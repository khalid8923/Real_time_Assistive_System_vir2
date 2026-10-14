import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";
import type { AnalogyMap } from "@/lib/ai-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You extract ANALOGIES from university lecture transcripts. Content is Arabic (Egyptian or MSA) with English technical terms.

An analogy = professor compares an abstract concept to something familiar (زي، مثل، كأنه، بالظبط زي، يشبه).

TASK: Find analogies and map the correspondence between the familiar thing (source) and the concept (target).

For each analogy, produce:
- title: short Arabic title
- sourceConcept: the familiar thing (مثل "المكتب"، "الويتر"، "عداد السرعة")
- sourceEmoji: ONE emoji representing the source (🏠, 🍽️, ⏱️, 📚, 🚗, 🏦, 🧠, 🍳, 🏗️, ⚙️, 📡, etc.)
- targetConcept: the technical concept (مثل "Cache"، "API"، "Derivative")
- targetEmoji: ONE emoji representing the target
- mappings: array of correspondence pairs (كل جزء في المصدر بيقابل إيه في الهدف)
- breaks: ways the analogy BREAKS DOWN (متى التشبيه مش دقيق؟)
- quote: short excerpt from professor's words

CRITICAL RULES:
1. ONLY extract analogies EXPLICITLY stated in the transcript
2. If professor didn't mention "breaks", set breaks: [] (don't invent)
3. For STEM lectures (programming, AI, math, engineering), only keep technical analogies
4. sourceEmoji/targetEmoji: single emoji ONLY, no text
5. If NO analogy exists, return analogies: []

Examples:
- "الكاش زي المكتب جنب المكتبة — سريع وصغير، والمكتبة بطيئة وكبيرة" → Cache vs مكتب
- "الـ API زي الويتر في المطعم — بياخد طلبك ويرجعلك" → API vs ويتر
- "الـ Stack زي كومة أطباق — آخر واحد بتحطه أول واحد بتشيله" → Stack vs أطباق
- "المشتقة زي عداد سرعة العربية" → Derivative vs عداد

JSON schema:
{
  "analogies": [
    {
      "title": "Cache vs مكتب",
      "sourceConcept": "مكتب جنب المكتبة",
      "sourceEmoji": "🏠",
      "targetConcept": "Cache",
      "targetEmoji": "⚡",
      "mappings": [
        { "sourceTerm": "المكتب", "targetTerm": "Cache", "note": "سريع وصغير" },
        { "sourceTerm": "المكتبة", "targetTerm": "RAM/HDD", "note": "بطيء وكبير" }
      ],
      "breaks": ["الكتب مش بتتفقد زي الداتا"],
      "quote": "الكاش زي المكتب جنب المكتبة"
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
      sourceEmoji: String(a.sourceEmoji || "🔷").slice(0, 4),
      targetConcept: String(a.targetConcept),
      targetEmoji: String(a.targetEmoji || "⚙️").slice(0, 4),
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