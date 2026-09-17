"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookMarked,
  Languages,
  Lightbulb,
  Loader2,
  PlayCircle,
  Sparkles,
  Volume2,
  Wrench,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CopyButton from "@/components/ui/CopyButton";
import type { Translation, TranslationType } from "@/app/api/translate/route";

interface TranslationPanelProps {
  transcript: string;
}

const TYPE_META: Record<
  TranslationType,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  technical: {
    label: "تقني",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: Wrench,
  },
  concept: {
    label: "مفهوم",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: Lightbulb,
  },
  tool: {
    label: "أداة",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: Wrench,
  },
  framework: {
    label: "إطار عمل",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    icon: BookMarked,
  },
  general: {
    label: "عام",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    icon: BookMarked,
  },
};

export default function TranslationPanel({ transcript }: TranslationPanelProps) {
  const [translations, setTranslations] = React.useState<Translation[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canGenerate = transcript.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });

      const data: { translations?: Translation[]; error?: string } =
        await response.json();

      if (!response.ok) {
        setError(data.error || "فشل الترجمة.");
        return;
      }

      setTranslations(data.translations ?? []);
    } catch {
      setError("تعذّر الاتصال بخدمة الترجمة.");
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    if (typeof window === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const fullText = translations
    .map((t) => `${t.original} → ${t.translated}`)
    .join("\n");

  return (
    <Card
      dir="rtl"
      className="glass w-full border-border bg-transparent shadow-sm"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Languages className="h-5 w-5 text-primary" />
          الترجمة الفورية
        </CardTitle>

        <div className="flex items-center gap-2">
          {translations.length > 0 && <CopyButton text={fullText} size="sm" />}
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
                جارٍ الترجمة...
              </>
            ) : (
              <>
                <PlayCircle className="h-3.5 w-3.5" />
                {translations.length > 0 ? "ترجم تاني" : "ابدأ الترجمة"}
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

        {translations.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/20 py-16 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {canGenerate
                ? "اضغط على (ابدأ الترجمة) عشان نترجم المصطلحات الإنجليزي"
                : "سجّل الشرح الأول من تاب (الكلام المباشر)..."}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              جارٍ ترجمة المصطلحات...
            </p>
          </div>
        )}

        {translations.length > 0 && !loading && (
          <div className="space-y-3">
            {translations.map((tr, i) => {
              const meta = TYPE_META[tr.type] || TYPE_META.general;
              const Icon = meta.icon;

              return (
                <motion.div
                  key={`${tr.original}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={`rounded-xl border ${meta.border} ${meta.bg} p-4 transition-transform hover:-translate-y-0.5`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span
                      className={`flex items-center gap-1.5 rounded-full border ${meta.border} ${meta.bg} ${meta.color} px-2.5 py-0.5 text-[10px] font-bold`}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => speak(tr.original)}
                      aria-label="اسمع النطق"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      dir="ltr"
                      className="rounded-lg bg-background px-2 py-1 font-mono text-sm font-bold text-foreground"
                    >
                      {tr.original}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-base font-bold text-primary">
                      {tr.translated}
                    </span>
                  </div>

                  {tr.pronunciation && (
                    <p className="mb-1 text-xs text-muted-foreground">
                      النطق: <span className="font-medium">{tr.pronunciation}</span>
                    </p>
                  )}

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {tr.context}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}