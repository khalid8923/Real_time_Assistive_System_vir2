"use client";

import * as React from "react";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import {
  Bot,
  X,
  Send,
  Loader2,
  MessageSquare,
  Sparkles,
  Trash2,
  User,
  GripHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface FloatingChatProps {
  transcript: string;
}

const SUGGESTED = [
  "إيه أهم نقطة في المحاضرة؟",
  "اشرحلي المصطلحات الصعبة",
  "اعملي ملخص سريع",
];

export default function FloatingChat({ transcript }: FloatingChatProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const dragControls = useDragControls();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  React.useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || loading || !transcript.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: q,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          context: transcript,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data: { answer?: string; error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل توليد الرد.");
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.answer ?? "",
        },
      ]);
    } catch {
      setError("تعذّر الاتصال بخدمة الأسئلة.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <>
      {/* Floating toggle button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 25 }}
            onClick={() => setIsOpen(true)}
            aria-label="فتح المساعد الذكي"
            className="fixed bottom-20 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-primary to-accent-1 text-white shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 lg:bottom-6"
          >
            <MessageSquare className="h-6 w-6" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                {messages.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            dragElastic={0.1}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-20 left-6 z-50 flex h-125 w-[min(380px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur-xl lg:bottom-6"
            dir="rtl"
          >
            {/* Header (drag handle) */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex cursor-grab items-center justify-between border-b border-border/60 bg-muted/30 px-3 py-2.5 active:cursor-grabbing"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-accent-1 text-white shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-bold">مساعد CaptionBridge</p>
                  <p className="text-[9px] text-muted-foreground">
                    اسأل عن أي حاجة في المحاضرة
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <GripHorizontal className="h-4 w-4 text-muted-foreground/50" />
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={clearChat}
                    aria-label="مسح المحادثة"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="إغلاق"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto p-3"
            >
              {messages.length === 0 && !loading && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">أنا مساعدك الذكي</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {transcript.trim().length > 0
                        ? "اسألني أي حاجة عن المحاضرة"
                        : "سجّل الشرح الأول من تاب الكلام المباشر"}
                    </p>
                  </div>
                  {transcript.trim().length > 0 && (
                    <div className="mt-2 flex w-full flex-col gap-1.5">
                      {SUGGESTED.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => ask(q)}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-right text-[11px] font-medium transition-colors hover:bg-muted hover:text-primary"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" && "flex-row-reverse",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent/20 text-primary",
                    )}
                  >
                    {msg.role === "user" ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Bot className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-primary">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span className="text-[10px] text-muted-foreground">
                      بيفكر...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-destructive/20 bg-destructive/10 px-3 py-1.5 text-[10px] font-medium text-destructive"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex gap-2 border-t border-border/60 bg-muted/20 p-2"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك..."
                rows={1}
                disabled={loading || !transcript.trim()}
                className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                style={{ maxHeight: "80px" }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || !transcript.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-accent-1 text-white shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
