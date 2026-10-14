"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Loader2,
  PlayCircle,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import InfographicSectionRenderer from "@/components/InfographicSectionRenderer";

interface InfographicPanelProps {
  transcript: string;
}

interface Section {
  id: string;
  title: string;
  type: string;
  flowchart?: { mermaidCode: string; title: string; description: string };
  chart?: {
    type: string;
    title: string;
    labels: string[];
    datasets: Array<{ label: string; data: number[] }>;
  };
  table?: { title: string; headers: string[]; rows: string[][] };
}

interface InfographicData {
  title: string;
  summary: string;
  sections: Section[];
}

export default function InfographicPanel({ transcript }: InfographicPanelProps) {
  const [data, setData] = React.useState<InfographicData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canGenerate = transcript.trim().length > 100 && !loading;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/visualize-infographic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
      const result: InfographicData & { error?: string } = await res.json();
      if (!res.ok) {
        setError(result.error || "فشل التوليد.");
        return;
      }
      setData(result);
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-primary to-accent-1">
            <ImageIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">الملخص البصري (Infographic)</h2>
            <p className="text-[10px] text-muted-foreground">
              {data
                ? `${data.sections.length} قسم مرئي`
                : "رسوم بيانية ومخططات من المحاضرة"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data && (
            <button
              type="button"
              onClick={() => setData(null)}
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
                جارٍ التحليل...
              </>
            ) : (
              <>
                <PlayCircle className="h-3.5 w-3.5" />
                {data ? "ولّد تاني" : "ولّد الإنفوجرافيك"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-5">
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

        {!data && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {canGenerate
                ? "اضغط (ولّد الإنفوجرافيك) لتحويل المحاضرة لرسوم بصرية"
                : "سجّل 100 حرف على الأقل الأول"}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              جارٍ تصميم الإنفوجرافيك...
            </p>
          </div>
        )}

        {data && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Title card */}
            <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary/5 to-accent-2/5 p-5">
              <h3 className="text-lg font-bold text-foreground">{data.title}</h3>
              {data.summary && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.summary}
                </p>
              )}
            </div>

            {/* Sections */}
            {data.sections.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  النص ده مش فيه محتوى بصري كافي
                </p>
              </div>
            ) : (
              data.sections.map((sec, i) => (
                <motion.div
                  key={sec.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-xl border border-border bg-background p-5"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <h4 className="text-sm font-bold text-foreground">
                      {sec.title}
                    </h4>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                      {sec.type}
                    </span>
                  </div>
                  <InfographicSectionRenderer section={sec} />
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}