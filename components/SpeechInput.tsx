"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Sparkles, BookOpen, Brain, Loader2, PlayCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface AnalysisData {
  topic: string;
  children: string[];
  terms: { term: string; definition: string }[];
}

interface SpeechInputProps {
  currentTranscript: string;
  isListening: boolean;
  onToggleMic: () => void;
  onAnalyze: (data: AnalysisData) => void;
  error: string | null;
}

export default function SpeechInput({
  currentTranscript,
  isListening,
  onToggleMic,
  onAnalyze,
  error,
}: SpeechInputProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisData | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    const text = currentTranscript.trim();
    if (text.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data: AnalysisData & { error?: string } = await response.json();

      if (!response.ok) {
        setAnalysisError(data.error || "فشل تحليل النص.");
        return;
      }

      setLatestAnalysis(data);
      onAnalyze(data);
    } catch {
      setAnalysisError("تعذّر الاتصال بخدمة التحليل.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentTranscript, onAnalyze]);

  const combinedError = error || analysisError;
  const canAnalyze = currentTranscript.trim().length > 0 && !isAnalyzing;

  return (
    <Card
      dir="rtl"
      className="glass w-full border-border bg-transparent shadow-sm"
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Sparkles className="h-5 w-5 text-primary" />
          إدخال الشرح الصوتي
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground">النص المباشر</h3>
          <div className="relative">
            <textarea
              value={currentTranscript}
              readOnly
              placeholder="استمع لشرح الدكتور هنا..."
              rows={8}
              dir="rtl"
              className="w-full resize-none overflow-y-auto rounded-xl border border-border bg-muted/30 p-4 text-right text-sm leading-relaxed placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              style={{ maxHeight: "300px" }}
            />
            {isListening && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-[#E1432C]/10 px-2.5 py-1"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E1432C] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E1432C]" />
                </span>
                <span className="text-[10px] font-bold text-[#E1432C]">
                  يسجّل
                </span>
              </motion.div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Brain className="h-4 w-4 text-primary" />
              الشرح
            </h3>
            <Button
              type="button"
              size="sm"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="gap-2 bg-linear-to-l from-primary to-accent-1 text-xs font-bold"
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
          <div
            className="overflow-y-auto rounded-xl border border-border bg-muted/20 p-4 text-sm leading-relaxed"
            style={{ maxHeight: "300px", minHeight: "140px" }}
          >
            {!latestAnalysis || !latestAnalysis.topic ? (
              <p className="text-center text-muted-foreground">
                {isAnalyzing
                  ? "جارٍ تحليل المحاضرة..."
                  : "اضغط على زر (ابدأ الشرح) لما يكون فيه نص مسجل..."}
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
                    الموضوع
                  </h4>
                  <p className="font-semibold">{latestAnalysis.topic}</p>
                </div>

                {latestAnalysis.children.length > 0 && (
                  <div>
                    <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
                      الفروع
                    </h4>
                    <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                      {latestAnalysis.children.map((child, i) => (
                        <li key={i}>{child}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestAnalysis.terms.length > 0 && (
                  <div>
                    <h4 className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary">
                      <BookOpen className="h-3 w-3" />
                      المصطلحات
                    </h4>
                    <ul className="space-y-2">
                      {latestAnalysis.terms.map((t, i) => (
                        <li key={i} className="text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {t.term}:
                          </span>{" "}
                          {t.definition}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {combinedError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
            >
              {combinedError}
            </motion.p>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-border bg-muted/20 sm:flex-row-reverse sm:justify-between">
        <Button
          type="button"
          variant={isListening ? "destructive" : "outline"}
          onClick={onToggleMic}
          className="relative w-full gap-2 overflow-hidden sm:w-auto"
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

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold">
            {currentTranscript.split(/\s+/).filter(Boolean).length} كلمة
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}