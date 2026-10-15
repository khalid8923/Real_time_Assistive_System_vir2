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
  - "thesis"    Ã¢â‚¬â€ the main position (exactly 1)
  - "claim"     Ã¢â‚¬â€ supporting point
  - "evidence"  Ã¢â‚¬â€ data/example/proof supporting a claim
  - "counterargument" Ã¢â‚¬â€ opposing view
  - "rebuttal"  Ã¢â‚¬â€ response to counterargument
  - "conclusion" Ã¢â‚¬â€ the takeaway
- links: relations between nodes:
  - "supports" Ã¢â‚¬â€ node A supports node B
  - "attacks"  Ã¢â‚¬â€ node A argues against node B
  - "refutes"  Ã¢â‚¬â€ node A refutes counterargument B
- sourceQuote: short excerpt from professor's words (optional)

CRITICAL RULES:
1. ONLY extract arguments EXPLICITLY stated in the transcript
2. MINIMUM 3 nodes, MAXIMUM 12 nodes per argument
3. Detect "empty claims" Ã¢â‚¬â€ claims without any supporting evidence
4. Use "strength": "strong" (has evidence) | "medium" (has reasoning) | "weak" (bare assertion)
5. If NO clear argument exists Ã¢â€ â€™ arguments: []

IMPORTANT: Reply with a SINGLE JSON object that has an "arguments" array. Even if there is only ONE argument, it must still be wrapped in an array.

Example - "Ã˜Â§Ã™â€žÃ™â‚¬ Transformers Ã˜Â£Ã™ÂÃ˜Â¶Ã™â€ž Ã™â€¦Ã™â€  RNN. Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â¨Ã˜Â¨ Ã˜Â¥Ã™â€ Ã™â€¡Ã˜Â§ Ã˜Â¨Ã˜ÂªÃ˜Â´Ã˜ÂªÃ˜ÂºÃ™â€ž parallel Ã˜Â¹Ã™â€žÃ™â€° GPUs. Ã˜Â§Ã™â€žÃ™â€ Ã˜Â§Ã™â€šÃ˜Â¯Ã™Å Ã™â€  Ã™â€šÃ˜Â§Ã™â€žÃ™Ë†Ã˜Â§ Ã˜Â¥Ã™â€ Ã™â€¡Ã˜Â§ Ã™â€¦Ã˜Â­Ã˜ÂªÃ˜Â§Ã˜Â¬Ã˜Â© Ã˜Â¨Ã™Å Ã˜Â§Ã™â€ Ã˜Â§Ã˜Âª Ã˜Â£Ã™Æ’Ã˜ÂªÃ˜Â±Ã˜Å’ Ã˜Â¨Ã˜Â³ Ã˜Â¯Ã™â€¡ Ã™â€¦Ã˜Â´ Ã™â€¦Ã˜Â´Ã™Æ’Ã™â€žÃ˜Â© Ã™â€žÃ˜Â£Ã™â€  Ã˜Â§Ã™â€žÃ˜Â¨Ã™Å Ã˜Â§Ã™â€ Ã˜Â§Ã˜Âª Ã™â€¦Ã˜ÂªÃ™Ë†Ã™ÂÃ˜Â±Ã˜Â©":

{
  "arguments": [
    {
      "title": "Ã™â€žÃ™â€¦Ã˜Â§Ã˜Â°Ã˜Â§ Transformers Ã˜Â£Ã™ÂÃ˜Â¶Ã™â€ž Ã™â€¦Ã™â€  RNN",
      "thesis": "Ã˜Â§Ã™â€žÃ™â‚¬ Transformers Ã˜Â£Ã™ÂÃ˜Â¶Ã™â€ž Ã™â€¦Ã™â€  RNN Ã™ÂÃ™Å  Ã˜Â§Ã™â€žÃ™â€¦Ã™â€¡Ã˜Â§Ã™â€¦ Ã˜Â§Ã™â€žÃ˜Â­Ã˜Â¯Ã™Å Ã˜Â«Ã˜Â©",
      "nodes": [
        { "id": "n1", "type": "thesis", "text": "Ã˜Â§Ã™â€žÃ™â‚¬ Transformers Ã˜Â£Ã™ÂÃ˜Â¶Ã™â€ž Ã™â€¦Ã™â€  RNN", "strength": "medium" },
        { "id": "n2", "type": "claim", "text": "Ã˜Â§Ã™â€žÃ™â‚¬ Transformers Ã˜Â¨Ã˜ÂªÃ˜Â´Ã˜ÂªÃ˜ÂºÃ™â€ž parallel", "strength": "strong", "quote": "Ã˜Â¨Ã˜ÂªÃ˜Â´Ã˜ÂªÃ˜ÂºÃ™â€ž parallel Ã˜Â¹Ã™â€žÃ™â€° GPUs" },
        { "id": "n3", "type": "evidence", "text": "Ã˜Â¨Ã˜ÂªÃ˜Â³Ã˜ÂªÃ™ÂÃ™Å Ã˜Â¯ Ã™â€¦Ã™â€  GPUs Ã™Æ’Ã˜Â§Ã™â€¦Ã™â€žÃ˜Â©", "strength": "strong" },
        { "id": "n4", "type": "counterargument", "text": "Ã™â€¦Ã˜Â­Ã˜ÂªÃ˜Â§Ã˜Â¬Ã˜Â© Ã˜Â¨Ã™Å Ã˜Â§Ã™â€ Ã˜Â§Ã˜Âª Ã˜Â£Ã™Æ’Ã˜ÂªÃ˜Â±", "strength": "medium" },
        { "id": "n5", "type": "rebuttal", "text": "Ã˜Â§Ã™â€žÃ˜Â¨Ã™Å Ã˜Â§Ã™â€ Ã˜Â§Ã˜Âª Ã™â€¦Ã˜ÂªÃ™Ë†Ã™ÂÃ˜Â±Ã˜Â© Ã˜Â­Ã˜Â§Ã™â€žÃ™Å Ã˜Â§Ã™â€¹", "strength": "strong" }
      ],
      "links": [
        { "from": "n2", "to": "n1", "relation": "supports" },
        { "from": "n3", "to": "n2", "relation": "supports" },
        { "from": "n4", "to": "n1", "relation": "attacks" },
        { "from": "n5", "to": "n4", "relation": "refutes" }
      ]
    }
  ]
}

Reply with JSON only, no markdown.`;

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

function normalizeArguments(parsed: unknown): ArgPayload["arguments"] {
  if (!parsed || typeof parsed !== "object") return [];

  const o = parsed as Record<string, unknown>;

  if (Array.isArray(o.arguments)) {
    return o.arguments as ArgPayload["arguments"];
  }

  if (
    typeof o.title === "string" &&
    typeof o.thesis === "string" &&
    Array.isArray(o.nodes)
  ) {
    return [o as NonNullable<ArgPayload["arguments"]>[0]];
  }

  return [];
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 10, 60_000, "visualize-argument").ok) {
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

  const rawArguments = normalizeArguments(parsed) ?? [];

  const now = Date.now();
  const arguments_: ArgumentMap[] = rawArguments
    .filter(
      (a) =>
        a &&
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