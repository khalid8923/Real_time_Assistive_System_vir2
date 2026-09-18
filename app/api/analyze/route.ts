import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT_LENGTH = 8000;

const SYSTEM_PROMPT = `You are an academic analyst inside a real-time captioning tool for deaf students. You receive a lecture transcript chunk in Arabic (may contain English technical terms).

Extract:

1. topic: Main topic in Arabic (3-6 words)
   - Always extract if text has any useful idea
   - Example: "البرمجة بلغة JavaScript", "أساسيات قواعد البيانات"
   - topic = "" only if text is pure filler, silence, or non-Arabic

2. children: 2-4 subtopics
   - Each 2-5 words in Arabic

3. terms: Academic or technical terms with brief definitions
   - One line each
   - English term stays English (Array, API, React)
   - Definition in Arabic
   - Extract 2-6 terms if present

Rules:
- Do not invent content not present in the text
- Rely on core meaning even if phrasing is incomplete
- Reply with JSON only:
{
  "topic": "...",
  "children": ["...", "..."],
  "terms": [
    { "term": "...", "definition": "..." }
  ]
}`;

interface AnalysisResult {
  topic: string;
  children: string[];
  terms: { term: string; definition: string }[];
}

interface ErrorResponse {
  error: string;
}

function jsonError(
  message: string,
  status: number
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}

function isValidResult(data: unknown): data is AnalysisResult {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.topic !== "string") return false;
  if (!Array.isArray(obj.children)) return false;
  if (!obj.children.every((c) => typeof c === "string")) return false;
  if (!Array.isArray(obj.terms)) return false;
  for (const t of obj.terms) {
    if (typeof t !== "object" || t === null) return false;
    const term = t as Record<string, unknown>;
    if (typeof term.term !== "string") return false;
    if (typeof term.definition !== "string") return false;
  }
  return true;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<AnalysisResult | ErrorResponse>> {
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
    return jsonError("Request body must be valid JSON.", 400);
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
    console.error("[analyze] Failed:", result.error);
    return jsonError(result.error || "Analysis failed.", 502);
  }

  const parsed = parseJsonResponse(result.text);
  if (!parsed || !isValidResult(parsed)) {
    console.error("[analyze] Invalid response:", result.text.slice(0, 300));
    return jsonError("Response does not match schema.", 502);
  }

  console.log(
    `[analyze] OK via "${result.provider}/${result.model}" | topic="${parsed.topic}" | terms=${parsed.terms.length}`
  );

  return NextResponse.json(parsed, { status: 200 });
}