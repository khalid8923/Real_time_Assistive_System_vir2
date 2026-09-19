"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { PanelLeft, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import AppSidebar from "@/components/AppSidebar";
import { STUDENT_FEATURES, type FeatureId } from "@/lib/features";
import { useSession } from "@/lib/auth-client";

export type ViewMode = "student" | "teacher";

interface AppShellProps {
  children: React.ReactNode;
  activeFeature: FeatureId;
  onFeatureChange: (id: FeatureId) => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isLive?: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenLectures?: () => void;
}

export default function AppShell({
  children,
  activeFeature,
  onFeatureChange,
  view,
  onViewChange,
  isLive = true,
  sidebarOpen,
  onToggleSidebar,
  onOpenLectures,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [headerHidden, setHeaderHidden] = React.useState(false);
  const [lastY, setLastY] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);

  const { data: session } = useSession();

  // ✅ Avoid hydration mismatch — only render user UI after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY;
      if (goingDown && y > 120) setHeaderHidden(true);
      else setHeaderHidden(false);
      setLastY(y);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastY]);

  const user = session?.user as { name?: string } | undefined;
  const mobileFeatures = STUDENT_FEATURES.slice(0, 6);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      {/* HEADER */}
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: headerHidden ? -100 : 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="القائمة"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            >
              <PanelLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="CaptionBridge"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl shadow-sm"
                priority
              />
              <div className="hidden leading-tight sm:flex sm:flex-col">
                <span className="text-sm font-bold tracking-tight">
                  CaptionBridge
                </span>
                <span className="text-[10px] text-muted-foreground">
                  رفيقك الذكي في المحاضرات الجامعية
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              aria-live="polite"
              className={cn(
                "hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium sm:flex",
                isLive
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "border-border bg-muted text-muted-foreground"
              )}
            >
              <span className="relative flex h-2 w-2">
                {isLive && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                )}
                <span
                  className={cn(
                    "relative inline-flex h-2 w-2 rounded-full",
                    isLive ? "bg-rose-500" : "bg-muted-foreground/50"
                  )}
                />
              </span>
              {isLive ? "مباشر" : "متوقف"}
            </Badge>

            <ThemeSwitcher />

            <div
              role="group"
              aria-label="تبديل واجهة التطبيق"
              className="flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5"
            >
              <button
                type="button"
                onClick={() => onViewChange("student")}
                aria-pressed={view === "student"}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  view === "student"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                طالب
              </button>
              <button
                type="button"
                onClick={() => onViewChange("teacher")}
                aria-pressed={view === "teacher"}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  view === "teacher"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                دكتور
              </button>
            </div>

            {/* ✅ Account button — render only after mount to avoid hydration mismatch */}
            {mounted && user && (
              <Link
                href="/account"
                aria-label="حسابي"
                title="حسابي"
                className="group flex items-center gap-2 rounded-full border border-border bg-background p-0.5 pl-3 transition-colors hover:border-primary/40 hover:bg-muted"
              >
                <span className="hidden text-xs font-bold text-foreground sm:block">
                  {user.name?.split(" ")[0] || "حسابي"}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-primary to-accent-1 text-xs font-black text-white shadow-sm">
                  {(user.name || "؟").charAt(0).toUpperCase()}
                </span>
              </Link>
            )}
          </div>
        </div>
      </motion.header>

      {/* BODY */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {view === "student" && (
          <AppSidebar
            activeFeature={activeFeature}
            onFeatureChange={onFeatureChange}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            onOpenLectures={onOpenLectures}
          />
        )}

        <main className="flex-1 min-w-0">
          <motion.div
            key={`${view}-${activeFeature}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* MOBILE NAV */}
      {view === "student" && (
        <nav
          dir="rtl"
          className="sticky bottom-0 z-40 w-full border-t border-border bg-background/95 backdrop-blur-xl lg:hidden"
        >
          <div className="flex items-center gap-1 overflow-x-auto px-2 py-2 no-scrollbar">
            {mobileFeatures.map((feature) => {
              const Icon = feature.icon;
              const active = feature.id === activeFeature;
              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => onFeatureChange(feature.id)}
                  className={cn(
                    "flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">
                    {feature.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}