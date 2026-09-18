import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";
import type { Translation } from "@/lib/ai-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT_LENGTH = 8000;

const SYSTEM_PROMPT = `You are a translator specialized in academic content. You receive an Arabic lecture text containing English terms.

Your task: extract all English terms and translate them to Arabic.

For each term:
- original: English text
- translated: Arabic translation
- type: "technical" | "concept" | "tool" | "framework" | "general"
- context: Short sentence from the text
- pronunciation: Arabic pronunciation (optional)

Rules:
- Extract only English terms
- Translation must be academic-contextual
- If no English -> translations: []
- Reply with JSON only:
{
  "translations": [
    { "original": "API", "translated": "واجهة برمجية", "type": "technical", "context": "..." }
  ]
}`;

interface ErrorResponse {
  error: string;
}

function jsonError(
  message: string,
  status: number,
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 15, 60_000).ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 },
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
    return jsonError(result.error || "Translation failed.", 502);
  }

  const parsed = parseJsonResponse<{ translations?: Translation[] }>(
    result.text,
  );
  if (!parsed) {
    return jsonError("Response does not match schema.", 502);
  }

  console.log(
    `[translate] OK via "${result.provider}" | count=${(parsed.translations ?? []).length}`,
  );
  return NextResponse.json(
    { translations: parsed.translations ?? [] },
    { status: 200 },
  );
}
