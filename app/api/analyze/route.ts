import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT_LENGTH = 8000;

// Try these models in order until one works
const MODEL_FALLBACKS = [
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
];

const SYSTEM_PROMPT = `أنت محلل أكاديمي داخل أداة ترجمة فورية للطلاب الصم. بتستقبل نص من محاضرة جامعية أو شرح عربي (ممكن يكون فيه أخطاء إملائية، جمل ناقصة، خلط بين عربي وإنجليزي).

مهمتك استخراج:

1. topic: الموضوع الرئيسي بالعربي في جملة قصيرة (3-6 كلمات)
   - لازم دايماً تستخرج topic لو النص فيه أي فكرة مفيدة
   - مثال: "البرمجة بلغة JavaScript", "أساسيات قواعد البيانات"
   - topic = "" فقط لو النص كله حشو، سكوت، أو مش عربي

2. children: 2-4 مفاهيم فرعية مذكورة أو ضمنية
   - كل واحد في 2-5 كلمات بالعربي

3. terms: المصطلحات الأكاديمية أو التقنية مع تعريف بسيط
   - كل مصطلح في سطر واحد
   - المصطلح الإنجليزي يبقى إنجليزي (Array, API, React)
   - التعريف بالعربي الواضح
   - استخرج 2-6 مصطلحات لو موجودة

قواعد:
- ممنوع تأليف أي محتوى مش موجود في النص
- اعتمد على المعنى الأساسي حتى لو الصياغة مش كاملة
- الرد JSON فقط`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    topic: { type: "string" },
    children: {
      type: "array",
      items: { type: "string" },
    },
    terms: {
      type: "array",
      items: {
        type: "object",
        properties: {
          term: { type: "string" },
          definition: { type: "string" },
        },
        required: ["term", "definition"],
      },
    },
  },
  required: ["topic", "children", "terms"],
};

interface AnalysisResult {
  topic: string;
  children: string[];
  terms: { term: string; definition: string }[];
}

interface ErrorResponse {
  error: string;
}

function jsonError(message: string, status: number): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}

function isValidResult(data: unknown): data is AnalysisResult {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.topic !== "string") return false;
  if (!Array.isArray(obj.children)) return false;
  if (!obj.children.every((c) => typeof c === "string")) return false;
  if (!Array.isArray(obj.terms)) return false;
  for (const t of obj.terms) {
    if (typeof t !== "object" || t === null) return false;
    const term = t as Record<string, unknown>;
    if (typeof term.term !== "string") return false;
    if (typeof term.definition !== "string") return false;
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

    const rawResponse = response.text ?? "";
    return { ok: true, text: rawResponse };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const notFound =
      errMsg.includes("404") || errMsg.toLowerCase().includes("not_found");
    return { ok: false, error: errMsg, notFound };
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<AnalysisResult | ErrorResponse>> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("[analyze] GEMINI_API_KEY missing");
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

  // Try each model in order
  for (const model of MODEL_FALLBACKS) {
    const result = await tryGenerate(ai, model, trimmedText);

    if (result.ok) {
      rawResponse = result.text;
      succeededModel = model;
      break;
    }

    lastError = result.error;
    console.warn(`[analyze] Model "${model}" failed:`, result.error.slice(0, 150));

    // If it's NOT a 404, don't keep trying other models
    if (!result.notFound) {
      break;
    }
  }

  if (!rawResponse) {
    console.error("[analyze] All models failed. Last error:", lastError);

    if (lastError.includes("429") || lastError.toLowerCase().includes("quota")) {
      return jsonError("خدمة التحليل مشغولة، حاول بعد لحظات.", 429);
    }
    if (lastError.includes("401") || lastError.includes("403") || lastError.includes("API key")) {
      return jsonError("Server misconfiguration (Gemini).", 500);
    }

    return jsonError("تعذّر الاتصال بخدمة التحليل.", 502);
  }

  if (!rawResponse.trim()) {
    console.error("[analyze] Empty response");
    return jsonError("Gemini رجّع رد فاضي.", 502);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    console.error("[analyze] Parse failed:", rawResponse.slice(0, 300));
    return jsonError("رد Gemini مش JSON صحيح.", 502);
  }

  if (!isValidResult(parsed)) {
    console.error("[analyze] Schema mismatch:", JSON.stringify(parsed).slice(0, 300));
    return jsonError("رد Gemini مش مطابق للصيغة.", 502);
  }

  console.log(
    `[analyze] OK via "${succeededModel}" | topic="${parsed.topic}" | terms=${parsed.terms.length}`
  );

  return NextResponse.json(parsed, { status: 200 });
}