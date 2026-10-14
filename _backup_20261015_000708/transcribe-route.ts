import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3-turbo";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface ErrorResponse {
  error: string;
}
interface SuccessResponse {
  text: string;
}
interface GroqResponse {
  text?: string;
}

function jsonError(
  message: string,
  status: number
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 15, 60_000).ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 }
    );
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return jsonError("Server misconfiguration.", 500);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Request must be multipart/form-data.", 400);
  }

  const audio = formData.get("audio");
  if (!(audio instanceof Blob))
    return jsonError('Missing "audio" field.', 400);
  if (audio.size === 0) return jsonError("Audio file is empty.", 400);
  if (audio.size > MAX_FILE_SIZE)
    return jsonError("Audio file is too large.", 413);

  const groqForm = new FormData();
  groqForm.append("file", audio, "chunk.webm");
  groqForm.append("model", GROQ_MODEL);
  groqForm.append("response_format", "json");
  groqForm.append("temperature", "0");

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: groqForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(
        `[transcribe] Groq error ${res.status}:`,
        errText.slice(0, 200)
      );
      if (res.status === 401 || res.status === 403) {
        return jsonError("Server misconfiguration.", 500);
      }
      if (res.status === 429) {
        return jsonError("Transcription service busy.", 429);
      }
      return jsonError("Transcription failed.", 502);
    }

    const data = (await res.json()) as GroqResponse;
    const text = (data.text ?? "").trim();

    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const hasLatin = /[a-zA-Z]{3,}/.test(text);
    if (!hasArabic && !hasLatin && text.length > 0) {
      console.log("[transcribe] No meaningful content, discarding");
      return NextResponse.json({ text: "" }, { status: 200 });
    }

    return NextResponse.json({ text }, { status: 200 });
  } catch (err) {
    console.error("[transcribe] Threw:", err);
    return jsonError("Transcription service unreachable.", 502);
  }
}