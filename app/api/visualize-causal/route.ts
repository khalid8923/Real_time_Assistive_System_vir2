import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";
import type { CausalLoop } from "@/lib/ai-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You extract CAUSAL relationships (X Ã¢â€ â€™ Y with sign) from university lecture transcripts. Content is Arabic (Egyptian or MSA) with English technical terms.

Look for:
- "X Ã˜Â¨Ã™Å Ã˜Â£Ã˜Â¯Ã™Å  Ã™â€žÃ™â‚¬ Y" / "X Ã˜Â¨Ã˜Â³Ã˜Â¨Ã˜Â¨ Y" / "Ã™â€žÃ™â€¦Ã˜Â§ X Ã™Å Ã˜Â²Ã™Å Ã˜Â¯ Y Ã™Å Ã˜Â²Ã™Å Ã˜Â¯"
- "X Ã˜Â¨Ã™Å Ã™â€šÃ™â€žÃ™â€ž Y" / "Ã™Æ’Ã™â€ž Ã™â€¦Ã˜Â§ X Y"
- "Ã™â€žÃ™Ë† X Ã˜Â§Ã˜ÂªÃ˜Â­Ã˜Â³Ã™â€  Y Ã™â€¡Ã™Å Ã˜ÂªÃ˜Â­Ã˜Â³Ã™â€ "
- "X Ã™Ë†Y Ã˜Â¨Ã™Å Ã˜ÂªÃ˜Â£Ã˜Â«Ã˜Â±Ã™Ë†Ã˜Â§ Ã˜Â¨Ã˜Â¨Ã˜Â¹Ã˜Â¶"
- Any cause Ã¢â€ â€™ effect statement
- Feedback loops (when a chain circles back)

For each node:
- id: "n1", "n2"...
- label: short Arabic/English name
- detail: one sentence (optional)
- category: "driver" (starting cause) | "process" (middle) | "outcome" (final) | "feedback"

For each edge:
- from, to: node ids
- sign: "positive" (same direction: XÃ¢â€ â€˜ Ã¢â€ â€™ YÃ¢â€ â€˜) | "negative" (opposite: XÃ¢â€ â€˜ Ã¢â€ â€™ YÃ¢â€ â€œ)
- evidence: "lecture" (explicit in text) | "inferred" (logical implication)
- label: short relation name (optional)
- quote: excerpt from professor's words (optional)

Detect loops:
- A cycle in the graph = a loop
- If product of all edge signs = "+" Ã¢â€ â€™ "reinforcing" (R)
- If product = "-" Ã¢â€ â€™ "balancing" (B)

STRICT RULES:
1. ONLY extract causal statements that are EXPLICIT or strongly implied
2. MINIMUM 2 nodes and 1 edge per causal map. MAXIMUM 12 nodes
3. Simple AÃ¢â€ â€™B causal relations are VALID Ã¢â‚¬â€ no need for a full cycle
4. Set loops: [] if you can't find a cycle Ã¢â‚¬â€ the server will auto-detect
5. If NO causality exists Ã¢â€ â€™ loops: []

IMPORTANT: Reply with a SINGLE JSON object that has a "loops" array. Even if there is only ONE causal map, it must still be wrapped in an array.

Example - "Ã™â€žÃ™â€¦Ã˜Â§ Ã˜Â§Ã™â€žÃ™ÂÃ˜Â§Ã™Å Ã˜Â¯Ã˜Â© Ã˜ÂªÃ˜Â²Ã™Å Ã˜Â¯Ã˜Å’ Ã˜Â§Ã™â€žÃ˜Â§Ã™â€šÃ˜ÂªÃ˜Â±Ã˜Â§Ã˜Â¶ Ã™Å Ã™â€šÃ™â€žÃ˜Å’ Ã™ÂÃ˜Â§Ã™â€žÃ˜Â§Ã˜Â³Ã˜ÂªÃ˜Â«Ã™â€¦Ã˜Â§Ã˜Â± Ã™Å Ã™â€šÃ™â€žÃ˜Å’ Ã™ÂÃ˜Â§Ã™â€žÃ™â€ Ã™â€¦Ã™Ë† Ã™Å Ã˜ÂªÃ˜Â¨Ã˜Â§Ã˜Â·Ã˜Â£":

