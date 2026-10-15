"use client";

import React from "react";
import { motion } from "motion/react";
import { BookOpen, Sparkles } from "lucide-react";

export interface GlossaryTerm {
  term: string;
  definition: string;
}

interface GlossaryPanelProps {
  terms: GlossaryTerm[];
  /** Kept for API compatibility — quick actions now live in the AppShell dock. */
  onAction?: (action: "ask" | "re-explain") => void;
}

export default function GlossaryPanel({ terms }: GlossaryPanelProps) {
  return (
    <div dir="rtl" className="space-y-4">
      <div className="rounded-md border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-wash">
              <BookOpen className="size-3.5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-serif text-[15px] font-bold leading-tight">
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

        <div className="p-3">
          {terms.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-10 text-center">
              <Sparkles className="size-6 text-muted-foreground/50" strokeWidth={1.5} />
              <p className="text-xs text-muted-foreground">
                سجّل محاضرة عشان تظهر المصطلحات هنا
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {terms.map((item, index) => (
                <motion.div
                  key={`${item.term}-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                  className="rounded-md border bg-card p-3 transition-colors hover:border-foreground/30"
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-primary text-[11px] font-bold text-primary-foreground">
                      {item.term.charAt(0).toUpperCase()}
                    </span>
                    <h3 className="text-[13px] font-bold leading-tight">
                      {item.term}
                    </h3>
                  </div>
                  <p className="text-[12px] leading-relaxed text-muted-foreground">
                    {item.definition}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}