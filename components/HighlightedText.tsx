"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface HighlightedTextProps {
  text: string;
  className?: string;
}

interface Token {
  value: string;
  type: "plain" | "whitespace" | "english" | "keyword" | "number";
}

const KEYWORD_PATTERNS = [
  // Exam/homework keywords
  /امتحان|واجب|تسليم|مشروع|اختبار|كويز|أسايمنت/,
  // Important transitions
  /مهم|ملاحظة|انتبه|ركز|تذكر|بالمناسبة/,
  // Academic terms (Arabic)
  /نظرية|قانون|قاعدة|تعريف|معادلة|دالة|متغير|خوارزمية/,
  // Technical Arabic
  /برمجة|شبكة|قاعدة بيانات|ذكاء اصطناعي|تعلم آلة/,
];

function classifyToken(value: string): Token["type"] {
  if (/^\s+$/.test(value)) return "whitespace";
  if (/^[a-zA-Z][a-zA-Z0-9+#.]*$/.test(value)) return "english";
  if (/^\d+(\.\d+)?%?$/.test(value)) return "number";
  if (KEYWORD_PATTERNS.some((p) => p.test(value))) return "keyword";
  return "plain";
}

function tokenize(text: string): Token[] {
  // Split by whitespace but keep the whitespace tokens
  const parts = text.split(/(\s+)/);
  return parts
    .filter((p) => p.length > 0)
    .map((value) => ({ value, type: classifyToken(value) }));
}

export default function HighlightedText({
  text,
  className,
}: HighlightedTextProps) {
  const tokens = React.useMemo(() => tokenize(text), [text]);

  return (
    <div
      dir="rtl"
      className={cn(
        "whitespace-pre-wrap text-right text-sm leading-relaxed",
        className
      )}
    >
      {tokens.map((token, i) => {
        if (token.type === "whitespace") {
          return <span key={i}>{token.value}</span>;
        }

        if (token.type === "english") {
          return (
            <span
              key={i}
              className="rounded-md bg-sky-500/15 px-1 font-semibold text-sky-700 dark:text-sky-400"
              dir="ltr"
            >
              {token.value}
            </span>
          );
        }

        if (token.type === "keyword") {
          return (
            <span
              key={i}
              className="rounded-md bg-amber-500/20 px-1 font-bold text-amber-700 dark:text-amber-400"
            >
              {token.value}
            </span>
          );
        }

        if (token.type === "number") {
          return (
            <span
              key={i}
              className="rounded-md bg-violet-500/15 px-1 font-mono font-semibold text-violet-700 dark:text-violet-400"
              dir="ltr"
            >
              {token.value}
            </span>
          );
        }

        return <span key={i}>{token.value}</span>;
      })}
    </div>
  );
}