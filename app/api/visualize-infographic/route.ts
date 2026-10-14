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
  "title": "عنوان عام للمحاضرة",
  "summary": "جملة واحدة تلخص المحتوى",
  "sections": [
    {
      "id": "sec-1",
      "title": "عنوان القسم",
      "type": "flowchart",
      "flowchart": {
        "mermaidCode": "graph TD\\n  A[نقطة 1] --> B[نقطة 2]",
        "title": "العملية",
        "description": "..."
      }
    },
    {
      "id": "sec-2",
      "title": "إحصائيات",
      "type": "bar-chart",
      "chart": {
        "type": "bar",
        "title": "توزيع...",
        "labels": ["أ", "ب", "ج"],
        "datasets": [{ "label": "العدد", "data": [10, 20, 30] }]
      }
    },
    {
      "id": "sec-3",
      "title": "مقارنة",
      "type": "comparison-table",
      "table": {
        "title": "س vs ص",
        "headers": ["المعيار", "س", "ص"],
        "rows": [["السرعة", "عالية", "منخفضة"]]
      }
    }
  ]
}

Rules:
- Only create sections that match actual content (skip empty)
- If the text has no data for charts, don't invent numbers — use flowchart/table
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
  if (!rateLimit(ip, 8, 60_000).ok) {
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
      title: parsed.title ?? "ملخص بصري",
      summary: parsed.summary ?? "",
      sections,
    },
    { status: 200 }
  );
}