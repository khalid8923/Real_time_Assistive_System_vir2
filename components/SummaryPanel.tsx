"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Loader2,
  PlayCircle,
  Sparkles,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CopyButton from "@/components/ui/CopyButton";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import { progress } from "@/components/TopProgressBar";

export interface SummaryData {
  title: string;
  overview: string;
  keyPoints: string[];
  conclusion: string;
}

interface SummaryPanelProps {
  transcript: string;
}

export default function SummaryPanel({ transcript }: SummaryPanelProps) {
  const [summary, setSummary] = React.useState<SummaryData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canGenerate = transcript.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setLoading(true);
    setError(null);

    try {
      const response = await progress.track(
        fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: transcript }),
        })
      );

      const data: SummaryData & { error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error || "فشل تلخيص المحاضرة.");
        return;
      }

      setSummary(data);
    } catch {
      setError("تعذّر الاتصال بخدمة التلخيص.");
    } finally {
      setLoading(false);
    }
  };

  const fullText = summary
    ? `${summary.title}\n\n${summary.overview}\n\nالنقاط الرئيسية:\n${summary.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\nالخلاصة:\n${summary.conclusion}`
    : "";

  return (
    <Card
      dir="rtl"
      className="glass w-full border-border bg-transparent shadow-sm"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <FileText className="h-5 w-5 text-primary" />
          ملخص المحاضرة
        </CardTitle>

        <div className="flex items-center gap-2">
          {summary && <CopyButton text={fullText} size="sm" />}
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
                جارٍ التلخيص...
              </>
            ) : (
              <>
                <PlayCircle className="h-3.5 w-3.5" />
                {summary ? "لخّص تاني" : "ابدأ التلخيص"}
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

        {!summary && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/20 py-16 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {canGenerate
                ? "اضغط على (ابدأ التلخيص) عشان نجيبلك ملخص المحاضرة"
                : "سجّل الشرح الأول من تاب (الكلام المباشر)..."}
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <SkeletonList count={4} />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        )}

        {summary && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <h3 className="mb-2 text-xl font-bold text-foreground">
                {summary.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {summary.overview}
              </p>
            </div>

            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                النقاط الرئيسية
              </h4>
              <ul className="space-y-2.5">
                {summary.keyPoints.map((point, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                    className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-3"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed">{point}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                الخلاصة
              </h4>
              <p className="text-sm leading-relaxed">{summary.conclusion}</p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}