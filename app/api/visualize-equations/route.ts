import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateText, parseJsonResponse } from "@/lib/ai/provider";
import type { CapturedEquation } from "@/lib/ai-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You extract MATHEMATICAL and PHYSICAL EQUATIONS from university lecture transcripts in Arabic (Egyptian or MSA) with English terms.

The professor says equations SPOKEN in Arabic. You convert them to:
1. LaTeX (proper formula)
2. JavaScript expression (for live calculation)
3. Variable definitions with realistic default/min/max

CRITICAL - Egyptian Arabic math vocabulary:
- "ÙŠØ³Ø§ÙˆÙŠ" / "Ø¨ØªØ³Ø§ÙˆÙŠ" â†’ =
- "Ø²Ø§Ø¦Ø¯" â†’ +
- "Ù†Ø§Ù‚Øµ" â†’ -
- "Ø¶Ø±Ø¨" / "ÙÙŠ" â†’ *
- "Ø¹Ù„Ù‰" / "Ù…Ù‚Ø³ÙˆÙ… Ø¹Ù„Ù‰" â†’ /
- "ØªØ±Ø¨ÙŠØ¹" / "Ø£Ø³ 2" â†’ ^2
- "ØªÙƒØ¹ÙŠØ¨" / "Ø£Ø³ 3" â†’ ^3
- "Ø¬Ø°Ø±" / "ØªØ­Øª Ø§Ù„Ø¬Ø°Ø±" â†’ sqrt()
- "Ø³ÙŠØ¬Ù…Ø§" â†’ sum
- "ÙƒÙˆØ³Ø§ÙŠÙ†" / "cos" â†’ cos
- "Ø³Ø§ÙŠÙ†" / "sin" â†’ sin
- "ØªØ§Ù†" / "tan" â†’ tan
- "Ù„ÙˆØºØ§Ø±ÙŠØªÙ…" / "Ù„ÙˆØ¬" â†’ log
- "Ø«ÙŠØªØ§" â†’ \\theta
- "Ø£Ù„ÙØ§" â†’ \\alpha
- "Ø¨ÙŠØªØ§" â†’ \\beta
- "Ø¯Ù„ØªØ§" â†’ \\Delta
- "Ø¨Ø§ÙŠ" â†’ \\pi
- "Ø¥Ù†" (ÙÙŠ Ø³ÙŠØ¬Ù…Ø§) â†’ n

RULES:
1. ONLY extract equations EXPLICITLY spoken. Don't invent.
2. If the equation is ambiguous or you're unsure â†’ confidence: "low"
3. Expression MUST be valid JavaScript. Use Math.* prefix for functions:
   - Math.sin(x), Math.cos(x), Math.sqrt(x), Math.log(x), Math.PI
   - Degrees to radians: Math.sin(theta * Math.PI / 180)
4. Variables: 1-5 variables, each with realistic defaults for a textbook problem
5. Prefer STEM equations: Newton's laws, kinematics, thermodynamics, differentiation, integrals, Ohm's law, circuit equations, ML loss functions, gradient descent, statistics, etc.
6. If NO equation exists â†’ equations: []

FEW-SHOT EXAMPLES:

Input: "Ø§Ù„Ø´ØºÙ„ ÙŠØ³Ø§ÙˆÙŠ Ø§Ù„Ù‚ÙˆØ© ÙÙŠ Ø§Ù„Ø¥Ø²Ø§Ø­Ø© ÙÙŠ ÙƒÙˆØ³Ø§ÙŠÙ† Ø«ÙŠØªØ§"
Output:
{
  "name": "Ø§Ù„Ø´ØºÙ„",
  "spoken": "Ø§Ù„Ø´ØºÙ„ ÙŠØ³Ø§ÙˆÙŠ Ø§Ù„Ù‚ÙˆØ© ÙÙŠ Ø§Ù„Ø¥Ø²Ø§Ø­Ø© ÙÙŠ ÙƒÙˆØ³Ø§ÙŠÙ† Ø«ÙŠØªØ§",
  "latex": "W = F \\cdot d \\cdot \\cos(\\theta)",
  "expression": "F * d * Math.cos(theta * Math.PI / 180)",
  "outputLabel": "Ø§Ù„Ø´ØºÙ„",
  "outputUnit": "J",
  "variables": [
    { "name": "F", "meaning": "Ø§Ù„Ù‚ÙˆØ©", "default": 10, "min": 0, "max": 100, "unit": "N" },
    { "name": "d", "meaning": "Ø§Ù„Ø¥Ø²Ø§Ø­Ø©", "default": 5, "min": 0, "max": 50, "unit": "m" },
    { "name": "theta", "meaning": "Ø§Ù„Ø²Ø§ÙˆÙŠØ©", "default": 30, "min": 0, "max": 90, "unit": "Â°" }
  ],
  "confidence": "high"
}

