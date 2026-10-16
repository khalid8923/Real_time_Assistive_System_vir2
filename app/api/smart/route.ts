import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const EMPTY_RESPONSE = { text: "", topic: "", children: [], terms: [] };

/* ------------------------------------------------------------------ */
/* Shared Vocabulary Hint (from Layer 1)                              */
/* ------------------------------------------------------------------ */

const ARABIC_LECTURE_PROMPT =
  "محاضرة جامعية بالعربي المصري عن الذكاء الاصطناعي والحاسبات والبرمجة. " +
  "احتفظ بالمصطلحات والأسماء الإنجليزية كما هي بالإنجليزي ولا تحوّلها لعربي: " +
  "ELIZA, Weizenbaum, Rogers, RNN, LSTM, GRU, LLM, GPT, ChatGPT, " +
  "Transformer, Attention, Token, Embedding, Vector, Backpropagation, " +
  "Google, OpenAI, NVIDIA, GPU, CPU, API, NLP, AI, ML, DL, Neural Network.";

/* ------------------------------------------------------------------ */
/* Multi-key Hakim with round-robin + auto-failover                   */
/* ------------------------------------------------------------------ */

function getHakimKeys(): string[] {
  return [
    process.env.HAKIM_API_KEY?.trim(),
    process.env.HAKIM_API_KEY_2?.trim(),
    process.env.HAKIM_API_KEY_3?.trim(),
    process.env.HAKIM_API_KEY_4?.trim(),
    process.env.HAKIM_API_KEY_5?.trim(),
  ].filter((k): k is string => !!k && k.length > 0);
}

let hakimRoundRobin = 0;

