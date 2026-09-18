"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HelpCircle,
  Loader2,
  PlayCircle,
  MessageCircle,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ClassroomQuestion } from "@/lib/ai-types";

interface ClassroomQuestionsPanelProps {
  transcript: string;
  questions: ClassroomQuestion[];
  onQuestionsChange: (questions: ClassroomQuestion[]) => void;
}

const CONFIDENCE_META: Record<
  ClassroomQuestion["confidence"],
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  high: {
    label: "ثقة عالية",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    icon: ShieldCheck,
  },
  medium: {
    label: "ثقة متوسطة",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    icon: Info,
  },
  low: {
    label: "تخمين",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    icon: AlertTriangle,
  },
};

export default function ClassroomQuestionsPanel({
  transcript,
  questions,
  onQuestionsChange,
}: ClassroomQuestionsPanelProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canScan = transcript.trim().length > 0;

  const handleScan = async () => {
    if (!canScan) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/classroom-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });

      const data: { questions?: ClassroomQuestion[]; error?: string } =
        await res.json();

      if (!res.ok) {
        setError(data.error || "فشل الاستنتاج.");
        return;
      }

      const newQ = data.questions ?? [];
      const merged = [...questions];
      const existing = new Set(
        questions.map((q) => q.inferredQuestion.toLowerCase()),
      );
      newQ.forEach((q) => {
        if (!existing.has(q.inferredQuestion.toLowerCase())) {
          merged.push(q);
        }
      });
      onQuestionsChange(merged);
    } catch {
      setError("تعذّر الاتصال بالخدمة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <HelpCircle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">أسئلة القاعة</h2>
            <p className="text-[10px] text-muted-foreground">
              {questions.length > 0
                ? `${questions.length} سؤال مستنتج`
                : "استنتج الأسئلة من ردود الدكتور"}
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleScan}
          disabled={!canScan || loading}
          className="gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 text-xs font-bold text-white shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              جارٍ الاستنتاج...
            </>
          ) : (
            <>
              <PlayCircle className="h-3.5 w-3.5" />
              {questions.length > 0 ? "استنتج تاني" : "استنتج الأسئلة"}
            </>
          )}
        </Button>
      </div>

      <div className="p-5">
        {/* Info banner */}
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="text-[11px] leading-relaxed text-muted-foreground">
            <strong className="text-foreground">إزاي الميزة دي بتشتغل؟</strong>{" "}
            الطلاب البعيدين أسئلتهم مش بتتسمع في المايك. لكن الدكتور بيرد عليهم.
            الميزة دي بتاخد رد الدكتور، وتستنتج السؤال الأصلي تلقائياً.
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {questions.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-bold">في انتظار الاستنتاج</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {canScan
                ? "اضغط (استنتج الأسئلة) عشان نلقط أسئلة القاعة من ردود الدكتور"
                : "سجّل الشرح الأول عشان نبدأ"}
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-muted/40"
              />
            ))}
          </div>
        )}

        {questions.length > 0 && !loading && (
          <ul className="space-y-4">
            {questions.map((q, i) => {
              const conf = CONFIDENCE_META[q.confidence];
              const ConfIcon = conf.icon;
              return (
                <motion.li
                  key={q.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="overflow-hidden rounded-xl border border-border bg-muted/20"
                >
                  {/* Question row */}
                  <div className="border-b border-border/60 bg-primary/5 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        ❓ سؤال محتمل من القاعة
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold",
                          conf.bg,
                          conf.color,
                        )}
                      >
                        <ConfIcon className="h-2.5 w-2.5" />
                        {conf.label}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {q.inferredQuestion}
                    </p>
                  </div>

                  {/* Answer row */}
                  <div className="flex gap-3 p-4">
                    <ArrowLeft className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <div className="flex-1">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        ✅ إجابة الدكتور
                      </span>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {q.answer}
                      </p>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
