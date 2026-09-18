import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an academic action-item radar. You receive a lecture transcript and extract academic hints.

Look for:
- Exams and midterms
- Assignments and homework
- Deadlines
- Important pages/chapters
- Focus points ("this is very important")

For each item:
- type: "exam" | "assignment" | "deadline" | "page" | "important" | "note"
- title: Short title (5-10 words)
- details: Details
- urgency: "high" | "medium" | "low"

Rules:
- If no hints -> items: []
- Reply with JSON only:
{
  "items": [
    { "type": "exam", "title": "...", "details": "...", "urgency": "high" }
  ]
}`;

import type { ActionItem } from "@/lib/db/ai-types";

interface ErrorResponse {
  error: string;
}

function jsonError(
  message: string,
  status: number,
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 10, 60_000).ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON.", 400);
  }

  const rawText = (body as Record<string, unknown>)?.text;
  if (typeof rawText !== "string" || rawText.trim().length === 0) {
    return jsonError("Text is required.", 400);
  }

  const text = rawText.trim();
  const trimmed = text.length > 8000 ? text.slice(0, 8000) : text;

  const result = await generateText({
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Text:\n\n${trimmed}` }],
    temperature: 0.1,
    maxTokens: 2048,
    prefer: "groq",
  });

  if (!result.ok || !result.text) {
    return jsonError(result.error || "Scan failed.", 502);
  }

  const parsed = parseJsonResponse<{
    items?: Omit<ActionItem, "id" | "detectedAt">[];
  }>(result.text);

  if (!parsed) {
    return jsonError("Response does not match schema.", 502);
  }

  const items: ActionItem[] = (parsed.items ?? []).map((item) => ({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    detectedAt: Date.now(),
  }));

  console.log(
    `[action-items] OK via "${result.provider}" | found=${items.length}`,
  );
  return NextResponse.json({ items }, { status: 200 });
}
