"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sigma,
  Loader2,
  PlayCircle,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/ErrorState";
import ExplorableEquation from "@/components/ExplorableEquation";
import type { CapturedEquation } from "@/lib/ai-types";

interface EquationsPanelProps {
  transcript: string;
}

export default function EquationsPanel({ transcript }: EquationsPanelProps) {
  const [equations, setEquations] = React.useState<CapturedEquation[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeIdx, setActiveIdx] = React.useState(0);

  const canGenerate = transcript.trim().length >= 50 && !loading;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/visualize-equations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
      const data: { equations?: CapturedEquation[]; error?: string } =
        await res.json();
      if (!res.ok) {
        setError(data.error || "فشل استخراج المعادلات.");
        return;
      }
      setEquations(data.equations ?? []);
      setActiveIdx(0);
    } catch {
      setError("تعذّر الاتصال بالخدمة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-rose-500 to-violet-500">
            <Sigma className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">المعادلات التحركية</h2>
            <p className="text-[10px] text-muted-foreground">
              {equations.length > 0
                ? `${equations.length} معادلة — جرّب القيم`
                : "استخرج المعادلات من كلام الدكتور"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {equations.length > 0 && (
            <button
              type="button"
              onClick={() => setEquations([])}
              aria-label="حذف"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 text-destructive transition-colors hover:bg-destructive/15"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="gap-2 bg-linear-to-l from-primary to-accent-1 text-xs font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                جارٍ الاستخراج...
              </>
            ) : (
              <>
                <PlayCircle className="h-3.5 w-3.5" />
                {equations.length > 0 ? "استخرج تاني" : "استخرج المعادلات"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4"
            >
              <ErrorState
                category="provider"
                title="مش قادرين نستخرج المعادلات"
                description={error}
                hint="تأكد إن الدكتور قال معادلة صراحة (زي يساوي، تربيع...)"
                onRetry={() => {
                  setError(null);
                  handleGenerate();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {equations.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-bold text-foreground">
              {canGenerate
                ? "اضغط (استخرج المعادلات)"
                : "سجّل 50 حرف على الأقل الأول"}
            </p>
            <p className="max-w-md text-xs text-muted-foreground">
              {canGenerate
                ? 'هنلقط المعادلات المنطوقة زي: "طاقة الحركة = نص الكتلة في السرعة تربيع"، "قانون أوم: الجهد = التيار × المقاومة"...'
                : "المعادلات بتظهر لما الدكتور يقولها بصوت عالي"}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              بندوّر على معادلات في المحاضرة...
            </p>
          </div>
        )}

        {equations.length > 0 && !loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Tabs */}
            {equations.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {equations.map((eq, i) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${
                      i === activeIdx
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {i + 1}. {eq.name}
                  </button>
                ))}
              </div>
            )}

            {equations[activeIdx] && (
              <ExplorableEquation equation={equations[activeIdx]} />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}