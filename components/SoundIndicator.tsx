"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, BellOff, Volume2, Zap } from "lucide-react";
import { useSoundDetection, type SoundLevel } from "@/hooks/useSoundDetection";
import { cn } from "@/lib/utils";

const LEVEL_META: Record<
  SoundLevel,
  { label: string; color: string; bg: string; dot: string }
> = {
  quiet: {
    label: "هادئ",
    color: "text-emerald-500",
    bg: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  normal: {
    label: "نشاط",
    color: "text-amber-500",
    bg: "bg-amber-500",
    dot: "bg-amber-500",
  },
  loud: {
    label: "مرتفع",
    color: "text-orange-500",
    bg: "bg-orange-500",
    dot: "bg-orange-500",
  },
  spike: {
    label: "مفاجئ!",
    color: "text-rose-500",
    bg: "bg-rose-500",
    dot: "bg-rose-500",
  },
};

interface SoundIndicatorProps {
  collapsed?: boolean;
}

export default function SoundIndicator({ collapsed = false }: SoundIndicatorProps) {
  const {
    isMonitoring,
    isSupported,
    currentLevel,
    currentIntensity,
    alerts,
    error,
    startMonitoring,
    stopMonitoring,
  } = useSoundDetection();

  const meta = LEVEL_META[currentLevel];
  const recentSpike = alerts.length > 0 && Date.now() - alerts[0].timestamp < 3000;

  // Collapsed version — just a colored dot with pulse
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={isMonitoring ? stopMonitoring : startMonitoring}
        disabled={!isSupported}
        aria-label={isMonitoring ? "إيقاف مراقبة الصوت" : "تشغيل مراقبة الصوت"}
        className="group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted"
      >
        <span className="relative flex h-4 w-4">
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
              "relative inline-flex h-4 w-4 rounded-full",
              isMonitoring ? meta.dot : "bg-muted-foreground/40"
            )}
          />
        </span>
        {recentSpike && (
          <Zap className="absolute -top-0.5 -left-0.5 h-3 w-3 text-rose-500" />
        )}
      </button>
    );
  }

  // Expanded version — full panel
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isMonitoring ? (
            <Volume2 className={cn("h-4 w-4", meta.color)} />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-xs font-bold">
            {isMonitoring ? "مراقبة الصوت" : "الصوت متوقف"}
          </span>
        </div>
        <button
          type="button"
          onClick={isMonitoring ? stopMonitoring : startMonitoring}
          disabled={!isSupported}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md text-xs transition-colors",
            isMonitoring
              ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          )}
          aria-label={isMonitoring ? "إيقاف" : "تشغيل"}
        >
          {isMonitoring ? (
            <BellOff className="h-3 w-3" />
          ) : (
            <Bell className="h-3 w-3" />
          )}
        </button>
      </div>

      {error && (
        <p className="mb-2 text-[10px] leading-tight text-destructive">{error}</p>
      )}

      {isMonitoring && (
        <div className="space-y-2">
          {/* Level bar */}
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className={cn("h-full rounded-full", meta.bg)}
                animate={{ width: `${currentIntensity}%` }}
                transition={{ duration: 0.15 }}
              />
            </div>
            <span className={cn("font-mono text-[10px] font-bold", meta.color)}>
              {currentIntensity}%
            </span>
          </div>

          {/* Status text */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  meta.dot
                )}
              />
              <span
                className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", meta.dot)}
              />
            </span>
            <span className={cn("text-[10px] font-bold", meta.color)}>
              {meta.label}
            </span>
          </div>

          {/* Recent spike */}
          <AnimatePresence>
            {recentSpike && alerts[0] && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-2 py-1.5"
              >
                <Zap className="h-3 w-3 text-rose-500" />
                <span className="text-[10px] font-bold text-rose-500">
                  صوت مفاجئ!
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {!isMonitoring && !error && (
        <p className="text-[10px] leading-tight text-muted-foreground">
          اضغط لتفعيل المراقبة
        </p>
      )}
    </div>
  );
}