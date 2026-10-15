"use client";

import Image from "next/image";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bookmark, ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  HIDDEN_FROM_SIDEBAR,
  STUDENT_FEATURES,
  type Feature,
  type FeatureCategory,
  type FeatureId,
} from "@/lib/features";

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
  const [expanded, setExpanded] = React.useState<Record<FeatureCategory, boolean>>({
    core: true,
    accessibility: true,
    ai: true,
    teacher: true,
  });

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

  const toggleCategory = (cat: FeatureCategory) => {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <aside
      dir="rtl"
      className={cn(
        "sticky top-16 hidden h-[calc(100vh-5rem)] shrink-0 overflow-hidden lg:flex lg:flex-col",
        collapsed ? "w-12" : "w-64"
      )}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-md border bg-chrome">
        {/* Top */}
        <div
          className={cn(
            "flex h-11 items-center gap-2 border-b px-2.5",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <Image
                src="/logo.png"
                alt="CaptionBridge"
                width={24}
                height={24}
                className="size-6 shrink-0 rounded-sm"
                priority
              />
              <p className="truncate text-[13px] font-bold">CaptionBridge</p>
            </div>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "توسيع القائمة" : "تصغير القائمة"}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" strokeWidth={1.5} />
            ) : (
              <PanelLeftClose className="size-4" strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav
          aria-label="التنقل الرئيسي"
          className="no-scrollbar flex-1 overflow-y-auto py-2"
        >
          {CATEGORY_ORDER.map((cat, si) => {
            const features = grouped.get(cat) ?? [];
            if (features.length === 0) return null;

            const isExpanded = expanded[cat];
            const hasActive = features.some((f) => f.id === activeFeature);

            return (
              <section
                key={cat}
                className={cn("mb-1", collapsed ? "" : "px-1")}
              >
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "flex w-full items-baseline gap-2 px-2 pb-1 pt-2 text-start text-[13px] font-bold leading-5",
                      hasActive ? "text-primary" : "text-foreground"
                    )}
                  >
                    <span className="num text-[10px] font-normal text-muted-foreground">
                      {si + 1}.
                    </span>
                    <span className="flex-1">{CATEGORY_LABELS[cat]}</span>
                    <ChevronDown
                      className={cn(
                        "size-3.5 text-muted-foreground transition-transform duration-100",
                        !isExpanded && "-rotate-90 rtl:rotate-90"
                      )}
                      strokeWidth={1.5}
                    />
                  </button>
                )}

                <AnimatePresence initial={false}>
                  {(isExpanded || collapsed) && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn("overflow-hidden", !collapsed && "border-t")}
                    >
                      {features.map((feature, ii) => (
                        <FeatureRow
                          key={feature.id}
                          feature={feature}
                          number={`${si + 1}.${ii + 1}`}
                          active={feature.id === activeFeature}
                          collapsed={collapsed}
                          onClick={() => onFeatureChange(feature.id)}
                        />
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </section>
            );
          })}
        </nav>

        {/* Bottom */}
        <div
          className={cn(
            "space-y-2 border-t p-2",
            collapsed && "flex flex-col items-center"
          )}
        >
          {onOpenLectures && (
            <button
              type="button"
              onClick={onOpenLectures}
              aria-label="المحاضرات المحفوظة"
              title={collapsed ? "المحاضرات المحفوظة" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md border border-input bg-card text-[11px] font-medium transition-colors hover:bg-hover",
                collapsed ? "size-8 justify-center" : "w-full px-2.5 py-2"
              )}
            >
              <Bookmark className="size-3.5" strokeWidth={1.5} />
              {!collapsed && <span>المحاضرات المحفوظة</span>}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

function FeatureRow({
  feature,
  number,
  active,
  collapsed,
  onClick,
}: {
  feature: Feature;
  number: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = feature.icon;

  if (collapsed) {
    return (
      <li>
        <button
          type="button"
          onClick={onClick}
          aria-current={active ? "page" : undefined}
          title={feature.label}
          className={cn(
            "flex h-9 w-full items-center justify-center border-s-2 transition-colors",
            active
              ? "border-primary bg-wash text-primary"
              : "border-transparent text-muted-foreground hover:bg-hover hover:text-foreground"
          )}
        >
          <Icon className="size-4" strokeWidth={1.5} />
        </button>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-8 w-full items-center gap-2 border-s-2 ps-2 pe-2 text-start text-[12.5px] transition-colors",
          active
            ? "border-primary bg-wash font-semibold text-primary"
            : "border-transparent text-foreground/90 hover:bg-hover"
        )}
      >
        <span className="num w-6 shrink-0 text-[10px] font-normal text-muted-foreground">
          {number}
        </span>
        <Icon
          className={cn(
            "size-3.5 shrink-0",
            active ? "text-primary" : "text-muted-foreground"
          )}
          strokeWidth={1.5}
        />
        <span className="truncate">{feature.label}</span>
        <span
          aria-hidden
          className="mx-1 h-0 min-w-2 flex-1 border-t border-dotted border-border"
        />
        {feature.badge && (
          <span className="rounded-sm bg-primary/15 px-1 text-[9px] font-bold text-primary">
            {feature.badge}
          </span>
        )}
      </button>
    </li>
  );
}