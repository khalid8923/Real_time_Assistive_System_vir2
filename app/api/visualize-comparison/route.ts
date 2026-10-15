import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";
import type { ComparisonTable } from "@/lib/ai-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You extract EXPLICIT comparison tables from university lecture transcripts. Content may be Arabic (Egyptian or MSA) with English technical terms.

TASK: Find moments where the professor compares 2-4 things side-by-side (X vs Y, X ÙˆØ§Ù„ÙØ±Ù‚ Ø¨ÙŠÙ†Ù‡ Ùˆ Y, Ù…Ù‚Ø§Ø±Ù†Ø© Ø¨ÙŠÙ†..., Ø£ÙØ¶Ù„ Ù…Ù†..., Ø¹Ù„Ù‰ Ø¹ÙƒØ³..., Ø¨Ø®Ù„Ø§Ù...).

For each comparison, produce:
- title: short Arabic title (e.g., "TCP vs UDP", "Ø§Ù„Ù…Ù‚Ø§Ø±Ù†Ø© Ø¨ÙŠÙ† Stack Ùˆ Queue")
- items: 2-4 things being compared (short names, keep English terms in English)
- criteria: 3-6 comparison dimensions (e.g., Ø§Ù„Ø³Ø±Ø¹Ø©ØŒ Ø§Ù„ØªØ¹Ù‚ÙŠØ¯ØŒ Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…)

CRITICAL RULES:
1. ONLY extract comparisons that appear EXPLICITLY in the transcript
2. For each cell, set source:
   - "lecture" if the professor SAID this value in the transcript (add a short quote)
   - "inferred" if you filled it from general knowledge to complete the table
3. If a cell has no data and you can't infer it confidently, use value: "â€”" and source: "inferred"
4. Prefer technical/academic comparisons relevant to STEM: algorithms, data structures, models, methods, materials, theorems, architectures
5. If NO explicit comparison exists, return comparisons: []

Examples of what to extract:
- "let Ø¨ÙŠØ³ØªØ®Ø¯Ù… block scopeØŒ Ø£Ù…Ø§ var ÙØ¨ÙŠØ³ØªØ®Ø¯Ù… function scope" â†’ let vs var
- "TCP Ø¨ÙŠØ¹Ù…Ù„ connection Ø§Ù„Ø£ÙˆÙ„ØŒ UDP Ù„Ø£" â†’ TCP vs UDP
- "Stack LIFOØŒ Queue FIFO" â†’ Stack vs Queue
- "Batch gradient descent Ø¨ÙŠØ­Ø³Ø¨ Ø¹Ù„Ù‰ ÙƒÙ„ Ø§Ù„Ø¯Ø§ØªØ§ØŒ stochastic Ø¹Ù„Ù‰ Ø¹ÙŠÙ†Ø©" â†’ Batch vs SGD

JSON schema:
{
  "comparisons": [
    {
      "title": "TCP vs UDP",
      "subtitle": "Ù…Ù‚Ø§Ø±Ù†Ø© Ø¨Ø±ÙˆØªÙˆÙƒÙˆÙ„Ø§Øª Ø§Ù„Ù†Ù‚Ù„",
      "items": [
        { "name": "TCP", "source": "lecture" },
        { "name": "UDP", "source": "lecture" }
      ],
      "criteria": [
        {
          "name": "Ø§Ù„Ø§ØªØµØ§Ù„",
          "values": [
            { "value": "connection-oriented", "source": "lecture", "quote": "Ø¨ÙŠØ¹Ù…Ù„ connection Ø§Ù„Ø£ÙˆÙ„" },
            { "value": "connectionless", "source": "lecture", "quote": "Ø¨ÙŠØ¨Ø¹Øª Ø¹Ù„Ù‰ Ø·ÙˆÙ„" }
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
  if (!rateLimit(ip, 10, 60_000, "visualize-comparison").ok) {
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
          value: String(v.value ?? "â€”"),
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