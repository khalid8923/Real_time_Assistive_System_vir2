import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You extract processes and steps from Arabic lecture transcripts and convert them into Mermaid flowchart syntax.

Rules:
- Detect "steps", "processes", "procedures" in the text
- Generate a Mermaid flowchart using "graph TD" syntax ONLY
- Use Arabic text inside the diagram (Mermaid supports it)
- Keep node labels short (max 5 words)
- Use arrows: --> for sequential steps
- Use {} for decisions if text has conditions
- NEVER include markdown fences in your output
- If the text has no clear process, return mermaidCode: ""

Reply with JSON only:
{
  "title": "short Arabic title",
  "description": "one sentence in Arabic",
  "mermaidCode": "graph TD\\n    A[الخطوة الأولى] --> B[الخطوة الثانية]\\n    B --> C{قرار؟}",
  "hasProcess": true
}`;

interface FlowResult {
  title: string;
  description: string;
  mermaidCode: string;
  hasProcess: boolean;
}

function isValidFlow(d: unknown): d is FlowResult {
  if (typeof d !== "object" || d === null) return false;
  const o = d as Record<string, unknown>;
  return (
    typeof o.title === "string" &&
    typeof o.description === "string" &&
    typeof o.mermaidCode === "string" &&
    typeof o.hasProcess === "boolean"
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 10, 60_000).ok) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const rawText = (body as Record<string, unknown>)?.text;
  if (typeof rawText !== "string" || rawText.trim().length === 0) {
    return NextResponse.json({ error: "Text required." }, { status: 400 });
  }

  const text = rawText.trim();
  const trimmed = text.length > 6000 ? text.slice(0, 6000) : text;

  const result = await generateText({
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Text:\n\n${trimmed}` }],
    temperature: 0.2,
    maxTokens: 1500,
    jsonMode: true,
  });

  if (!result.ok || !result.text) {
    return NextResponse.json(
      { error: result.error || "Failed." },
      { status: 502 }
    );
  }

  const parsed = parseJsonResponse(result.text);
  if (!parsed || !isValidFlow(parsed)) {
    return NextResponse.json(
      { error: "Invalid schema." },
      { status: 502 }
    );
  }

  console.log(`[visualize-flow] OK via "${result.provider}" | hasProcess=${parsed.hasProcess}`);
  return NextResponse.json(parsed, { status: 200 });
}