"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
  label?: string;
  copiedLabel?: string;
  size?: "sm" | "default";
}

export default function CopyButton({
  text,
  className,
  label = "نسخ",
  copiedLabel = "تم النسخ",
  size = "default",
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for insecure contexts
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("[copy] failed:", err);
    }
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? copiedLabel : label}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background font-medium transition-colors",
        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        isSmall ? "h-7 px-2 text-[11px]" : "h-8 px-2.5 text-xs",
        copied && "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
        className
      )}
    >
      {copied ? (
        <>
          <Check className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
          {copiedLabel}
        </>
      ) : (
        <>
          <Copy className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
          {label}
        </>
      )}
    </button>
  );
}