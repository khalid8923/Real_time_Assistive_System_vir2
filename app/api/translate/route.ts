import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT_LENGTH = 8000;

const MODEL_FALLBACKS = [
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
];

const SYSTEM_PROMPT = `أنت مترجم متخصص في المحتوى الأكاديمي. بتستقبل نص محاضرة جامعية عربية (فيه مصطلحات إنجليزي متداخلة).

مهمتك:
1. استخرج كل المصطلحات أو الجمل الإنجليزي (مش العربي)
2. لكل مصطلح إنجليزي، اعمله ترجمة عربية دقيقة في سياق المحاضرة
3. حدد نوع المصطلح

قواعد:
- استخرج بس الإنجليزي (متترجمش العربي)
- لو مفيش إنجليزي في النص → رجّع مصفوفة فاضية
- الترجمة تكون بالسياق الأكاديمي (مش ترجمة حرفية)
- مثال: "API" → "واجهة برمجية للتطبيقات"
- مثال: "Machine Learning" → "تعلم الآلة"
- رتب المصطلحات حسب الأهمية
- منعاً للتكرار

لكل مصطلح حدد:
- original: النص الإنجليزي كما ظهر
- translated: الترجمة العربية
- type: نوع المصطلح — واحد من: "technical" | "concept" | "tool" | "framework" | "general"
- context: جملة قصيرة (5-10 كلمات) من النص فيها المصطلح
- pronunciation: طريقة النطق بالعربي (اختياري، للحاجات الصعبة بس)

الرد JSON فقط.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    translations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          translated: { type: "string" },
          type: {
            type: "string",
            enum: ["technical", "concept", "tool", "framework", "general"],
          },
          context: { type: "string" },
          pronunciation: { type: "string" },
        },
        required: ["original", "translated", "type", "context"],
      },
    },
  },
  required: ["translations"],
};

export type TranslationType =
  | "technical"
  | "concept"
  | "tool"
  | "framework"
  | "general";

export interface Translation {
  original: string;
  translated: string;
  type: TranslationType;
  context: string;
  pronunciation?: string;
}

interface TranslationResult {
  translations: Translation[];
}

interface ErrorResponse {
  error: string;
}

function jsonError(message: string, status: number): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}

function isValidResult(data: unknown): data is TranslationResult {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.translations)) return false;
  for (const t of obj.translations) {
    if (typeof t !== "object" || t === null) return false;
    const tr = t as Record<string, unknown>;
    if (typeof tr.original !== "string") return false;
    if (typeof tr.translated !== "string") return false;
    if (typeof tr.type !== "string") return false;
    if (typeof tr.context !== "string") return false;
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
        temperature: 0.2,
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
): Promise<NextResponse<TranslationResult | ErrorResponse>> {
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
    console.error("[translate] All models failed:", lastError.slice(0, 200));
    if (lastError.includes("429") || lastError.toLowerCase().includes("quota")) {
      return jsonError("خدمة الترجمة مشغولة، حاول بعد لحظات.", 429);
    }
    return jsonError("تعذّر الاتصال بخدمة الترجمة.", 502);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    return jsonError("رد Gemini مش JSON صحيح.", 502);
  }

  if (!isValidResult(parsed)) {
    return jsonError("رد Gemini مش مطابق للصيغة.", 502);
  }

  console.log(
    `[translate] OK via "${succeededModel}" | count=${parsed.translations.length}`
  );

  return NextResponse.json(parsed, { status: 200 });
}