"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Network,
  Loader2,
  PlayCircle,
  Trash2,
  Sparkles,
  Quote,
  Plus,
  Minus,
  RotateCw,
  ChevronDown,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/ErrorState";
import { cn } from "@/lib/utils";
import type { CausalLoop, CausalNode, CausalEdge } from "@/lib/ai-types";

interface CausalLoopPanelProps {
  transcript: string;
}

export default function CausalLoopPanel({ transcript }: CausalLoopPanelProps) {
  const [loops, setLoops] = React.useState<CausalLoop[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canGenerate = transcript.trim().length >= 50 && !loading;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/visualize-causal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
      const data: { loops?: CausalLoop[]; error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل استخراج العلاقات السببية.");
        return;
      }
      setLoops(data.loops ?? []);
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-rose-500 to-amber-500">
            <Network className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">مستكشف الأسباب والنتائج</h2>
            <p className="text-[10px] text-muted-foreground">
              {loops.length > 0
                ? `${loops.length} علاقة سببية`
                : "استخرج علاقات السبب والنتيجة"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loops.length > 0 && (
            <button
              type="button"
              onClick={() => setLoops([])}
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
                {loops.length > 0 ? "استخرج تاني" : "استخرج العلاقات"}
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
                title="مش قادرين نستخرج العلاقات"
                description={error}
                hint="العلاقات بتظهر لما الدكتور يقول: لما X يزيد Y يزيد"
                onRetry={() => {
                  setError(null);
                  handleGenerate();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {loops.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-bold text-foreground">
              {canGenerate
                ? "اضغط (استخرج العلاقات)"
                : "سجّل 50 حرف على الأقل الأول"}
            </p>
            <p className="max-w-md text-xs text-muted-foreground">
              {canGenerate
                ? "هنلقط علاقات السبب والنتيجة: لما X يزيد Y يزيد، X بيقلل Y..."
                : "العلاقات بتظهر لما الدكتور يوضح تأثير حاجة على حاجة"}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              بندوّر على علاقات سببية...
            </p>
          </div>
        )}

        {loops.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {loops.map((loop, idx) => (
              <CausalLoopCard key={loop.id} loop={loop} index={idx} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const CATEGORY_STYLES: Record<
  CausalNode["category"] & string,
  { bg: string; border: string; text: string; label: string }
> = {
  driver: {
    bg: "bg-sky-500/10",
    border: "border-sky-500/40",
    text: "text-sky-600 dark:text-sky-400",
    label: "سبب",
  },
  process: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/40",
    text: "text-violet-600 dark:text-violet-400",
    label: "عملية",
  },
  outcome: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/40",
    text: "text-emerald-600 dark:text-emerald-400",
    label: "نتيجة",
  },
  feedback: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
    text: "text-amber-600 dark:text-amber-400",
    label: "تغذية راجعة",
  },
};

function CausalLoopCard({ loop, index }: { loop: CausalLoop; index: number }) {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [expandedEdge, setExpandedEdge] = React.useState<number | null>(null);

  // تأثير العقدة المختارة: BFS مع مضاعفة الإشارات
  const affectedNodes = React.useMemo(() => {
    if (!selectedNodeId) return new Map<string, { sign: number; hops: number }>();

    const affected = new Map<string, { sign: number; hops: number }>();
    const adj = new Map<string, Array<{ to: string; sign: number }>>();
    for (const e of loop.edges) {
      if (!adj.has(e.from)) adj.set(e.from, []);
      adj.get(e.from)!.push({
        to: e.to,
        sign: e.sign === "positive" ? 1 : -1,
      });
    }

    // BFS
    const queue: Array<{ id: string; sign: number; hops: number }> = [
      { id: selectedNodeId, sign: 1, hops: 0 },
    ];
    affected.set(selectedNodeId, { sign: 1, hops: 0 });

    while (queue.length > 0) {
      const { id, sign, hops } = queue.shift()!;
      if (hops >= 3) continue;

      const neighbors = adj.get(id) ?? [];
      for (const { to, sign: edgeSign } of neighbors) {
        const newSign = sign * edgeSign;
        if (!affected.has(to) || affected.get(to)!.hops > hops + 1) {
          affected.set(to, { sign: newSign, hops: hops + 1 });
          queue.push({ id: to, sign: newSign, hops: hops + 1 });
        }
      }
    }

    return affected;
  }, [selectedNodeId, loop.edges]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="overflow-hidden rounded-2xl border border-border bg-background"
    >
      {/* Title */}
      <div className="border-b border-border bg-linear-to-l from-rose-500/8 to-amber-500/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
            {index + 1}
          </span>
          <h3 className="text-sm font-bold">{loop.title}</h3>
        </div>
        {loop.subtitle && (
          <p className="mt-1 pr-8 text-[11px] text-muted-foreground">
            {loop.subtitle}
          </p>
        )}
        {loop.sourceQuote && (
          <div className="mt-2 mr-8 flex items-start gap-1.5 rounded-md bg-primary/5 px-2.5 py-1.5 text-[10px] leading-snug text-primary/90">
            <Quote className="mt-0.5 h-2.5 w-2.5 shrink-0" />
            <span className="italic">&ldquo;{loop.sourceQuote}&rdquo;</span>
          </div>
        )}
      </div>

      {/* Interactive hint */}
      <div className="flex items-start gap-2 border-b border-border bg-muted/20 px-4 py-2 text-[10px] text-muted-foreground">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
        <span>
          اضغط على أي عقدة عشان تشوف تأثيرها على باقي الشبكة. الخط المتصل = نفس
          الاتجاه (+) · الخط المتقطع = عكسي (−)
        </span>
      </div>

      {/* Nodes grid */}
      <div className="p-4">
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loop.nodes.map((node) => {
            const meta = CATEGORY_STYLES[node.category ?? "process"];
            const isSelected = selectedNodeId === node.id;
            const isAffected = affectedNodes.has(node.id);
            const affectInfo = affectedNodes.get(node.id);
            const affectDirection =
              affectInfo && affectInfo.sign > 0 ? "positive" : "negative";

            return (
              <motion.button
                key={node.id}
                type="button"
                onClick={() =>
                  setSelectedNodeId(isSelected ? null : node.id)
                }
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-right transition-all",
                  meta.bg,
                  isSelected
                    ? "border-primary shadow-lg shadow-primary/20"
                    : isAffected
                    ? affectDirection === "positive"
                      ? "border-emerald-500/60"
                      : "border-rose-500/60"
                    : meta.border
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className={cn("text-[9px] font-bold uppercase tracking-wider", meta.text)}>
                    {meta.label}
                  </span>
                  {isAffected && !isSelected && (
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white",
                        affectDirection === "positive"
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      )}
                    >
                      {affectDirection === "positive" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-foreground leading-tight">
                  {node.label}
                </p>
                {node.detail && (
                  <p className="text-[10px] leading-tight text-muted-foreground line-clamp-2">
                    {node.detail}
                  </p>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Edges list */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            العلاقات ({loop.edges.length})
          </p>
          {loop.edges.map((edge, ei) => {
            const fromNode = loop.nodes.find((n) => n.id === edge.from);
            const toNode = loop.nodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            const isExpanded = expandedEdge === ei;
            const isPositive = edge.sign === "positive";

            return (
              <motion.div
                key={ei}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: ei * 0.04 }}
                className={cn(
                  "overflow-hidden rounded-lg border transition-colors",
                  isPositive
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-rose-500/30 bg-rose-500/5"
                )}
              >
                <button
                  type="button"
                  onClick={() => setExpandedEdge(isExpanded ? null : ei)}
                  className="flex w-full items-center gap-3 p-2.5 text-right"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold text-white",
                      isPositive ? "bg-emerald-500" : "bg-rose-500"
                    )}
                  >
                    {isPositive ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  </span>

                  <span className="flex flex-1 flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-bold text-foreground">
                      {fromNode.label}
                    </span>
                    <span className={cn("text-[10px]", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                      {isPositive ? "يزيد" : "يقلل"}
                    </span>
                    <span className="font-bold text-foreground">
                      {toNode.label}
                    </span>
                  </span>

                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-bold",
                      edge.evidence === "lecture"
                        ? "bg-primary/10 text-primary"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {edge.evidence === "lecture" ? "من المحاضرة" : "مستنتج"}
                  </span>

                  {edge.quote && (
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && edge.quote && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-border/60"
                    >
                      <div className="flex items-start gap-2 px-3 py-2 text-[10px] italic text-muted-foreground">
                        <Quote className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>&ldquo;{edge.quote}&rdquo;</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Detected Loops */}
        {loop.loops.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <RotateCw className="h-3 w-3" />
              حلقات مغلقة مكتشفة ({loop.loops.length})
            </p>
            <div className="space-y-1.5">
              {loop.loops.map((detLoop, li) => {
                const nodeLabels = detLoop.nodeIds
                  .map((id) => loop.nodes.find((n) => n.id === id)?.label ?? "?")
                  .join(" → ");
                return (
                  <div
                    key={li}
                    className="flex items-center gap-2 rounded-md bg-background/60 px-2 py-1.5 text-[10px]"
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full font-bold text-white",
                        detLoop.type === "reinforcing"
                          ? "bg-rose-500"
                          : "bg-sky-500"
                      )}
                    >
                      {detLoop.type === "reinforcing" ? "R" : "B"}
                    </span>
                    <span className="text-foreground" dir="ltr">
                      {nodeLabels} → {loop.nodes.find((n) => n.id === detLoop.nodeIds[0])?.label}
                    </span>
                    <span className="text-muted-foreground mr-auto">
                      {detLoop.type === "reinforcing"
                        ? "حلقة تعزيزية (بتزيد نفسها)"
                        : "حلقة موازِنة (بتوقف نفسها)"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}