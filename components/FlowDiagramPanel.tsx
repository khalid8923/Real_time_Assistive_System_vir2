"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Network, Loader2, PlayCircle, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MermaidDiagram from "@/components/MermaidDiagram";

interface FlowDiagramPanelProps {
  transcript: string;
}

interface FlowResult {
  title: string;
  description: string;
  mermaidCode: string;
  hasProcess: boolean;
}

export default function FlowDiagramPanel({ transcript }: FlowDiagramPanelProps) {
  const [flow, setFlow] = React.useState<FlowResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canGenerate = transcript.trim().length > 50 && !loading;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/visualize-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
      const data: FlowResult & { error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل التحويل.");
        return;
      }
      setFlow(data);
    } catch {
      setError("تعذّر الاتصال بالخدمة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Network className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold">مخطط العمليات</h2>
            <p className="text-[10px] text-muted-foreground">
              {flow?.hasProcess
                ? "المخطط جاهز"
                : "استخرج الخطوات كـ flowchart"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {flow && (
            <button
              type="button"
              onClick={() => setFlow(null)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 text-destructive transition-colors hover:bg-destructive/15"
              aria-label="حذف"
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
                جارٍ التحويل...
              </>
            ) : (
              <>
                <PlayCircle className="h-3.5 w-3.5" />
                {flow ? "ولّد تاني" : "ولّد المخطط"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-4">
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {!flow && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {canGenerate
                ? "اضغط (ولّد المخطط) عشان نستخرج الخطوات"
                : "سجّل 50 حرف على الأقل الأول"}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              جارٍ تحليل العملية...
            </p>
          </div>
        )}

        {flow && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {flow.hasProcess && flow.mermaidCode ? (
              <>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <h3 className="text-sm font-bold">{flow.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {flow.description}
                  </p>
                </div>
                <MermaidDiagram code={flow.mermaidCode} />
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  مفيش عملية واضحة في النص ده
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}