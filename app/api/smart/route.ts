import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3-turbo";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_TEXT_LENGTH = 5000;

const REFINE_SYSTEM_PROMPT = `You are an Arabic academic text cleaner.

Basic rule: Students study Arabic university lectures that contain many English technical terms. Your job is to clean the text WITHOUT translating.

Your tasks:

1. **text**: The cleaned text after correction
   - Fix Arabic spelling errors
   - Remove repeated words and filler (يعني، اه، ممم)
   - Add punctuation
   - CRITICAL: Keep English terms as-is (JavaScript, API, React, Linear Algebra, Data Science, Machine Learning, HTML, CSS)
   - NEVER translate English words to Arabic
   - Correct example: "بنستخدم JavaScript في تطوير الويب"
   - Wrong example: "بنستخدم جافاسكريبت في تطوير الويب"
   - If text is not useful Arabic (silence/noise) -> text = ""

2. **topic**: Main topic in Arabic (3-6 words)
   - Empty if not academic

3. **children**: 2-4 subtopics in Arabic

4. **terms**: 2-6 terms
   - English term stays English
   - Definition in Arabic
   - Example: { "term": "API", "definition": "واجهة برمجة التطبيقات" }

Strict rules:
- Do NOT invent content
- Do NOT translate English to Arabic
- Reply with JSON only:
{
  "text": "...",
  "topic": "...",
  "children": ["..."],
  "terms": [{"term": "...", "definition": "..."}]
}`;

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

  let rawText = "";
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
    rawText = (data.text ?? "").trim();
  } catch (err) {
    console.error("[smart] Whisper threw:", err);
    return NextResponse.json(
      { text: "", topic: "", children: [], terms: [] },
      { status: 200 }
    );
  }

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

  const trimmed =
    rawText.length > MAX_TEXT_LENGTH
      ? rawText.slice(0, MAX_TEXT_LENGTH)
      : rawText;

  const result = await generateText({
    systemPrompt: REFINE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Raw text:\n\n${trimmed}` }],
    temperature: 0.2,
    maxTokens: 2048,
    prefer: "groq",
  });

  if (!result.ok || !result.text) {
    return NextResponse.json(
      { text: rawText, topic: "", children: [], terms: [] },
      { status: 200 }
    );
  }

  const parsed = parseJsonResponse<{
    text?: string;
    topic?: string;
    children?: string[];
    terms?: { term: string; definition: string }[];
  }>(result.text);

  if (!parsed || !parsed.text) {
    return NextResponse.json(
      { text: rawText, topic: "", children: [], terms: [] },
      { status: 200 }
    );
  }

  console.log(
    `[smart] OK | text=${parsed.text.length}c | topic="${parsed.topic}" | terms=${(parsed.terms ?? []).length}`
  );

  return NextResponse.json(
    {
      text: parsed.text,
      topic: parsed.topic ?? "",
      children: parsed.children ?? [],
      terms: parsed.terms ?? [],
    },
    { status: 200 }
  );
}