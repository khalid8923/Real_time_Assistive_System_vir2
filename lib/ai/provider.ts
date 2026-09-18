import { GoogleGenAI } from "@google/genai";

/* ------------------------------------------------------------------ */
/* Config                                                             */
/* ------------------------------------------------------------------ */

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

// ✅ نماذج Groq الحالية (2024-2026)
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama3-70b-8192",
  "mixtral-8x7b-32768",
];

const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
];

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type AIProvider = "gemini" | "groq";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateOptions {
  systemPrompt: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  prefer?: AIProvider;
}

export interface GenerateResult {
  ok: boolean;
  text?: string;
  provider?: AIProvider;
  model?: string;
  error?: string;
}

/* ------------------------------------------------------------------ */
/* Gemini                                                             */
/* ------------------------------------------------------------------ */

async function tryGemini(
  options: GenerateOptions
): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "GEMINI_API_KEY missing" };

  const ai = new GoogleGenAI({ apiKey });

  const contents = options.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let lastError = "";

  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: options.systemPrompt,
          temperature: options.temperature ?? 0.5,
          maxOutputTokens: options.maxTokens ?? 2048,
        },
      });

      const text = response.text ?? "";
      if (text.trim()) {
        return { ok: true, text, provider: "gemini", model };
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      lastError = errMsg;

      const isQuota =
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("quota") ||
        errMsg.toLowerCase().includes("resource_exhausted");
      const isHighDemand = errMsg.includes("503");

      if (isQuota || isHighDemand) continue;
      return { ok: false, error: errMsg };
    }
  }

  return { ok: false, error: lastError || "All Gemini models failed" };
}

/* ------------------------------------------------------------------ */
/* Groq                                                               */
/* ------------------------------------------------------------------ */

async function tryGroq(
  options: GenerateOptions
): Promise<GenerateResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "GROQ_API_KEY missing" };

  const messages = [
    { role: "system", content: options.systemPrompt },
    ...options.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  let lastError = "";

  // ✅ جرب كل الموديلات لحد ما واحد يشتغل
  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.5,
          max_tokens: options.maxTokens ?? 2048,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        lastError = `Groq ${res.status}: ${errText.slice(0, 200)}`;

        // لو الموديل مش موجود، جرب الموديل اللي بعده
        if (res.status === 404 || res.status === 400) continue;

        return { ok: false, error: lastError };
      }

      const data: {
        choices?: Array<{ message?: { content?: string } }>;
      } = await res.json();

      const text = data.choices?.[0]?.message?.content ?? "";
      if (text.trim()) {
        return { ok: true, text, provider: "groq", model };
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      lastError = errMsg;
      continue;
    }
  }

  return { ok: false, error: lastError || "All Groq models failed" };
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

export async function generateText(
  options: GenerateOptions
): Promise<GenerateResult> {
  const order: AIProvider[] =
    options.prefer === "groq" ? ["groq", "gemini"] : ["gemini", "groq"];

  let lastError = "";

  for (const provider of order) {
    const result =
      provider === "gemini"
        ? await tryGemini(options)
        : await tryGroq(options);

    if (result.ok) return result;

    lastError = result.error ?? "Unknown error";
    console.warn(`[ai] ${provider} failed:`, lastError.slice(0, 150));
  }

  return {
    ok: false,
    error: lastError || "كل الخدمات مشغولة حالياً. حاول بعد لحظات.",
  };
}

export function parseJsonResponse<T = unknown>(raw: string): T | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}