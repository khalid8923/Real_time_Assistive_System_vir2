"use client";

import { motion, AnimatePresence } from "motion/react";
import { Clock, LogOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InactivityWarningProps {
  show: boolean;
  secondsLeft: number;
  onStay: () => void;
  onLogout: () => void;
}

export default function InactivityWarning({
  show,
  secondsLeft,
  onStay,
  onLogout,
}: InactivityWarningProps) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="inactivity-title"
          aria-describedby="inactivity-desc"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.25 }}
            className="glass w-full max-w-md space-y-5 rounded-3xl border border-border p-6 text-center shadow-2xl"
            dir="rtl"
          >
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-500/40 bg-amber-500/15">
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h3
                id="inactivity-title"
                className="text-xl font-bold text-foreground"
              >
                لسه موجود؟
              </h3>
              <p
                id="inactivity-desc"
                className="text-sm leading-relaxed text-muted-foreground"
              >
                مش لاحظنا أي نشاط منك. هنسجّل خروجك تلقائياً بعد:
              </p>
            </div>

            <div
              aria-live="polite"
              className="mx-auto flex h-20 w-40 items-center justify-center rounded-2xl border border-border bg-muted/30 font-mono text-4xl font-bold tracking-wider text-foreground"
            >
              {formatted}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <Button
                type="button"
                onClick={onStay}
                className="h-11 flex-1 gap-2 bg-linear-to-l from-primary to-accent-1 font-bold"
              >
                <RotateCw className="h-4 w-4" />
                أيوة، كمّل
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onLogout}
                className="h-11 flex-1 gap-2"
              >
                <LogOut className="h-4 w-4" />
                سجّل خروج دلوقتي
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}