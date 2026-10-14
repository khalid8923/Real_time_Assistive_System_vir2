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
- "يساوي" / "بتساوي" → =
- "زائد" → +
- "ناقص" → -
- "ضرب" / "في" → *
- "على" / "مقسوم على" → /
- "تربيع" / "أس 2" → ^2
- "تكعيب" / "أس 3" → ^3
- "جذر" / "تحت الجذر" → sqrt()
- "سيجما" → sum
- "كوساين" / "cos" → cos
- "ساين" / "sin" → sin
- "تان" / "tan" → tan
- "لوغاريتم" / "لوج" → log
- "ثيتا" → \\theta
- "ألفا" → \\alpha
- "بيتا" → \\beta
- "دلتا" → \\Delta
- "باي" → \\pi
- "إن" (في سيجما) → n

RULES:
1. ONLY extract equations EXPLICITLY spoken. Don't invent.
2. If the equation is ambiguous or you're unsure → confidence: "low"
3. Expression MUST be valid JavaScript. Use Math.* prefix for functions:
   - Math.sin(x), Math.cos(x), Math.sqrt(x), Math.log(x), Math.PI
   - Degrees to radians: Math.sin(theta * Math.PI / 180)
4. Variables: 1-5 variables, each with realistic defaults for a textbook problem
5. Prefer STEM equations: Newton's laws, kinematics, thermodynamics, differentiation, integrals, Ohm's law, circuit equations, ML loss functions, gradient descent, statistics, etc.
6. If NO equation exists → equations: []

FEW-SHOT EXAMPLES:

Input: "الشغل يساوي القوة في الإزاحة في كوساين ثيتا"
Output:
{
  "name": "الشغل",
  "spoken": "الشغل يساوي القوة في الإزاحة في كوساين ثيتا",
  "latex": "W = F \\cdot d \\cdot \\cos(\\theta)",
  "expression": "F * d * Math.cos(theta * Math.PI / 180)",
  "outputLabel": "الشغل",
  "outputUnit": "J",
  "variables": [
    { "name": "F", "meaning": "القوة", "default": 10, "min": 0, "max": 100, "unit": "N" },
    { "name": "d", "meaning": "الإزاحة", "default": 5, "min": 0, "max": 50, "unit": "m" },
    { "name": "theta", "meaning": "الزاوية", "default": 30, "min": 0, "max": 90, "unit": "°" }
  ],
  "confidence": "high"
}

Input: "طاقة الحركة تساوي نص الكتلة في السرعة تربيع"
Output:
{
  "name": "طاقة الحركة",
  "spoken": "طاقة الحركة تساوي نص الكتلة في السرعة تربيع",
  "latex": "KE = \\frac{1}{2} m v^2",
  "expression": "0.5 * m * v * v",
  "outputLabel": "طاقة الحركة",
  "outputUnit": "J",
  "variables": [
    { "name": "m", "meaning": "الكتلة", "default": 2, "min": 0.1, "max": 100, "unit": "kg" },
    { "name": "v", "meaning": "السرعة", "default": 10, "min": 0, "max": 50, "unit": "m/s" }
  ],
  "confidence": "high"
}

Input: "قانون أوم: الجهد يساوي التيار في المقاومة"
Output:
{
  "name": "قانون أوم",
  "spoken": "الجهد يساوي التيار في المقاومة",
  "latex": "V = I \\cdot R",
  "expression": "I * R",
  "outputLabel": "الجهد",
  "outputUnit": "V",
  "variables": [
    { "name": "I", "meaning": "التيار", "default": 2, "min": 0, "max": 20, "unit": "A" },
    { "name": "R", "meaning": "المقاومة", "default": 10, "min": 1, "max": 1000, "unit": "Ω" }
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