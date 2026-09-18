import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT_LENGTH = 10000;

const SYSTEM_PROMPT = `You are an academic assistant for deaf students. You receive a lecture transcript and summarize it.

Your task: summarize the lecture in an organized form:

1. title: Short Arabic title (3-7 words)
2. overview: Short paragraph (2-4 sentences) explaining the main idea
3. keyPoints: 4-7 main points, each a complete sentence
4. conclusion: One sentence summarizing the takeaway

Rules:
- Rely only on the original text - never invent information
- Keep English terms as-is (JavaScript, API)
- Language: clear simple Modern Standard Arabic
- Reply with JSON only:
{
  "title": "...",
  "overview": "...",
  "keyPoints": ["...", "..."],
  "conclusion": "..."
}`;

interface SummaryResult {
  title: string;
  overview: string;
  keyPoints: string[];
  conclusion: string;
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

function isValidSummary(data: unknown): data is SummaryResult {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.title !== "string") return false;
  if (typeof obj.overview !== "string") return false;
  if (!Array.isArray(obj.keyPoints)) return false;
  if (!obj.keyPoints.every((p) => typeof p === "string")) return false;
  if (typeof obj.conclusion !== "string") return false;
  return true;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SummaryResult | ErrorResponse>> {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 10, 60_000).ok) {
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
    temperature: 0.3,
    maxTokens: 2048,
    prefer: "groq",
  });

  if (!result.ok || !result.text) {
    return jsonError(result.error || "Summarization failed.", 502);
  }

  const parsed = parseJsonResponse(result.text);
  if (!parsed || !isValidSummary(parsed)) {
    return jsonError("Response does not match schema.", 502);
  }

  console.log(`[summarize] OK via "${result.provider}"`);
  return NextResponse.json(parsed, { status: 200 });
}