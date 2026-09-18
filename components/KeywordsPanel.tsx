"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  BookMarked,
  Briefcase,
  Hash,
  Lightbulb,
  Loader2,
  MapPin,
  PlayCircle,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Keyword, KeywordCategory } from "@/lib/ai-types";

interface KeywordsPanelProps {
  transcript: string;
}

interface CategoryMeta {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}

const CATEGORY_META: Record<KeywordCategory, CategoryMeta> = {
  term: {
    label: "مصطلح",
    icon: BookMarked,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
  },
  concept: {
    label: "مفهوم",
    icon: Lightbulb,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  person: {
    label: "شخص",
    icon: User,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
  },
  place: {
    label: "مكان",
    icon: MapPin,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
  number: {
    label: "رقم",
    icon: Hash,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },
  tool: {
    label: "أداة",
    icon: Briefcase,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
};

const IMPORTANCE_LABELS: Record<number, string> = {
  1: "منخفضة",
  2: "عادية",
  3: "متوسطة",
  4: "عالية",
  5: "مرتفعة جداً",
};

export default function KeywordsPanel({ transcript }: KeywordsPanelProps) {
  const [keywords, setKeywords] = React.useState<Keyword[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canGenerate = transcript.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });

      const data: { keywords?: Keyword[]; error?: string } =
        await response.json();

      if (!response.ok) {
        setError(data.error || "فشل استخراج الكلمات المهمة.");
        return;
      }

      setKeywords(data.keywords ?? []);
    } catch {
      setError("تعذّر الاتصال بخدمة التحليل.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <AlertTriangle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              الكلمات المهمة
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {keywords.length > 0
                ? `${keywords.length} كلمة`
                : "اضغط للاستخراج"}
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleGenerate}
          disabled={!canGenerate || loading}
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
              {keywords.length > 0 ? "استخرج تاني" : "استخرج الكلمات"}
            </>
          )}
        </Button>
      </div>

      <div className="p-5">
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

        {keywords.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {canGenerate
                ? "اضغط (استخرج الكلمات) عشان نطلعلك الكلمات المهمة"
                : "سجّل الشرح الأول من تاب الكلام المباشر..."}
            </p>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl border border-border bg-muted/30"
              />
            ))}
          </div>
        )}

        {keywords.length > 0 && !loading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {keywords.map((kw, i) => {
              const meta = CATEGORY_META[kw.category] || CATEGORY_META.term;
              const Icon = meta.icon;
              const stars = Math.min(5, Math.max(1, Math.round(kw.importance)));

              return (
                <motion.div
                  key={`${kw.word}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl border p-4 transition-transform hover:-translate-y-0.5",
                    meta.border,
                    meta.bg
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        meta.bg,
                        meta.color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-foreground">
                        {kw.word}
                      </p>
                      <p
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          meta.color
                        )}
                      >
                        {meta.label}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {kw.context}
                  </p>

                  <div className="mt-auto flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">
                      {IMPORTANCE_LABELS[stars] ?? "متوسطة"}
                    </span>
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span
                          key={idx}
                          className={
                            idx < stars
                              ? "text-amber-500"
                              : "text-muted-foreground/30"
                          }
                        >
                          ★
                        </span>
                      ))}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}