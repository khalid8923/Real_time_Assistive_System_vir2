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

const SYSTEM_PROMPT = `أنت محلل نصوص أكاديمية عربية. بتستقبل نص محاضرة جامعية أو شرح، ومهمتك تستخرج الكلمات المهمة والمصطلحات المفتاحية.

لكل كلمة مهمة، حدد:

1. **word**: الكلمة أو المصطلح (زي ما هو في النص)
   - لو المصطلح إنجليزي، سيبه إنجليزي (JavaScript, Array, API)
2. **category**: نوع الكلمة — واحد من:
   - "term" → مصطلح تقني أو علمي
   - "concept" → مفهوم أو فكرة عامة
   - "person" → اسم شخص أو عالم
   - "place" → مكان أو جهة
   - "number" → رقم أو تاريخ مهم
   - "tool" → أداة أو لغة برمجة أو تقنية
3. **importance**: أهميته من 1 (منخفض) لـ 5 (مرتفع جداً)
4. **context**: جملة قصيرة جداً (5-10 كلمات) بتوضح الكلمة في سياقها

قواعد:
- استخرج بين 6 و 12 كلمة مهمة
- رتبهم حسب الأهمية (الأعلى أولاً)
- ممنوع تكرار نفس الكلمة
- اعتمد على النص الأصلي فقط
- الرد JSON فقط`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    keywords: {
      type: "array",
      items: {
        type: "object",
        properties: {
          word: { type: "string" },
          category: {
            type: "string",
            enum: ["term", "concept", "person", "place", "number", "tool"],
          },
          importance: { type: "number" },
          context: { type: "string" },
        },
        required: ["word", "category", "importance", "context"],
      },
    },
  },
  required: ["keywords"],
};

export type KeywordCategory =
  | "term"
  | "concept"
  | "person"
  | "place"
  | "number"
  | "tool";

export interface Keyword {
  word: string;
  category: KeywordCategory;
  importance: number;
  context: string;
}

interface KeywordsResult {
  keywords: Keyword[];
}

interface ErrorResponse {
  error: string;
}

function jsonError(message: string, status: number): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}

function isValidResult(data: unknown): data is KeywordsResult {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.keywords)) return false;
  for (const k of obj.keywords) {
    if (typeof k !== "object" || k === null) return false;
    const kw = k as Record<string, unknown>;
    if (typeof kw.word !== "string") return false;
    if (typeof kw.category !== "string") return false;
    if (typeof kw.importance !== "number") return false;
    if (typeof kw.context !== "string") return false;
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
): Promise<NextResponse<KeywordsResult | ErrorResponse>> {
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
    console.error("[keywords] All models failed:", lastError.slice(0, 200));
    if (lastError.includes("429") || lastError.toLowerCase().includes("quota")) {
      return jsonError("خدمة التحليل مشغولة، حاول بعد لحظات.", 429);
    }
    return jsonError("تعذّر الاتصال بخدمة التحليل.", 502);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    console.error("[keywords] Parse failed:", rawResponse.slice(0, 300));
    return jsonError("رد Gemini مش JSON صحيح.", 502);
  }

  if (!isValidResult(parsed)) {
    return jsonError("رد Gemini مش مطابق للصيغة.", 502);
  }

  console.log(
    `[keywords] OK via "${succeededModel}" | count=${parsed.keywords.length}`
  );

  return NextResponse.json(parsed, { status: 200 });
}