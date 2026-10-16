"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, X } from "lucide-react";
import SoundIndicator from "@/components/SoundIndicator";

export default function FloatingSoundWidget() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="pointer-events-none fixed right-0 top-24 z-40 hidden lg:block">
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto w-60 overflow-hidden rounded-l-xl border border-r-0 border-border bg-card shadow-xl"
            dir="rtl"
          >
            <div className="flex h-9 items-center justify-between border-b border-border px-3">
              <span className="text-xs font-bold">مراقبة الصوت</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <div className="p-2">
              <SoundIndicator />
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="strip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="مراقبة الصوت"
            title="مراقبة الصوت"
            className="pointer-events-auto group flex h-20 w-1.5 items-center justify-center rounded-l-full border border-r-0 border-border bg-border transition-all duration-200 hover:w-9 hover:bg-primary"
          >
            <Volume2 className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-primary-foreground" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
