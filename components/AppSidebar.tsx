"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  HIDDEN_FROM_SIDEBAR,
  STUDENT_FEATURES,
  type Feature,
  type FeatureCategory,
  type FeatureId,
} from "@/lib/features";
import SoundIndicator from "@/components/SoundIndicator";

interface AppSidebarProps {
  activeFeature: FeatureId;
  onFeatureChange: (id: FeatureId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenLectures?: () => void;
}

const CATEGORY_ORDER: FeatureCategory[] = ["core", "accessibility", "ai"];

export default function AppSidebar({
  activeFeature,
  onFeatureChange,
  collapsed,
  onToggleCollapse,
  onOpenLectures,
}: AppSidebarProps) {
  const [expanded, setExpanded] = React.useState<
    Record<FeatureCategory, boolean>
  >({
    core: true,
    accessibility: true,
    ai: true,
    teacher: true,
  });

  const toggleCategory = (cat: FeatureCategory) => {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const grouped = React.useMemo(() => {
    const map = new Map<FeatureCategory, Feature[]>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const feature of STUDENT_FEATURES) {
      if (HIDDEN_FROM_SIDEBAR.includes(feature.id)) continue;
      const list = map.get(feature.category);
      if (list) list.push(feature);
    }
    return map;
  }, []);

  return (
    <aside
      dir="rtl"
      className={cn(
        "sticky top-20 hidden h-[calc(100vh-6rem)] shrink-0 overflow-hidden lg:flex lg:flex-col transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-xs">
        {/* Sidebar top */}
        <div
          className={cn(
            "flex items-center gap-2 border-b border-border px-3 py-3",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-accent-1 text-white shadow-sm">
                <span className="text-xs font-black">CB</span>
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold">CaptionBridge</p>
                <p className="text-[9px] text-muted-foreground">
                  للطلاب الصم
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "توسيع القائمة" : "تصغير القائمة"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto no-scrollbar p-2">
          {CATEGORY_ORDER.map((cat) => {
            const features = grouped.get(cat) ?? [];
            if (features.length === 0) return null;

            const isExpanded = expanded[cat];
            const hasActive = features.some((f) => f.id === activeFeature);

            return (
              <div key={cat} className="mb-2">
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
                      hasActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{CATEGORY_LABELS[cat]}</span>
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform duration-200",
                        !isExpanded && "-rotate-90"
                      )}
                    />
                  </button>
                )}

                <AnimatePresence initial={false}>
                  {(isExpanded || collapsed) && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={cn(
                        "space-y-0.5 overflow-hidden",
                        !collapsed && "mt-1"
                      )}
                    >
                      {features.map((feature) => (
                        <FeatureItem
                          key={feature.id}
                          feature={feature}
                          active={feature.id === activeFeature}
                          collapsed={collapsed}
                          onClick={() => onFeatureChange(feature.id)}
                        />
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Bottom — sound + lectures only */}
        <div
          className={cn(
            "space-y-2 border-t border-border p-2",
            collapsed && "flex flex-col items-center"
          )}
        >
          <SoundIndicator collapsed={collapsed} />

          {onOpenLectures && (
            <button
              type="button"
              onClick={onOpenLectures}
              aria-label="المحاضرات المحفوظة"
              title={collapsed ? "المحاضرات المحفوظة" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-xl border border-border bg-muted/20 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary",
                collapsed
                  ? "h-10 w-10 justify-center"
                  : "w-full px-3 py-2.5"
              )}
            >
              <Bookmark className="h-4 w-4" />
              {!collapsed && <span>المحاضرات المحفوظة</span>}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */

function FeatureItem({
  feature,
  active,
  collapsed,
  onClick,
}: {
  feature: Feature;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = feature.icon;

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        title={collapsed ? feature.label : undefined}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-lg px-2 py-2 text-right transition-all",
          collapsed && "justify-center",
          active
            ? "bg-primary/10 text-primary"
            : "text-foreground/80 hover:bg-muted hover:text-foreground"
        )}
      >
        {active && (
          <motion.span
            layoutId="sidebar-active-indicator"
            className="absolute inset-y-1 right-0 w-0.5 rounded-full bg-primary"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}

        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
            active
              ? "bg-primary text-primary-foreground"
              : "bg-muted/60 text-muted-foreground group-hover:bg-muted"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>

        {!collapsed && (
          <span className="flex-1 min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold">
                {feature.label}
              </span>
              {feature.badge && (
                <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                  {feature.badge}
                </span>
              )}
            </span>
          </span>
        )}
      </button>
    </li>
  );
}