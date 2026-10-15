"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import AppSidebar from "@/components/AppSidebar";
import FloatingSoundWidget from "@/components/FloatingSoundWidget";
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
  /** @deprecated kept for compatibility; unused */
  sidebarOpen?: boolean;
  /** @deprecated kept for compatibility; unused */
  onToggleSidebar?: () => void;
  onOpenLectures?: () => void;
  footer?: React.ReactNode;
}

export default function AppShell({
  children,
  activeFeature,
  onFeatureChange,
  view,
  onViewChange,
  isLive = true,
  onOpenLectures,
  footer,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { data: session } = useSession();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const user = session?.user as { name?: string } | undefined;
  const mobileFeatures = STUDENT_FEATURES.slice(0, 6);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b bg-chrome/95 backdrop-blur-md">
        <div className="mx-auto flex h-11 w-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="CaptionBridge"
                width={28}
                height={28}
                className="size-7 rounded-md"
                priority
              />
              <span className="font-serif text-base font-bold leading-none" dir="ltr">
                CaptionBridge
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div
              role="status"
              className="hidden items-center gap-1.5 text-xs sm:flex"
            >
              <span
                aria-hidden
                className={cn(
                  "size-2 rounded-[2px]",
                  isLive ? "bg-destructive" : "bg-muted-foreground"
                )}
              />
              <span>{isLive ? "مباشر" : "متوقف"}</span>
            </div>

            <ThemeSwitcher />

            <div
              role="group"
              aria-label="تبديل واجهة التطبيق"
              className="flex items-center overflow-hidden rounded-md border border-input"
            >
              <button
                type="button"
                onClick={() => onViewChange("student")}
                aria-pressed={view === "student"}
                className={cn(
                  "h-7 px-2.5 text-xs font-medium transition-colors",
                  view === "student"
                    ? "bg-wash text-primary"
                    : "text-muted-foreground hover:bg-hover hover:text-foreground"
                )}
              >
                طالب
              </button>
              <button
                type="button"
                onClick={() => onViewChange("teacher")}
                aria-pressed={view === "teacher"}
                className={cn(
                  "h-7 border-s border-input px-2.5 text-xs font-medium transition-colors",
                  view === "teacher"
                    ? "bg-wash text-primary"
                    : "text-muted-foreground hover:bg-hover hover:text-foreground"
                )}
              >
                دكتور
              </button>
            </div>

            {mounted && user && (
              <Link
                href="/account"
                aria-label="حسابي"
                title="حسابي"
                className="flex items-center gap-2 rounded-md border border-input bg-card p-0.5 pl-2.5 transition-colors hover:bg-hover"
              >
                <span className="hidden text-xs font-medium sm:block">
                  {user.name?.split(" ")[0] || "حسابي"}
                </span>
                <span className="flex size-6 items-center justify-center rounded-[4px] bg-primary text-[10px] font-bold text-primary-foreground">
                  {(user.name || "؟").charAt(0).toUpperCase()}
                </span>
              </Link>
            )}

            {mounted && !user && (
              <Link
                href="/login"
                aria-label="حسابي"
                title="تسجيل الدخول"
                className="flex size-7 items-center justify-center rounded-md border border-input bg-card text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
              >
                <User className="size-3.5" strokeWidth={1.5} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 gap-6 px-4 py-5 sm:px-6 lg:px-8">
        {view === "student" && (
          <AppSidebar
            activeFeature={activeFeature}
            onFeatureChange={onFeatureChange}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            onOpenLectures={onOpenLectures}
          />
        )}

        <main className="min-w-0 flex-1">
          <motion.div
            key={`${view}-${activeFeature}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* QUICK ACTIONS DOCK */}
      {footer && (
        <div className="sticky bottom-0 z-40 border-t bg-chrome/95 backdrop-blur-md">
          {footer}
        </div>
      )}

      <FloatingSoundWidget />

      {/* MOBILE NAV */}
      {view === "student" && (
        <nav
          dir="rtl"
          className="sticky bottom-0 z-30 w-full border-t bg-chrome/95 backdrop-blur-md lg:hidden"
        >
          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto px-2 py-1.5">
            {mobileFeatures.map((feature) => {
              const Icon = feature.icon;
              const active = feature.id === activeFeature;
              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => onFeatureChange(feature.id)}
                  className={cn(
                    "flex shrink-0 flex-col items-center gap-0.5 rounded-md px-2.5 py-1 transition-colors",
                    active
                      ? "bg-wash text-primary"
                      : "text-muted-foreground hover:bg-hover"
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.5} />
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