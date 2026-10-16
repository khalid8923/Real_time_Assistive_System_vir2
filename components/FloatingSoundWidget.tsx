"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, X } from "lucide-react";
import SoundIndicator from "@/components/SoundIndicator";

export default function FloatingSoundWidget() {
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  return (
    <div className="pointer-events-none fixed left-0 top-24 z-40 hidden lg:block">
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto w-60 overflow-hidden rounded-l-none rounded-r-xl border border-l-0 border-border bg-card shadow-xl"
            dir="rtl"
          >
            <div className="flex h-9 items-center justify-between border-b border-border px-3">
              <div className="flex items-center gap-1.5">
                <Volume2 className="size-3.5 text-primary" strokeWidth={1.75} />
                <span className="text-xs font-bold text-foreground">مراقبة الصوت</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="p-2">
              <SoundIndicator />
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="strip"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            type="button"
            onClick={() => setOpen(true)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label="فتح مراقبة الصوت"
            title="مراقبة الصوت"
            className="pointer-events-auto group relative flex h-20 w-1.5 items-center justify-center rounded-r-full border border-l-0 border-border bg-border transition-all duration-200 hover:w-8 hover:bg-primary"
          >
            <Volume2
              className="size-3.5 shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:text-primary-foreground"
              strokeWidth={2}
            />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
