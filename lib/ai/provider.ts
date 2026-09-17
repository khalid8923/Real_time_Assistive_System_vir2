import { GoogleGenAI } from "@google/genai";

export type AIProvider = "gemini" | "groq";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
];

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateOptions {
  systemPrompt: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateResult {
  ok: boolean;
  text?: string;
  provider?: AIProvider;
  model?: string;
  error?: string;
}

async function tryGemini(options: GenerateOptions): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "GEMINI_API_KEY missing" };

  const ai = new GoogleGenAI({ apiKey });

  const contents = options.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: options.systemPrompt,
          temperature: options.temperature ?? 0.5,
          maxOutputTokens: options.maxTokens ?? 1024,
        },
      });

      const text = response.text ?? "";
      if (text.trim()) {
        return { ok: true, text, provider: "gemini", model };
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const notFound =
        errMsg.includes("404") || errMsg.toLowerCase().includes("not_found");
      if (!notFound) {
        return { ok: false, error: errMsg };
      }
    }
  }

  return { ok: false, error: "All Gemini models failed" };
}

async function tryGroq(options: GenerateOptions): Promise<GenerateResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "GROQ_API_KEY missing" };

  const messages = [
    { role: "system", content: options.systemPrompt },
    ...options.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: options.temperature ?? 0.5,
        max_tokens: options.maxTokens ?? 1024,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: `Groq ${res.status}: ${errText.slice(0, 150)}` };
    }

    const data: {
      choices?: Array<{ message?: { content?: string } }>;
    } = await res.json();

    const text = data.choices?.[0]?.message?.content ?? "";
    if (text.trim()) {
      return { ok: true, text, provider: "groq", model: GROQ_MODEL };
    }

    return { ok: false, error: "Groq empty response" };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: errMsg };
  }
}

export async function generateText(options: GenerateOptions): Promise<GenerateResult> {
  // Try Gemini first
  const gemini = await tryGemini(options);
  if (gemini.ok) return gemini;

  console.warn("[ai] Gemini failed:", gemini.error?.slice(0, 150));

  // Fallback to Groq
  const groq = await tryGroq(options);
  if (groq.ok) return groq;

  console.error("[ai] Groq failed too:", groq.error?.slice(0, 150));

  return {
    ok: false,
    error: "كل الخدمات مشغولة حالياً. حاول بعد لحظات.",
  };
}