import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3-turbo";
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const EMPTY_RESPONSE = { text: "", topic: "", children: [], terms: [] };

/* ------------------------------------------------------------------ */
/* Retry helper                                                       */
/* ------------------------------------------------------------------ */

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxAttempts = 3
): Promise<Response> {
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(url, init);
      lastResponse = res;

      // نجاح أو خطأ غير قابل للـ retry
      if (res.ok) return res;
      if (res.status !== 429 && res.status < 500) return res;

      // 429 أو 5xx — جرب تاني
      if (attempt < maxAttempts - 1) {
        const retryAfter = res.headers.get("retry-after");
        const delay = retryAfter
          ? Math.min(parseInt(retryAfter, 10) * 1000, 8000)
          : 800 * Math.pow(2, attempt); // 800ms, 1600ms, 3200ms
        console.warn(
          `[smart] retry ${attempt + 1}/${maxAttempts - 1} after ${delay}ms (status ${res.status})`
        );
        await sleep(delay);
        continue;
      }
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts - 1) {
        const delay = 800 * Math.pow(2, attempt);
        console.warn(`[smart] retry ${attempt + 1} after network error`);
        await sleep(delay);
        continue;
      }
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError ?? new Error("Whisper fetch failed after retries");
}

/* ------------------------------------------------------------------ */
/* POST                                                               */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 10, 60_000).ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 }
    );
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (!groqKey) {
    return NextResponse.json(
      { error: "Server misconfiguration." },
      { status: 500 }
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

  const whisperForm = new FormData();
  whisperForm.append("file", audio, "chunk.webm");
  whisperForm.append("model", GROQ_MODEL);
  whisperForm.append("response_format", "json");
  whisperForm.append("temperature", "0");
  whisperForm.append("language", "ar");
  whisperForm.append(
    "prompt",
    "The speaker is a university professor explaining an academic topic in Arabic (Egyptian or Modern Standard Arabic). Preserve technical terms in English."
  );

  try {
    const res = await fetchWithRetry(GROQ_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}` },
      body: whisperForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(
        `[smart] Whisper error ${res.status} (final):`,
        errText.slice(0, 200)
      );
      // 429 نهائي — رجّع 429 عشان الفرونت يعرف
      if (res.status === 429) {
        return NextResponse.json(
          { error: "Transcription service busy." },
          { status: 429 }
        );
      }
      return NextResponse.json(EMPTY_RESPONSE, { status: 200 });
    }

    const data = (await res.json()) as { text?: string };
    const rawText = (data.text ?? "").trim();

    if (!rawText) {
      return NextResponse.json(EMPTY_RESPONSE, { status: 200 });
    }

    const hasArabic = /[\u0600-\u06FF]/.test(rawText);
    const hasLatin = /[a-zA-Z]{3,}/.test(rawText);
    if (!hasArabic && !hasLatin) {
      return NextResponse.json(EMPTY_RESPONSE, { status: 200 });
    }

    console.log(`[smart] OK | text=${rawText.length}c`);

    return NextResponse.json(
      { text: rawText, topic: "", children: [], terms: [] },
      { status: 200 }
    );
  } catch (err) {
    console.error("[smart] Threw after retries:", err);
    return NextResponse.json(EMPTY_RESPONSE, { status: 200 });
  }
}