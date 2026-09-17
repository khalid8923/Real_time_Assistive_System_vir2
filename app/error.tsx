"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-destructive/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass relative z-10 mx-auto max-w-md space-y-6 rounded-3xl border border-border p-8 text-center shadow-2xl"
      >
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-destructive/30 bg-destructive/10">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            حصلت مشكلة غير متوقعة
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            في حاجة غلط حصلت في التطبيق. جرّب تعيد تحميل الصفحة أو ترجع للرئيسية.
          </p>
          {error.digest && (
            <p className="font-mono text-[10px] text-muted-foreground/60">
              Reference: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            <RefreshCw className="h-4 w-4" />
            حاول تاني
          </button>
          <Link
            href="/"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 text-sm font-bold transition-colors hover:bg-muted"
          >
            <Home className="h-4 w-4" />
            الرئيسية
          </Link>
        </div>
      </motion.div>
    </div>
  );
}