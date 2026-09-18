"use client";

import * as React from "react";
import { Download, FileText, FileType, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExportButtonProps {
  transcript: string;
  topic?: string;
  terms?: { term: string; definition: string }[];
  summary?: string;
  className?: string;
}

export default function ExportButton({
  transcript,
  topic,
  terms,
  summary,
  className,
}: ExportButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const disabled = transcript.trim().length === 0;

  const handleExport = async (format: "txt" | "pdf") => {
    if (disabled) return;
    setLoading(true);
    setOpen(false);

    try {
      const date = new Date().toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (format === "txt") {
        const content = buildTextContent({
          transcript,
          topic,
          terms,
          summary,
          date,
        });
        downloadFile(
          content,
          `captionbridge-${Date.now()}.txt`,
          "text/plain;charset=utf-8"
        );
        toast.success("تم تحميل النص");
      } else if (format === "pdf") {
        const html = buildPrintHTML({
          transcript,
          topic,
          terms,
          summary,
          date,
        });
        openPrintWindow(html);
        toast.success("افتح نافذة الطباعة واختار Save as PDF");
      }
    } catch (err) {
      console.error("[export]", err);
      toast.error("فشل التصدير");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || loading}
        aria-label="تصدير المحاضرة"
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-bold transition-colors",
          "hover:bg-muted hover:border-primary/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-primary/40 bg-primary/10 text-primary"
        )}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        تصدير
      </button>

      {open && (
        <div
          role="menu"
          className="animate-in fade-in-0 zoom-in-95 absolute left-0 top-full z-50 mt-2 w-52 origin-top-left overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-2xl"
        >
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-right transition-colors hover:bg-muted"
          >
            <FileType className="h-4 w-4 text-rose-500" />
            <div className="flex flex-col items-start">
              <span className="text-xs font-bold">PDF</span>
              <span className="text-[10px] text-muted-foreground">
                للطباعة والحفظ
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleExport("txt")}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-right transition-colors hover:bg-muted"
          >
            <FileText className="h-4 w-4 text-sky-500" />
            <div className="flex flex-col items-start">
              <span className="text-xs font-bold">نص عادي (TXT)</span>
              <span className="text-[10px] text-muted-foreground">
                للمشاركة والنسخ
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

function buildTextContent({
  transcript,
  topic,
  terms,
  summary,
  date,
}: {
  transcript: string;
  topic?: string;
  terms?: { term: string; definition: string }[];
  summary?: string;
  date: string;
}) {
  let content = `CaptionBridge — محاضرة\nالتاريخ: ${date}\n`;
  content += `\n${"═".repeat(40)}\n\n`;

  if (topic) content += `📌 الموضوع: ${topic}\n\n`;
  if (summary) content += `📄 الملخص:\n${summary}\n\n`;
  if (terms && terms.length > 0) {
    content += `📚 المصطلحات:\n`;
    terms.forEach((t) => {
      content += `  • ${t.term}: ${t.definition}\n`;
    });
    content += `\n`;
  }

  content += `📝 النص الكامل:\n${"─".repeat(40)}\n${transcript}\n`;

  return content;
}

function buildPrintHTML({
  transcript,
  topic,
  terms,
  summary,
  date,
}: {
  transcript: string;
  topic?: string;
  terms?: { term: string; definition: string }[];
  summary?: string;
  date: string;
}) {
  const termsHtml =
    terms && terms.length > 0
      ? `
    <div class="section">
      <h2>📚 المصطلحات</h2>
      <ul>
        ${terms
          .map(
            (t) =>
              `<li><strong>${escapeHtml(t.term)}:</strong> ${escapeHtml(
                t.definition
              )}</li>`
          )
          .join("")}
      </ul>
    </div>`
      : "";

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>CaptionBridge — محاضرة</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Cairo', sans-serif;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
      color: #1f2937;
      line-height: 1.8;
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 3px solid #8470ff;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #8470ff;
      font-size: 28px;
      margin-bottom: 6px;
    }
    .header p { color: #6b7280; font-size: 13px; }
    .section { margin-bottom: 24px; }
    .section h2 {
      font-size: 18px;
      color: #8470ff;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    .topic-box {
      background: rgba(132, 112, 255, 0.08);
      padding: 16px;
      border-radius: 12px;
      border-right: 4px solid #8470ff;
      font-size: 18px;
      font-weight: bold;
    }
    ul { list-style: none; padding: 0; }
    li {
      padding: 8px 12px;
      background: #f9fafb;
      margin-bottom: 6px;
      border-radius: 8px;
      font-size: 14px;
    }
    .transcript {
      background: #f9fafb;
      padding: 20px;
      border-radius: 12px;
      font-size: 14px;
      white-space: pre-wrap;
      border: 1px solid #e5e7eb;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>CaptionBridge</h1>
    <p>جسر التواصل للطلاب الصم — ${escapeHtml(date)}</p>
  </div>

  ${
    topic
      ? `<div class="section">
      <h2>📌 الموضوع</h2>
      <div class="topic-box">${escapeHtml(topic)}</div>
    </div>`
      : ""
  }

  ${
    summary
      ? `<div class="section">
      <h2>📄 الملخص</h2>
      <p>${escapeHtml(summary)}</p>
    </div>`
      : ""
  }

  ${termsHtml}

  <div class="section">
    <h2>📝 النص الكامل</h2>
    <div class="transcript">${escapeHtml(transcript)}</div>
  </div>

  <div class="footer">
    تم إنشاء هذا الملف بواسطة CaptionBridge
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob(["\ufeff" + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openPrintWindow(html: string) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("من فضلك اسمح بالنوافذ المنبثقة");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 500);
}