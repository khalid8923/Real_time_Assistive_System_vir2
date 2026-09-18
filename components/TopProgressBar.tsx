"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

type Listener = (active: boolean) => void;
const listeners = new Set<Listener>();
let pendingCount = 0;

function emit(active: boolean) {
  listeners.forEach((fn) => fn(active));
}

export const progress = {
  start() {
    pendingCount++;
    if (pendingCount === 1) emit(true);
  },
  done() {
    pendingCount = Math.max(0, pendingCount - 1);
    if (pendingCount === 0) emit(false);
  },
  reset() {
    pendingCount = 0;
    emit(false);
  },
  async track<T>(promise: Promise<T>): Promise<T> {
    this.start();
    try {
      return await promise;
    } finally {
      this.done();
    }
  },
};

export default function TopProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = React.useState(false);
  const [progressValue, setProgressValue] = React.useState(0);
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const startProgress = React.useCallback(() => {
    clearTimers();
    setVisible(true);
    setProgressValue(8);

    const steps = [22, 42, 62, 78, 88];
    steps.forEach((value, index) => {
      const t = setTimeout(() => {
        setProgressValue((prev) => (prev < value ? value : prev));
      }, 150 * (index + 1));
      timersRef.current.push(t);
    });
  }, []);

  const finishProgress = React.useCallback(() => {
    clearTimers();
    setProgressValue(100);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setProgressValue(0), 250);
    }, 220);
    timersRef.current.push(t);
  }, []);

  React.useEffect(() => {
    const listener: Listener = (active) => {
      if (active) startProgress();
      else finishProgress();
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [startProgress, finishProgress]);

  React.useEffect(() => {
    startProgress();
    const t = setTimeout(() => finishProgress(), 400);
    return () => clearTimeout(t);
  }, [pathname, startProgress, finishProgress]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="top-progress"
          role="progressbar"
          aria-label="جاري التحميل"
          aria-valuenow={progressValue}
          aria-valuemin={0}
          aria-valuemax={100}
          className="pointer-events-none fixed inset-x-0 top-0 z-100 h-0.75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="h-full bg-linear-to-l from-primary via-accent-1 to-accent-2 shadow-[0_0_10px_rgba(132,112,255,0.6)]"
            animate={{ width: `${progressValue}%` }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}