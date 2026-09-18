"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, BellOff, Volume2, Zap } from "lucide-react";
import { useSoundDetection, type SoundLevel } from "@/hooks/useSoundDetection";
import { cn } from "@/lib/utils";

const LEVEL_META: Record<
  SoundLevel,
  { label: string; color: string; barColor: string; dot: string }
> = {
  quiet: {
    label: "هادئ",
    color: "text-emerald-500",
    barColor: "from-emerald-500 to-emerald-400",
    dot: "bg-emerald-500",
  },
  normal: {
    label: "نشاط",
    color: "text-amber-500",
    barColor: "from-amber-500 to-amber-400",
    dot: "bg-amber-500",
  },
  loud: {
    label: "مرتفع",
    color: "text-orange-500",
    barColor: "from-orange-500 to-orange-400",
    dot: "bg-orange-500",
  },
  spike: {
    label: "مفاجئ!",
    color: "text-rose-500",
    barColor: "from-rose-500 to-rose-400",
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

  // Collapsed version — colored dot
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

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
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
        <p className="mb-2 text-[10px] leading-tight text-destructive">
          {error}
        </p>
      )}

      {isMonitoring && (
        <div className="flex gap-3">
          {/* ====== VERTICAL METER ====== */}
          <div className="relative h-40 w-8 overflow-hidden rounded-lg border border-border bg-background">
            {/* Thresholds lines */}
            <div className="absolute inset-x-0 bottom-[70%] h-px bg-orange-500/30" />
            <div className="absolute inset-x-0 bottom-[45%] h-px bg-amber-500/30" />
            <div className="absolute inset-x-0 bottom-[15%] h-px bg-emerald-500/30" />

            {/* Fill bar */}
            <motion.div
              className={cn(
                "absolute inset-x-0 bottom-0 rounded-t-sm bg-linear-to-t",
                meta.barColor
              )}
              animate={{ height: `${currentIntensity}%` }}
              transition={{ duration: 0.12, ease: "easeOut" }}
            />

            {/* Peak indicator */}
            <motion.div
              className="absolute inset-x-0 h-0.5 bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
              animate={{ bottom: `${currentIntensity}%` }}
              transition={{ duration: 0.12, ease: "easeOut" }}
            />
          </div>

          {/* ====== Info side ====== */}
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <div className="mb-1 flex items-baseline gap-1">
                <span
                  className={cn("text-2xl font-black tabular-nums", meta.color)}
                >
                  {currentIntensity}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">
                  %
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className={cn(
                      "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                      meta.dot
                    )}
                  />
                  <span
                    className={cn(
                      "relative inline-flex h-1.5 w-1.5 rounded-full",
                      meta.dot
                    )}
                  />
                </span>
                <span className={cn("text-[10px] font-bold", meta.color)}>
                  {meta.label}
                </span>
              </div>
            </div>

            {/* Recent spike alert */}
            <AnimatePresence>
              {recentSpike && alerts[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.9 }}
                  className="flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-2 py-1.5"
                >
                  <Zap className="h-3 w-3 shrink-0 text-rose-500" />
                  <span className="text-[10px] font-bold text-rose-500">
                    صوت مفاجئ
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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