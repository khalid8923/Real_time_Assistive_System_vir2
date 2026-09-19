import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";
import type { Keyword, KeywordCategory } from "@/lib/ai-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT_LENGTH = 8000;

const SYSTEM_PROMPT = `You are a keyword extractor for deaf university students. You receive a lecture transcript in Arabic (may contain English technical terms) and extract the most important keywords.

For each keyword:
- word: The exact word or short phrase from the text (keep English as-is: React, API)
- category: One of:
  - "term" (academic/technical term)
  - "concept" (abstract idea)
  - "person" (name of person)
  - "place" (location)
  - "number" (important number, date, percentage)
  - "tool" (software, library, instrument)
- importance: Integer 1-5 (5 = very important, 1 = low)
- context: Short sentence from the text showing how the word was used (max 15 words)

Rules:
- Extract 5-12 keywords per lecture
- Prioritize academic and technical terms
- Skip filler words (the, is, was, هذا, كان)
- If text is too short, extract fewer keywords
- If no meaningful keywords, return keywords: []
- Rely ONLY on the transcript — never invent
- Reply with JSON only:
{
  "keywords": [
    { "word": "Array", "category": "term", "importance": 5, "context": "..." }
  ]
}`;

interface SuccessResponse {
  keywords: Keyword[];
}

interface ErrorResponse {
  error: string;
}

const VALID_CATEGORIES: KeywordCategory[] = [
  "term",
  "concept",
  "person",
  "place",
  "number",
  "tool",
];

function jsonError(
  message: string,
  status: number
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}

function isValidKeyword(kw: unknown): kw is Keyword {
  if (typeof kw !== "object" || kw === null) return false;
  const k = kw as Record<string, unknown>;
  if (typeof k.word !== "string" || k.word.trim().length === 0) return false;
  if (
    typeof k.category !== "string" ||
    !VALID_CATEGORIES.includes(k.category as KeywordCategory)
  )
    return false;
  if (typeof k.importance !== "number") return false;
  if (typeof k.context !== "string") return false;
  return true;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 15, 60_000).ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON.", 400);
  }

  const rawText = (body as Record<string, unknown>)?.text;
  if (typeof rawText !== "string" || rawText.trim().length === 0) {
    return jsonError("Text is required.", 400);
  }

  const text = rawText.trim();
  const trimmed =
    text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text;

  const result = await generateText({
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Text:\n\n${trimmed}` }],
    temperature: 0.2,
    maxTokens: 2048,
    prefer: "groq",
  });

  if (!result.ok || !result.text) {
    return jsonError(result.error || "Extraction failed.", 502);
  }

  const parsed = parseJsonResponse<{ keywords?: unknown[] }>(result.text);
  if (!parsed || !Array.isArray(parsed.keywords)) {
    return jsonError("Response does not match schema.", 502);
  }

  const keywords: Keyword[] = parsed.keywords
    .filter(isValidKeyword)
    .map((k) => ({
      word: k.word.trim(),
      category: k.category as KeywordCategory,
      importance: Math.max(1, Math.min(5, Math.round(k.importance))),
      context: k.context.trim(),
    }));

  console.log(
    `[keywords] OK via "${result.provider}" | count=${keywords.length}`
  );
  return NextResponse.json({ keywords }, { status: 200 });
}