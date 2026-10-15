"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, X } from "lucide-react";
import SoundIndicator from "@/components/SoundIndicator";

export default function FloatingSoundWidget() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="pointer-events-none fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-auto w-52 overflow-hidden rounded-md border bg-chrome shadow-md"
            dir="rtl"
          >
            <div className="flex h-8 items-center justify-between border-b px-2.5">
              <span className="text-[11px] font-bold">مراقبة الصوت</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
              >
                <X className="size-3" strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-2">
              <SoundIndicator />
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="فتح مراقبة الصوت"
            title="مراقبة الصوت"
            className="pointer-events-auto flex size-10 items-center justify-center rounded-md border bg-chrome text-muted-foreground shadow-sm transition-colors hover:bg-hover hover:text-foreground"
          >
            <Volume2 className="size-4" strokeWidth={1.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}