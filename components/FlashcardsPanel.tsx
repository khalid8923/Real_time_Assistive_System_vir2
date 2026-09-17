"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  PlayCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
  Flashcard,
  FlashcardDifficulty,
} from "@/app/api/flashcards/route";

interface FlashcardsPanelProps {
  transcript: string;
}

const DIFFICULTY_META: Record<
  FlashcardDifficulty,
  { label: string; color: string; bg: string }
> = {
  easy: {
    label: "سهل",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
  },
  medium: {
    label: "متوسط",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
  },
  hard: {
    label: "صعب",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/30",
  },
};

export default function FlashcardsPanel({ transcript }: FlashcardsPanelProps) {
  const [cards, setCards] = React.useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canGenerate = transcript.trim().length > 0;
  const currentCard = cards[currentIndex];
  const total = cards.length;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setLoading(true);
    setError(null);
    setFlipped(false);
    setCurrentIndex(0);

    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });

      const data: { cards?: Flashcard[]; error?: string } =
        await response.json();

      if (!response.ok) {
        setError(data.error || "فشل توليد الكروت.");
        return;
      }

      setCards(data.cards ?? []);
    } catch {
      setError("تعذّر الاتصال بخدمة التوليد.");
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (total === 0) return;
    setFlipped(false);
    setCurrentIndex((i) => (i + 1) % total);
  };

  const prev = () => {
    if (total === 0) return;
    setFlipped(false);
    setCurrentIndex((i) => (i - 1 + total) % total);
  };

  const reset = () => {
    setCurrentIndex(0);
    setFlipped(false);
  };

  return (
    <Card
      dir="rtl"
      className="glass w-full border-border bg-transparent shadow-sm"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Layers className="h-5 w-5 text-primary" />
          كروت المراجعة
        </CardTitle>

        <div className="flex items-center gap-2">
          {total > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={reset}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              إعادة
            </Button>
          )}
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
                جارٍ التوليد...
              </>
            ) : (
              <>
                <PlayCircle className="h-3.5 w-3.5" />
                {total > 0 ? "ولّد تاني" : "ولّد الكروت"}
              </>
            )}
          </Button>
        </div>
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

        {total === 0 && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/20 py-16 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {canGenerate
                ? "اضغط على (ولّد الكروت) عشان نطلعلك كروت مراجعة"
                : "سجّل الشرح الأول من تاب (الكلام المباشر)..."}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              جارٍ توليد الكروت من المحاضرة...
            </p>
          </div>
        )}

        {currentCard && !loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>
                كرت {currentIndex + 1} من {total}
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 font-bold ${DIFFICULTY_META[currentCard.difficulty].bg} ${DIFFICULTY_META[currentCard.difficulty].color}`}
              >
                {DIFFICULTY_META[currentCard.difficulty].label}
              </span>
            </div>

            <div
              className="cursor-pointer select-none"
              onClick={() => setFlipped((f) => !f)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setFlipped((f) => !f);
                }
              }}
            >
              <motion.div
                key={currentIndex + (flipped ? "-back" : "-front")}
                initial={{ opacity: 0, rotateY: -8 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.35 }}
                className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-border bg-muted/20 p-8 text-center transition-colors hover:border-primary/40"
              >
                {!flipped ? (
                  <>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-primary">
                      السؤال
                    </p>
                    <p className="text-lg font-semibold leading-relaxed">
                      {currentCard.question}
                    </p>
                    <p className="mt-6 text-xs text-muted-foreground">
                      اضغط لعرض الإجابة
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      الإجابة
                    </p>
                    <p className="text-base leading-relaxed">
                      {currentCard.answer}
                    </p>
                    <p className="mt-6 text-xs text-muted-foreground">
                      اضغط للرجوع للسؤال
                    </p>
                  </>
                )}
              </motion.div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={prev}
                className="gap-1.5"
              >
                <ChevronRight className="h-4 w-4" />
                السابق
              </Button>

              <div className="flex items-center gap-1">
                {cards.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(i);
                      setFlipped(false);
                    }}
                    aria-label={`كرت ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentIndex
                        ? "w-6 bg-primary"
                        : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={next}
                className="gap-1.5"
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
