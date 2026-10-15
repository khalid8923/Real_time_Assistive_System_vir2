import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";
import type { ExplodedSystem } from "@/lib/ai-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You extract LAYERED SYSTEMS from university lecture transcripts. Content is Arabic (Egyptian or MSA) with English technical terms.

A "system" = a set of layers/components working together in a hierarchy. Examples:
- OSI model (7 layers)
- TCP/IP model (4 layers)
- Computer architecture (CPU pipeline, memory hierarchy)
- Compiler stages (lexer â†’ parser â†’ optimizer â†’ codegen)
- ML pipeline (data â†’ features â†’ model â†’ eval â†’ deploy)
- IoT architecture (sensor â†’ edge â†’ cloud â†’ app)
- Software architecture (UI â†’ logic â†’ data)
- Microservices stack

For each system, produce:
- title: short Arabic title
- subtitle: short Arabic description
- layers: 3-7 layers, ordered top-to-bottom (high-level â†’ low-level). Each layer:
  - id: "l1", "l2"...
  - name: layer name (English kept as-is: "Application Layer")
  - role: ONE sentence in Arabic (what it does)
  - examples: 2-4 concrete protocols/tools/files ("HTTP", "TCP", "Ethernet")
  - input: what comes IN from layer above (short Arabic)
  - output: what goes OUT below (short Arabic)
- scenario: OPTIONAL step-by-step flow (ONLY if professor described a real journey):
  - step: 1, 2, 3...
  - from: layer id
  - to: layer id
  - label: what happens (short Arabic)
- sourceQuote: excerpt from professor's words

RULES:
1. ONLY extract systems EXPLICITLY described in the transcript
2. If professor didn't describe a flow scenario, set scenario: [] â€” DON'T invent
3. Order layers as professor described them (top-down usually)
4. Prefer STEM systems: OSI, TCP/IP, CPU, compiler, ML pipeline
5. If NO layered system exists â†’ systems: []

Example - "Ù†Ù…ÙˆØ°Ø¬ OSI ÙÙŠÙ‡ 7 Ø·Ø¨Ù‚Ø§Øª: Application, Presentation, Session, Transport, Network, Data Link, Physical. ÙƒÙ„ Ø·Ø¨Ù‚Ø© Ø¨ØªØ¶ÙŠÙ header Ø®Ø§Øµ Ø¨Ù‡Ø§":

{
  "systems": [
    {
      "title": "Ù†Ù…ÙˆØ°Ø¬ OSI",
      "subtitle": "7 Ø·Ø¨Ù‚Ø§Øª Ù„Ù„Ø§ØªØµØ§Ù„ Ø§Ù„Ø´Ø¨ÙƒÙŠ",
      "layers": [
        { "id": "l1", "name": "Application", "role": "Ø¨ÙŠÙˆÙØ± Ø§Ù„Ø®Ø¯Ù…Ø§Øª Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…Ø¨Ø§Ø´Ø±Ø©", "examples": ["HTTP", "FTP", "SMTP"], "input": "Ø£ÙˆØ§Ù…Ø± Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…", "output": "Ø¯Ø§ØªØ§ Ù…Ù†Ø¸Ù…Ø©" },
        { "id": "l2", "name": "Presentation", "role": "Ø¨ÙŠØªØ±Ø¬Ù… Ø§Ù„Ø¯Ø§ØªØ§ ÙˆÙŠØ¶ØºØ·Ù‡Ø§ ÙˆÙŠØ´ÙÙ‘Ø±Ù‡Ø§", "examples": ["SSL/TLS", "JPEG", "ASCII"], "input": "Ø¯Ø§ØªØ§ Ù…Ù† Application", "output": "Ø¯Ø§ØªØ§ Ù…ÙØ´ÙÙ‘Ø±Ø©" },
        { "id": "l3", "name": "Session", "role": "Ø¨ÙŠØ¯ÙŠØ± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨ÙŠÙ† Ø§Ù„Ø¬Ù‡Ø§Ø²ÙŠÙ†", "examples": ["NetBIOS", "RPC"], "input": "Ø¯Ø§ØªØ§ Ù…Ø´ÙØ±Ø©", "output": "Ø³ÙŠØ´Ù† Ù…ÙØªÙˆØ­" }
      ],
      "scenario": [
        { "step": 1, "from": "l1", "to": "l2", "label": "Ø§Ù„Ø·Ù„Ø¨ Ø¨ÙŠØªØ­ÙˆÙ„ Ù„ØµÙŠØºØ© Ù…ÙˆØ­Ø¯Ø©" },
        { "step": 2, "from": "l2", "to": "l3", "label": "Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø¨ØªØªØ´ÙÙ‘Ø±" }
      ]
    }
  ]
}

Reply with JSON only.`;

interface SystemPayload {
  systems?: Array<{
    title?: string;
    subtitle?: string;
    layers?: Array<{
      id?: string;
      name?: string;
      role?: string;
      examples?: string[];
      input?: string;
      output?: string;
    }>;
    scenario?: Array<{
      step?: number;
      from?: string;
      to?: string;
      label?: string;
    }>;
    sourceQuote?: string;
  }>;
}

function isValid(d: unknown): d is SystemPayload {
  if (typeof d !== "object" || d === null) return false;
  return Array.isArray((d as Record<string, unknown>).systems);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 10, 60_000, "visualize-system").ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const rawText = (body as Record<string, unknown>)?.text;
  if (typeof rawText !== "string" || rawText.trim().length < 50) {
    return NextResponse.json({ error: "Text too short." }, { status: 400 });
  }

  const text = rawText.trim().slice(0, 8000);

  const result = await generateText({
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Transcript:\n\n${text}` }],
    temperature: 0.2,
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
  if (!parsed || !isValid(parsed)) {
    return NextResponse.json({ error: "Invalid schema." }, { status: 502 });
  }

  const now = Date.now();
  const systems: ExplodedSystem[] = (parsed.systems ?? [])
    .filter(
      (s) =>
        typeof s.title === "string" &&
        Array.isArray(s.layers) &&
        s.layers.length >= 3 &&
        s.layers.length <= 8
    )
    .slice(0, 2)
    .map((s, idx) => ({
      id: `sys-${now}-${idx}`,
      title: String(s.title),
      subtitle: s.subtitle ? String(s.subtitle) : undefined,
      layers: (s.layers ?? []).map((l, li) => ({
        id: String(l.id ?? `l${li + 1}`),
        name: String(l.name ?? ""),
        role: String(l.role ?? ""),
        examples: Array.isArray(l.examples)
          ? l.examples.slice(0, 5).map(String)
          : [],
        input: l.input ? String(l.input) : undefined,
        output: l.output ? String(l.output) : undefined,
      })),
      scenario: Array.isArray(s.scenario)
        ? s.scenario.map((sc, i) => ({
            step: Number(sc.step ?? i + 1),
            from: String(sc.from ?? ""),
            to: String(sc.to ?? ""),
            label: String(sc.label ?? ""),
          }))
        : [],
      sourceQuote: s.sourceQuote ? String(s.sourceQuote) : undefined,
      detectedAt: now,
    }));

  console.log(
    `[visualize-system] OK via "${result.provider}" | systems=${systems.length}`
  );

  return NextResponse.json({ systems }, { status: 200 });
}