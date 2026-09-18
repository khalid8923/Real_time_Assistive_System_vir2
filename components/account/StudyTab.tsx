"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  BookOpen,
  Layers,
  Trash2,
  Loader2,
  Star,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getMyGlossary,
  deleteGlossary,
  getMyFlashcards,
  deleteCard,
} from "@/app/actions/study";
import type {
  SavedGlossaryItem,
  FlashcardProgress,
} from "@/lib/db";

export default function StudyTab() {
  const [glossary, setGlossary] = React.useState<SavedGlossaryItem[]>([]);
  const [cards, setCards] = React.useState<FlashcardProgress[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const [g, c] = await Promise.all([getMyGlossary(), getMyFlashcards()]);
      setGlossary(g);
      setCards(c);
      setLoading(false);
    })();
  }, []);

  const handleDeleteGlossary = async (id: string) => {
    const res = await deleteGlossary(id);
    if (res.ok) {
      setGlossary((prev) => prev.filter((x) => x.id !== id));
      toast.success("تم الحذف");
    }
  };

  const handleDeleteCard = async (id: string) => {
    const res = await deleteCard(id);
    if (res.ok) {
      setCards((prev) => prev.filter((x) => x.id !== id));
      toast.success("تم الحذف");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* GLOSSARY */}
      <section className="rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                معجمي الشخصي
              </h2>
              <p className="text-[10px] text-muted-foreground">
                {glossary.length} مصطلح محفوظ
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {glossary.length === 0 ? (
            <EmptyState
              icon={Star}
              title="مفيش مصطلحات محفوظة بعد"
              description="احفظ المصطلحات من صفحة المعجم"
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {glossary.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group relative rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:border-primary/40"
                >
                  <button
                    type="button"
                    onClick={() => handleDeleteGlossary(item.id)}
                    aria-label="حذف"
                    className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>

                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-accent-1 text-xs font-black text-white">
                      {item.term.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="truncate text-sm font-bold text-foreground">
                      {item.term}
                    </h3>
                  </div>
                  <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {item.definition}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FLASHCARDS */}
      <section className="rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Layers className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                كروت المراجعة
              </h2>
              <p className="text-[10px] text-muted-foreground">
                {cards.length} كرت محفوظ
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {cards.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="مفيش كروت محفوظة بعد"
              description="احفظ الكروت من صفحة كروت المراجعة"
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {cards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group relative rounded-xl border border-border bg-muted/20 p-4"
                >
                  <button
                    type="button"
                    onClick={() => handleDeleteCard(card.id)}
                    aria-label="حذف"
                    className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>

                  <p className="mb-2 pr-6 text-xs font-bold text-foreground">
                    {card.question}
                  </p>
                  <p className="mb-3 line-clamp-2 text-[11px] text-muted-foreground">
                    {card.answer}
                  </p>

                  {/* Mastery bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        الإتقان
                      </span>
                      <span
                        className={cn(
                          card.masteryLevel >= 70
                            ? "text-emerald-500"
                            : card.masteryLevel >= 40
                            ? "text-amber-500"
                            : "text-rose-500"
                        )}
                      >
                        {card.masteryLevel}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          card.masteryLevel >= 70
                            ? "bg-emerald-500"
                            : card.masteryLevel >= 40
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        )}
                        style={{ width: `${card.masteryLevel}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
      <Icon className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}