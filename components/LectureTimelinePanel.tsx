"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  Activity,
  Clock,
  TrendingUp,
  Info,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import type { RefinedChunk } from "@/hooks/useSpeechTranscription";

interface LectureTimelinePanelProps {
  refinedChunks: RefinedChunk[];
  currentTranscript: string;
}

interface TimelinePoint {
  index: number;
  label: string;
  density: number;
  wordCount: number;
  preview: string;
  elapsedSec: number;
}

export default function LectureTimelinePanel({
  refinedChunks,
  currentTranscript,
}: LectureTimelinePanelProps) {
  const points: TimelinePoint[] = React.useMemo(() => {
    if (refinedChunks.length === 0) return [];

    return refinedChunks.map((c, i) => {
      const words = c.text.trim().split(/\s+/).filter(Boolean).length;
      const elapsedSec = Math.round((c.timestamp - refinedChunks[0].timestamp) / 1000);
      const density = Math.round((words / 10) * 60); // كلمة/دقيقة (chunk = ~10s)

      return {
        index: i,
        label: formatTime(elapsedSec),
        density,
        wordCount: words,
        preview: c.text.slice(0, 100),
        elapsedSec,
      };
    });
  }, [refinedChunks]);

  const stats = React.useMemo(() => {
    if (points.length === 0) {
      return { avgDensity: 0, peakDensity: 0, peakIdx: -1, totalWords: 0, durationSec: 0 };
    }
    const totalWords = currentTranscript.split(/\s+/).filter(Boolean).length;
    const avg = Math.round(points.reduce((s, p) => s + p.density, 0) / points.length);
    const peak = Math.max(...points.map((p) => p.density));
    const peakIdx = points.findIndex((p) => p.density === peak);
    const durationSec = points[points.length - 1].elapsedSec;
    return { avgDensity: avg, peakDensity: peak, peakIdx, totalWords, durationSec };
  }, [points, currentTranscript]);

  const isEmpty = refinedChunks.length === 0;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-sky-500">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">الخط الزمني للمحاضرة</h2>
            <p className="text-[10px] text-muted-foreground">
              {isEmpty
                ? "سجّل محاضرة عشان تشوف الخريطة"
                : `${points.length} مقطع · ${formatTime(stats.durationSec)}`}
            </p>
          </div>
        </div>

        {!isEmpty && (
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            بلا LLM · مجاني
          </div>
        )}
      </div>

      <div className="p-3 sm:p-5">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-bold">في انتظار المحاضرة</p>
            <p className="max-w-md text-xs text-muted-foreground">
              لما تسجّل، هيتولّد خط زمني تلقائي يوضّح:
              <br />
              ⏱️ مدة كل جزء · 📊 كثافة الكلام · 🔥 أكثر اللحظات ازدحاماً
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                icon={Clock}
                label="المدة"
                value={formatTime(stats.durationSec)}
                color="text-sky-500"
                bg="bg-sky-500/10"
              />
              <StatCard
                icon={TrendingUp}
                label="الكثافة المتوسطة"
                value={`${stats.avgDensity} ك/د`}
                color="text-emerald-500"
                bg="bg-emerald-500/10"
              />
              <StatCard
                icon={Activity}
                label="أعلى كثافة"
                value={`${stats.peakDensity} ك/د`}
                color="text-amber-500"
                bg="bg-amber-500/10"
              />
              <StatCard
                icon={Info}
                label="إجمالي الكلمات"
                value={String(stats.totalWords)}
                color="text-violet-500"
                bg="bg-violet-500/10"
              />
            </div>

            {/* Density chart */}
            <div className="rounded-xl border border-border bg-muted/10 p-4">
              <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Activity className="h-3 w-3" />
                كثافة الكلام على مدار المحاضرة
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={points}>
                  <defs>
                    <linearGradient id="densityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3ec972" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#3ec972" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const p = payload[0].payload as TimelinePoint;
                      return (
                        <div
                          dir="rtl"
                          className="rounded-xl border border-border bg-popover p-3 text-xs shadow-xl"
                        >
                          <p className="mb-1 font-bold text-foreground">
                            ⏱️ {p.label}
                          </p>
                          <p className="text-muted-foreground">
                            {p.wordCount} كلمة · {p.density} كلمة/دقيقة
                          </p>
                          <p className="mt-2 border-t border-border pt-2 text-[10px] text-muted-foreground italic">
                            &ldquo;{p.preview}...&rdquo;
                          </p>
                        </div>
                      );
                    }}
                  />
                  {stats.peakIdx >= 0 && (
                    <ReferenceLine
                      x={points[stats.peakIdx].label}
                      stroke="#f0bb33"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="density"
                    stroke="#3ec972"
                    strokeWidth={2}
                    fill="url(#densityGrad)"
                    name="كثافة"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Segments list */}
            <div className="rounded-xl border border-border bg-muted/10 p-4">
              <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3 w-3" />
                أجزاء المحاضرة (اضغط للتنقل)
              </p>
              <div className="space-y-1.5">
                {points.map((p, i) => (
                  <motion.button
                    key={i}
                    type="button"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => {
                      // scroll transcript - placehoder: log
                      console.log("[timeline] jump to", p.label);
                    }}
                    className="group flex w-full items-start gap-3 rounded-lg border border-transparent bg-background/40 p-2.5 text-right transition-all hover:border-primary/30 hover:bg-primary/5"
                  >
                    <span className="flex h-7 shrink-0 items-center gap-1 rounded-md bg-muted px-2 text-[10px] font-mono font-bold text-foreground">
                      {p.label}
                    </span>
                    <span className="flex-1 min-w-0">
                      <p className="line-clamp-1 text-xs text-foreground">
                        {p.preview}...
                      </p>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-2.5 w-2.5" />
                      {p.density}
                    </span>
                    <ArrowLeft className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Info footer */}
            <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <p>
                <strong className="text-foreground">كثافة الكلام</strong> = عدد
                الكلمات ÷ مدة المقطع. الأجزاء عالية الكثافة غالباً فيها تفاصيل
                مهمة، والأجزاء منخفضة الكثافة ممكن تكون سؤال من طالب أو شرح
                هادي.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-1.5 flex items-center gap-2">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${bg} ${color}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className={`text-lg font-black ${color}`}>{value}</p>
    </div>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}