import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const EMPTY_RESPONSE = { text: "", topic: "", children: [], terms: [] };

/* ------------------------------------------------------------------ */
/* Provider 1: Hakim AI (Arabic-first, 10 req/min free)              */
/* ------------------------------------------------------------------ */

async function transcribeWithHakim(audio: Blob): Promise<string> {
  const apiKey = process.env.HAKIM_API_KEY?.trim();
  if (!apiKey) return "";

  const formData = new FormData();
  formData.append("file", audio, "chunk.webm");
  formData.append("model", "hakim-arab-v2");
  formData.append("language", "ar");
  formData.append("response_format", "json");

  const res = await fetch("https://api.tryhakim.ai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[hakim] ${res.status}:`, errText.slice(0, 200));
    return "";
  }

  const data = (await res.json()) as {
    text?: string;
    kind?: string;
    data?: { text?: string };
  };

  // Hakim قد يرجّع { kind: "sync_json", data: { text } } أو { text }
  return (data.text ?? data.data?.text ?? "").trim();
}

/* ------------------------------------------------------------------ */
/* Provider 2: Hugging Face — Whisper Egyptian Arabic                 */
/* ------------------------------------------------------------------ */

async function transcribeWithHF(audio: Blob): Promise<string> {
  const apiKey = process.env.HF_TOKEN?.trim();
  if (!apiKey) return "";

  const res = await fetch(
    "https://api-inference.huggingface.co/models/AbdelrahmanHassan/whisper-large-v3-egyptian-arabic",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "audio/webm",
      },
      body: audio,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[hf] ${res.status}:`, errText.slice(0, 200));
    return "";
  }

  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}

/* ------------------------------------------------------------------ */
/* Provider 3: Groq Whisper (fallback)                                */
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
  formData.append(
    "prompt",
    "دكتور جامعي يشرح بالعربي المصري. احتفظ بالمصطلحات الإنجليزية."
  );

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

  // جرّب المزودين بالترتيب
  const providers: Array<{ name: string; fn: (b: Blob) => Promise<string> }> = [
    { name: "hakim", fn: transcribeWithHakim },
    { name: "huggingface", fn: transcribeWithHF },
    { name: "groq", fn: transcribeWithGroq },
  ];

  let rawText = "";
  let usedProvider = "";

  for (const provider of providers) {
    try {
      rawText = await provider.fn(audio);
      if (rawText.length > 0) {
        usedProvider = provider.name;
        break;
      }
      console.log(`[smart] ${provider.name} returned empty`);
    } catch (err) {
      console.warn(`[smart] ${provider.name} threw:`, err);
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

  console.log(`[smart] OK via "${usedProvider}" | text=${rawText.length}c`);

  return NextResponse.json(
    { text: rawText, topic: "", children: [], terms: [] },
    { status: 200 }
  );
}