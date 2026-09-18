import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3-turbo";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

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

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}` },
      body: whisperForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(
        `[smart] Whisper error ${res.status}:`,
        errText.slice(0, 200)
      );
      return NextResponse.json(
        { text: "", topic: "", children: [], terms: [] },
        { status: 200 }
      );
    }

    const data = (await res.json()) as { text?: string };
    const rawText = (data.text ?? "").trim();

    if (!rawText) {
      return NextResponse.json(
        { text: "", topic: "", children: [], terms: [] },
        { status: 200 }
      );
    }

    const hasArabic = /[\u0600-\u06FF]/.test(rawText);
    const hasLatin = /[a-zA-Z]{3,}/.test(rawText);
    if (!hasArabic && !hasLatin) {
      return NextResponse.json(
        { text: "", topic: "", children: [], terms: [] },
        { status: 200 }
      );
    }

    console.log(`[smart] OK | text=${rawText.length}c`);

    return NextResponse.json(
      {
        text: rawText,
        topic: "",
        children: [],
        terms: [],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[smart] Threw:", err);
    return NextResponse.json(
      { text: "", topic: "", children: [], terms: [] },
      { status: 200 }
    );
  }
}