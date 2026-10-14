"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wand2,
  Loader2,
  PlayCircle,
  Trash2,
  Sparkles,
  Quote,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/ErrorState";
import DiagramRenderer from "@/components/DiagramRenderer";
import type { GeneratedDiagram } from "@/lib/ai-types";

interface VisualizeThisPanelProps {
  transcript: string;
}

const SHAPE_LABELS: Record<string, string> = {
  sequence: "خطوات",
  cycle: "دورة",
  hierarchy: "شجرة",
  comparison: "مقارنة",
  layers: "طبقات",
};

export default function VisualizeThisPanel({ transcript }: VisualizeThisPanelProps) {
  const [diagram, setDiagram] = React.useState<GeneratedDiagram | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canGenerate = transcript.trim().length >= 30 && !loading;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/visualize-this", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
      const data: { diagram?: GeneratedDiagram; error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل توليد الرسم.");
        return;
      }
      setDiagram(data.diagram ?? null);
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-fuchsia-500 to-amber-500">
            <Wand2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">ارسمها لي</h2>
            <p className="text-[10px] text-muted-foreground">
              {diagram
                ? `نوع: ${SHAPE_LABELS[diagram.shape] ?? diagram.shape}`
                : "حوّل أي فكرة لرسم توضيحي"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {diagram && (
            <button
              type="button"
              onClick={() => setDiagram(null)}
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
                جارٍ الرسم...
              </>
            ) : (
              <>
                {diagram ? <RefreshCw className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                {diagram ? "ارسم تاني" : "ارسمها"}
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
                title="مش قادرين نرسم"
                description={error}
                hint="جرّب بمحاضرة فيها خطوات أو دورة أو تصنيف"
                onRetry={() => {
                  setError(null);
                  handleGenerate();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!diagram && !loading && !error && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-bold text-foreground">
              {canGenerate
                ? "اضغط (ارسمها) لتحويل أي فكرة لرسم"
                : "سجّل 30 حرف على الأقل الأول"}
            </p>
            <p className="max-w-md text-xs text-muted-foreground">
              {canGenerate
                ? "المحرك هيختار الشكل المناسب تلقائياً: خطوات، دورة، شجرة، مقارنة، أو طبقات"
                : "المحرك يشتغل على نص المحاضرة الكامل"}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              بندوّر على شكل مناسب للرسم...
            </p>
          </div>
        )}

        {diagram && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="rounded-xl border border-primary/20 bg-linear-to-br from-primary/5 to-accent-2/5 p-4">
              <h3 className="text-sm font-bold">{diagram.title}</h3>
              {diagram.subtitle && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {diagram.subtitle}
                </p>
              )}
              {diagram.sourceQuote && (
                <div className="mt-3 flex items-start gap-1.5 rounded-md bg-background/60 px-2.5 py-1.5 text-[10px] leading-snug text-primary/90">
                  <Quote className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                  <span className="italic">&ldquo;{diagram.sourceQuote}&rdquo;</span>
                </div>
              )}
            </div>

            <DiagramRenderer diagram={diagram} />
          </motion.div>
        )}
      </div>
    </div>
  );
}