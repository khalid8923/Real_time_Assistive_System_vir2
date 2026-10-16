"use client";

import * as React from "react";
import { Hand, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  onAsk: () => void;
  onRepeat: () => void;
  askRaised?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function QuickActions({
  onAsk,
  onRepeat,
  askRaised = false,
  disabled = false,
  className,
}: QuickActionsProps) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.repeat) return;
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))
      ) return;
      if (disabled) return;
      if (e.code === "KeyQ") { e.preventDefault(); onAsk(); }
      else if (e.code === "KeyR") { e.preventDefault(); onRepeat(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAsk, onRepeat, disabled]);

  return (
    <div
      role="toolbar"
      aria-label="إجراءات سريعة"
      className={cn(
        "pointer-events-none fixed left-6 bottom-24 z-40 hidden flex-row gap-2 lg:flex",
        className
      )}
    >
      <button
        type="button"
        onClick={onAsk}
        disabled={disabled}
        aria-pressed={askRaised || undefined}
        aria-keyshortcuts="Q"
        title="عايز أسأل (Q)"
        className={cn(
          "pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-all hover:scale-105 hover:border-primary hover:bg-primary hover:text-primary-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          askRaised && "border-primary bg-primary text-primary-foreground"
        )}
      >
        <Hand className="size-4" strokeWidth={1.75} />
      </button>

      <button
        type="button"
        onClick={onRepeat}
        disabled={disabled}
        aria-keyshortcuts="R"
        title="أعد الشرح (R)"
        className={cn(
          "pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-all hover:scale-105 hover:border-primary hover:bg-primary hover:text-primary-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <RotateCcw className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