Input: "Ø·Ø§Ù‚Ø© Ø§Ù„Ø­Ø±ÙƒØ© ØªØ³Ø§ÙˆÙŠ Ù†Øµ Ø§Ù„ÙƒØªÙ„Ø© ÙÙŠ Ø§Ù„Ø³Ø±Ø¹Ø© ØªØ±Ø¨ÙŠØ¹"
Output:
{
  "name": "Ø·Ø§Ù‚Ø© Ø§Ù„Ø­Ø±ÙƒØ©",
  "spoken": "Ø·Ø§Ù‚Ø© Ø§Ù„Ø­Ø±ÙƒØ© ØªØ³Ø§ÙˆÙŠ Ù†Øµ Ø§Ù„ÙƒØªÙ„Ø© ÙÙŠ Ø§Ù„Ø³Ø±Ø¹Ø© ØªØ±Ø¨ÙŠØ¹",
  "latex": "KE = \\frac{1}{2} m v^2",
  "expression": "0.5 * m * v * v",
  "outputLabel": "Ø·Ø§Ù‚Ø© Ø§Ù„Ø­Ø±ÙƒØ©",
  "outputUnit": "J",
  "variables": [
    { "name": "m", "meaning": "Ø§Ù„ÙƒØªÙ„Ø©", "default": 2, "min": 0.1, "max": 100, "unit": "kg" },
    { "name": "v", "meaning": "Ø§Ù„Ø³Ø±Ø¹Ø©", "default": 10, "min": 0, "max": 50, "unit": "m/s" }
  ],
  "confidence": "high"
}

Input: "Ù‚Ø§Ù†ÙˆÙ† Ø£ÙˆÙ…: Ø§Ù„Ø¬Ù‡Ø¯ ÙŠØ³Ø§ÙˆÙŠ Ø§Ù„ØªÙŠØ§Ø± ÙÙŠ Ø§Ù„Ù…Ù‚Ø§ÙˆÙ…Ø©"
Output:
{
  "name": "Ù‚Ø§Ù†ÙˆÙ† Ø£ÙˆÙ…",
  "spoken": "Ø§Ù„Ø¬Ù‡Ø¯ ÙŠØ³Ø§ÙˆÙŠ Ø§Ù„ØªÙŠØ§Ø± ÙÙŠ Ø§Ù„Ù…Ù‚Ø§ÙˆÙ…Ø©",
  "latex": "V = I \\cdot R",
  "expression": "I * R",
  "outputLabel": "Ø§Ù„Ø¬Ù‡Ø¯",
  "outputUnit": "V",
  "variables": [
    { "name": "I", "meaning": "Ø§Ù„ØªÙŠØ§Ø±", "default": 2, "min": 0, "max": 20, "unit": "A" },
    { "name": "R", "meaning": "Ø§Ù„Ù…Ù‚Ø§ÙˆÙ…Ø©", "default": 10, "min": 1, "max": 1000, "unit": "Î©" }
  ],
  "confidence": "high"
}

Reply with JSON only:
{
  "equations": [
    {
      "name": "...",
      "spoken": "...",
      "latex": "...",
      "expression": "...",
      "outputLabel": "...",
      "outputUnit": "...",
      "variables": [...],
      "confidence": "high",
      "sourceQuote": "..."
    }
  ]
}`;

interface EqPayload {
  equations?: Array<{
    name?: string;
    spoken?: string;
    latex?: string;
    expression?: string;
    outputLabel?: string;
    outputUnit?: string;
    variables?: Array<{
      name?: string;
      meaning?: string;
      default?: number;
      min?: number;
      max?: number;
      unit?: string;
    }>;
    confidence?: string;
    sourceQuote?: string;
  }>;
}

function isValidPayload(d: unknown): d is EqPayload {
  if (typeof d !== "object" || d === null) return false;
  return Array.isArray((d as Record<string, unknown>).equations);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 8, 60_000, "visualize-equations").ok) {
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
    temperature: 0.1,
    maxTokens: 3000,
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
    return NextResponse.json({ error: "Invalid schema." }, { status: 502 });
  }

  const now = Date.now();
  const equations: CapturedEquation[] = (parsed.equations ?? [])
    .filter(
      (eq) =>
        typeof eq.name === "string" &&
        typeof eq.latex === "string" &&
        typeof eq.expression === "string" &&
        Array.isArray(eq.variables) &&
        eq.variables.length > 0 &&
        eq.variables.length <= 6
    )
    .slice(0, 4)
    .map((eq, idx) => ({
      id: `eq-${now}-${idx}`,
      name: String(eq.name),
      spoken: String(eq.spoken ?? ""),
      latex: String(eq.latex),
      expression: String(eq.expression),
      outputLabel: String(eq.outputLabel ?? eq.name),
      outputUnit: eq.outputUnit ? String(eq.outputUnit) : undefined,
      variables: (eq.variables ?? []).map((v) => ({
        name: String(v.name ?? "x"),
        meaning: String(v.meaning ?? v.name ?? ""),
        default: Number(v.default ?? 1),
        min: Number(v.min ?? 0),
        max: Number(v.max ?? 100),
        unit: v.unit ? String(v.unit) : undefined,
      })),
      confidence:
        eq.confidence === "high" || eq.confidence === "low"
          ? eq.confidence
          : "medium",
      sourceQuote: eq.sourceQuote ? String(eq.sourceQuote) : undefined,
      detectedAt: now,
    }));

  console.log(
    `[visualize-equations] OK via "${result.provider}" | equations=${equations.length}`
  );

  return NextResponse.json({ equations }, { status: 200 });
}