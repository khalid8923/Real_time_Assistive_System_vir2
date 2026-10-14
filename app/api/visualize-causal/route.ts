import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";
import type { CausalLoop } from "@/lib/ai-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You extract CAUSAL relationships (X → Y with sign) from university lecture transcripts. Content is Arabic (Egyptian or MSA) with English technical terms.

Look for:
- "X بيأدي لـ Y" / "X بسبب Y" / "لما X يزيد Y يزيد"
- "X بيقلل Y" / "كل ما X Y"
- "لو X اتحسن Y هيتحسن"
- "X وY بيتأثروا ببعض"
- Any cause → effect statement
- Feedback loops (when a chain circles back)

For each node:
- id: "n1", "n2"...
- label: short Arabic/English name
- detail: one sentence
- category: "driver" (starting cause) | "process" (middle) | "outcome" (final) | "feedback"

For each edge:
- from, to: node ids
- sign: "positive" (same direction: X↑ → Y↑) | "negative" (opposite: X↑ → Y↓)
- evidence: "lecture" (explicit in text) | "inferred" (logical implication)
- label: short relation name
- quote: excerpt from professor's words

Detect loops:
- A cycle in the graph = a loop
- If product of all edge signs = "+" → "reinforcing" (R)
- If product = "-" → "balancing" (B)

STRICT RULES:
1. ONLY extract causal statements that are EXPLICIT or strongly implied
2. Max 12 nodes
3. If NO causality exists, return systems: []
4. NEVER invent relationships

Example - "لما الفايدة تزيد، الاقتراض يقل، فالاستثمار يقل، فالنمو يتباطأ":

{
  "title": "تأثير الفايدة على النمو",
  "subtitle": "سلسلة سببية اقتصادية",
  "nodes": [
    { "id": "n1", "label": "الفايدة", "category": "driver" },
    { "id": "n2", "label": "الاقتراض", "category": "process" },
    { "id": "n3", "label": "الاستثمار", "category": "process" },
    { "id": "n4", "label": "النمو", "category": "outcome" }
  ],
  "edges": [
    { "from": "n1", "to": "n2", "sign": "negative", "evidence": "lecture", "label": "بيقلل الاقتراض", "quote": "لما الفايدة تزيد الاقتراض يقل" },
    { "from": "n2", "to": "n3", "sign": "positive", "evidence": "lecture", "label": "الاقتراض يمول الاستثمار" },
    { "from": "n3", "to": "n4", "sign": "positive", "evidence": "lecture", "label": "الاستثمار يرفع النمو" }
  ],
  "loops": []
}

Reply with JSON only.`;

interface CausalPayload {
  loops?: Array<{
    title?: string;
    subtitle?: string;
    nodes?: Array<{
      id?: string;
      label?: string;
      detail?: string;
      category?: string;
    }>;
    edges?: Array<{
      from?: string;
      to?: string;
      sign?: string;
      evidence?: string;
      label?: string;
      quote?: string;
    }>;
    sourceQuote?: string;
  }>;
}

function isValid(d: unknown): d is CausalPayload {
  if (typeof d !== "object" || d === null) return false;
  return Array.isArray((d as Record<string, unknown>).loops);
}

function detectLoops(
  nodeIds: string[],
  edges: Array<{ from: string; to: string; sign: "positive" | "negative" }>
): Array<{
  id: string;
  type: "reinforcing" | "balancing";
  nodeIds: string[];
}> {
  const detected: Array<{
    id: string;
    type: "reinforcing" | "balancing";
    nodeIds: string[];
  }> = [];

  const adj = new Map<string, Array<{ to: string; sign: number }>>();
  for (const e of edges) {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push({ to: e.to, sign: e.sign === "positive" ? 1 : -1 });
  }

  const seen = new Set<string>();

  // Simple cycle detection via DFS
  function dfs(
    start: string,
    current: string,
    path: string[],
    signProduct: number,
    visitedInPath: Set<string>
  ) {
    if (path.length > 6) return;
    const neighbors = adj.get(current) ?? [];
    for (const { to, sign } of neighbors) {
      if (to === start && path.length >= 2) {
        // Found a cycle
        const key = [...path].sort().join("|");
        if (!seen.has(key)) {
          seen.add(key);
          detected.push({
            id: `loop-${detected.length + 1}`,
            type: signProduct * sign > 0 ? "reinforcing" : "balancing",
            nodeIds: [...path],
          });
        }
      } else if (!visitedInPath.has(to)) {
        visitedInPath.add(to);
        dfs(start, to, [...path, to], signProduct * sign, visitedInPath);
        visitedInPath.delete(to);
      }
    }
  }

  for (const start of nodeIds) {
    dfs(start, start, [start], 1, new Set([start]));
  }

  return detected.slice(0, 4);
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
  const loops: CausalLoop[] = (parsed.loops ?? [])
    .filter(
      (l) =>
        typeof l.title === "string" &&
        Array.isArray(l.nodes) &&
        l.nodes.length >= 3 &&
        l.nodes.length <= 12 &&
        Array.isArray(l.edges) &&
        l.edges.length >= 2
    )
    .slice(0, 2)
    .map((l, idx) => {
      const nodes = (l.nodes ?? []).map((n, ni) => ({
        id: String(n.id ?? `n${ni + 1}`),
        label: String(n.label ?? "").slice(0, 60),
        detail: n.detail ? String(n.detail).slice(0, 120) : undefined,
        category: ["driver", "process", "outcome", "feedback"].includes(
          n.category ?? ""
        )
          ? (n.category as "driver" | "process" | "outcome" | "feedback")
          : "process",
      }));

      const nodeIdsSet = new Set(nodes.map((n) => n.id));

      const edges = (l.edges ?? [])
        .filter(
          (e) =>
            typeof e.from === "string" &&
            typeof e.to === "string" &&
            nodeIdsSet.has(e.from) &&
            nodeIdsSet.has(e.to)
        )
        .map((e) => ({
          from: String(e.from),
          to: String(e.to),
          sign: (e.sign === "negative" ? "negative" : "positive") as
            | "positive"
            | "negative",
          evidence: (e.evidence === "inferred" ? "inferred" : "lecture") as
            | "lecture"
            | "inferred",
          label: e.label ? String(e.label).slice(0, 40) : undefined,
          quote: e.quote ? String(e.quote).slice(0, 200) : undefined,
        }));

      // Auto-detect loops
      const detectedLoops = detectLoops(
        nodes.map((n) => n.id),
        edges
      );

      return {
        id: `cl-${now}-${idx}`,
        title: String(l.title),
        subtitle: l.subtitle ? String(l.subtitle) : undefined,
        nodes,
        edges,
        loops: detectedLoops,
        sourceQuote: l.sourceQuote ? String(l.sourceQuote) : undefined,
        detectedAt: now,
      };
    });

  console.log(
    `[visualize-causal] OK via "${result.provider}" | loops=${loops.length}`
  );

  return NextResponse.json({ loops }, { status: 200 });
}