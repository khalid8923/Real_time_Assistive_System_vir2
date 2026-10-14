import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";
import type { ComparisonTable } from "@/lib/ai-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You extract EXPLICIT comparison tables from university lecture transcripts. Content may be Arabic (Egyptian or MSA) with English technical terms.

TASK: Find moments where the professor compares 2-4 things side-by-side (X vs Y, X والفرق بينه و Y, مقارنة بين..., أفضل من..., على عكس..., بخلاف...).

For each comparison, produce:
- title: short Arabic title (e.g., "TCP vs UDP", "المقارنة بين Stack و Queue")
- items: 2-4 things being compared (short names, keep English terms in English)
- criteria: 3-6 comparison dimensions (e.g., السرعة، التعقيد، الاستخدام)

CRITICAL RULES:
1. ONLY extract comparisons that appear EXPLICITLY in the transcript
2. For each cell, set source:
   - "lecture" if the professor SAID this value in the transcript (add a short quote)
   - "inferred" if you filled it from general knowledge to complete the table
3. If a cell has no data and you can't infer it confidently, use value: "—" and source: "inferred"
4. Prefer technical/academic comparisons relevant to STEM: algorithms, data structures, models, methods, materials, theorems, architectures
5. If NO explicit comparison exists, return comparisons: []

Examples of what to extract:
- "let بيستخدم block scope، أما var فبيستخدم function scope" → let vs var
- "TCP بيعمل connection الأول، UDP لأ" → TCP vs UDP
- "Stack LIFO، Queue FIFO" → Stack vs Queue
- "Batch gradient descent بيحسب على كل الداتا، stochastic على عينة" → Batch vs SGD

JSON schema:
{
  "comparisons": [
    {
      "title": "TCP vs UDP",
      "subtitle": "مقارنة بروتوكولات النقل",
      "items": [
        { "name": "TCP", "source": "lecture" },
        { "name": "UDP", "source": "lecture" }
      ],
      "criteria": [
        {
          "name": "الاتصال",
          "values": [
            { "value": "connection-oriented", "source": "lecture", "quote": "بيعمل connection الأول" },
            { "value": "connectionless", "source": "lecture", "quote": "بيبعت على طول" }
          ]
        }
      ]
    }
  ]
}

Reply with JSON only, no markdown.`;

interface ComparisonResponse {
  comparisons?: Array<{
    title?: string;
    subtitle?: string;
    items?: Array<{ name?: string; source?: string }>;
    criteria?: Array<{
      name?: string;
      values?: Array<{ value?: string; source?: string; quote?: string }>;
    }>;
  }>;
}

function isValidPayload(d: unknown): d is ComparisonResponse {
  if (typeof d !== "object" || d === null) return false;
  const o = d as Record<string, unknown>;
  return Array.isArray(o.comparisons);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 10, 60_000).ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
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
  if (typeof rawText !== "string" || rawText.trim().length < 50) {
    return NextResponse.json(
      { error: "Text too short (need 50+ chars)." },
      { status: 400 }
    );
  }

  const text = rawText.trim().slice(0, 8000);

  const result = await generateText({
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Transcript:\n\n${text}` }],
    temperature: 0.15,
    maxTokens: 2500,
    jsonMode: true,
    prefer: "nvidia",
  });

  if (!result.ok || !result.text) {
    return NextResponse.json(
      { error: result.error || "Extraction failed." },
      { status: 502 }
    );
  }

  const parsed = parseJsonResponse(result.text);
  if (!parsed || !isValidPayload(parsed)) {
    console.error(
      "[visualize-comparison] Invalid schema:",
      result.text.slice(0, 300)
    );
    return NextResponse.json(
      { error: "Invalid response schema." },
      { status: 502 }
    );
  }

  const now = Date.now();
  const comparisons: ComparisonTable[] = (parsed.comparisons ?? [])
    .filter(
      (c) =>
        typeof c.title === "string" &&
        Array.isArray(c.items) &&
        c.items.length >= 2 &&
        Array.isArray(c.criteria) &&
        c.criteria.length > 0
    )
    .slice(0, 3)
    .map((c, idx) => ({
      id: `cmp-${now}-${idx}`,
      title: String(c.title),
      subtitle: c.subtitle ? String(c.subtitle) : undefined,
      items: (c.items ?? []).map((it) => ({
        name: String(it.name ?? ""),
        source: it.source === "lecture" ? "lecture" : "inferred",
      })),
      criteria: (c.criteria ?? []).map((cr) => ({
        name: String(cr.name ?? ""),
        values: (cr.values ?? []).map((v) => ({
          value: String(v.value ?? "—"),
          source: v.source === "lecture" ? "lecture" : "inferred",
          quote: v.quote ? String(v.quote) : undefined,
        })),
      })),
      detectedAt: now,
    }));

  console.log(
    `[visualize-comparison] OK via "${result.provider}" | tables=${comparisons.length}`
  );

  return NextResponse.json({ comparisons }, { status: 200 });
}