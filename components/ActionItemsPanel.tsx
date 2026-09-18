"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Target,
  Loader2,
  PlayCircle,
  Sparkles,
  Calendar,
  FileText,
  AlertCircle,
  BookOpen,
  Lightbulb,
  Bell,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActionItem } from "@/lib/db/ai-types";

interface ActionItemsPanelProps {
  transcript: string;
  items: ActionItem[];
  onItemsChange: (items: ActionItem[]) => void;
  onNotify?: (item: ActionItem) => void;
}

const TYPE_META: Record<
  ActionItem["type"],
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  exam: {
    label: "امتحان",
    icon: AlertCircle,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
  },
  assignment: {
    label: "تكليف",
    icon: FileText,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
  deadline: {
    label: "موعد تسليم",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  page: {
    label: "مرجع",
    icon: BookOpen,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
  },
  important: {
    label: "مهم",
    icon: Lightbulb,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
  },
  note: {
    label: "ملاحظة",
    icon: Bell,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-500/10",
  },
};

const URGENCY_META: Record<
  ActionItem["urgency"],
  { label: string; color: string }
> = {
  high: { label: "عاجل", color: "bg-rose-500 text-white" },
  medium: { label: "متوسط", color: "bg-amber-500 text-white" },
  low: { label: "عادي", color: "bg-muted text-foreground" },
};

export default function ActionItemsPanel({
  transcript,
  items,
  onItemsChange,
  onNotify,
}: ActionItemsPanelProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"all" | ActionItem["type"]>("all");

  const canScan = transcript.trim().length > 0;

  const handleScan = async () => {
    if (!canScan) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/action-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });

      const data: { items?: ActionItem[]; error?: string } = await res.json();

      if (!res.ok) {
        setError(data.error || "فشل فحص المهام.");
        return;
      }

      const newItems = data.items ?? [];

      // ✅ Notify each new item
      newItems.forEach((item) => {
        if (onNotify && item.urgency !== "low") {
          onNotify(item);
        }
      });

      // Merge without duplicates
      const merged = [...items];
      const existingTitles = new Set(items.map((i) => i.title.toLowerCase()));
      newItems.forEach((item) => {
        if (!existingTitles.has(item.title.toLowerCase())) {
          merged.push(item);
        }
      });

      onItemsChange(merged);
    } catch {
      setError("تعذّر الاتصال بالخدمة.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = React.useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.type === filter);
  }, [items, filter]);

  const highCount = items.filter((i) => i.urgency === "high").length;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Target className="h-4 w-4 text-primary" />
            {highCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {highCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">رادار المهام</h2>
            <p className="text-[10px] text-muted-foreground">
              {items.length > 0
                ? `${items.length} عنصر مكتشف`
                : "افحص المحاضرة لاستخراج التكليفات"}
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleScan}
          disabled={!canScan || loading}
          className="gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 text-xs font-bold text-white shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              جارٍ الفحص...
            </>
          ) : (
            <>
              <PlayCircle className="h-3.5 w-3.5" />
              {items.length > 0 ? "افحص تاني" : "افحص المهام"}
            </>
          )}
        </Button>
      </div>

      <div className="p-5">
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {items.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center">
            <Target className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-bold">في انتظار الفحص</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {canScan
                ? "اضغط (افحص المهام) لاستخراج التكليفات وتلميحات الامتحانات"
                : "سجّل الشرح الأول عشان الرادار يشتغل"}
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-muted/40"
              />
            ))}
          </div>
        )}

        {items.length > 0 && !loading && (
          <>
            {/* Filter chips */}
            <div className="mb-4 flex flex-wrap gap-2">
              <FilterChip
                active={filter === "all"}
                onClick={() => setFilter("all")}
                label={`الكل (${items.length})`}
              />
              {(Object.keys(TYPE_META) as ActionItem["type"][]).map((type) => {
                const count = items.filter((i) => i.type === type).length;
                if (count === 0) return null;
                const meta = TYPE_META[type];
                const Icon = meta.icon;
                return (
                  <FilterChip
                    key={type}
                    active={filter === type}
                    onClick={() => setFilter(type)}
                    label={`${meta.label} (${count})`}
                    icon={<Icon className="h-3 w-3" />}
                  />
                );
              })}
            </div>

            <ul className="space-y-3">
              {filtered.map((item, i) => {
                const meta = TYPE_META[item.type];
                const urgency = URGENCY_META[item.urgency];
                const Icon = meta.icon;

                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={cn(
                      "relative overflow-hidden rounded-xl border p-4",
                      meta.bg,
                      "border-border/60",
                    )}
                  >
                    {/* Left accent bar */}
                    <div
                      className={cn(
                        "absolute inset-y-0 right-0 w-1",
                        item.urgency === "high"
                          ? "bg-rose-500"
                          : item.urgency === "medium"
                            ? "bg-amber-500"
                            : "bg-muted-foreground/30",
                      )}
                    />

                    <div className="flex items-start gap-3 pr-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          meta.bg,
                          meta.color,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[9px] font-bold",
                              meta.bg,
                              meta.color,
                            )}
                          >
                            {meta.label}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[9px] font-bold",
                              urgency.color,
                            )}
                          >
                            {urgency.label}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-foreground">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {item.details}
                        </p>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
