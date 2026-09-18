"use client";

import * as React from "react";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInTranscriptProps {
  text: string;
  containerRef: React.RefObject<HTMLTextAreaElement | null>;
}

export default function SearchInTranscript({
  text,
  containerRef,
}: SearchInTranscriptProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [matchIndex, setMatchIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const matches = React.useMemo(() => {
    if (!query.trim() || !text) return [];
    const q = query.trim().toLowerCase();
    const lower = text.toLowerCase();
    const results: number[] = [];
    let idx = 0;
    while (true) {
      const found = lower.indexOf(q, idx);
      if (found === -1) break;
      results.push(found);
      idx = found + q.length;
    }
    return results;
  }, [query, text]);

  const total = matches.length;
  const safeIndex = total > 0 ? Math.min(matchIndex, total - 1) : 0;

  React.useEffect(() => {
    setMatchIndex(0);
  }, [query]);

  React.useEffect(() => {
    const ta = containerRef.current;
    if (!ta || total === 0) return;
    const pos = matches[safeIndex];
    if (pos === undefined) return;

    const ratio = pos / ta.value.length;
    const targetScroll = ratio * (ta.scrollHeight - ta.clientHeight);
    ta.scrollTo({ top: targetScroll, behavior: "smooth" });

    try {
      ta.setSelectionRange(pos, pos + query.length);
    } catch {
      // ignore
    }
  }, [safeIndex, matches, total, query, containerRef]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const goNext = () => {
    if (total === 0) return;
    setMatchIndex((i) => (i + 1) % total);
  };

  const goPrev = () => {
    if (total === 0) return;
    setMatchIndex((i) => (i - 1 + total) % total);
  };

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        aria-label="بحث في النص (Ctrl+F)"
        className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted hover:text-primary"
      >
        <Search className="h-3.5 w-3.5" />
        بحث
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/5 px-2 py-1">
      <Search className="h-3.5 w-3.5 shrink-0 text-primary" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث..."
        className="h-7 w-32 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
      />

      {query && (
        <span
          className={cn(
            "shrink-0 text-[10px] font-bold",
            total === 0 ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {total === 0 ? "لا نتائج" : `${safeIndex + 1}/${total}`}
        </span>
      )}

      <button
        type="button"
        onClick={goPrev}
        disabled={total === 0}
        aria-label="السابق"
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={goNext}
        disabled={total === 0}
        aria-label="التالي"
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={close}
        aria-label="إغلاق البحث"
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}