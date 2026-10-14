"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Layers,
  Loader2,
  PlayCircle,
  Trash2,
  Sparkles,
  ChevronDown,
  ArrowDown,
  ArrowLeft,
  Quote,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/ErrorState";
import { cn } from "@/lib/utils";
import type { ExplodedSystem } from "@/lib/ai-types";

interface SystemExplorerPanelProps {
  transcript: string;
}

export default function SystemExplorerPanel({ transcript }: SystemExplorerPanelProps) {
  const [systems, setSystems] = React.useState<ExplodedSystem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canGenerate = transcript.trim().length >= 50 && !loading;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/visualize-system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
      const data: { systems?: ExplodedSystem[]; error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل استخراج الأنظمة.");
        return;
      }
      setSystems(data.systems ?? []);
    } catch {
      setError("تعذّر الاتصال بالخدمة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-emerald-500">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">المنظر المفكّك للأنظمة</h2>
            <p className="text-[10px] text-muted-foreground">
              {systems.length > 0
                ? `${systems.length} نظام — جرّب الطبقات`
                : "لفهم الأنظمة ذات الطبقات"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {systems.length > 0 && (
            <button
              type="button"
              onClick={() => setSystems([])}
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
                {systems.length > 0 ? "استخرج تاني" : "استخرج الأنظمة"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-5">
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
                title="مش قادرين نستخرج الأنظمة"
                description={error}
                hint="الأنظمة بتظهر لما الدكتور يشرح طبقات (OSI, TCP/IP...)"
                onRetry={() => {
                  setError(null);
                  handleGenerate();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {systems.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-bold text-foreground">
              {canGenerate
                ? "اضغط (استخرج الأنظمة)"
                : "سجّل 50 حرف على الأقل الأول"}
            </p>
            <p className="max-w-md text-xs text-muted-foreground">
              {canGenerate
                ? "هنلقط الأنظمة ذات الطبقات: OSI، TCP/IP، Compiler، CPU Pipeline..."
                : "الأنظمة بتظهر لما الدكتور يشرح حاجة مكوّنة من طبقات"}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              بندوّر على أنظمة في المحاضرة...
            </p>
          </div>
        )}

        {systems.length > 0 && !loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {systems.map((sys, idx) => (
              <SystemCard key={sys.id} system={sys} index={idx} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SystemCard({ system, index }: { system: ExplodedSystem; index: number }) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [activeStep, setActiveStep] = React.useState<number>(-1);
  const [playing, setPlaying] = React.useState(false);

  // Auto-play scenario
  React.useEffect(() => {
    if (!playing || system.scenario.length === 0) return;
    const interval = setInterval(() => {
      setActiveStep((s) => {
        if (s >= system.scenario.length - 1) {
          setPlaying(false);
          return -1;
        }
        return s + 1;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [playing, system.scenario.length]);

  const activeLayerIds = React.useMemo(() => {
    if (activeStep < 0 || !system.scenario[activeStep]) return new Set<string>();
    const step = system.scenario[activeStep];
    return new Set([step.from, step.to]);
  }, [activeStep, system.scenario]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="overflow-hidden rounded-2xl border border-border bg-background"
    >
      {/* Title */}
      <div className="border-b border-border bg-linear-to-l from-indigo-500/8 to-emerald-500/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
            {index + 1}
          </span>
          <h3 className="text-sm font-bold">{system.title}</h3>
        </div>
        {system.subtitle && (
          <p className="mt-1 pr-8 text-[11px] text-muted-foreground">{system.subtitle}</p>
        )}
        {system.sourceQuote && (
          <div className="mt-2 mr-8 flex items-start gap-1.5 rounded-md bg-primary/5 px-2.5 py-1.5 text-[10px] leading-snug text-primary/90">
            <Quote className="mt-0.5 h-2.5 w-2.5 shrink-0" />
            <span className="italic">&ldquo;{system.sourceQuote}&rdquo;</span>
          </div>
        )}
      </div>

      {/* Scenario player */}
      {system.scenario.length > 0 && (
        <div className="border-b border-border bg-indigo-500/5 px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (activeStep < 0 || activeStep >= system.scenario.length - 1) {
                    setActiveStep(0);
                    setPlaying(true);
                  } else {
                    setPlaying((p) => !p);
                  }
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white transition-transform hover:scale-105"
                aria-label={playing ? "إيقاف" : "تشغيل"}
              >
                {playing ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveStep(-1);
                  setPlaying(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted"
                aria-label="إعادة"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <div>
                <p className="text-[11px] font-bold text-foreground">
                  {activeStep >= 0
                    ? `خطوة ${activeStep + 1} من ${system.scenario.length}`
                    : "شغّل السيناريو"}
                </p>
                {activeStep >= 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    {system.scenario[activeStep].label}
                  </p>
                )}
              </div>
            </div>
            <span className="rounded-full border border-indigo-500/30 bg-background px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              {system.scenario.length} خطوات
            </span>
          </div>
        </div>
      )}

      {/* Layers stack */}
      <div className="space-y-2 p-5">
        {system.layers.map((layer, li) => {
          const expanded = expandedId === layer.id;
          const isActive = activeLayerIds.has(layer.id);
          return (
            <React.Fragment key={layer.id}>
              <motion.div
                layout
                className={cn(
                  "rounded-xl border-2 transition-all cursor-pointer",
                  isActive
                    ? "border-indigo-500 shadow-lg shadow-indigo-500/20 scale-[1.02]"
                    : expanded
                    ? "border-primary/50 shadow-md"
                    : "border-border hover:border-primary/30"
                )}
                style={{
                  background: `linear-gradient(135deg, rgba(99,102,241,${0.05 + li * 0.03}) 0%, rgba(16,185,129,${0.03 + li * 0.02}) 100%)`
                }}
                onClick={() => setExpandedId(expanded ? null : layer.id)}
              >
                <div className="flex items-center gap-3 p-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background font-mono text-[11px] font-bold text-primary shadow-sm">
                    L{li + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground" dir="ltr">
                      {layer.name}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                      {layer.role}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      expanded && "rotate-180"
                    )}
                  />
                </div>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-border/60"
                    >
                      <div className="space-y-3 p-4">
                        {layer.examples.length > 0 && (
                          <div>
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              أمثلة
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {layer.examples.map((ex, i) => (
                                <span
                                  key={i}
                                  dir="ltr"
                                  className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary"
                                >
                                  {ex}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {(layer.input || layer.output) && (
                          <div className="grid grid-cols-2 gap-3">
                            {layer.input && (
                              <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-2">
                                <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                                  ⬇️ يدخل
                                </p>
                                <p className="text-[11px] text-foreground">
                                  {layer.input}
                                </p>
                              </div>
                            )}
                            {layer.output && (
                              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2">
                                <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                  ⬆️ يخرج
                                </p>
                                <p className="text-[11px] text-foreground">
                                  {layer.output}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {li < system.layers.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ArrowDown
                    className={cn(
                      "h-3.5 w-3.5 transition-colors",
                      isActive ? "text-indigo-500" : "text-muted-foreground/40"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}

        {activeStep >= 0 && system.scenario[activeStep] && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
            <p className="text-[11px] text-foreground">
              <strong>خطوة {activeStep + 1}:</strong>{" "}
              {system.scenario[activeStep].label}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}