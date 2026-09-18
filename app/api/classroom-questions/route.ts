import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a smart analyzer in a university classroom. Distant students' questions are not caught by the mic. The professor replies to them.

Your task: infer the hidden question from the professor's answer.

Look for professor replies to classroom questions:
- "سؤال ممتاز"
- "زي ما زميلكم سأل"
- "بالنسبة لسؤالك"
- "في حد سأل عن..."

For each pair:
- inferredQuestion: The likely question (5-15 words)
- answer: Summary of professor's answer (10-40 words)
- confidence: "high" | "medium" | "low"

Rules:
- Infer from the answer content, not imagination
- If unsure -> confidence: "low"
- Reply with JSON only:
{
  "questions": [
    { "inferredQuestion": "...", "answer": "...", "confidence": "high" }
  ]
}`;

import type { ClassroomQuestion } from "@/lib/ai-types";

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
  if (!rateLimit(ip, 10, 60_000).ok) {
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
  const trimmed = text.length > 8000 ? text.slice(0, 8000) : text;

  const result = await generateText({
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Text:\n\n${trimmed}` }],
    temperature: 0.3,
    maxTokens: 2048,
    prefer: "groq",
  });

  if (!result.ok || !result.text) {
    return jsonError(result.error || "Inference failed.", 502);
  }

  const parsed = parseJsonResponse<{
    questions?: Omit<ClassroomQuestion, "id" | "detectedAt">[];
  }>(result.text);

  if (!parsed) {
    return jsonError("Response does not match schema.", 502);
  }

  const questions: ClassroomQuestion[] = (parsed.questions ?? []).map((q) => ({
    ...q,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    detectedAt: Date.now(),
  }));

  console.log(
    `[classroom-questions] OK via "${result.provider}" | found=${questions.length}`,
  );
  return NextResponse.json({ questions }, { status: 200 });
}