async function transcribeWithHakim(audio: Blob): Promise<string> {
  const keys = getHakimKeys();
  if (keys.length === 0) return "";

  const startIdx = hakimRoundRobin % keys.length;
  hakimRoundRobin = (hakimRoundRobin + 1) % keys.length;

  for (let i = 0; i < keys.length; i++) {
    const idx = (startIdx + i) % keys.length;
    const apiKey = keys[idx];

    const formData = new FormData();
    formData.append("file", audio, "chunk.webm");
    formData.append("model", "hakim-arab-v2");
    formData.append("language", "ar");
    formData.append("response_format", "json");
    formData.append("prompt", ARABIC_LECTURE_PROMPT);

    try {
      const res = await fetch(
        "https://api.tryhakim.ai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: formData,
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[hakim #${idx + 1}] ${res.status}:`, errText.slice(0, 150));

        if (res.status === 429 || res.status === 401 || res.status === 403) {
          continue;
        }
        return "";
      }

      const data = (await res.json()) as {
        text?: string;
        data?: { text?: string };
      };

      const text = (data.text ?? data.data?.text ?? "").trim();
      if (text.length > 0) {
        console.log(`[smart] Hakim key #${idx + 1} returned ${text.length}c`);
        return text;
      }

      console.log(`[smart] Hakim key #${idx + 1} returned empty`);
    } catch (err) {
      console.warn(`[hakim #${idx + 1}] threw:`, err);
      continue;
    }
  }

  return "";
}

/* ------------------------------------------------------------------ */
/* Groq Whisper (fallback)                                            */
/* ------------------------------------------------------------------ */

async function transcribeWithGroq(audio: Blob): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return "";

  const formData = new FormData();
  formData.append("file", audio, "chunk.webm");
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("response_format", "json");
  formData.append("temperature", "0");
  formData.append("language", "ar");
  formData.append("prompt", ARABIC_LECTURE_PROMPT);

  const res = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[groq] ${res.status}:`, errText.slice(0, 200));
    return "";
  }

  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}

/* ------------------------------------------------------------------ */
/* Hallucination & Quality Filter                                     */
/* ------------------------------------------------------------------ */

const HALLUCINATION_PATTERNS: RegExp[] = [
  /\b(vo[cç][eê]|obrigad[oa]|por favor|ent[ãa]o|muito|bom dia|at[eé])\b/i,
  /\b(legendado|legendas?|legenda)\b/i,
  /\b(gracias|hola|se[ñn]or|amigo)\b/i,
  /\b(mul[țt]umesc|bun[ăa]|salut|rom[âa]n)\b/i,
  /\b(subtitles?|subs?|caption(s|ed)?|transcri(p|b)ed?)\s+by\b/i,
  /\b(thank you for watching|the end|subscribe|like and share)\b/i,
  /(.)\1{4,}/,
  /\b([a-z]-){3,}[a-z]+\b/i,
  /[\u00A9\u00AE\u2122]/,
];

function arabicRatio(text: string): number {
  const letters = text.replace(/[^\p{L}]/gu, "");
  if (letters.length === 0) return 0;
  const arabicCount = (letters.match(/[\u0600-\u06FF]/g) ?? []).length;
  return arabicCount / letters.length;
}

function isBadTranscription(text: string): { bad: boolean; reason?: string } {
  const t = text.trim();
  if (t.length === 0) return { bad: true, reason: "empty" };

  for (const p of HALLUCINATION_PATTERNS) {
    if (p.test(t)) return { bad: true, reason: "hallucination-pattern" };
  }

  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 2) return { bad: true, reason: "too-short" };

  const ratio = arabicRatio(t);
  if (ratio < 0.4) {
    return { bad: true, reason: `low-arabic-ratio:${ratio.toFixed(2)}` };
  }

  return { bad: false };
}

/* ------------------------------------------------------------------ */
/* Layer 2 — LLM Correction                                          */
/* ------------------------------------------------------------------ */

const CORRECTION_SYSTEM_PROMPT = `أنت مصحح نصوص عربية لمحاضرة جامعية. مهمتك إصلاح أخطاء النسخ الصوتي فقط.

قواعد صارمة:
1. أصلح أسماء الأعلام الإنجليزية المترجمة خطأ إلى كلمات عربية:
   - "مكاسب زوجية" → "كارل روجرز"
   - "روجوز" → "Rogers"
   - "إسحاق" في سياق ELIZA → "Weizenbaum"
   - "Resilient Psychotherapy" → "Rogerian Psychotherapy"
2. أصلح الاختصارات الإنجليزية الخاطئة:
   - "RNA" أو "RNM" في سياق الشبكات العصبية → "RNN"
   - "ال LL. سي تي ام" أو "LSTM" متكسرة → "LSTM"
   - "Tension Mechanism" → "Attention Mechanism"
   - "Guardant Neural Networks" → "Recurrent Neural Networks"
3. أصلح الكلمات العربية المكسورة:
   - "لآناته" → "لا يعني له"
   - "خلّبت اللعبة" → "ورقة Google"
4. احتفظ بجميع المصطلحات الإنجليزية كما هي: RNN, LSTM, ELIZA, Attention, Token, Embedding, GPT, LLM
5. لا تترجم أي مصطلح إنجليزي إلى عربي
6. لا تضف أي شرح أو مقدمة أو خاتمة أو علامات اقتباس
7. أعد النص المصحح فقط، بنفس التنسيق والطول تقريباً
8. لو النص سليم أصلاً، أرجعه كما هو بدون أي تغيير`;

async function correctTranscription(rawText: string): Promise<string> {
  const trimmed = rawText.trim();
  if (trimmed.length < 5) return rawText;

  try {
    const startedAt = Date.now();

    const result = await generateText({
      systemPrompt: CORRECTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: trimmed }],
      temperature: 0.1,
      maxTokens: Math.min(1500, Math.ceil(trimmed.length * 2)),
      prefer: "groq",
    });

    if (!result.ok || !result.text) {
      console.log(`[correct] LLM failed: ${result.error ?? "no text"}`);
      return rawText;
    }

    let corrected = result.text.trim();

    // Strip markdown code fences لو الـ LLM لفّ النص
    corrected = corrected
      .replace(/^```[\s\S]*?\n/, "")
      .replace(/\n```\s*$/, "")
      .trim();

    // Strip common preambles
    corrected = corrected
      .replace(
        /^(النص المصحح|النص بعد التصحيح|Corrected[^\n]*|Output)[\s:：\-]*/i,
        ""
      )
      .trim();

    // Strip surrounding quotes
    if (
      (corrected.startsWith('"') && corrected.endsWith('"')) ||
      (corrected.startsWith("«") && corrected.endsWith("»"))
    ) {
      corrected = corrected.slice(1, -1).trim();
    }

    // Sanity check 1: non-empty
    if (corrected.length === 0) {
      console.log("[correct] empty result, keeping original");
      return rawText;
    }

    // Sanity check 2: length ratio
    const ratio = corrected.length / rawText.length;
    if (ratio < 0.5) {
      console.log(`[correct] too short (ratio=${ratio.toFixed(2)}), keeping original`);
      return rawText;
    }
    if (ratio > 1.8) {
      console.log(`[correct] too long (ratio=${ratio.toFixed(2)}), keeping original`);
      return rawText;
    }

    // Sanity check 3: re-run hallucination filter on corrected text
    const verdict = isBadTranscription(corrected);
    if (verdict.bad) {
      console.log(
        `[correct] corrected fails filter (${verdict.reason}), keeping original`
      );
      return rawText;
    }

    const elapsed = Date.now() - startedAt;

    // Log only when something actually changed
    if (corrected !== rawText) {
      console.log(
        `[correct] ${elapsed}ms via ${result.provider} | ${rawText.length}c → ${corrected.length}c`
      );
    } else {
      console.log(`[correct] ${elapsed}ms via ${result.provider} | no change`);
    }

    return corrected;
  } catch (err) {
    console.warn("[correct] threw:", err);
    return rawText;
  }
}

/* ------------------------------------------------------------------ */
/* POST                                                               */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 15, 60_000, "smart").ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Request must be multipart/form-data." },
      { status: 400 }
    );
  }

  const audio = formData.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "Audio missing." }, { status: 400 });
  }
  if (audio.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Audio too large." }, { status: 413 });
  }

  let rawText = "";
  let provider = "";

  try {
    rawText = await transcribeWithHakim(audio);
    if (rawText) provider = "hakim";
  } catch (err) {
    console.warn("[smart] hakim threw:", err);
  }

  if (!rawText) {
    console.log("[smart] Hakim empty - falling back to Groq");
    try {
      rawText = await transcribeWithGroq(audio);
      if (rawText) provider = "groq";
    } catch (err) {
      console.warn("[smart] groq threw:", err);
    }
  }

  if (!rawText) {
    return NextResponse.json(EMPTY_RESPONSE, { status: 200 });
  }

  // Filter BEFORE correction (avoid wasting LLM on garbage)
  const verdict = isBadTranscription(rawText);
  if (verdict.bad) {
    console.log(
      `[smart] REJECTED (${verdict.reason}) via "${provider}" | text="${rawText.slice(0, 100)}"`
    );
    return NextResponse.json(EMPTY_RESPONSE, { status: 200 });
  }

  console.log(`[smart] OK via "${provider}" | text=${rawText.length}c`);

  // Layer 2: LLM correction (with fallback to rawText on any failure)
  const correctedText = await correctTranscription(rawText);

  return NextResponse.json(
    { text: correctedText, topic: "", children: [], terms: [] },
    { status: 200 }
  );
}