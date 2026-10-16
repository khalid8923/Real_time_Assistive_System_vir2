"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Link2,
  Loader2,
  PlayCircle,
  Trash2,
  Sparkles,
  Quote,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/ErrorState";
import type { AnalogyMap } from "@/lib/ai-types";

interface AnalogyMapPanelProps {
  transcript: string;
}

export default function AnalogyMapPanel({ transcript }: AnalogyMapPanelProps) {
  const [analogies, setAnalogies] = React.useState<AnalogyMap[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canGenerate = transcript.trim().length >= 50 && !loading;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/visualize-analogy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
      const data: { analogies?: AnalogyMap[]; error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل استخراج التشبيهات.");
        return;
      }
      setAnalogies(data.analogies ?? []);
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-sky-500">
            <Link2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">خريطة التشبيه</h2>
            <p className="text-[10px] text-muted-foreground">
              {analogies.length > 0
                ? `${analogies.length} تشبيه`
                : "اربط المفاهيم الصعبة بحاجات مألوفة"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {analogies.length > 0 && (
            <button
              type="button"
              onClick={() => setAnalogies([])}
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
                {analogies.length > 0 ? "استخرج تاني" : "استخرج التشبيهات"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-3 sm:p-5">
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
                title="مش قادرين نستخرج التشبيهات"
                description={error}
                hint="التشبيهات بتحتاج الدكتور يقارن بشيء مألوف"
                onRetry={() => {
                  setError(null);
                  handleGenerate();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {analogies.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-bold text-foreground">
              {canGenerate
                ? "اضغط (استخرج التشبيهات)"
                : "سجّل 50 حرف على الأقل الأول"}
            </p>
            <p className="max-w-md text-xs text-muted-foreground">
              {canGenerate
                ? 'هنلقط التشبيهات زي: "الكاش زي المكتب"، "API زي الويتر"...'
                : "التشبيهات بتظهر لما الدكتور يقول زي/مثل/كأنه"}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              بندوّر على تشبيهات في المحاضرة...
            </p>
          </div>
        )}

        {analogies.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {analogies.map((anl, idx) => (
              <AnalogyCard key={anl.id} analogy={anl} index={idx} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function AnalogyCard({ analogy, index }: { analogy: AnalogyMap; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="overflow-hidden rounded-2xl border border-border bg-background"
    >
      {/* Title bar */}
      <div className="border-b border-border bg-linear-to-l from-violet-500/8 to-sky-500/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
            {index + 1}
          </span>
          <h3 className="text-sm font-bold">{analogy.title}</h3>
        </div>
        {analogy.quote && (
          <div className="mt-2 mr-8 flex items-start gap-1.5 rounded-md bg-primary/5 px-2.5 py-1.5 text-[10px] leading-snug text-primary/90">
            <Quote className="mt-0.5 h-2.5 w-2.5 shrink-0" />
            <span className="italic">&ldquo;{analogy.quote}&rdquo;</span>
          </div>
        )}
      </div>

      {/* Two columns visualization */}
      <div className="grid grid-cols-2 gap-4 border-b border-border p-5">
        {/* Source (فamiliar) */}
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-sky-500/30 bg-sky-500/5 p-4">
          <span className="text-4xl" role="img" aria-label={analogy.sourceConcept}>
            {analogy.sourceEmoji}
          </span>
          <p className="text-center text-sm font-bold text-sky-600 dark:text-sky-400">
            {analogy.sourceConcept}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            الشيء المألوف
          </p>
        </div>

        {/* Target (concept) */}
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-solid border-violet-500/40 bg-violet-500/10 p-4">
          <span className="text-4xl" role="img" aria-label={analogy.targetConcept}>
            {analogy.targetEmoji}
          </span>
          <p className="text-center text-sm font-bold text-violet-600 dark:text-violet-400">
            {analogy.targetConcept}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            المفهوم التقني
          </p>
        </div>
      </div>

      {/* Mappings */}
      <div className="space-y-2 p-5">
        <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Link2 className="h-3 w-3" />
          التطابق بين الجزئين
        </p>
        {analogy.mappings.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3"
          >
            <span className="flex-1 rounded-lg bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
              {m.sourceTerm}
            </span>
            <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 rounded-lg bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-600 dark:text-violet-400">
              {m.targetTerm}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Where analogy breaks */}
      {analogy.breaks.length > 0 && (
        <div className="border-t border-amber-500/20 bg-amber-500/5 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            التشبيه بينهار هنا
          </p>
          <ul className="space-y-1">
            {analogy.breaks.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
              >
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}