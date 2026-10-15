import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const EMPTY_RESPONSE = { text: "", topic: "", children: [], terms: [] };

/* ------------------------------------------------------------------ */
/* Multi-key Hakim with round-robin + auto-failover                   */
/* ------------------------------------------------------------------ */

function getHakimKeys(): string[] {
  return [
    process.env.HAKIM_API_KEY?.trim(),
    process.env.HAKIM_API_KEY_2?.trim(),
    process.env.HAKIM_API_KEY_3?.trim(),
  ].filter((k): k is string => !!k && k.length > 0);
}

// Simple round-robin counter â€” ÙŠØªØµÙÙ‘Ø± ÙƒÙ„ restart
let hakimRoundRobin = 0;

async function transcribeWithHakim(audio: Blob): Promise<string> {
  const keys = getHakimKeys();
  if (keys.length === 0) return "";

  // Ø§Ø¨Ø¯Ø£ Ù…Ù† Ø§Ù„Ù…ÙØªØ§Ø­ Ø§Ù„ØªØ§Ù„ÙŠ ÙÙŠ Ø§Ù„Ù€ round-robin
  const startIdx = hakimRoundRobin % keys.length;
  hakimRoundRobin = (hakimRoundRobin + 1) % keys.length;

  // Ø¬Ø±Ù‘Ø¨ ÙƒÙ„ Ø§Ù„Ù…ÙØ§ØªÙŠØ­ Ø¨Ø§Ù„ØªØ±ØªÙŠØ¨ (ÙŠØ¨Ø¯Ø£ Ù…Ù† Ø§Ù„Ù€ round-robin)
  for (let i = 0; i < keys.length; i++) {
    const idx = (startIdx + i) % keys.length;
    const apiKey = keys[idx];

    const formData = new FormData();
    formData.append("file", audio, "chunk.webm");
    formData.append("model", "hakim-arab-v2");
    formData.append("language", "ar");
    formData.append("response_format", "json");

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

        // 429 Ø£Ùˆ 401 â†’ Ø¬Ø±Ù‘Ø¨ Ø§Ù„Ù…ÙØªØ§Ø­ Ø§Ù„ØªØ§Ù„ÙŠ
        if (res.status === 429 || res.status === 401 || res.status === 403) {
          continue;
        }
        // Ø®Ø·Ø£ ØªØ§Ù†ÙŠ â†’ Ø§Ø·Ù„Ø¹
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

      // Ù†Øµ ÙØ§Ø¶ÙŠ â†’ Ø¬Ø±Ù‘Ø¨ Ø§Ù„Ù…ÙØªØ§Ø­ Ø§Ù„ØªØ§Ù„ÙŠ
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
  formData.append(
    "prompt",
    "Ø¯ÙƒØªÙˆØ± Ø¬Ø§Ù…Ø¹ÙŠ ÙŠØ´Ø±Ø­ Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠ Ø§Ù„Ù…ØµØ±ÙŠ. Ø§Ø­ØªÙØ¸ Ø¨Ø§Ù„Ù…ØµØ·Ù„Ø­Ø§Øª Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©."
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

  // 1. Ø¬Ø±Ù‘Ø¨ Hakim (multi-key round-robin + failover)
  try {
    rawText = await transcribeWithHakim(audio);
    if (rawText) provider = "hakim";
  } catch (err) {
    console.warn("[smart] hakim threw:", err);
  }

  // 2. Ù„Ùˆ ÙØ´Ù„ØŒ Groq
  if (!rawText) {
    console.log("[smart] Hakim empty â€” falling back to Groq");
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