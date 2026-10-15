import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";
import type { AnalogyMap } from "@/lib/ai-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You extract ANALOGIES from university lecture transcripts. Content is Arabic (Egyptian or MSA) with English technical terms.

An analogy = professor compares an abstract concept to something familiar (Ø²ÙŠØŒ Ù…Ø«Ù„ØŒ ÙƒØ£Ù†Ù‡ØŒ Ø¨Ø§Ù„Ø¸Ø¨Ø· Ø²ÙŠØŒ ÙŠØ´Ø¨Ù‡).

TASK: Find analogies and map the correspondence between the familiar thing (source) and the concept (target).

For each analogy, produce:
- title: short Arabic title
- sourceConcept: the familiar thing (Ù…Ø«Ù„ "Ø§Ù„Ù…ÙƒØªØ¨"ØŒ "Ø§Ù„ÙˆÙŠØªØ±"ØŒ "Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ø³Ø±Ø¹Ø©")
- sourceEmoji: ONE emoji representing the source (ðŸ , ðŸ½ï¸, â±ï¸, ðŸ“š, ðŸš—, ðŸ¦, ðŸ§ , ðŸ³, ðŸ—ï¸, âš™ï¸, ðŸ“¡, etc.)
- targetConcept: the technical concept (Ù…Ø«Ù„ "Cache"ØŒ "API"ØŒ "Derivative")
- targetEmoji: ONE emoji representing the target
- mappings: array of correspondence pairs (ÙƒÙ„ Ø¬Ø²Ø¡ ÙÙŠ Ø§Ù„Ù…ØµØ¯Ø± Ø¨ÙŠÙ‚Ø§Ø¨Ù„ Ø¥ÙŠÙ‡ ÙÙŠ Ø§Ù„Ù‡Ø¯Ù)
- breaks: ways the analogy BREAKS DOWN (Ù…ØªÙ‰ Ø§Ù„ØªØ´Ø¨ÙŠÙ‡ Ù…Ø´ Ø¯Ù‚ÙŠÙ‚ØŸ)
- quote: short excerpt from professor's words

CRITICAL RULES:
1. ONLY extract analogies EXPLICITLY stated in the transcript
2. If professor didn't mention "breaks", set breaks: [] (don't invent)
3. For STEM lectures (programming, AI, math, engineering), only keep technical analogies
4. sourceEmoji/targetEmoji: single emoji ONLY, no text
5. If NO analogy exists, return analogies: []

Examples:
- "Ø§Ù„ÙƒØ§Ø´ Ø²ÙŠ Ø§Ù„Ù…ÙƒØªØ¨ Ø¬Ù†Ø¨ Ø§Ù„Ù…ÙƒØªØ¨Ø© â€” Ø³Ø±ÙŠØ¹ ÙˆØµØºÙŠØ±ØŒ ÙˆØ§Ù„Ù…ÙƒØªØ¨Ø© Ø¨Ø·ÙŠØ¦Ø© ÙˆÙƒØ¨ÙŠØ±Ø©" â†’ Cache vs Ù…ÙƒØªØ¨
- "Ø§Ù„Ù€ API Ø²ÙŠ Ø§Ù„ÙˆÙŠØªØ± ÙÙŠ Ø§Ù„Ù…Ø·Ø¹Ù… â€” Ø¨ÙŠØ§Ø®Ø¯ Ø·Ù„Ø¨Ùƒ ÙˆÙŠØ±Ø¬Ø¹Ù„Ùƒ" â†’ API vs ÙˆÙŠØªØ±
- "Ø§Ù„Ù€ Stack Ø²ÙŠ ÙƒÙˆÙ…Ø© Ø£Ø·Ø¨Ø§Ù‚ â€” Ø¢Ø®Ø± ÙˆØ§Ø­Ø¯ Ø¨ØªØ­Ø·Ù‡ Ø£ÙˆÙ„ ÙˆØ§Ø­Ø¯ Ø¨ØªØ´ÙŠÙ„Ù‡" â†’ Stack vs Ø£Ø·Ø¨Ø§Ù‚
- "Ø§Ù„Ù…Ø´ØªÙ‚Ø© Ø²ÙŠ Ø¹Ø¯Ø§Ø¯ Ø³Ø±Ø¹Ø© Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©" â†’ Derivative vs Ø¹Ø¯Ø§Ø¯

