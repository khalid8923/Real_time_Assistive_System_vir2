"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  BellOff,
  Loader2,
  Trash2,
  Volume2,
  VolumeX,
  Waves,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSoundDetection, type SoundLevel } from "@/hooks/useSoundDetection";

const LEVEL_META: Record<
  SoundLevel,
  { label: string; color: string; bg: string; width: string }
> = {
  quiet: {
    label: "هادئ",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500",
    width: "25%",
  },
  normal: {
    label: "نشاط عادي",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500",
    width: "55%",
  },
  loud: {
    label: "صوت مرتفع",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500",
    width: "80%",
  },
  spike: {
    label: "صوت مفاجئ",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500",
    width: "100%",
  },
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function SoundsPanel() {
  const {
    isMonitoring,
    isSupported,
    currentLevel,
    currentIntensity,
    alerts,
    error,
    startMonitoring,
    stopMonitoring,
    clearAlerts,
  } = useSoundDetection();

  const meta = LEVEL_META[currentLevel];

  return (
    <Card
      dir="rtl"
      className="glass w-full border-border bg-transparent shadow-sm"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Bell className="h-5 w-5 text-primary" />
          التنبيهات الصوتية
        </CardTitle>

        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={clearAlerts}
              className="gap-1.5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              مسح
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            disabled={!isSupported}
            variant={isMonitoring ? "destructive" : "default"}
            className={
              isMonitoring
                ? "gap-2 text-xs font-bold"
                : "gap-2 bg-linear-to-l from-primary to-accent-1 text-xs font-bold"
            }
          >
            {isMonitoring ? (
              <>
                <BellOff className="h-3.5 w-3.5" />
                إيقاف المراقبة
              </>
            ) : (
              <>
                <Bell className="h-3.5 w-3.5" />
                ابدأ المراقبة
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {!isMonitoring && alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/20 py-16 text-center">
            <Waves className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              اضغط على (ابدأ المراقبة) عشان نراقب الأصوات المفاجئة
            </p>
            <p className="text-xs text-muted-foreground/70">
              (باب، جرس، تليفون...)
            </p>
          </div>
        )}

        {isMonitoring && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 rounded-2xl border border-border bg-muted/20 p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentIntensity > 5 ? (
                  <Volume2 className={`h-5 w-5 ${meta.color}`} />
                ) : (
                  <VolumeX className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={`text-sm font-bold ${meta.color}`}>
                  {meta.label}
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-foreground">
                {currentIntensity}%
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className={`h-full rounded-full ${meta.bg}`}
                animate={{ width: `${currentIntensity}%` }}
                transition={{ duration: 0.15 }}
              />
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              جارٍ المراقبة...
            </div>
          </motion.div>
        )}

        {alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Zap className="h-4 w-4 text-rose-500" />
              التنبيهات الأخيرة ({alerts.length})
            </h4>
            <div
              className="space-y-2 overflow-y-auto"
              style={{ maxHeight: "300px" }}
            >
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20">
                      <Zap className="h-4 w-4 text-rose-500" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        صوت مفاجئ
                      </p>
                      <p className="text-xs text-muted-foreground">
                        الشدة: {alert.intensity}%
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatTime(alert.timestamp)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}