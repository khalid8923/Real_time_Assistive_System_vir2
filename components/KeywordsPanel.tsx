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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Keyword, KeywordCategory } from "@/app/api/keywords/route";

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
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
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
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
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
    <Card
      dir="rtl"
      className="glass w-full border-border bg-transparent shadow-sm"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <AlertTriangle className="h-5 w-5 text-primary" />
          الكلمات المهمة
        </CardTitle>

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
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {keywords.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/20 py-16 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {canGenerate
                ? "اضغط على (استخرج الكلمات) عشان نطلعلك الكلمات المهمة"
                : "سجّل الشرح الأول من تاب (الكلام المباشر)..."}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              جارٍ تحليل المحاضرة واستخراج الكلمات...
            </p>
          </div>
        )}

        {keywords.length > 0 && !loading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {keywords.map((kw, i) => {
              const meta = CATEGORY_META[kw.category] || CATEGORY_META.term;
              const Icon = meta.icon;
              const stars = Math.min(5, Math.max(1, Math.round(kw.importance)));

              return (
                <motion.div
                  key={`${kw.word}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={`flex flex-col gap-2 rounded-xl border ${meta.border} ${meta.bg} p-4 transition-transform hover:-translate-y-0.5`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-foreground">
                          {kw.word}
                        </p>
                        <p
                          className={`text-[10px] font-semibold uppercase tracking-wider ${meta.color}`}
                        >
                          {meta.label}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {kw.context}
                  </p>

                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-muted-foreground">
                      الأهمية: {IMPORTANCE_LABELS[stars] ?? "متوسطة"}
                    </span>
                    <span className="mr-auto flex items-center gap-0.5">
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
      </CardContent>
    </Card>
  );
}
