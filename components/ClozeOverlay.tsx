"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Check, X, RotateCcw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClozeCell {
  id: string;
  value: string;
}

interface ClozeOverlayProps {
  cells: ClozeCell[];
  onClose: () => void;
  children: (renderCell: (cell: ClozeCell) => React.ReactNode) => React.ReactNode;
}

/**
 * Cloze mode — hides a subset of cells, shows shuffled chips below,
 * user clicks chip then clicks slot to place it. Immediate feedback.
 */
export default function ClozeOverlay({ cells, onClose, children }: ClozeOverlayProps) {
  const [hiddenIds, setHiddenIds] = React.useState<Set<string>>(() => {
    // hide 60% of cells randomly
    const shuffled = [...cells].sort(() => Math.random() - 0.5);
    const count = Math.max(2, Math.ceil(cells.length * 0.6));
    return new Set(shuffled.slice(0, count).map((c) => c.id));
  });

  const [placed, setPlaced] = React.useState<Record<string, string | null>>({});
  const [selectedChip, setSelectedChip] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<Record<string, "correct" | "wrong">>({});

  const usedChips = new Set(
    Object.values(placed).filter((v): v is string => !!v)
  );

  const availableChips = React.useMemo(() => {
    const hidden = cells.filter((c) => hiddenIds.has(c.id));
    return hidden
      .filter((c) => !usedChips.has(c.value))
      .sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, hiddenIds, Object.values(placed).join("|")]);

  const handleChipClick = (value: string) => {
    setSelectedChip(selectedChip === value ? null : value);
  };

  const handleCellClick = (cellId: string) => {
    if (!selectedChip) return;
    const target = cells.find((c) => c.id === cellId);
    if (!target) return;

    const isCorrect = target.value === selectedChip;
    setPlaced((p) => ({ ...p, [cellId]: selectedChip }));
    setResults((r) => ({ ...r, [cellId]: isCorrect ? "correct" : "wrong" }));
    setSelectedChip(null);
  };

  const renderCell = (cell: ClozeCell): React.ReactNode => {
    if (!hiddenIds.has(cell.id)) {
      return <span className="text-foreground">{cell.value}</span>;
    }
    const placedValue = placed[cell.id];
    const result = results[cell.id];

    if (placedValue && result === "correct") {
      return (
        <motion.span
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-bold text-emerald-700 dark:text-emerald-400"
        >
          <Check className="h-3 w-3" />
          {placedValue}
        </motion.span>
      );
    }
    if (placedValue && result === "wrong") {
      return (
        <span className="inline-flex items-center gap-1">
          <motion.span
            initial={{ x: 0 }}
            animate={{ x: [0, -3, 3, -3, 0] }}
            transition={{ duration: 0.3 }}
            className="rounded-md bg-rose-500/15 px-1.5 py-0.5 text-rose-700 line-through dark:text-rose-400"
          >
            <X className="inline h-3 w-3" /> {placedValue}
          </motion.span>
          <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
            ← {cell.value}
          </span>
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={() => handleCellClick(cell.id)}
        disabled={!selectedChip}
        className={cn(
          "inline-flex min-w-[60px] items-center justify-center rounded-md border-2 border-dashed px-2 py-0.5 text-[10px] font-bold transition-all",
          selectedChip
            ? "border-primary bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
            : "border-muted-foreground/40 bg-muted/30 text-muted-foreground"
        )}
      >
        ___
      </button>
    );
  };

  const total = hiddenIds.size;
  const correctCount = Object.values(results).filter((r) => r === "correct").length;
  const done = correctCount + Object.values(results).filter((r) => r === "wrong").length;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4"
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">
              اختبر نفسك — اكمل الفراغات
            </p>
            <p className="text-[10px] text-muted-foreground">
              {done}/{total} · صح: {correctCount} · {percent}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={() => {
              setPlaced({});
              setResults({});
              setSelectedChip(null);
            }}
            className="gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            من جديد
          </Button>
          <Button
            type="button"
            size="xs"
            onClick={onClose}
            className="gap-1 bg-linear-to-l from-primary to-accent-1"
          >
            <EyeOff className="h-3 w-3" />
            إخفاء
          </Button>
        </div>
      </div>

      {/* Content with cloze cells */}
      <div className="rounded-xl border border-border bg-background p-4">
        {children(renderCell)}
      </div>

      {/* Chips tray */}
      <div className="mt-4 rounded-xl border border-primary/20 bg-background p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          <Eye className="h-3 w-3" />
          اضغط على الكلمة ثم اضغط على الفراغ
        </p>
        <div className="flex flex-wrap gap-2">
          {availableChips.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              ✓ خلصت كل الكلمات
            </p>
          ) : (
            availableChips.map((chip, i) => (
              <motion.button
                key={`${chip.value}-${i}`}
                type="button"
                onClick={() => handleChipClick(chip.value)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition-all",
                  selectedChip === chip.value
                    ? "border-primary bg-primary text-primary-foreground scale-105"
                    : "border-border bg-muted/40 text-foreground hover:border-primary/40 hover:bg-muted"
                )}
              >
                {chip.value}
              </motion.button>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}