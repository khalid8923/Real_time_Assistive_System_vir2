import { GoogleGenAI } from "@google/genai";

/* ------------------------------------------------------------------ */
/* Config                                                             */
/* ------------------------------------------------------------------ */

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

// Groq model fallbacks (tries in order)
const GROQ_MODELS = [
  "llama-3.1-8b-instant",
  "llama-3.2-3b-preview",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
];

// Gemini model fallbacks
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
/* Gemini (with multi-key rotation)                                   */
/* ------------------------------------------------------------------ */

function getGeminiApiKeys(): string[] {
  const keys = [
    process.env.GEMINI_API_KEY?.trim(),
    process.env.GEMINI_API_KEY_2?.trim(),
    process.env.GEMINI_API_KEY_3?.trim(),
  ].filter((k): k is string => !!k && k.length > 0);

  return Array.from(new Set(keys));
}

async function tryGemini(
  options: GenerateOptions
): Promise<GenerateResult> {
  const apiKeys = getGeminiApiKeys();

  if (apiKeys.length === 0) {
    return { ok: false, error: "No GEMINI_API_KEY set" };
  }

  const contents = options.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let lastError = "";

  for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
    const apiKey = apiKeys[keyIndex];
    const ai = new GoogleGenAI({ apiKey });
    let keyQuotaExhausted = false;

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
          console.log(
            `[ai] Gemini OK | key #${keyIndex + 1} | model "${model}"`
          );
          return {
            ok: true,
            text,
            provider: "gemini",
            model: `${model} (key #${keyIndex + 1})`,
          };
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        lastError = errMsg;

        const isQuota =
          errMsg.includes("429") ||
          errMsg.toLowerCase().includes("quota") ||
          errMsg.toLowerCase().includes("resource_exhausted");
        const isHighDemand = errMsg.includes("503");
        const isNotFound =
          errMsg.includes("404") || errMsg.toLowerCase().includes("not_found");

        if (isQuota) {
          console.warn(
            `[ai] Gemini key #${keyIndex + 1} quota exhausted — trying next key`
          );
          keyQuotaExhausted = true;
          break;
        }

        if (isHighDemand) {
          console.warn(
            `[ai] Gemini model "${model}" high demand — trying next model`
          );
          continue;
        }

        if (isNotFound) {
          continue;
        }

        return { ok: false, error: errMsg };
      }
    }

    if (keyQuotaExhausted) continue;
  }

  return { ok: false, error: lastError || "All Gemini keys/models failed" };
}

/* ------------------------------------------------------------------ */
/* Groq (with model fallbacks)                                        */
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
        lastError = `Groq ${res.status} (${model}): ${errText.slice(0, 150)}`;

        if (res.status === 404 || res.status === 400) {
          console.warn(`[ai] Groq model "${model}" unavailable — trying next`);
          continue;
        }

        if (res.status === 429) {
          console.warn(`[ai] Groq rate limit hit`);
          return { ok: false, error: lastError };
        }

        return { ok: false, error: lastError };
      }

      const data: {
        choices?: Array<{ message?: { content?: string } }>;
      } = await res.json();

      const text = data.choices?.[0]?.message?.content ?? "";
      if (text.trim()) {
        console.log(`[ai] Groq OK | model "${model}"`);
        return { ok: true, text, provider: "groq", model };
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      lastError = errMsg;
      console.warn(`[ai] Groq model "${model}" threw — trying next`);
      continue;
    }
  }

  return { ok: false, error: lastError || "All Groq models failed" };
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Generate text using Gemini or Groq.
 * Default order: Groq → Gemini (faster first).
 * Set `prefer: "gemini"` to try Gemini first.
 */
export async function generateText(
  options: GenerateOptions
): Promise<GenerateResult> {
  const order: AIProvider[] =
    options.prefer === "gemini" ? ["gemini", "groq"] : ["groq", "gemini"];

  let lastError = "";

  for (const provider of order) {
    const result =
      provider === "gemini"
        ? await tryGemini(options)
        : await tryGroq(options);

    if (result.ok) return result;

    lastError = result.error ?? "Unknown error";
    console.warn(
      `[ai] ${provider} failed:`,
      lastError.slice(0, 150)
    );
  }

  return {
    ok: false,
    error: lastError || "كل الخدمات مشغولة حالياً. حاول بعد لحظات.",
  };
}

/**
 * Parse JSON from AI response (strips markdown fences if present).
 */
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