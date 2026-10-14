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
- Compiler stages (lexer → parser → optimizer → codegen)
- ML pipeline (data → features → model → eval → deploy)
- IoT architecture (sensor → edge → cloud → app)
- Software architecture (UI → logic → data)
- Microservices stack

For each system, produce:
- title: short Arabic title
- subtitle: short Arabic description
- layers: 3-7 layers, ordered top-to-bottom (high-level → low-level). Each layer:
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
2. If professor didn't describe a flow scenario, set scenario: [] — DON'T invent
3. Order layers as professor described them (top-down usually)
4. Prefer STEM systems: OSI, TCP/IP, CPU, compiler, ML pipeline
5. If NO layered system exists → systems: []

Example - "نموذج OSI فيه 7 طبقات: Application, Presentation, Session, Transport, Network, Data Link, Physical. كل طبقة بتضيف header خاص بها":

{
  "systems": [
    {
      "title": "نموذج OSI",
      "subtitle": "7 طبقات للاتصال الشبكي",
      "layers": [
        { "id": "l1", "name": "Application", "role": "بيوفر الخدمات للمستخدم مباشرة", "examples": ["HTTP", "FTP", "SMTP"], "input": "أوامر المستخدم", "output": "داتا منظمة" },
        { "id": "l2", "name": "Presentation", "role": "بيترجم الداتا ويضغطها ويشفّرها", "examples": ["SSL/TLS", "JPEG", "ASCII"], "input": "داتا من Application", "output": "داتا مُشفّرة" },
        { "id": "l3", "name": "Session", "role": "بيدير الاتصال بين الجهازين", "examples": ["NetBIOS", "RPC"], "input": "داتا مشفرة", "output": "سيشن مفتوح" }
      ],
      "scenario": [
        { "step": 1, "from": "l1", "to": "l2", "label": "الطلب بيتحول لصيغة موحدة" },
        { "step": 2, "from": "l2", "to": "l3", "label": "البيانات بتتشفّر" }
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
  if (!rateLimit(ip, 10, 60_000).ok) {
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