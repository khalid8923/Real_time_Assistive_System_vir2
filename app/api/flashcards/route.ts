import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";
import type { Flashcard, FlashcardDifficulty } from "@/lib/ai-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT_LENGTH = 8000;

const SYSTEM_PROMPT = `You are a study-card generator for deaf university students. You receive a lecture transcript in Arabic (may contain English technical terms) and generate study flashcards.

Your task: create 4-8 high-quality flashcards that test understanding of the lecture.

For each card:
- question: Clear question in Modern Standard Arabic (5-15 words)
- answer: Concise answer in Arabic (10-40 words), keep English terms as-is (Array, API, React)
- difficulty: "easy" | "medium" | "hard"

Rules:
- Questions should test understanding, not memorization of random facts
- Cover the most important concepts from the lecture
- If the text is too short or unclear, generate fewer cards (minimum 3)
- If no useful content at all, return cards: []
- Rely ONLY on the transcript content — never invent information
- Reply with JSON only:
{
  "cards": [
    { "question": "...", "answer": "...", "difficulty": "medium" }
  ]
}`;

interface SuccessResponse {
  cards: Flashcard[];
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

function isValidCard(card: unknown): card is Flashcard {
  if (typeof card !== "object" || card === null) return false;
  const c = card as Record<string, unknown>;
  if (typeof c.question !== "string" || c.question.trim().length === 0)
    return false;
  if (typeof c.answer !== "string" || c.answer.trim().length === 0)
    return false;
  if (
    c.difficulty !== "easy" &&
    c.difficulty !== "medium" &&
    c.difficulty !== "hard"
  )
    return false;
  return true;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
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
    temperature: 0.4,
    maxTokens: 2048,
    prefer: "groq",
  });

  if (!result.ok || !result.text) {
    return jsonError(result.error || "Generation failed.", 502);
  }

  const parsed = parseJsonResponse<{ cards?: unknown[] }>(result.text);
  if (!parsed || !Array.isArray(parsed.cards)) {
    return jsonError("Response does not match schema.", 502);
  }

  const cards: Flashcard[] = parsed.cards
    .filter(isValidCard)
    .map((c) => ({
      question: c.question.trim(),
      answer: c.answer.trim(),
      difficulty: c.difficulty as FlashcardDifficulty,
    }));

  console.log(
    `[flashcards] OK via "${result.provider}" | count=${cards.length}`
  );
  return NextResponse.json({ cards }, { status: 200 });
}