{
  "loops": [
    {
      "title": "Ã˜ÂªÃ˜Â£Ã˜Â«Ã™Å Ã˜Â± Ã˜Â§Ã™â€žÃ™ÂÃ˜Â§Ã™Å Ã˜Â¯Ã˜Â© Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ™â€ Ã™â€¦Ã™Ë†",
      "subtitle": "Ã˜Â³Ã™â€žÃ˜Â³Ã™â€žÃ˜Â© Ã˜Â³Ã˜Â¨Ã˜Â¨Ã™Å Ã˜Â© Ã˜Â§Ã™â€šÃ˜ÂªÃ˜ÂµÃ˜Â§Ã˜Â¯Ã™Å Ã˜Â©",
      "nodes": [
        { "id": "n1", "label": "Ã˜Â§Ã™â€žÃ™ÂÃ˜Â§Ã™Å Ã˜Â¯Ã˜Â©", "category": "driver" },
        { "id": "n2", "label": "Ã˜Â§Ã™â€žÃ˜Â§Ã™â€šÃ˜ÂªÃ˜Â±Ã˜Â§Ã˜Â¶", "category": "process" },
        { "id": "n3", "label": "Ã˜Â§Ã™â€žÃ˜Â§Ã˜Â³Ã˜ÂªÃ˜Â«Ã™â€¦Ã˜Â§Ã˜Â±", "category": "process" },
        { "id": "n4", "label": "Ã˜Â§Ã™â€žÃ™â€ Ã™â€¦Ã™Ë†", "category": "outcome" }
      ],
      "edges": [
        { "from": "n1", "to": "n2", "sign": "negative", "evidence": "lecture", "label": "Ã˜Â¨Ã™Å Ã™â€šÃ™â€žÃ™â€ž Ã˜Â§Ã™â€žÃ˜Â§Ã™â€šÃ˜ÂªÃ˜Â±Ã˜Â§Ã˜Â¶", "quote": "Ã™â€žÃ™â€¦Ã˜Â§ Ã˜Â§Ã™â€žÃ™ÂÃ˜Â§Ã™Å Ã˜Â¯Ã˜Â© Ã˜ÂªÃ˜Â²Ã™Å Ã˜Â¯ Ã˜Â§Ã™â€žÃ˜Â§Ã™â€šÃ˜ÂªÃ˜Â±Ã˜Â§Ã˜Â¶ Ã™Å Ã™â€šÃ™â€ž" },
        { "from": "n2", "to": "n3", "sign": "positive", "evidence": "lecture", "label": "Ã˜Â§Ã™â€žÃ˜Â§Ã™â€šÃ˜ÂªÃ˜Â±Ã˜Â§Ã˜Â¶ Ã™Å Ã™â€¦Ã™Ë†Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â§Ã˜Â³Ã˜ÂªÃ˜Â«Ã™â€¦Ã˜Â§Ã˜Â±" },
        { "from": "n3", "to": "n4", "sign": "positive", "evidence": "lecture", "label": "Ã˜Â§Ã™â€žÃ˜Â§Ã˜Â³Ã˜ÂªÃ˜Â«Ã™â€¦Ã˜Â§Ã˜Â± Ã™Å Ã˜Â±Ã™ÂÃ˜Â¹ Ã˜Â§Ã™â€žÃ™â€ Ã™â€¦Ã™Ë†" }
      ],
      "loops": []
    }
  ]
}

Reply with JSON only, no markdown.`;

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

function normalizeLoops(parsed: unknown): CausalPayload["loops"] {
  if (!parsed || typeof parsed !== "object") return [];

  const o = parsed as Record<string, unknown>;

  if (Array.isArray(o.loops)) {
    return o.loops as CausalPayload["loops"];
  }

  if (
    typeof o.title === "string" &&
    Array.isArray(o.nodes) &&
    Array.isArray(o.edges)
  ) {
    return [o as NonNullable<CausalPayload["loops"]>[0]];
  }

  return [];
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
  if (!rateLimit(ip, 10, 60_000, "visualize-causal").ok) {
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
  if (!parsed) {
    return NextResponse.json({ error: "Invalid schema." }, { status: 502 });
  }

  const rawLoops = normalizeLoops(parsed) ?? [];

  const now = Date.now();
  const loops: CausalLoop[] = rawLoops
    .filter(
      (l) =>
        l &&
        typeof l.title === "string" &&
        Array.isArray(l.nodes) &&
        l.nodes.length >= 2 &&
        l.nodes.length <= 12 &&
        Array.isArray(l.edges) &&
        l.edges.length >= 1
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