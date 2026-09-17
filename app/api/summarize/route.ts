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

const SYSTEM_PROMPT = `أنت مساعد أكاديمي للطلاب الصم. بتستقبل نص محاضرة جامعية مكتوب من تحويل صوت (ممكن يكون فيه أخطاء إملائية، جمل ناقصة، خلط بين عربي وإنجليزي).

مهمتك تلخّص المحاضرة في شكل منظّم:

1. **title**: عنوان مختصر بالعربي (3-7 كلمات)
2. **overview**: فقرة قصيرة (2-4 جمل) بتشرح الفكرة العامة
3. **keyPoints**: 4-7 نقاط رئيسية، كل نقطة جملة كاملة
4. **conclusion**: جملة واحدة تلخّص الخلاصة

قواعد:
- اعتمد على النص الأصلي فقط — ممنوع تأليف معلومات
- سيب المصطلحات الإنجليزي زي ما هي (JavaScript, API)
- اللغة: عربي فصيح بسيط ومباشر
- لو النص مش فيه محتوى كافي (أقل من 50 كلمة مفيدة) → رجّع رسالة إن المحتوى غير كافي
- الرد JSON فقط`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    overview: { type: "string" },
    keyPoints: {
      type: "array",
      items: { type: "string" },
    },
    conclusion: { type: "string" },
  },
  required: ["title", "overview", "keyPoints", "conclusion"],
};

interface SummaryResult {
  title: string;
  overview: string;
  keyPoints: string[];
  conclusion: string;
}

interface ErrorResponse {
  error: string;
}

function jsonError(message: string, status: number): NextResponse<ErrorResponse> {
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
        temperature: 0.3,
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
): Promise<NextResponse<SummaryResult | ErrorResponse>> {
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
    console.error("[summarize] All models failed:", lastError.slice(0, 200));
    if (lastError.includes("429") || lastError.toLowerCase().includes("quota")) {
      return jsonError("خدمة التلخيص مشغولة، حاول بعد لحظات.", 429);
    }
    return jsonError("تعذّر الاتصال بخدمة التلخيص.", 502);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    console.error("[summarize] Parse failed:", rawResponse.slice(0, 300));
    return jsonError("رد Gemini مش JSON صحيح.", 502);
  }

  if (!isValidSummary(parsed)) {
    return jsonError("رد Gemini مش مطابق للصيغة.", 502);
  }

  console.log(
    `[summarize] OK via "${succeededModel}" | title="${parsed.title}" | points=${parsed.keyPoints.length}`
  );

  return NextResponse.json(parsed, { status: 200 });
}