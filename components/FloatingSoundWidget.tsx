"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, X } from "lucide-react";
import SoundIndicator from "@/components/SoundIndicator";

export default function FloatingSoundWidget() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="pointer-events-none fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-auto ml-0 w-60 overflow-hidden rounded-r-2xl border border-l-0 border-border bg-card shadow-xl"
            dir="rtl"
          >
            <div className="flex h-9 items-center justify-between border-b border-border px-3">
              <span className="text-xs font-bold text-foreground">مراقبة الصوت</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-2">
              <SoundIndicator />
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="فتح مراقبة الصوت"
            title="مراقبة الصوت"
            className="pointer-events-auto group relative flex h-20 w-2 items-center justify-center rounded-r-full border border-l-0 border-border bg-card transition-all hover:w-8 hover:bg-primary hover:text-primary-foreground"
          >
            <Volume2
              className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              strokeWidth={1.75}
            />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
