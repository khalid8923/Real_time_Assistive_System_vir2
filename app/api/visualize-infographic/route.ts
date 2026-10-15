import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an infographic designer. Analyze an Arabic lecture transcript and split it into 3-6 visual sections.

For EACH section, choose the best visualization type from:
- "flowchart": for processes, steps, procedures (provide Mermaid code)
- "bar-chart": for comparing quantities, counts, percentages
- "line-chart": for data over time, trends
- "pie-chart": for distribution, parts of a whole
- "comparison-table": for X vs Y comparisons

Reply with JSON only:
{
  "title": "Ø¹Ù†ÙˆØ§Ù† Ø¹Ø§Ù… Ù„Ù„Ù…Ø­Ø§Ø¶Ø±Ø©",
  "summary": "Ø¬Ù…Ù„Ø© ÙˆØ§Ø­Ø¯Ø© ØªÙ„Ø®Øµ Ø§Ù„Ù…Ø­ØªÙˆÙ‰",
  "sections": [
    {
      "id": "sec-1",
      "title": "Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ù‚Ø³Ù…",
      "type": "flowchart",
      "flowchart": {
        "mermaidCode": "graph TD\\n  A[Ù†Ù‚Ø·Ø© 1] --> B[Ù†Ù‚Ø·Ø© 2]",
        "title": "Ø§Ù„Ø¹Ù…Ù„ÙŠØ©",
        "description": "..."
      }
    },
    {
      "id": "sec-2",
      "title": "Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª",
      "type": "bar-chart",
      "chart": {
        "type": "bar",
        "title": "ØªÙˆØ²ÙŠØ¹...",
        "labels": ["Ø£", "Ø¨", "Ø¬"],
        "datasets": [{ "label": "Ø§Ù„Ø¹Ø¯Ø¯", "data": [10, 20, 30] }]
      }
    },
    {
      "id": "sec-3",
      "title": "Ù…Ù‚Ø§Ø±Ù†Ø©",
      "type": "comparison-table",
      "table": {
        "title": "Ø³ vs Øµ",
        "headers": ["Ø§Ù„Ù…Ø¹ÙŠØ§Ø±", "Ø³", "Øµ"],
        "rows": [["Ø§Ù„Ø³Ø±Ø¹Ø©", "Ø¹Ø§Ù„ÙŠØ©", "Ù…Ù†Ø®ÙØ¶Ø©"]]
      }
    }
  ]
}

Rules:
- Only create sections that match actual content (skip empty)
- If the text has no data for charts, don't invent numbers â€” use flowchart/table
- If nothing visual fits, return sections: []`;

function isValidSection(s: unknown): boolean {
  if (typeof s !== "object" || s === null) return false;
  const o = s as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.type === "string"
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 8, 60_000, "visualize-infographic").ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
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

  const trimmed = rawText.trim().slice(0, 8000);

  const result = await generateText({
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Text:\n\n${trimmed}` }],
    temperature: 0.3,
    maxTokens: 2500,
    jsonMode: true,
  });

  if (!result.ok || !result.text) {
    return NextResponse.json(
      { error: result.error || "Failed." },
      { status: 502 }
    );
  }

  const parsed = parseJsonResponse<{
    title?: string;
    summary?: string;
    sections?: unknown[];
  }>(result.text);

  if (!parsed || !Array.isArray(parsed.sections)) {
    return NextResponse.json(
      { error: "Invalid schema." },
      { status: 502 }
    );
  }

  const sections = parsed.sections.filter(isValidSection);

  console.log(
    `[visualize-infographic] OK via "${result.provider}" | sections=${sections.length}`
  );

  return NextResponse.json(
    {
      title: parsed.title ?? "Ù…Ù„Ø®Øµ Ø¨ØµØ±ÙŠ",
      summary: parsed.summary ?? "",
      sections,
    },
    { status: 200 }
  );
}