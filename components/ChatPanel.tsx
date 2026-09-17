"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  User,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ChatPanelProps {
  transcript: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "إيه أهم نقطة في المحاضرة؟",
  "اشرحلي المصطلحات الصعبة",
  "إيه الفرق بين المفاهيم اللي اتكلم عنها؟",
  "اعملي ملخص سريع",
];

export default function ChatPanel({ transcript }: ChatPanelProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const canAsk = transcript.trim().length > 0 && !loading;

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (q.length === 0 || !canAsk) return;

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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          context: transcript,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data: { answer?: string; error?: string } = await response.json();

      if (!response.ok) {
        setError(data.error || "فشل توليد الرد.");
        return;
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.answer ?? "",
      };

      setMessages((prev) => [...prev, assistantMsg]);
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
    <Card
      dir="rtl"
      className="glass flex w-full flex-col border-border bg-transparent shadow-sm"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <MessageSquare className="h-5 w-5 text-primary" />
          أسئلة AI
        </CardTitle>

        {messages.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={clearChat}
            className="gap-1.5 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            مسح
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {transcript.trim().length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/20 py-16 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              سجّل الشرح الأول من تاب (الكلام المباشر) عشان تقدر تسأل...
            </p>
          </div>
        )}

        {transcript.trim().length > 0 && (
          <>
            <div
              ref={scrollRef}
              className="max-h-100 min-h-60 space-y-3 overflow-y-auto rounded-xl border border-border bg-muted/20 p-4"
              style={{ maxHeight: "400px" }}
            >
              {messages.length === 0 && !loading && (
                <div className="space-y-4 py-8 text-center">
                  <Bot className="mx-auto h-10 w-10 text-primary/60" />
                  <p className="text-sm font-medium text-foreground">
                    اسأل أي حاجة عن المحاضرة!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    الردود هتكون مبنية على المحتوى اللي اتسجل
                  </p>
                  <div className="mx-auto grid max-w-md grid-cols-1 gap-2 pt-3 sm:grid-cols-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => ask(q)}
                        className="rounded-xl border border-border bg-background px-3 py-2 text-right text-xs font-medium transition-colors hover:bg-muted hover:text-primary"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent-1/15 text-accent-1"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-1/15 text-accent-1">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">
                      بيفكر...
                    </span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك هنا... (Enter للإرسال)"
                rows={1}
                disabled={loading}
                className="flex-1 resize-none rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                style={{ maxHeight: "120px" }}
              />
              <Button
                type="submit"
                disabled={!canAsk || input.trim().length === 0}
                className="h-auto shrink-0 gap-2 bg-linear-to-l from-primary to-accent-1 font-bold"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}