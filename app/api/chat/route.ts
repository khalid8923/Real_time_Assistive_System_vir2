import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, type ChatMessage } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_CONTEXT_LENGTH = 8000;
const MAX_MESSAGES = 20;
const MAX_QUESTION_LENGTH = 500;

const SYSTEM_PROMPT = `You are a smart academic assistant for deaf students in CaptionBridge. You help them understand a recorded university lecture.

You have:
- The full lecture transcript (context)
- The student's question

Your task:
- Answer the question based on the lecture content
- If the question is unrelated, politely say it is out of scope
- Answer in clear Modern Standard Arabic
- Be concise and clear
- Keep English terms as-is (Array, API, React)
- If info is not in the lecture, say "هذه المعلومة غير موجودة في المحاضرة"
- Never invent information

Style:
- Direct without long introductions
- Explain with example when possible
- Use bullet points for multiple items`;

interface RequestBody {
  question: string;
  context: string;
  history?: ChatMessage[];
}

interface ErrorResponse {
  error: string;
}

interface SuccessResponse {
  answer: string;
  provider: string;
  model: string;
}

function jsonError(
  message: string,
  status: number
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 20, 60_000).ok) {
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

  if (typeof body !== "object" || body === null) {
    return jsonError("Invalid request body.", 400);
  }

  const { question, context, history } = body as Partial<RequestBody>;

  if (typeof question !== "string" || question.trim().length === 0) {
    return jsonError("Question is required.", 400);
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return jsonError(
      `Question too long (max ${MAX_QUESTION_LENGTH} characters).`,
      413
    );
  }

  if (typeof context !== "string" || context.trim().length === 0) {
    return jsonError("Context (lecture) is required.", 400);
  }

  const trimmedContext =
    context.length > MAX_CONTEXT_LENGTH
      ? context.slice(0, MAX_CONTEXT_LENGTH)
      : context;

  const safeHistory: ChatMessage[] = Array.isArray(history)
    ? history
        .filter(
          (m): m is ChatMessage =>
            typeof m === "object" &&
            m !== null &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string"
        )
        .slice(-MAX_MESSAGES)
    : [];

  const systemPromptWithContext = `${SYSTEM_PROMPT}

---

Lecture text (context):
${trimmedContext}

---`;

  const messages: ChatMessage[] = [
    ...safeHistory,
    { role: "user", content: question.trim() },
  ];

  const result = await generateText({
    systemPrompt: systemPromptWithContext,
    messages,
    temperature: 0.5,
    maxTokens: 1024,
  });

  if (!result.ok || !result.text) {
    console.error("[chat] Failed:", result.error);
    return jsonError(result.error || "Failed to generate response.", 502);
  }

  console.log(
    `[chat] OK via "${result.provider}/${result.model}" | q=${question.length}c | a=${result.text.length}c`
  );

  return NextResponse.json(
    {
      answer: result.text.trim(),
      provider: result.provider ?? "unknown",
      model: result.model ?? "unknown",
    },
    { status: 200 }
  );
}