"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Gauge, Rabbit, Turtle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpeechSpeed } from "@/hooks/useSpeechSpeed";

interface SpeechSpeedIndicatorProps {
  speed: SpeechSpeed;
  wpm: number;
  isTracking: boolean;
  onToggle: () => void;
  collapsed?: boolean;
}

const SPEED_META: Record<
  SpeechSpeed,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  slow: {
    label: "بطيء",
    color: "text-sky-500",
    bg: "bg-sky-500",
    icon: Turtle,
  },
  normal: {
    label: "عادي",
    color: "text-emerald-500",
    bg: "bg-emerald-500",
    icon: Gauge,
  },
  fast: {
    label: "سريع",
    color: "text-rose-500",
    bg: "bg-rose-500",
    icon: Rabbit,
  },
  unknown: {
    label: "—",
    color: "text-muted-foreground",
    bg: "bg-muted-foreground/40",
    icon: Gauge,
  },
};

export default function SpeechSpeedIndicator({
  speed,
  wpm,
  isTracking,
  onToggle,
  collapsed = false,
}: SpeechSpeedIndicatorProps) {
  const meta = SPEED_META[speed];
  const Icon = meta.icon;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label={isTracking ? "إيقاف قياس السرعة" : "تشغيل قياس السرعة"}
        className="group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted"
      >
        <Icon className={cn("h-4 w-4", isTracking ? meta.color : "text-muted-foreground/40")} />
        {isTracking && speed === "fast" && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge
            className={cn(
              "h-4 w-4",
              isTracking ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span className="text-xs font-bold">سرعة الكلام</span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md text-xs transition-colors",
            isTracking
              ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          )}
          aria-label={isTracking ? "إيقاف" : "تشغيل"}
        >
          <Zap className="h-3 w-3" />
        </button>
      </div>

      {isTracking ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Icon className={cn("h-3.5 w-3.5", meta.color)} />
              <span className={cn("text-xs font-bold", meta.color)}>
                {meta.label}
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-muted-foreground">
              {wpm} ك/د
            </span>
          </div>

          {/* Speed bar */}
          <div className="flex gap-0.5">
            {["slow", "normal", "fast"].map((level) => (
              <div
                key={level}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  speed === level ? SPEED_META[level as SpeechSpeed].bg : "bg-muted"
                )}
              />
            ))}
          </div>

          {speed === "fast" && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-medium text-rose-500"
            >
              ⚡ الدكتور بيتكلم بسرعة!
            </motion.p>
          )}
        </div>
      ) : (
        <p className="text-[10px] leading-tight text-muted-foreground">
          اضغط لقياس سرعة الشرح
        </p>
      )}
    </div>
  );
}