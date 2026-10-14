import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const EMPTY_RESPONSE = { text: "", topic: "", children: [], terms: [] };

/* ------------------------------------------------------------------ */
/* Config                                                             */
/* ------------------------------------------------------------------ */

const QWEN_ENDPOINT =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
const QWEN_MODEL = "qwen3-asr-flash";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3-turbo";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/* ------------------------------------------------------------------ */
/* Qwen3-ASR-Flash (Alibaba Cloud) — Primary                          */
/* ------------------------------------------------------------------ */

async function transcribeWithQwen(audio: Blob): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
  if (!apiKey) return "";

  const base64Audio = await blobToBase64(audio);

  const res = await fetch(QWEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: QWEN_MODEL,
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: "اللهجة مصرية. دكتور جامعي يشرح. احتفظ بالمصطلحات الإنجليزية.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_audio",
              input_audio: {
                data: `data:audio/webm;base64,${base64Audio}`,
              },
            },
          ],
        },
      ],
      asr_options: {
        language: "ar",
        enable_itn: true,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[qwen-asr] ${res.status}:`, errText.slice(0, 200));
    return "";
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return (data.choices?.[0]?.message?.content ?? "").trim();
}

/* ------------------------------------------------------------------ */
/* Groq Whisper — Fallback                                            */
/* ------------------------------------------------------------------ */

async function transcribeWithGroq(audio: Blob): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return "";

  const whisperForm = new FormData();
  whisperForm.append("file", audio, "chunk.webm");
  whisperForm.append("model", GROQ_MODEL);
  whisperForm.append("response_format", "json");
  whisperForm.append("temperature", "0");
  whisperForm.append("language", "ar");
  whisperForm.append(
    "prompt",
    "دكتور جامعي يشرح بالعربي المصري. احتفظ بالمصطلحات الإنجليزية."
  );

  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: whisperForm,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[groq-whisper] ${res.status}:`, errText.slice(0, 200));
    return "";
  }

  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}

/* ------------------------------------------------------------------ */
/* POST                                                               */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 15, 60_000).ok) {
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

  // 1. جرّب Qwen أولاً
  let rawText = "";
  let provider = "qwen";

  try {
    rawText = await transcribeWithQwen(audio);
  } catch (err) {
    console.warn("[qwen-asr] threw:", err);
    rawText = "";
  }

  // 2. لو فشل، جرّب Groq
  if (!rawText) {
    console.log("[smart] Qwen returned empty — falling back to Groq");
    provider = "groq";
    try {
      rawText = await transcribeWithGroq(audio);
    } catch (err) {
      console.warn("[groq-whisper] threw:", err);
      rawText = "";
    }
  }

  if (!rawText) {
    return NextResponse.json(EMPTY_RESPONSE, { status: 200 });
  }

  const hasArabic = /[\u0600-\u06FF]/.test(rawText);
  const hasLatin = /[a-zA-Z]{3,}/.test(rawText);
  if (!hasArabic && !hasLatin) {
    return NextResponse.json(EMPTY_RESPONSE, { status: 200 });
  }

  console.log(`[smart] OK via "${provider}" | text=${rawText.length}c`);

  return NextResponse.json(
    { text: rawText, topic: "", children: [], terms: [] },
    { status: 200 }
  );
}