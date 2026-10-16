"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, X, MicOff } from "lucide-react";
import { useSoundDetection, type SoundLevel } from "@/hooks/useSoundDetection";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "cb_sound_widget_v1";

const LEVEL_META: Record<
  SoundLevel,
  { label: string; bar: string; dot: string; text: string }
> = {
  quiet: {
    label: "هادئ",
    bar: "from-emerald-500 to-emerald-400",
    dot: "bg-emerald-500",
    text: "text-emerald-500",
  },
  normal: {
    label: "نشاط",
    bar: "from-amber-500 to-amber-400",
    dot: "bg-amber-500",
    text: "text-amber-500",
  },
  loud: {
    label: "مرتفع",
    bar: "from-orange-500 to-orange-400",
    dot: "bg-orange-500",
    text: "text-orange-500",
  },
  spike: {
    label: "مفاجئ",
    bar: "from-rose-500 to-rose-400",
    dot: "bg-rose-500",
    text: "text-rose-500",
  },
};

export default function FloatingSoundWidget() {
  const [expanded, setExpanded] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const autoStartTried = React.useRef(false);

  const {
    isMonitoring,
    isSupported,
    currentLevel,
    currentIntensity,
    error,
    startMonitoring,
    stopMonitoring,
  } = useSoundDetection();

  React.useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem(STORAGE_KEY) === "hidden") setHidden(true);
    } catch {
      /* ignore */
    }
  }, []);

  // Auto-start if mic permission already granted
  React.useEffect(() => {
    if (!mounted || hidden || !isSupported || autoStartTried.current) return;
    if (isMonitoring) {
      autoStartTried.current = true;
      return;
    }
    autoStartTried.current = true;

    (async () => {
      try {
        const nav = navigator as Navigator & { permissions?: Permissions };
        if (nav.permissions) {
          const status = await nav.permissions.query({
            name: "microphone" as PermissionName,
          });
          if (status.state === "granted") {
            await startMonitoring();
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }, [mounted, hidden, isSupported, isMonitoring, startMonitoring]);

  const handleHide = () => {
    stopMonitoring();
    setHidden(true);
    try {
      localStorage.setItem(STORAGE_KEY, "hidden");
    } catch {
      /* ignore */
    }
  };

  const handleRestore = () => {
    setHidden(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  if (!mounted || !isSupported) return null;

  // ============ HIDDEN: small restore tab ============
  if (hidden) {
    return (
      <button
        type="button"
        onClick={handleRestore}
        aria-label="إظهار مراقبة الصوت"
        title="إظهار مراقبة الصوت"
        className="pointer-events-auto fixed left-0 top-24 z-40 flex h-10 w-6 items-center justify-center rounded-e-lg border border-s-0 border-border bg-background/95 text-muted-foreground shadow-md backdrop-blur transition-colors hover:bg-muted hover:text-foreground"
      >
        <Volume2 className="size-3" />
      </button>
    );
  }

  const meta = LEVEL_META[currentLevel];

  return (
    <div className="pointer-events-none fixed left-0 top-24 z-40">
      <AnimatePresence mode="wait" initial={false}>
        {!expanded ? (
          // ============ COLLAPSED: vertical strip ============
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="فتح مراقبة الصوت"
            className="pointer-events-auto flex flex-col items-center gap-2 rounded-e-2xl border border-s-0 border-border bg-background/95 px-2 py-3 shadow-lg backdrop-blur-md"
          >
            {/* Status dot */}
            <span className="relative flex size-2.5">
              {isMonitoring && (
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                    meta.dot
                  )}
                />
              )}
              <span
                className={cn(
                  "relative inline-flex size-2.5 rounded-full",
                  isMonitoring ? meta.dot : "bg-muted-foreground/40"
                )}
              />
            </span>

            {/* Vertical label */}
            <span
              className="text-[9px] font-bold text-muted-foreground"
              style={{ writingMode: "vertical-rl" }}
            >
              صوت
            </span>

            {/* Meter */}
            <div className="relative h-24 w-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className={cn(
                  "absolute inset-x-0 bottom-0 rounded-full bg-gradient-to-t",
                  meta.bar
                )}
                animate={{
                  height: isMonitoring ? `${currentIntensity}%` : "0%",
                }}
                transition={{ duration: 0.12, ease: "easeOut" }}
              />
            </div>

            <Volume2
              className={cn(
                "size-3.5",
                isMonitoring ? meta.text : "text-muted-foreground"
              )}
            />
          </motion.button>
        ) : (
          // ============ EXPANDED: full panel ============
          <motion.div
            key="expanded"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            dir="rtl"
            className="pointer-events-auto w-60 overflow-hidden rounded-e-2xl border border-s-0 border-border bg-background/95 shadow-2xl backdrop-blur"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
              <div className="flex items-center gap-2">
                <Volume2 className={cn("size-3.5", meta.text)} />
                <span className="text-xs font-bold">مراقبة الصوت</span>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="طيّ"
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3">
              {error && (
                <p className="mb-2 rounded-md bg-destructive/10 px-2 py-1.5 text-[10px] font-medium text-destructive">
                  {error}
                </p>
              )}

              {isMonitoring ? (
                <div className="flex items-center gap-3">
                  <div className="relative h-28 w-6 overflow-hidden rounded-lg border border-border bg-muted">
                    <motion.div
                      className={cn(
                        "absolute inset-x-0 bottom-0 rounded-t bg-gradient-to-t",
                        meta.bar
                      )}
                      animate={{ height: `${currentIntensity}%` }}
                      transition={{ duration: 0.12, ease: "easeOut" }}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="mb-1 flex items-baseline gap-1">
                      <span
                        className={cn(
                          "text-2xl font-black tabular-nums",
                          meta.text
                        )}
                      >
                        {currentIntensity}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        %
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("size-1.5 rounded-full", meta.dot)} />
                      <span className={cn("text-xs font-bold", meta.text)}>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startMonitoring}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  تشغيل المراقبة
                </button>
              )}

              <div className="mt-3 flex items-center gap-2">
                {isMonitoring && (
                  <button
                    type="button"
                    onClick={stopMonitoring}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] font-bold text-foreground transition-colors hover:bg-muted"
                  >
                    <MicOff className="size-3" />
                    إيقاف
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleHide}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-[11px] font-bold text-destructive transition-colors hover:bg-destructive/15"
                >
                  <X className="size-3" />
                  إخفاء
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}