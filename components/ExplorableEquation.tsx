"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import { Sliders, TrendingUp, AlertCircle, Play, Pause } from "lucide-react";
import { Parser } from "expr-eval";
import type { CapturedEquation } from "@/lib/ai-types";

interface ExplorableEquationProps {
  equation: CapturedEquation;
}

const parser = new Parser();

export default function ExplorableEquation({ equation }: ExplorableEquationProps) {
  const [values, setValues] = React.useState<Record<string, number>>(
    () => Object.fromEntries(equation.variables.map((v) => [v.name, v.default]))
  );
  const [activeVar, setActiveVar] = React.useState<string>(
    equation.variables[0]?.name ?? ""
  );
  const [animating, setAnimating] = React.useState(false);
  const [latexHtml, setLatexHtml] = React.useState("");

  // KaTeX render
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const katex = (await import("katex")).default;
        if (cancelled) return;
        const html = katex.renderToString(equation.latex, {
          throwOnError: false,
          displayMode: true,
          output: "html",
        });
        setLatexHtml(html);
      } catch (err) {
        console.error("[katex] render failed", err);
        if (!cancelled) setLatexHtml(equation.latex);
      }
    })();
    return () => { cancelled = true; };
  }, [equation.latex]);

  // KaTeX CSS
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const linkId = "katex-css-link";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
      document.head.appendChild(link);
    }
  }, []);

  // Calculated output
  const output = React.useMemo(() => {
    try {
      const expr = parser.parse(equation.expression);
      const val = expr.evaluate(values);
      if (typeof val !== "number" || !isFinite(val)) return null;
      return val;
    } catch {
      return null;
    }
  }, [equation.expression, values]);

  // Curve data for the active variable
  const curveData = React.useMemo(() => {
    const active = equation.variables.find((v) => v.name === activeVar);
    if (!active) return [];
    const points: Array<{ x: number; y: number }> = [];
    const steps = 20;
    const step = (active.max - active.min) / steps;
    try {
      const expr = parser.parse(equation.expression);
      for (let i = 0; i <= steps; i++) {
        const x = active.min + step * i;
        const vals = { ...values, [activeVar]: x };
        const y = expr.evaluate(vals);
        if (typeof y === "number" && isFinite(y)) {
          points.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(4)) });
        }
      }
    } catch { /* ignore */ }
    return points;
  }, [equation.expression, equation.variables, values, activeVar]);

  // Animate
  React.useEffect(() => {
    if (!animating) return;
    const active = equation.variables.find((v) => v.name === activeVar);
    if (!active) return;
    let dir = 1;
    const interval = setInterval(() => {
      setValues((prev) => {
        const cur = prev[activeVar] ?? active.default;
        let next = cur + (active.max - active.min) * 0.05 * dir;
        if (next >= active.max) { next = active.max; dir = -1; }
        if (next <= active.min) { next = active.min; dir = 1; }
        return { ...prev, [activeVar]: Number(next.toFixed(2)) };
      });
    }, 80);
    return () => clearInterval(interval);
  }, [animating, activeVar, equation.variables]);

  const activeDef = equation.variables.find((v) => v.name === activeVar);

  return (
    <div className="space-y-4">
      {/* Equation display */}
      <div className="rounded-xl border border-border bg-linear-to-br from-primary/5 to-accent-2/5 p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-foreground">{equation.name}</h4>
          {equation.confidence === "low" && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-2.5 w-2.5" />
              ثقة منخفضة
            </span>
          )}
        </div>

        <div
          dir="ltr"
          className="overflow-x-auto rounded-lg bg-background/60 px-4 py-3 text-center"
          dangerouslySetInnerHTML={{ __html: latexHtml }}
        />

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-bold text-foreground">الدكتور قال: </span>
          {equation.spoken}
        </p>
      </div>

      {/* Variables sliders */}
      <div className="rounded-xl border border-border bg-muted/10 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Sliders className="h-3 w-3" />
          جرّب بنفسك — حرّك القيم
        </p>
        <div className="space-y-3">
          {equation.variables.map((v) => (
            <div key={v.name}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2">
                  <span className="rounded bg-background px-2 py-0.5 font-mono font-bold text-primary" dir="ltr">
                    {v.name}
                  </span>
                  <span className="text-muted-foreground">{v.meaning}</span>
                  {v.unit && (
                    <span className="text-[10px] text-muted-foreground/60" dir="ltr">
                      ({v.unit})
                    </span>
                  )}
                </label>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
                  {values[v.name]?.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={v.min}
                max={v.max}
                step={(v.max - v.min) / 100}
                value={values[v.name] ?? v.default}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setValues((prev) => ({ ...prev, [v.name]: val }));
                }}
                onFocus={() => setActiveVar(v.name)}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary sm:h-1.5"
              />
              <div className="mt-0.5 flex justify-between text-[9px] text-muted-foreground/50 font-mono" dir="ltr">
                <span>{v.min}</span>
                <span>{v.max}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live output */}
      <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-5">
        <div className="mb-1 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            الناتج الحالي
          </p>
          <button
            type="button"
            onClick={() => setAnimating((a) => !a)}
            className="flex h-7 items-center gap-1 rounded-full border border-emerald-500/30 bg-background px-3 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 transition-colors hover:bg-emerald-500/10"
          >
            {animating ? (
              <>
                <Pause className="h-3 w-3" />
                وقف
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                جرّب تلقائي
              </>
            )}
          </button>
        </div>
        <p className="text-3xl font-black tabular-nums text-emerald-600 dark:text-emerald-400" dir="ltr">
          {output !== null ? output.toFixed(3) : "—"}
          {equation.outputUnit && (
            <span className="ml-2 text-base font-bold opacity-60">
              {equation.outputUnit}
            </span>
          )}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {equation.outputLabel}
        </p>
      </div>

      {/* Curve for active variable */}
      {curveData.length > 0 && activeDef && (
        <div className="rounded-xl border border-border bg-muted/10 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            كيف يتغير الناتج مع <span className="font-mono text-primary" dir="ltr">{activeVar}</span>
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={curveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="x"
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                type="number"
                domain={["dataMin", "dataMax"]}
              />
              <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{
                  background: "#1f2937",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 11,
                  direction: "ltr",
                }}
              />
              <Line
                type="monotone"
                dataKey="y"
                stroke="#3ec972"
                strokeWidth={2.5}
                dot={false}
              />
              {output !== null && (
                <ReferenceDot
                  x={values[activeVar]}
                  y={output}
                  r={7}
                  fill="#8470ff"
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Source quote */}
      {equation.sourceQuote && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-[11px] italic text-primary/90">
          &ldquo;{equation.sourceQuote}&rdquo;
        </div>
      )}
    </div>
  );
}