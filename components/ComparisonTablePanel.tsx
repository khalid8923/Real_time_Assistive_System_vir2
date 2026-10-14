"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Table as TableIcon,
  Loader2,
  PlayCircle,
  Trash2,
  Sparkles,
  Quote,
  Info,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/ErrorState";
import ClozeOverlay from "@/components/ClozeOverlay";
import { cn } from "@/lib/utils";
import type { ComparisonTable } from "@/lib/ai-types";

interface ComparisonTablePanelProps {
  transcript: string;
}

export default function ComparisonTablePanel({
  transcript,
}: ComparisonTablePanelProps) {
  const [tables, setTables] = React.useState<ComparisonTable[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [clozeMode, setClozeMode] = React.useState(false);

  const canGenerate = transcript.trim().length >= 50 && !loading;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/visualize-comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
      const data: { comparisons?: ComparisonTable[]; error?: string } =
        await res.json();
      if (!res.ok) {
        setError(data.error || "فشل استخراج المقارنات.");
        return;
      }
      setTables(data.comparisons ?? []);
      setClozeMode(false);
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-primary to-accent-1">
            <TableIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">جداول المقارنة</h2>
            <p className="text-[10px] text-muted-foreground">
              {tables.length > 0
                ? `${tables.length} مقارنة`
                : "استخرج المقارنات من كلام الدكتور"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tables.length > 0 && !clozeMode && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setClozeMode(true)}
              className="gap-2 border-violet-500/40 text-violet-600 dark:text-violet-400"
            >
              <Brain className="h-3.5 w-3.5" />
              اختبر نفسك
            </Button>
          )}

          {!clozeMode && tables.length > 0 && (
            <button
              type="button"
              onClick={() => setTables([])}
              aria-label="حذف"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 text-destructive transition-colors hover:bg-destructive/15"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {!clozeMode && (
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
                  {tables.length > 0 ? "استخرج تاني" : "استخرج المقارنات"}
                </>
              )}
            </Button>
          )}
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
                title="مش قادرين نستخرج المقارنات"
                description={error}
                hint="تأكد من المحاضرة فيها مقارنة صريحة"
                onRetry={() => {
                  setError(null);
                  handleGenerate();
                }}
              />
            </motion.div>
          )}

          {clozeMode ? (
            <motion.div
              key="cloze"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ComparisonCloze tables={tables} onExit={() => setClozeMode(false)} />
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Legend */}
              {tables.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-muted/20 px-4 py-2.5 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-foreground">من المحاضرة</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="font-bold text-foreground">مستنتج</span>
                  </div>
                </div>
              )}

              {tables.length === 0 && !loading && !error && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-bold text-foreground">
                    {canGenerate
                      ? "اضغط (استخرج المقارنات)"
                      : "سجّل 50 حرف على الأقل الأول"}
                  </p>
                  <p className="max-w-md text-xs text-muted-foreground">
                    {canGenerate
                      ? "هنلقط كل المقارنات: let vs var، TCP vs UDP، SQL vs NoSQL..."
                      : "المقارنات بتظهر لما الدكتور يقارن بين حاجتين"}
                  </p>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-14">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    بندوّر على مقارنات في المحاضرة...
                  </p>
                </div>
              )}

              {tables.length > 0 && !loading && (
                <div className="space-y-6">
                  {tables.map((table, idx) => (
                    <ComparisonCard key={table.id} table={table} index={idx} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cloze wrapper for comparison tables                                */
/* ------------------------------------------------------------------ */

function ComparisonCloze({
  tables,
  onExit,
}: {
  tables: ComparisonTable[];
  onExit: () => void;
}) {
  const [activeTableIdx, setActiveTableIdx] = React.useState(0);
  const table = tables[activeTableIdx];
  if (!table) return null;

  // اجمع كل خلايا القيم كـ cloze cells
  const allCells = React.useMemo(() => {
    const cells: Array<{ id: string; value: string; criterion: string; item: string }> = [];
    table.criteria.forEach((criterion, ci) => {
      criterion.values.forEach((cell, vi) => {
        if (cell.value && cell.value !== "—") {
          cells.push({
            id: `c${ci}-v${vi}`,
            value: cell.value,
            criterion: criterion.name,
            item: table.items[vi]?.name ?? "",
          });
        }
      });
    });
    return cells;
  }, [table]);

  return (
    <div className="space-y-4">
      {tables.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {tables.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTableIdx(i)}
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-bold transition-colors",
                i === activeTableIdx
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {i + 1}. {t.title}
            </button>
          ))}
        </div>
      )}

      <ClozeOverlay cells={allCells} onClose={onExit}>
        {(renderCell) => (
          <div className="overflow-x-auto">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-foreground">{table.title}</h3>
              {table.subtitle && (
                <p className="text-[11px] text-muted-foreground">{table.subtitle}</p>
              )}
            </div>
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="bg-muted/40 p-3 font-bold text-muted-foreground">
                    المعيار
                  </th>
                  {table.items.map((item, i) => (
                    <th
                      key={i}
                      className="p-3 font-bold text-foreground"
                    >
                      {item.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.criteria.map((criterion, ci) => (
                  <tr key={ci} className="border-b border-border last:border-0">
                    <td className="bg-muted/20 p-3 align-top text-[11px] font-bold text-muted-foreground">
                      {criterion.name}
                    </td>
                    {criterion.values.map((cell, vi) => {
                      const cellId = `c${ci}-v${vi}`;
                      const isHidden = cell.value && cell.value !== "—";
                      return (
                        <td key={vi} className="p-3 align-top">
                          {isHidden ? (
                            renderCell({ id: cellId, value: cell.value })
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ClozeOverlay>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ComparisonCard({
  table,
  index,
}: {
  table: ComparisonTable;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="overflow-hidden rounded-xl border border-border bg-background"
    >
      <div className="border-b border-border bg-linear-to-l from-primary/8 to-accent-2/5 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
            {index + 1}
          </span>
          <h3 className="text-sm font-bold text-foreground">{table.title}</h3>
        </div>
        {table.subtitle && (
          <p className="mt-1 pr-8 text-[11px] text-muted-foreground">
            {table.subtitle}
          </p>
        )}
      </div>

      <div className="overflow-x-auto p-4">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="bg-muted/40 p-3 font-bold text-muted-foreground">
                المعيار
              </th>
              {table.items.map((item, i) => (
                <th
                  key={i}
                  className={cn(
                    "p-3 font-bold",
                    item.source === "lecture"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {item.source === "inferred" && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-amber-500"
                        title="مستنتج"
                      />
                    )}
                    {item.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.criteria.map((criterion, ci) => (
              <tr
                key={ci}
                className="border-b border-border last:border-0 hover:bg-muted/20"
              >
                <td className="bg-muted/20 p-3 align-top text-[11px] font-bold text-muted-foreground">
                  {criterion.name}
                </td>
                {criterion.values.map((cell, vi) => (
                  <td key={vi} className="p-3 align-top">
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5">
                        <span
                          className={cn(
                            "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                            cell.source === "lecture"
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          )}
                        />
                        <span
                          className={cn(
                            "leading-relaxed",
                            cell.source === "lecture"
                              ? "text-foreground"
                              : "text-muted-foreground italic"
                          )}
                        >
                          {cell.value}
                        </span>
                      </div>
                      {cell.quote && (
                        <div className="flex items-start gap-1 rounded-md bg-primary/5 px-2 py-1 text-[10px] leading-snug text-primary/90">
                          <Quote className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                          <span className="italic">
                            &ldquo;{cell.quote}&rdquo;
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-muted/20 px-4 py-2 text-[10px] text-muted-foreground">
        <Info className="h-3 w-3" />
        <span>أخضر = من المحاضرة · أصفر = مستنتج من معرفة عامة</span>
      </div>
    </motion.div>
  );
}