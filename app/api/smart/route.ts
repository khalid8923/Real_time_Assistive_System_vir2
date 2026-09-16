/**
 * app/api/smart/route.ts
 *
 * The Middleman — a single endpoint that:
 *   1. Transcribes audio via Groq Whisper Large V3 Turbo
 *   2. Refines and enriches the text via Google Gemini
 *   3. Returns clean structured data: text + topic + children + terms
 *
 * Required env vars:
 *   GROQ_API_KEY=...
 *   GEMINI_API_KEY=...
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3-turbo";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_TEXT_LENGTH = 5000;

// NOTE: We intentionally do NOT send a "prompt" to Whisper.
// Whisper hallucinates the prompt itself during silence/noise,
// producing garbage like "محاضرة جامعية باللغة العربية" repeated.

const REFINE_SYSTEM_PROMPT = `أنت محرك تنضيف نصوص أكاديمية عربية. بتستقبل نص خام من تحويل صوت لمحاضرة جامعية.

النص ممكن يكون فيه:
- أخطاء إملائية من الصوت
- كلمات مكررة
- كلمات حشو (يعني، اه، ممم، آآآ)
- بدون علامات ترقيم
- خلط بين عربي وإنجليزي

مهمتك:

1. **تنضيف النص (text):**
   - صلّح الأخطاء الإملائية
   - شيل الكلمات المكررة والحشو
   - ضيف علامات الترقيم المناسبة
   - سيب المصطلحات الإنجليزي الأكاديمي زي ما هي (Array, API, Linear Algebra)
   - حافظ على المعنى الأصلي 100% — ممنوع تأليف أي محتوى
   - لو النص مش عربي مفيد (سكوت، تشويش، كلام غير مفهوم تماماً) → ارجع text = ""

2. **استخراج الموضوع (topic):**
   - الموضوع الرئيسي في جملة قصيرة بالعربي (3-6 كلمات)
   - لو النص فيه أي معلومة مفيدة (حتى لو مش محاضرة كاملة) → استخرج موضوع
   - مثال: "البرمجة بلغة JavaScript" أو "قواعد البيانات العلائقية"
   - topic = "" فقط لو النص: حشو بحت، أو سكوت، أو كلام غير مفهوم تماماً، أو مش عربي
   - متكنش متشدد — أي نص فيه أفكار → استخرج موضوع

3. **الفروع (children):**
   - 2-4 مفاهيم فرعية مذكورة أو ضمنية
   - كل واحد في 2-5 كلمات بالعربي
   - لو مفيش أفكار فرعية واضحة → ارجع مصفوفة فاضية

4. **المصطلحات (terms):**
   - كل مصطلح أكاديمي أو تقني مع تعريف بسيط بالعربي (سطر واحد)
   - المصطلح الإنجليزي يفضل بالإنجليزي (API, Array)
   - لو مفيش مصطلحات → ارجع terms = []

قواعد صارمة:
- ممنوع تالف أي محتوى مش موجود في النص
- الرد لازم يكون JSON فقط، بدون أي كلام إضافي
- بدون markdown code fences`;

const REFINE_SCHEMA = {
  type: "object",
  properties: {
    text: {
      type: "string",
      description: "النص النظيف بعد التصحيح. فاضي لو مش عربي مفيد.",
    },
    topic: {
      type: "string",
      description: "الموضوع الرئيسي بالعربي. فاضي لو مش أكاديمي.",
    },
    children: {
      type: "array",
      items: { type: "string" },
      description: "2-4 فروع فرعية.",
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
      description: "المصطلحات الأكاديمية.",
    },
  },
  required: ["text", "topic", "children", "terms"],
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RefinedResult {
  text: string;
  topic: string;
  children: string[];
  terms: { term: string; definition: string }[];
}

interface ErrorResponse {
  error: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonError(message: string, status: number): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}

function stripMarkdownFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function isValidRefinedResult(data: unknown): data is RefinedResult {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.text !== "string") return false;
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

function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

// ---------------------------------------------------------------------------
// Step 1: Transcribe audio via Groq Whisper
// ---------------------------------------------------------------------------

async function transcribeAudio(
  audio: Blob,
  groqKey: string
): Promise<{ text: string } | { error: string }> {
  const formData = new FormData();
  formData.append("file", audio, "chunk.webm");
  formData.append("model", GROQ_MODEL);
  formData.append("language", "ar");
  formData.append("response_format", "json");
  formData.append("temperature", "0");

  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${groqKey}` },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[smart] Groq error ${res.status}:`, errText.slice(0, 200));
    if (res.status === 401 || res.status === 403) {
      return { error: "Server misconfiguration (Groq)." };
    }
    if (res.status === 429) {
      return { error: "خدمة التحويل مشغولة، حاول تاني." };
    }
    return { error: "فشل تحويل الصوت إلى نص." };
  }

  const data = (await res.json()) as { text?: string };
  return { text: (data.text ?? "").trim() };
}

// ---------------------------------------------------------------------------
// Step 2: Refine and enrich text via Gemini
// ---------------------------------------------------------------------------

async function refineText(
  rawText: string,
  geminiKey: string
): Promise<{ result: RefinedResult } | { error: string }> {
  const geminiBody = {
    systemInstruction: { parts: [{ text: REFINE_SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [{ text: `النص الخام:\n\n${rawText}` }],
      },
    ],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      responseSchema: REFINE_SCHEMA,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ],
  };

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${geminiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(geminiBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[smart] Gemini error ${res.status}:`, errText.slice(0, 200));
    if (res.status === 429) {
      return { error: "خدمة التنضيف مشغولة، حاول تاني." };
    }
    return { error: "فشل تنضيف النص." };
  }

  const data: {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    promptFeedback?: { blockReason?: string };
  } = await res.json();

  if (data.promptFeedback?.blockReason) {
    return { result: { text: "", topic: "", children: [], terms: [] } };
  }

  const rawResponse =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

  if (!rawResponse.trim()) {
    return { error: "Gemini returned empty response." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripMarkdownFences(rawResponse));
  } catch {
    console.error("[smart] Parse failed:", rawResponse.slice(0, 300));
    return { error: "Gemini response is not valid JSON." };
  }

  if (!isValidRefinedResult(parsed)) {
    return { error: "Gemini response does not match schema." };
  }

  return { result: parsed };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest
): Promise<NextResponse<RefinedResult | ErrorResponse>> {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  if (!groqKey) {
    console.error("[smart] GROQ_API_KEY missing");
    return jsonError("Server misconfiguration (Groq).", 500);
  }
  if (!geminiKey) {
    console.error("[smart] GEMINI_API_KEY missing");
    return jsonError("Server misconfiguration (Gemini).", 500);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Request must be multipart/form-data.", 400);
  }

  const audio = formData.get("audio");
  if (!(audio instanceof Blob)) {
    return jsonError('Missing "audio" field.', 400);
  }
  if (audio.size === 0) {
    return jsonError("Audio file is empty.", 400);
  }
  if (audio.size > MAX_FILE_SIZE) {
    return jsonError("Audio file is too large.", 413);
  }

  const startedAt = Date.now();
  console.log(`[smart] Processing ${(audio.size / 1024).toFixed(1)} KB`);

  let rawText: string;
  try {
    const transcribeResult = await transcribeAudio(audio, groqKey);
    if ("error" in transcribeResult) {
      return jsonError(transcribeResult.error, 502);
    }
    rawText = transcribeResult.text;
  } catch (err) {
    console.error("[smart] Transcription threw:", err);
    return jsonError("تعذّر الاتصال بخدمة التحويل.", 502);
  }

  console.log(`[smart] Transcribed: ${rawText.length} chars`);

  if (rawText.length === 0 || !hasArabic(rawText)) {
    console.log("[smart] No Arabic content, discarding");
    return NextResponse.json(
      { text: "", topic: "", children: [], terms: [] },
      { status: 200 }
    );
  }

  const textForRefine =
    rawText.length > MAX_TEXT_LENGTH ? rawText.slice(0, MAX_TEXT_LENGTH) : rawText;

  let refined: RefinedResult;
  try {
    const refineResult = await refineText(textForRefine, geminiKey);
    if ("error" in refineResult) {
      console.error("[smart] Refine failed:", refineResult.error);
      refined = { text: rawText, topic: "", children: [], terms: [] };
    } else {
      refined = refineResult.result;
    }
  } catch (err) {
    console.error("[smart] Refine threw:", err);
    refined = { text: rawText, topic: "", children: [], terms: [] };
  }

  if (!refined.text || !hasArabic(refined.text)) {
    console.log("[smart] No meaningful Arabic after refinement");
    return NextResponse.json(
      { text: "", topic: "", children: [], terms: [] },
      { status: 200 }
    );
  }

  const elapsed = Date.now() - startedAt;
  console.log(
    `[smart] Done in ${elapsed}ms | text=${refined.text.length}c | topic="${refined.topic}" | terms=${refined.terms.length}`
  );

  return NextResponse.json(refined, { status: 200 });
}