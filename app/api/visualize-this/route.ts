import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";
import type { GeneratedDiagram, DiagramShape } from "@/lib/ai-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_SHAPES = ["sequence", "cycle", "hierarchy", "comparison", "layers"];

const ALLOWED_ICONS = [
  "arrow-right", "circle", "square", "triangle", "zap", "star", "flag",
  "check", "x", "cpu", "database", "cloud", "server", "code", "terminal",
  "git-branch", "git-merge", "layers", "box", "boxes", "package", "file",
  "folder", "brain", "network", "share", "link", "workflow", "activity",
  "trending-up", "refresh-cw", "rotate-cw", "repeat", "hash", "binary",
  "key", "lock", "settings", "wrench", "hammer", "beaker", "atom",
  "function-square", "pi", "sigma", "plus", "minus", "divide", "equal",
  "calculator", "book", "lightbulb", "target", "compass", "map",
];

const SYSTEM_PROMPT = `You are a visual diagram generator for a university STEM lecture assistant. You receive a fragment of Arabic lecture text (may include English technical terms) and convert it to a STRUCTURED diagram.

Choose ONE shape from this closed list:
- "sequence"   = ordered steps (خطوات بالترتيب، مراحل)
- "cycle"      = repeating process (دورة، حلقة، لوب)
- "hierarchy"  = tree / taxonomy (تصنيف، شجرة، مستويات)
- "comparison" = 2 sides being compared (X vs Y)
- "layers"     = stacked layers (طبقات، طبقات فوق بعض)

Output JSON ONLY:
{
  "shape": "sequence",
  "title": "short Arabic title",
  "subtitle": "one sentence in Arabic",
  "nodes": [
    { "id": "n1", "label": "اسم قصير بالعربي أو إنجليزي", "detail": "جملة قصيرة", "icon": "arrow-right" }
  ],
  "relations": [
    { "from": "n1", "to": "n2", "type": "next", "label": "بعد كده" }
  ],
  "emphasis": ["n1"],
  "sourceQuote": "الجملة الأصلية من المحاضرة"
}

STRICT RULES:
1. ONLY use icons from this list (exact spelling): ${ALLOWED_ICONS.join(", ")}
2. If you can't find a fitting icon, use "circle".
3. Nodes: 3-7 nodes MAX.
4. Relations: use type from "next" | "part_of" | "opposite" | "contains".
5. For "comparison" shape: exactly 2 top-level nodes, each with relation "opposite".
6. For "layers" shape: relations should be "contains" (each layer contains the one below).
7. For "hierarchy": root node has "part_of" relations to children.
8. Keep labels VERY short (max 4 words each).
9. If the text has NO clear structure, use shape "sequence" with 3-4 summary points.
10. Emphasis = 1-2 node ids that are most important.

Examples:

Input: "الماكينة تبدأ بفحص المواد الأولية، بعدين بتخلطها، وبعدين بتسخنها، وفي الآخر بتعبّي المنتج"
Output: shape="sequence", nodes: [فحص، خلط، تسخين، تعبئة], relations: next.

Input: "دورة حياة البرمجيات: تحليل، تصميم، تنفيذ، اختبار، صيانة، وبعدها بترجع للتحليل"
Output: shape="cycle", relations: next (with last→first).

Input: "أنواع الـ AI: supervised, unsupervised, reinforcement، كل واحد ليه subtypes"
Output: shape="hierarchy".

Reply with JSON only, no markdown.`;

interface DiagramPayload {
  shape?: string;
  title?: string;
  subtitle?: string;
  nodes?: Array<{
    id?: string;
    label?: string;
    detail?: string;
    icon?: string;
  }>;
  relations?: Array<{
    from?: string;
    to?: string;
    type?: string;
    label?: string;
  }>;
  emphasis?: string[];
  sourceQuote?: string;
}

function isValid(d: unknown): d is DiagramPayload {
  if (typeof d !== "object" || d === null) return false;
  const o = d as Record<string, unknown>;
  return typeof o.shape === "string" && Array.isArray(o.nodes);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 10, 60_000).ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const rawText = (body as Record<string, unknown>)?.text;
  if (typeof rawText !== "string" || rawText.trim().length < 30) {
    return NextResponse.json({ error: "Text too short." }, { status: 400 });
  }

  const text = rawText.trim().slice(0, 4000);

  const result = await generateText({
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Text:\n\n${text}` }],
    temperature: 0.2,
    maxTokens: 2000,
    jsonMode: true,
    prefer: "nvidia",
  });

  if (!result.ok || !result.text) {
    return NextResponse.json(
      { error: result.error || "Generation failed." },
      { status: 502 }
    );
  }

  const parsed = parseJsonResponse(result.text);
  if (!parsed || !isValid(parsed)) {
    return NextResponse.json({ error: "Invalid schema." }, { status: 502 });
  }

  // Validate shape
  const shape: DiagramShape = ALLOWED_SHAPES.includes(parsed.shape ?? "")
    ? (parsed.shape as DiagramShape)
    : "sequence";

  const now = Date.now();

  // Sanitize nodes
  const nodes = (parsed.nodes ?? [])
    .slice(0, 7)
    .map((n, i) => {
      const icon = n.icon && ALLOWED_ICONS.includes(n.icon) ? n.icon : "circle";
      return {
        id: String(n.id ?? `n${i + 1}`),
        label: String(n.label ?? "").slice(0, 60),
        detail: n.detail ? String(n.detail).slice(0, 120) : undefined,
        icon,
      };
    })
    .filter((n) => n.label.length > 0);

  if (nodes.length < 3) {
    return NextResponse.json(
      { error: "Not enough nodes to render a diagram." },
      { status: 200, headers: { "X-Empty": "1" } }
    );
  }

  const nodeIds = new Set(nodes.map((n) => n.id));

  const relations = (parsed.relations ?? [])
    .filter(
      (r) =>
        typeof r.from === "string" &&
        typeof r.to === "string" &&
        nodeIds.has(r.from) &&
        nodeIds.has(r.to)
    )
    .slice(0, 20)
    .map((r) => ({
      from: String(r.from),
      to: String(r.to),
      type: ["next", "part_of", "opposite", "contains"].includes(r.type ?? "")
        ? (r.type as "next" | "part_of" | "opposite" | "contains")
        : "next",
      label: r.label ? String(r.label).slice(0, 40) : undefined,
    }));

  const emphasis = Array.isArray(parsed.emphasis)
    ? parsed.emphasis.filter((id) => typeof id === "string" && nodeIds.has(id)).slice(0, 3)
    : [];

  const diagram: GeneratedDiagram = {
    id: `diag-${now}`,
    shape,
    title: String(parsed.title ?? "رسم توضيحي"),
    subtitle: parsed.subtitle ? String(parsed.subtitle) : undefined,
    nodes,
    relations,
    emphasis,
    sourceQuote: parsed.sourceQuote ? String(parsed.sourceQuote) : undefined,
    detectedAt: now,
  };

  console.log(
    `[visualize-this] OK via "${result.provider}" | shape=${shape} | nodes=${nodes.length}`
  );

  return NextResponse.json({ diagram }, { status: 200 });
}