JSON schema:
{
  "analogies": [
    {
      "title": "Cache vs Ù…ÙƒØªØ¨",
      "sourceConcept": "Ù…ÙƒØªØ¨ Ø¬Ù†Ø¨ Ø§Ù„Ù…ÙƒØªØ¨Ø©",
      "sourceEmoji": "ðŸ ",
      "targetConcept": "Cache",
      "targetEmoji": "âš¡",
      "mappings": [
        { "sourceTerm": "Ø§Ù„Ù…ÙƒØªØ¨", "targetTerm": "Cache", "note": "Ø³Ø±ÙŠØ¹ ÙˆØµØºÙŠØ±" },
        { "sourceTerm": "Ø§Ù„Ù…ÙƒØªØ¨Ø©", "targetTerm": "RAM/HDD", "note": "Ø¨Ø·ÙŠØ¡ ÙˆÙƒØ¨ÙŠØ±" }
      ],
      "breaks": ["Ø§Ù„ÙƒØªØ¨ Ù…Ø´ Ø¨ØªØªÙÙ‚Ø¯ Ø²ÙŠ Ø§Ù„Ø¯Ø§ØªØ§"],
      "quote": "Ø§Ù„ÙƒØ§Ø´ Ø²ÙŠ Ø§Ù„Ù…ÙƒØªØ¨ Ø¬Ù†Ø¨ Ø§Ù„Ù…ÙƒØªØ¨Ø©"
    }
  ]
}

Reply with JSON only, no markdown.`;

interface AnalogyPayload {
  analogies?: Array<{
    title?: string;
    sourceConcept?: string;
    sourceEmoji?: string;
    targetConcept?: string;
    targetEmoji?: string;
    mappings?: Array<{ sourceTerm?: string; targetTerm?: string; note?: string }>;
    breaks?: string[];
    quote?: string;
  }>;
}

function isValid(d: unknown): d is AnalogyPayload {
  if (typeof d !== "object" || d === null) return false;
  return Array.isArray((d as Record<string, unknown>).analogies);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 10, 60_000, "visualize-analogy").ok) {
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
    maxTokens: 2000,
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
  const analogies: AnalogyMap[] = (parsed.analogies ?? [])
    .filter(
      (a) =>
        typeof a.title === "string" &&
        typeof a.sourceConcept === "string" &&
        typeof a.targetConcept === "string" &&
        Array.isArray(a.mappings) &&
        a.mappings.length > 0
    )
    .slice(0, 2)
    .map((a, idx) => ({
      id: `anl-${now}-${idx}`,
      title: String(a.title),
      sourceConcept: String(a.sourceConcept),
      sourceEmoji: String(a.sourceEmoji || "ðŸ”·").slice(0, 4),
      targetConcept: String(a.targetConcept),
      targetEmoji: String(a.targetEmoji || "âš™ï¸").slice(0, 4),
      mappings: (a.mappings ?? []).map((m) => ({
        sourceTerm: String(m.sourceTerm ?? ""),
        targetTerm: String(m.targetTerm ?? ""),
        note: m.note ? String(m.note) : undefined,
      })),
      breaks: Array.isArray(a.breaks) ? a.breaks.map(String) : [],
      quote: a.quote ? String(a.quote) : undefined,
      detectedAt: now,
    }));

  console.log(
    `[visualize-analogy] OK via "${result.provider}" | analogies=${analogies.length}`
  );

  return NextResponse.json({ analogies }, { status: 200 });
}