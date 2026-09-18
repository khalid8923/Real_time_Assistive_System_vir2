"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Sparkles,
  BookOpen,
  Brain,
  PlayCircle,
  Waves,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { progress } from "@/components/TopProgressBar";
import type { RefinedChunk } from "@/hooks/useSpeechTranscription";
import SearchInTranscript from "@/components/SearchInTranscript";
import ExportButton from "@/components/ExportButton";
import HighlightedText from "@/components/HighlightedText";

export interface AnalysisData {
  topic: string;
  children: string[];
  terms: { term: string; definition: string }[];
}

interface SpeechInputProps {
  currentTranscript: string;
  refinedChunks: RefinedChunk[];
  isListening: boolean;
  onToggleMic: () => void;
  onAnalyze: (data: AnalysisData) => void;
  error: string | null;
}

export default function SpeechInput({
  currentTranscript,
  refinedChunks,
  isListening,
  onToggleMic,
  onAnalyze,
  error,
}: SpeechInputProps) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showHighlight, setShowHighlight] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const latest: RefinedChunk | undefined =
    refinedChunks[refinedChunks.length - 1];

  const displayTopic = analysis?.topic || latest?.topic;
  const displayChildren = analysis?.children || latest?.children || [];
  const displayTerms = analysis?.terms || latest?.terms || [];

  const wordCount = currentTranscript.split(/\s+/).filter(Boolean).length;
  const canAnalyze = currentTranscript.trim().length > 0 && !isAnalyzing;
  const hasContent = !!displayTopic;

  useEffect(() => {
    if (currentTranscript.length === 0) {
      setAnalysis(null);
    }
  }, [currentTranscript]);

  const handleAnalyze = async () => {
    const text = currentTranscript.trim();
    if (text.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await progress.track(
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        })
      );

      const data: AnalysisData & { error?: string } = await response.json();

      if (!response.ok) {
        setAnalysisError(data.error || "فشل تحليل النص.");
        return;
      }

      setAnalysis(data);
      if (data.topic && data.topic.trim() !== "") {
        onAnalyze(data);
      }
    } catch {
      setAnalysisError("تعذّر الاتصال بخدمة التحليل.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearAnalysis = () => {
    setAnalysis(null);
    setAnalysisError(null);
  };

  return (
    <div className="space-y-4">
      {/* ==================== LIVE TRANSCRIPT ==================== */}
      <div className="rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Waves className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                النص المباشر
              </h2>
              <p className="text-[10px] text-muted-foreground">
                {isListening
                  ? "بيستمع الآن..."
                  : wordCount > 0
                  ? `${wordCount} كلمة`
                  : "في انتظار التشغيل"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isListening && (
              <div className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                </span>
                <span className="text-[10px] font-bold text-rose-500">
                  يسجّل
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowHighlight((v) => !v)}
              aria-label={showHighlight ? "إخفاء التمييز" : "إظهار التمييز"}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition-colors",
                showHighlight
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-primary"
              )}
            >
              {showHighlight ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
              تمييز
            </button>

            <SearchInTranscript
              text={currentTranscript}
              containerRef={textareaRef}
            />

            <ExportButton
              transcript={currentTranscript}
              topic={displayTopic}
              terms={displayTerms}
            />
          </div>
        </div>

        <div className="p-4">
          {showHighlight ? (
            <div
              className="min-h-44 w-full overflow-y-auto rounded-xl border border-border bg-muted/30 p-4"
              style={{ maxHeight: "280px" }}
            >
              {currentTranscript ? (
                <HighlightedText text={currentTranscript} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  استمع لشرح الدكتور هنا...
                </p>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={currentTranscript}
              readOnly
              placeholder="استمع لشرح الدكتور هنا..."
              rows={7}
              dir="rtl"
              className="w-full resize-none rounded-xl border border-border bg-muted/30 p-4 text-right text-sm leading-relaxed placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              style={{ maxHeight: "280px" }}
            />
          )}
        </div>
      </div>

      {/* ==================== EXPLANATION (AI) ==================== */}
      <div className="rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                الشرح الذكي
              </h2>
              <p className="text-[10px] text-muted-foreground">
                {hasContent ? "التحليل جاهز" : "في انتظار التحليل"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ✅ زرار الحذف */}
            {hasContent && (
              <button
                type="button"
                onClick={handleClearAnalysis}
                aria-label="حذف الشرح"
                title="حذف الشرح الحالي"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 text-destructive transition-colors hover:bg-destructive/15"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 text-xs font-bold text-white shadow-md"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  جارٍ التحليل...
                </>
              ) : (
                <>
                  <PlayCircle className="h-3.5 w-3.5" />
                  ابدأ الشرح
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="p-4">
          <AnimatePresence>
            {analysisError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
              >
                {analysisError}
              </motion.p>
            )}
          </AnimatePresence>

          {!hasContent && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {currentTranscript.trim().length > 0
                  ? "اضغط (ابدأ الشرح) عشان نحلل النص"
                  : "سجّل الشرح الأول من الميكروفون"}
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="space-y-4">
              <div className="h-20 animate-pulse rounded-xl bg-muted/40" />
              <div className="h-16 animate-pulse rounded-xl bg-muted/40" />
              <div className="h-16 animate-pulse rounded-xl bg-muted/40" />
            </div>
          )}

          {hasContent && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Topic */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="mb-1 flex items-center gap-1.5">
                  <PlayCircle className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    الموضوع
                  </span>
                </div>
                <p className="text-base font-bold text-foreground">
                  {displayTopic}
                </p>
              </div>

              {/* Children */}
              {displayChildren.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-accent-2" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent-2">
                      الفروع
                    </span>
                  </div>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {displayChildren.map((child: string, i: number) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-2/15 text-[10px] font-bold text-accent-2">
                          {i + 1}
                        </span>
                        <span className="text-xs">{child}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Terms */}
              {displayTerms.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                      المصطلحات
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {displayTerms.map(
                      (
                        t: { term: string; definition: string },
                        i: number
                      ) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="rounded-lg border border-border bg-muted/20 px-3 py-2"
                        >
                          <p className="text-xs leading-relaxed">
                            <span className="font-bold text-foreground">
                              {t.term}:
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {t.definition}
                            </span>
                          </p>
                        </motion.li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* ==================== ERROR ==================== */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== CONTROLS ==================== */}
      <div className="sticky bottom-4 z-30 flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-xl sm:flex-row-reverse sm:justify-between">
        <Button
          type="button"
          variant={isListening ? "destructive" : "default"}
          onClick={onToggleMic}
          className={cn(
            "relative h-12 w-full gap-2 overflow-hidden text-sm font-bold sm:w-auto sm:px-6",
            !isListening &&
              "bg-linear-to-l from-primary to-accent-1 text-white shadow-md hover:shadow-lg"
          )}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              إيقاف الميكروفون
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              تشغيل الميكروفون
            </>
          )}
          {isListening && (
            <span className="absolute inset-0 -z-10 animate-pulse bg-destructive/20" />
          )}
        </Button>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold">
            {refinedChunks.length} مقطع
          </span>
        </div>
      </div>
    </div>
  );
}