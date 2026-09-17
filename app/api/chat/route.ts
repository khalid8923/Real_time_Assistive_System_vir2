import { NextRequest, NextResponse } from "next/server";
import { generateText, type ChatMessage } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_CONTEXT_LENGTH = 8000;
const MAX_MESSAGES = 20;
const MAX_QUESTION_LENGTH = 500;

const SYSTEM_PROMPT = `أنت مساعد أكاديمي ذكي للطلاب الصم في تطبيق CaptionBridge. بتساعدهم يفهموا محاضرة جامعية اتسجلت.

عندك:
- نص المحاضرة الكامل (السياق)
- سؤال الطالب

مهمتك:
- جاوب سؤال الطالب بناءً على محتوى المحاضرة
- لو السؤال مش متعلق بالمحاضرة، قول بأدب إن السؤال خارج الموضوع
- جاوب بالعربي الفصيح البسيط
- خليك مختصر وواضح
- سيب المصطلحات الإنجليزي زي ما هي (Array, API, React)
- لو معلومة مش موجودة في المحاضرة، قول "المعلومة دي مش موجودة في المحاضرة"
- ممنوع تأليف معلومات مش موجودة

أسلوب الرد:
- مباشر وبدون مقدمات طويلة
- اشرح بمثال لو ممكن
- استخدم نقاط لما يكون فيه أكثر من عنصر`;

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

function jsonError(message: string, status: number): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
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
    return jsonError("السؤال مطلوب.", 400);
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return jsonError(`السؤال طويل أوي (الحد الأقصى ${MAX_QUESTION_LENGTH} حرف).`, 413);
  }

  if (typeof context !== "string" || context.trim().length === 0) {
    return jsonError("النص الأصلي (المحاضرة) مطلوب.", 400);
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

نص المحاضرة (السياق):
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
    return jsonError(result.error || "تعذّر توليد الرد.", 502);
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