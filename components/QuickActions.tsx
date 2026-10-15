"use client";

import * as React from "react";
import { Hand, RotateCcw, Search } from "lucide-react";
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
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyK") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.repeat) return;

      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))
      ) {
        return;
      }
      if (disabled) return;
      if (e.code === "KeyQ") {
        e.preventDefault();
        onAsk();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        onRepeat();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAsk, onRepeat, disabled]);

  return (
    <>
      <div
        role="toolbar"
        aria-label="إجراءات سريعة"
        className={cn(
          "mx-auto flex h-11 w-full max-w-[1600px] items-center gap-2 px-4 sm:px-6 lg:px-8",
          className
        )}
      >
        <button
          type="button"
          onClick={onAsk}
          disabled={disabled}
          aria-pressed={askRaised || undefined}
          aria-keyshortcuts="Q"
          title="سجّل رفع يدك (Q)"
          className={cn(
            "inline-flex h-8 items-center gap-2 rounded-md border border-input bg-card px-2.5 text-xs font-medium transition-colors",
            "hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50",
            "aria-pressed:border-primary aria-pressed:bg-wash aria-pressed:text-primary"
          )}
        >
          <Hand className="size-3.5" strokeWidth={1.5} />
          <span>عايز أسأل</span>
          <kbd className="kbd hidden sm:inline-block">Q</kbd>
        </button>

        <button
          type="button"
          onClick={onRepeat}
          disabled={disabled}
          aria-keyshortcuts="R"
          title="اطلب إعادة آخر نقطة (R)"
          className={cn(
            "inline-flex h-8 items-center gap-2 rounded-md border border-input bg-card px-2.5 text-xs font-medium transition-colors",
            "hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <RotateCcw className="size-3.5" strokeWidth={1.5} />
          <span>أعد الشرح</span>
          <kbd className="kbd hidden sm:inline-block">R</kbd>
        </button>

        <span className="flex-1" />

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          aria-haspopup="dialog"
          aria-keyshortcuts="Control+K Meta+K"
          className="inline-flex h-8 items-center gap-2 rounded-md border border-input px-2.5 text-xs text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
        >
          <Search className="size-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">الأوامر</span>
          <kbd className="kbd hidden sm:inline-block">Ctrl K</kbd>
        </button>
      </div>

      {paletteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPaletteOpen(false)}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-[18vh]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-lg border bg-card shadow-lg"
          >
            <div className="flex items-center gap-2 border-b px-3">
              <Search className="size-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                autoFocus
                placeholder="اكتب اسم الأمر..."
                className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setPaletteOpen(false);
                }}
              />
              <kbd className="kbd">Esc</kbd>
            </div>
            <ul className="p-1">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setPaletteOpen(false);
                    onAsk();
                  }}
                  className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-start text-sm hover:bg-wash"
                >
                  <Hand className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  <span>عايز أسأل</span>
                  <span className="flex-1" />
                  <kbd className="kbd">Q</kbd>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setPaletteOpen(false);
                    onRepeat();
                  }}
                  className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-start text-sm hover:bg-wash"
                >
                  <RotateCcw className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  <span>أعد الشرح</span>
                  <span className="flex-1" />
                  <kbd className="kbd">R</kbd>
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}