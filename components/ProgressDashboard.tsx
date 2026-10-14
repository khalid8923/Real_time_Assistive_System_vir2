"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Loader2,
  Activity,
} from "lucide-react";
import type { UserStats } from "@/lib/db/queries";

interface TimelinePoint {
  date: string;
  label: string;
  lectures: number;
  words: number;
}

interface ProgressDashboardProps {
  stats: UserStats | null;
}

const COLORS = ["#8470ff", "#67bfff", "#3ec972", "#f0bb33", "#ff5656"];

export default function ProgressDashboard({ stats }: ProgressDashboardProps) {
  const [timeline, setTimeline] = React.useState<TimelinePoint[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/stats/timeline");
        if (res.ok) {
          const data = await res.json();
          setTimeline(data.timeline ?? []);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasActivity = timeline.some((p) => p.lectures > 0 || p.words > 0);

  // بيانات Pie
  const pieData = stats
    ? [
        { name: "محاضرات", value: stats.totalLectures },
        { name: "مصطلحات", value: stats.totalGlossary },
        { name: "كروت", value: stats.totalFlashcards },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-4">
      {/* الخط الزمني — Area Chart */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-5 shadow-xs"
      >
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">النشاط (آخر 30 يوم)</h3>
            <p className="text-[10px] text-muted-foreground">
              عدد الكلمات المكتوبة يومياً
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !hasActivity ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
            <p className="text-sm text-muted-foreground">
              مفيش نشاط في آخر 30 يوم
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8470ff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8470ff" stopOpacity={0} />
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
                contentStyle={{
                  background: "#1f2937",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                  direction: "rtl",
                }}
                labelStyle={{ color: "#f3f4f6", fontWeight: "bold" }}
              />
              <Area
                type="monotone"
                dataKey="words"
                stroke="#8470ff"
                strokeWidth={2}
                fill="url(#colorWords)"
                name="كلمات"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Grid: Bar Chart + Pie Chart */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Bar Chart — المحاضرات اليومية */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border bg-card p-5 shadow-xs"
        >
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-2/15">
              <BarChart3 className="h-4 w-4 text-accent-2" />
            </div>
            <div>
              <h3 className="text-sm font-bold">المحاضرات اليومية</h3>
              <p className="text-[10px] text-muted-foreground">
                عدد المحاضرات المسجلة
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={timeline.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: "#9ca3af" }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#1f2937",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                    direction: "rtl",
                  }}
                  cursor={{ fill: "rgba(132,112,255,0.08)" }}
                />
                <Bar dataKey="lectures" fill="#67bfff" radius={[6, 6, 0, 0]} name="محاضرات" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Pie Chart — توزيع المحتوى */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-5 shadow-xs"
        >
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <PieIcon className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold">توزيع المحتوى</h3>
              <p className="text-[10px] text-muted-foreground">
                محاضرات / مصطلحات / كروت
              </p>
            </div>
          </div>

          {pieData.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">مفيش بيانات بعد</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#1f2937",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      fontSize: 12,
                      direction: "rtl",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-2 flex flex-wrap justify-center gap-3 text-[10px]">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-muted-foreground">
                      {d.name}: <strong className="text-foreground">{d.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}