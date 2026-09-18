"use client";

import React from "react";
import { motion } from "motion/react";
import { BookOpen, Hand, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GlossaryTerm {
  term: string;
  definition: string;
}

interface GlossaryPanelProps {
  terms: GlossaryTerm[];
  onAction: (action: "ask" | "re-explain") => void;
}

export default function GlossaryPanel({ terms, onAction }: GlossaryPanelProps) {
  return (
    <div dir="rtl" className="space-y-4">
      {/* ==================== TERMS ==================== */}
      <div className="rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                المعجم الأكاديمي
              </h2>
              <p className="text-[10px] text-muted-foreground">
                {terms.length > 0
                  ? `${terms.length} مصطلح`
                  : "لا توجد مصطلحات بعد"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {terms.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                سجّل محاضرة عشان تظهر المصطلحات هنا
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {terms.map((item, index) => (
                <motion.div
                  key={`${item.term}-${index}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.3 }}
                  className="group rounded-xl border border-border bg-muted/20 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/40 hover:shadow-sm"
                >
                  <div className="mb-2 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-accent-1 text-sm font-black text-white shadow-sm">
                      {item.term.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="text-sm font-bold leading-tight text-foreground">
                      {item.term}
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {item.definition}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==================== QUICK ACTIONS ==================== */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">إجراءات سريعة</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            onClick={() => onAction("ask")}
            className="group h-16 gap-3 bg-linear-to-l from-amber-500 to-orange-500 text-base font-bold text-white shadow-md transition-transform hover:scale-[1.02] hover:from-amber-600 hover:to-orange-600"
          >
            <Hand className="h-5 w-5 transition-transform group-hover:rotate-12" />
            عايز أسأل ✋
          </Button>
          <Button
            type="button"
            onClick={() => onAction("re-explain")}
            className="group h-16 gap-3 bg-linear-to-l from-teal-600 to-emerald-600 text-base font-bold text-white shadow-md transition-transform hover:scale-[1.02] hover:from-teal-700 hover:to-emerald-700"
          >
            <RefreshCw className="h-5 w-5 transition-transform group-hover:rotate-180" />
            أعد الشرح 🔄
          </Button>
        </div>
      </div>
    </div>
  );
}