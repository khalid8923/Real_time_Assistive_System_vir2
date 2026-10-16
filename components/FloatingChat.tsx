"use client";

import * as React from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
} from "motion/react";
import { X, Send, Loader2, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import RobotIcon from "@/components/RobotIcon";

const POSITION_KEY = "cb_chat_btn_pos_v1";
const BTN_SIZE = 56;
const MARGIN = 12;

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

function clampX(x: number) {
  const w = typeof window !== "undefined" ? window.innerWidth : 375;
  return Math.max(MARGIN, Math.min(x, w - BTN_SIZE - MARGIN));
}
function clampY(y: number) {
  const h = typeof window !== "undefined" ? window.innerHeight : 667;
  return Math.max(60, Math.min(y, h - BTN_SIZE - 90));
}
function defaultPos() {
  const w = typeof window !== "undefined" ? window.innerWidth : 375;
  const h = typeof window !== "undefined" ? window.innerHeight : 667;
  return { x: w - BTN_SIZE - MARGIN, y: h - BTN_SIZE - 150 };
}
function loadPos() {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (raw) {
      const p = JSON.parse(raw) as { x: number; y: number };
      if (typeof p.x === "number" && typeof p.y === "number") {
        return { x: clampX(p.x), y: clampY(p.y) };
      }
    }
  } catch {
    /* ignore */
  }
  return defaultPos();
}
function savePos(p: { x: number; y: number }) {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export default function FloatingChat({ transcript }: FloatingChatProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  // Button position (state triggers re-render for window anchor calc)
  const [btnPos, setBtnPos] = React.useState({ x: 0, y: 0 });
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setMounted(true);
    const p = loadPos();
    setBtnPos(p);
    mx.set(p.x);
    my.set(p.y);
  }, [mx, my]);

  React.useEffect(() => {
    if (!mounted) return;
    const onResize = () => {
      const nx = clampX(mx.get());
      const ny = clampY(my.get());
      mx.set(nx);
      my.set(ny);
      setBtnPos({ x: nx, y: ny });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mounted, mx, my]);

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
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
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

  if (!mounted) return null;

  // --- Window position (near button, adaptive) ---
  const ww = typeof window !== "undefined" ? window.innerWidth : 375;
  const wh = typeof window !== "undefined" ? window.innerHeight : 667;
  const winW = Math.min(380, ww - 24);
  const winH = Math.min(520, wh * 0.72);

  const isRight = btnPos.x + BTN_SIZE / 2 > ww / 2;
  const isBottom = btnPos.y + BTN_SIZE / 2 > wh / 2;

  let wx: number;
  let wy: number;
  if (isRight) wx = btnPos.x - winW - 12;
  else wx = btnPos.x + BTN_SIZE + 12;

  if (isBottom) wy = btnPos.y - winH + BTN_SIZE;
  else wy = btnPos.y;

  wx = Math.max(12, Math.min(wx, ww - winW - 12));
  wy = Math.max(60, Math.min(wy, wh - winH - 12));

  return (
    <>
      {/* ============ Draggable Floating Button ============ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0}
            onDragEnd={() => {
              const nx = clampX(mx.get());
              const ny = clampY(my.get());
              mx.set(nx);
              my.set(ny);
              setBtnPos({ x: nx, y: ny });
              savePos({ x: nx, y: ny });
            }}
            onTap={() => setIsOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 25 }}
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              x: mx,
              y: my,
              touchAction: "none",
              zIndex: 40,
            }}
            className="cursor-grab active:cursor-grabbing"
          >
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-primary to-accent-1 text-white shadow-lg shadow-primary/40 ring-2 ring-background/40">
              <RobotIcon className="h-8 w-8" />
              {messages.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                  {messages.length}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ Chat Window (anchored near button) ============ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              position: "fixed",
              left: wx,
              top: wy,
              width: winW,
              maxHeight: winH,
              zIndex: 50,
            }}
            className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur-xl"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-accent-1 text-white shadow-sm">
                  <RobotIcon className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-bold">مساعد CaptionBridge</p>
                  <p className="text-[9px] text-muted-foreground">
                    اسأل عن أي حاجة
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={clearChat}
                    aria-label="مسح"
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
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent-1 text-white shadow-md shadow-primary/20">
                    <RobotIcon className="h-9 w-9" />
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
                    msg.role === "user" && "flex-row-reverse"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent/20 text-primary"
                    )}
                  >
                    {msg.role === "user" ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <RobotIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-primary">
                    <RobotIcon className="h-4 w-4" />
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

            {error && (
              <p className="border-t border-destructive/20 bg-destructive/10 px-3 py-1.5 text-[10px] font-medium text-destructive">
                {error}
              </p>
            )}

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