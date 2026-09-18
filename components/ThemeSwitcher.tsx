"use client";

import * as React from "react";
import { Check, Palette, Sun, Moon, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { THEMES, type Theme } from "@/lib/themes";

const THEME_ICONS: Record<Theme, React.ElementType> = {
  light: Sun,
  dark: Moon,
  focus: BookOpen,
};

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const CurrentIcon = THEME_ICONS[theme] || Palette;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="تغيير المظهر"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all hover:border-primary/40 hover:text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          open && "border-primary/40 bg-primary/10 text-primary"
        )}
      >
        <CurrentIcon className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-in fade-in-0 zoom-in-95 absolute left-0 top-full z-50 mt-2 w-72 origin-top-left overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-2xl"
        >
          <div className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            اختر المظهر
          </div>

          {THEMES.map((t) => {
            const active = t.id === theme;
            const Icon = THEME_ICONS[t.id] || Palette;

            return (
              <button
                key={t.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl p-3 text-right transition-colors",
                  active
                    ? "bg-primary/10"
                    : "hover:bg-muted"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white shadow-sm",
                    t.previewGradient
                  )}
                >
                  <Icon className="h-4.5 w-4.5 drop-shadow" />
                </span>

                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {t.label}
                    </span>
                    {active && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {t.tagline}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}