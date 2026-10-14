import { GoogleGenAI } from "@google/genai";

/* ------------------------------------------------------------------ */
/* Config                                                             */
/* ------------------------------------------------------------------ */

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELS = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3-32b",
];

const NVIDIA_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODELS = [
  "meta/llama-3.1-8b-instruct",
  "meta/llama-3.1-70b-instruct",
  "nvidia/llama-3.1-nemotron-70b-instruct",
];

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
];

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type AIProvider = "gemini" | "groq" | "nvidia";

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
  jsonMode?: boolean;
}

export interface GenerateResult {
  ok: boolean;
  text?: string;
  provider?: AIProvider;
  model?: string;
  error?: string;
}

/* ------------------------------------------------------------------ */
/* Multi-key helpers                                                  */
/* ------------------------------------------------------------------ */

function getNvidiaKeys(): string[] {
  const keys = [
    process.env.NVIDIA_API_KEY?.trim(),
    process.env.NVIDIA_API_KEY_2?.trim(),
    process.env.NVIDIA_API_KEY_3?.trim(),
  ].filter((k): k is string => !!k && k.length > 0);
  return Array.from(new Set(keys));
}

function getGeminiKeys(): string[] {
  const keys = [
    process.env.GEMINI_API_KEY?.trim(),
    process.env.GEMINI_API_KEY_2?.trim(),
    process.env.GEMINI_API_KEY_3?.trim(),
  ].filter((k): k is string => !!k && k.length > 0);
  return Array.from(new Set(keys));
}

/* ------------------------------------------------------------------ */
/* Gemini                                                             */
/* ------------------------------------------------------------------ */

async function tryGemini(options: GenerateOptions): Promise<GenerateResult> {
  const apiKeys = getGeminiKeys();
  if (apiKeys.length === 0) return { ok: false, error: "No GEMINI_API_KEY set" };

  const contents = options.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let lastError = "";

  for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
    const ai = new GoogleGenAI({ apiKey: apiKeys[keyIndex] });
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
          console.log(`[ai] Gemini OK | key #${keyIndex + 1} | model "${model}"`);
          return { ok: true, text, provider: "gemini", model: `${model} (key #${keyIndex + 1})` };
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        lastError = errMsg;
        const isQuota =
          errMsg.includes("429") ||
          errMsg.toLowerCase().includes("quota") ||
          errMsg.toLowerCase().includes("resource_exhausted");
        if (isQuota) {
          keyQuotaExhausted = true;
          break;
        }
        if (errMsg.includes("503") || errMsg.includes("404")) continue;
        return { ok: false, error: errMsg };
      }
    }
    if (keyQuotaExhausted) continue;
  }
  return { ok: false, error: lastError || "All Gemini keys/models failed" };
}

/* ------------------------------------------------------------------ */
/* Groq                                                               */
/* ------------------------------------------------------------------ */

async function tryGroq(options: GenerateOptions): Promise<GenerateResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "GROQ_API_KEY missing" };

  const messages = [
    { role: "system", content: options.systemPrompt },
    ...options.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let lastError = "";
  for (const model of GROQ_MODELS) {
    try {
      const body: Record<string, unknown> = {
        model,
        messages,
        temperature: options.temperature ?? 0.5,
        max_tokens: options.maxTokens ?? 2048,
      };
      if (options.jsonMode) {
        body.response_format = { type: "json_object" };
      }

      const res = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        lastError = `Groq ${res.status} (${model}): ${errText.slice(0, 150)}`;
        if (res.status === 404 || res.status === 400) continue;
        return { ok: false, error: lastError };
      }

      const data: { choices?: Array<{ message?: { content?: string } }> } = await res.json();
      const text = data.choices?.[0]?.message?.content ?? "";
      if (text.trim()) {
        console.log(`[ai] Groq OK | model "${model}"`);
        return { ok: true, text, provider: "groq", model };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      continue;
    }
  }
  return { ok: false, error: lastError || "All Groq models failed" };
}

/* ------------------------------------------------------------------ */
/* NVIDIA NIM — multi-key rotation                                    */
/* ------------------------------------------------------------------ */

async function tryNvidia(options: GenerateOptions): Promise<GenerateResult> {
  const apiKeys = getNvidiaKeys();
  if (apiKeys.length === 0) {
    return { ok: false, error: "NVIDIA_API_KEY missing" };
  }

  const messages = [
    { role: "system", content: options.systemPrompt },
    ...options.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let lastError = "";

  for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
    const apiKey = apiKeys[keyIndex];
    let keyExhausted = false;

    for (const model of NVIDIA_MODELS) {
      try {
        const body: Record<string, unknown> = {
          model,
          messages,
          temperature: options.temperature ?? 0.5,
          max_tokens: options.maxTokens ?? 2048,
          stream: false,
        };
        if (options.jsonMode) {
          body.response_format = { type: "json_object" };
        }

        const res = await fetch(NVIDIA_ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errText = await res.text();
          lastError = `NVIDIA ${res.status} (${model}): ${errText.slice(0, 150)}`;

          // 429 → جرّب المفتاح التالي
          if (res.status === 429) {
            keyExhausted = true;
            console.warn(`[ai] NVIDIA key #${keyIndex + 1} rate-limited — next key`);
            break;
          }
          if (res.status === 404 || res.status === 400) continue;
          return { ok: false, error: lastError };
        }

        const data: { choices?: Array<{ message?: { content?: string } }> } =
          await res.json();
        const text = data.choices?.[0]?.message?.content ?? "";
        if (text.trim()) {
          console.log(
            `[ai] NVIDIA OK | key #${keyIndex + 1} | model "${model}"`
          );
          return {
            ok: true,
            text,
            provider: "nvidia",
            model: `${model} (key #${keyIndex + 1})`,
          };
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        continue;
      }
    }

    if (keyExhausted) continue;
  }

  return { ok: false, error: lastError || "All NVIDIA keys/models failed" };
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

export async function generateText(
  options: GenerateOptions
): Promise<GenerateResult> {
  const order: AIProvider[] =
    options.prefer === "gemini"
      ? ["gemini", "nvidia", "groq"]
      : options.prefer === "groq"
      ? ["groq", "nvidia", "gemini"]
      : ["nvidia", "groq", "gemini"];

  let lastError = "";
  for (const provider of order) {
    const result =
      provider === "nvidia"
        ? await tryNvidia(options)
        : provider === "groq"
        ? await tryGroq(options)
        : await tryGemini(options);

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
