import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT_LENGTH = 10000;

const MODEL_FALLBACKS = [
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
];

const SYSTEM_PROMPT = `أنت مساعد تعليمي للطلاب الصم. بتستقبل نص محاضرة جامعية ومهمتك تولّد كروت مراجعة (Flashcards).

كل كرت فيه:

1. **question**: سؤال قصير وواضح (5-15 كلمة)
   - يكون سؤال مفيد يختبر الفهم، مش حفظ
   - مثال: "إيه الفرق بين Array و Object؟"
2. **answer**: إجابة موجزة وشاملة (10-30 كلمة)
   - إجابة مباشرة على السؤال
3. **difficulty**: "easy" | "medium" | "hard"
   - easy: تعريف أو معلومة مباشرة
   - medium: فهم أو مقارنة
   - hard: تطبيق أو تحليل

قواعد:
- ولّد بين 5 و 10 كروت
- اعتمد على المحتوى الفعلي فقط
- نوّع الأسئلة (تعريفات، مقارنات، تطبيقات)
- سيب المصطلحات الإنجليزي (Array, API, JavaScript)
- الرد JSON فقط`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    cards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
          difficulty: {
            type: "string",
            enum: ["easy", "medium", "hard"],
          },
        },
        required: ["question", "answer", "difficulty"],
      },
    },
  },
  required: ["cards"],
};

export type FlashcardDifficulty = "easy" | "medium" | "hard";

export interface Flashcard {
  question: string;
  answer: string;
  difficulty: FlashcardDifficulty;
}

interface FlashcardsResult {
  cards: Flashcard[];
}

interface ErrorResponse {
  error: string;
}

function jsonError(message: string, status: number): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}

function isValidResult(data: unknown): data is FlashcardsResult {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.cards)) return false;
  for (const c of obj.cards) {
    if (typeof c !== "object" || c === null) return false;
    const card = c as Record<string, unknown>;
    if (typeof card.question !== "string") return false;
    if (typeof card.answer !== "string") return false;
    if (typeof card.difficulty !== "string") return false;
  }
  return true;
}

async function tryGenerate(
  ai: GoogleGenAI,
  model: string,
  text: string
): Promise<{ ok: true; text: string } | { ok: false; error: string; notFound: boolean }> {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `النص:\n\n${text}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });
    return { ok: true, text: response.text ?? "" };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const notFound =
      errMsg.includes("404") || errMsg.toLowerCase().includes("not_found");
    return { ok: false, error: errMsg, notFound };
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<FlashcardsResult | ErrorResponse>> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return jsonError("Server misconfiguration.", 500);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  if (typeof body !== "object" || body === null || !("text" in body)) {
    return jsonError('Request body must include a "text" field.', 400);
  }

  const rawText = (body as Record<string, unknown>).text;
  if (typeof rawText !== "string") {
    return jsonError('The "text" field must be a string.', 400);
  }

  const text = rawText.trim();
  if (text.length === 0) {
    return jsonError('The "text" field cannot be empty.', 400);
  }

  const trimmedText =
    text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text;

  const ai = new GoogleGenAI({ apiKey });

  let rawResponse = "";
  let lastError = "";
  let succeededModel = "";

  for (const model of MODEL_FALLBACKS) {
    const result = await tryGenerate(ai, model, trimmedText);
    if (result.ok) {
      rawResponse = result.text;
      succeededModel = model;
      break;
    }
    lastError = result.error;
    if (!result.notFound) break;
  }

  if (!rawResponse) {
    console.error("[flashcards] All models failed:", lastError.slice(0, 200));
    if (lastError.includes("429") || lastError.toLowerCase().includes("quota")) {
      return jsonError("خدمة التوليد مشغولة، حاول بعد لحظات.", 429);
    }
    return jsonError("تعذّر الاتصال بخدمة التوليد.", 502);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    console.error("[flashcards] Parse failed:", rawResponse.slice(0, 300));
    return jsonError("رد Gemini مش JSON صحيح.", 502);
  }

  if (!isValidResult(parsed)) {
    return jsonError("رد Gemini مش مطابق للصيغة.", 502);
  }

  console.log(
    `[flashcards] OK via "${succeededModel}" | cards=${parsed.cards.length}`
  );

  return NextResponse.json(parsed, { status: 200 });
}