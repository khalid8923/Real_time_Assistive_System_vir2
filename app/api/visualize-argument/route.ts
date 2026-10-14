import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";
import type { ArgumentMap } from "@/lib/ai-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You extract ARGUMENT STRUCTURES from university lecture transcripts. Content is Arabic (Egyptian or MSA) with English technical terms.

An argument structure has: a central thesis, supporting claims with evidence, counterarguments, and rebuttals.

TASK: Convert the professor's argument into a structured map.

For each argument, produce:
- title: short Arabic title
- thesis: the main position (one sentence)
- nodes: 5-12 argument nodes with these types:
  - "thesis"    — the main position (exactly 1)
  - "claim"     — supporting point
  - "evidence"  — data/example/proof supporting a claim
  - "counterargument" — opposing view
  - "rebuttal"  — response to counterargument
  - "conclusion" — the takeaway
- links: relations between nodes:
  - "supports" — node A supports node B
  - "attacks"  — node A argues against node B
  - "refutes"  — node A refutes counterargument B

CRITICAL RULES:
1. ONLY extract arguments EXPLICITLY stated
2. Detect "empty claims" — claims without any supporting evidence or data
3. Use "strength": "strong" (has evidence) | "medium" (has reasoning) | "weak" (bare assertion)
4. Max 12 nodes
5. If NO clear argument exists → arguments: []

Example - "الـ Transformers أفضل من RNN. السبب إنها بتشتغل parallel على GPUs. الناقدين قالوا إنها محتاجة بيانات أكتر، بس ده مش مشكلة لأن البيانات متوفرة":

{
  "title": "لماذا Transformers أفضل من RNN",
  "thesis": "الـ Transformers أفضل من RNN في المهام الحديثة",
  "nodes": [
    { "id": "n1", "type": "thesis", "text": "الـ Transformers أفضل من RNN", "strength": "medium" },
    { "id": "n2", "type": "claim", "text": "الـ Transformers بتشتغل parallel", "strength": "strong", "quote": "بتشتغل parallel على GPUs" },
    { "id": "n3", "type": "evidence", "text": "بتستفيد من GPUs كاملة", "strength": "strong" },
    { "id": "n4", "type": "counterargument", "text": "محتاجة بيانات أكتر", "strength": "medium" },
    { "id": "n5", "type": "rebuttal", "text": "البيانات متوفرة حالياً", "strength": "strong" }
  ],
  "links": [
    { "from": "n2", "to": "n1", "relation": "supports" },
    { "from": "n3", "to": "n2", "relation": "supports" },
    { "from": "n4", "to": "n1", "relation": "attacks" },
    { "from": "n5", "to": "n4", "relation": "refutes" }
  ]
}

Reply with JSON only.`;

interface ArgPayload {
  arguments?: Array<{
    title?: string;
    thesis?: string;
    nodes?: Array<{
      id?: string;
      type?: string;
      text?: string;
      strength?: string;
      quote?: string;
    }>;
    links?: Array<{
      from?: string;
      to?: string;
      relation?: string;
    }>;
    sourceQuote?: string;
  }>;
}

const VALID_TYPES = ["thesis", "claim", "evidence", "counterargument", "rebuttal", "conclusion"];
const VALID_RELATIONS = ["supports", "attacks", "refutes"];

function isValid(d: unknown): d is ArgPayload {
  if (typeof d !== "object" || d === null) return false;
  return Array.isArray((d as Record<string, unknown>).arguments);
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
  if (typeof rawText !== "string" || rawText.trim().length < 50) {
    return NextResponse.json({ error: "Text too short." }, { status: 400 });
  }

  const text = rawText.trim().slice(0, 8000);

  const result = await generateText({
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Transcript:\n\n${text}` }],
    temperature: 0.2,
    maxTokens: 2500,
    jsonMode: true,
    prefer: "nvidia",
  });

  if (!result.ok || !result.text) {
    return NextResponse.json(
      { error: result.error || "Extraction failed." },
      { status: 502 }
    );
  }

  const parsed = parseJsonResponse(result.text);
  if (!parsed || !isValid(parsed)) {
    return NextResponse.json({ error: "Invalid schema." }, { status: 502 });
  }

  const now = Date.now();
  const arguments_: ArgumentMap[] = (parsed.arguments ?? [])
    .filter(
      (a) =>
        typeof a.title === "string" &&
        typeof a.thesis === "string" &&
        Array.isArray(a.nodes) &&
        a.nodes.length >= 3 &&
        a.nodes.length <= 12
    )
    .slice(0, 2)
    .map((a, idx) => {
      const nodes = (a.nodes ?? []).map((n, ni) => ({
        id: String(n.id ?? `n${ni + 1}`),
        type: VALID_TYPES.includes(n.type ?? "")
          ? (n.type as ArgumentMap["nodes"][0]["type"])
          : "claim",
        text: String(n.text ?? "").slice(0, 200),
        strength: ["strong", "medium", "weak"].includes(n.strength ?? "")
          ? (n.strength as "strong" | "medium" | "weak")
          : "medium",
        quote: n.quote ? String(n.quote).slice(0, 200) : undefined,
      }));

      const nodeIds = new Set(nodes.map((n) => n.id));

      const links = (a.links ?? [])
        .filter(
          (l) =>
            typeof l.from === "string" &&
            typeof l.to === "string" &&
            nodeIds.has(l.from) &&
            nodeIds.has(l.to)
        )
        .map((l) => ({
          from: String(l.from),
          to: String(l.to),
          relation: VALID_RELATIONS.includes(l.relation ?? "")
            ? (l.relation as "supports" | "attacks" | "refutes")
            : "supports",
        }));

      // Detect empty claims — claims with no incoming "supports" link
      const supportedIds = new Set(
        links.filter((l) => l.relation === "supports").map((l) => l.to)
      );
      const emptyClaimIds = nodes
        .filter(
          (n) =>
            (n.type === "claim" || n.type === "thesis") &&
            !supportedIds.has(n.id) &&
            n.strength === "weak"
        )
        .map((n) => n.id);

      return {
        id: `arg-${now}-${idx}`,
        title: String(a.title),
        thesis: String(a.thesis),
        nodes,
        links,
        hasEmptyClaims: emptyClaimIds.length > 0,
        emptyClaimIds,
        sourceQuote: a.sourceQuote ? String(a.sourceQuote) : undefined,
        detectedAt: now,
      };
    });

  console.log(
    `[visualize-argument] OK via "${result.provider}" | args=${arguments_.length}`
  );

  return NextResponse.json({ arguments: arguments_ }, { status: 200 });
}