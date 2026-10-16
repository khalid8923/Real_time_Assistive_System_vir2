"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { X, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  HIDDEN_FROM_SIDEBAR,
  STUDENT_FEATURES,
  type Feature,
  type FeatureCategory,
  type FeatureId,
} from "@/lib/features";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  activeFeature: FeatureId;
  onFeatureChange: (id: FeatureId) => void;
  onOpenLectures?: () => void;
}

const CATEGORY_ORDER: FeatureCategory[] = ["core", "accessibility", "ai"];

export default function MobileDrawer({
  open,
  onClose,
  activeFeature,
  onFeatureChange,
  onOpenLectures,
}: MobileDrawerProps) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
          />

          <motion.aside
            key="drawer"
            dir="rtl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label="قائمة الميزات"
            className="fixed inset-y-0 right-0 z-[70] flex w-[85vw] max-w-sm flex-col border-s border-border bg-background shadow-2xl lg:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/logo.png"
                  alt="CaptionBridge"
                  width={32}
                  height={32}
                  className="size-8 rounded-lg"
                />
                <div className="leading-tight">
                  <p className="text-sm font-bold">CaptionBridge</p>
                  <p className="text-[10px] text-muted-foreground">
                    كل الميزات
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto p-3">
              {CATEGORY_ORDER.map((cat) => {
                const features = grouped.get(cat) ?? [];
                if (features.length === 0) return null;

                return (
                  <div key={cat} className="mb-4">
                    <h3 className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {CATEGORY_LABELS[cat]}
                    </h3>
                    <ul className="space-y-0.5">
                      {features.map((feature) => {
                        const Icon = feature.icon;
                        const active = feature.id === activeFeature;
                        return (
                          <li key={feature.id}>
                            <button
                              type="button"
                              onClick={() => {
                                onFeatureChange(feature.id);
                                onClose();
                              }}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right transition-colors",
                                active
                                  ? "bg-primary/10 text-primary"
                                  : "text-foreground hover:bg-muted"
                              )}
                            >
                              <span
                                className={cn(
                                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                                  active
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                <Icon className="size-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold">
                                  {feature.label}
                                </span>
                                <span className="block truncate text-[10px] text-muted-foreground">
                                  {feature.description}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </nav>

            {onOpenLectures && (
              <div className="border-t border-border p-3">
                <button
                  type="button"
                  onClick={() => {
                    onOpenLectures();
                    onClose();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
                >
                  <Bookmark className="size-3.5" />
                  المحاضرات المحفوظة
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}