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
  "meta/llama-3.3-70b-instruct",
  "nvidia/llama-3.3-nemotron-super-49b-v1",
  "meta/llama-3.1-70b-instruct",
  "mistralai/mistral-nemotron",
];

// ✅ محدث — Gemini 2.0 و2.5 اتشالوا
const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-flash-latest",
];

/* ------------------------------------------------------------------ */
/* Friendly messages                                                  */
/* ------------------------------------------------------------------ */

const FRIENDLY_ERRORS = {
  noProviders: "كل خدمات الذكاء الاصطناعي مشغولة حالياً. جرّب تاني بعد لحظة.",
  nvidiaMissing: "خدمة NVIDIA مش مفعّلة. كلّم الدعم.",
  groqMissing: "خدمة Groq مش مفعّلة. كلّم الدعم.",
  geminiMissing: "خدمة Gemini مش مفعّلة. كلّم الدعم.",
  allFailed: "الخدمات مشغولة حالياً. جرّب تاني بعد لحظة.",
};

function friendlyError(raw: string): string {
  if (!raw) return FRIENDLY_ERRORS.allFailed;
  const lower = raw.toLowerCase();
  // Gemini model not found
  if (lower.includes("no longer available") || lower.includes("not_found")) {
    return "الخدمة تحتاج تحديث. فريقنا بيراجعها دلوقتي.";
  }
  if (lower.includes("quota") || lower.includes("429") || lower.includes("rate limit")) {
    return "الخدمة مشغولة حالياً. جرّب بعد دقيقة.";
  }
  if (lower.includes("unauthorized") || lower.includes("401") || lower.includes("invalid api key")) {
    return "خدمة الذكاء الاصطناعي محتاجة إعادة تفعيل. كلّم الدعم.";
  }
  // Default friendly
  return FRIENDLY_ERRORS.allFailed;
}

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
  return [
    process.env.NVIDIA_API_KEY?.trim(),
    process.env.NVIDIA_API_KEY_2?.trim(),
    process.env.NVIDIA_API_KEY_3?.trim(),
  ].filter((k): k is string => !!k && k.length > 0);
}

function getGeminiKeys(): string[] {
  return [
    process.env.GEMINI_API_KEY?.trim(),
    process.env.GEMINI_API_KEY_2?.trim(),
    process.env.GEMINI_API_KEY_3?.trim(),
  ].filter((k): k is string => !!k && k.length > 0);
}

/* ------------------------------------------------------------------ */
/* NVIDIA NIM — primary                                               */
/* ------------------------------------------------------------------ */

async function tryNvidia(options: GenerateOptions): Promise<GenerateResult> {
  const apiKeys = getNvidiaKeys();
  if (apiKeys.length === 0) {
    return { ok: false, error: FRIENDLY_ERRORS.nvidiaMissing };
  }

  const messages = [
    { role: "system", content: options.systemPrompt },
    ...options.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let lastErr = "";

  for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
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
            Authorization: `Bearer ${apiKeys[keyIdx]}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          lastErr = `NVIDIA ${res.status}`;
          if (res.status === 429) break; // جرّب المفتاح التالي
          if (res.status === 404 || res.status === 400) continue;
          continue;
        }

        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = data.choices?.[0]?.message?.content ?? "";
        if (text.trim()) {
          console.log(`[ai] NVIDIA OK | key #${keyIdx + 1} | model "${model}"`);
          return {
            ok: true,
            text,
            provider: "nvidia",
            model: `${model} (key #${keyIdx + 1})`,
          };
        }
      } catch (err) {
        lastErr = err instanceof Error ? err.message : "unknown";
        continue;
      }
    }
  }

  return { ok: false, error: friendlyError(lastErr) };
}

/* ------------------------------------------------------------------ */
/* Groq                                                               */
/* ------------------------------------------------------------------ */

async function tryGroq(options: GenerateOptions): Promise<GenerateResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: FRIENDLY_ERRORS.groqMissing };

  const messages = [
    { role: "system", content: options.systemPrompt },
    ...options.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let lastErr = "";

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
        lastErr = `Groq ${res.status}`;
        continue;
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content ?? "";
      if (text.trim()) {
        console.log(`[ai] Groq OK | model "${model}"`);
        return { ok: true, text, provider: "groq", model };
      }
    } catch (err) {
      lastErr = err instanceof Error ? err.message : "unknown";
      continue;
    }
  }

  return { ok: false, error: friendlyError(lastErr) };
}

/* ------------------------------------------------------------------ */
/* Gemini                                                             */
/* ------------------------------------------------------------------ */

async function tryGemini(options: GenerateOptions): Promise<GenerateResult> {
  const apiKeys = getGeminiKeys();
  if (apiKeys.length === 0) {
    return { ok: false, error: FRIENDLY_ERRORS.geminiMissing };
  }

  const contents = options.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let lastErr = "";

  for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
    const ai = new GoogleGenAI({ apiKey: apiKeys[keyIdx] });

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
          console.log(`[ai] Gemini OK | key #${keyIdx + 1} | model "${model}"`);
          return {
            ok: true,
            text,
            provider: "gemini",
            model: `${model} (key #${keyIdx + 1})`,
          };
        }
      } catch (err) {
        lastErr = err instanceof Error ? err.message : "unknown";
        continue;
      }
    }
  }

  return { ok: false, error: friendlyError(lastErr) };
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

  for (const provider of order) {
    const result =
      provider === "nvidia"
        ? await tryNvidia(options)
        : provider === "groq"
        ? await tryGroq(options)
        : await tryGemini(options);

    if (result.ok) return result;
    console.warn(`[ai] ${provider} failed`);
  }

  return { ok: false, error: FRIENDLY_ERRORS.allFailed };
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