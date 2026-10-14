"use client";

import * as React from "react";
import {
  AlertTriangle,
  RefreshCw,
  WifiOff,
  Clock,
  Lock,
  Shield,
  Search,
  Server,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ErrorCategory } from "@/lib/errors";

const CATEGORY_ICONS: Record<
  ErrorCategory,
  React.ElementType
> = {
  network: WifiOff,
  timeout: Clock,
  offline: WifiOff,
  auth: Lock,
  permission: Shield,
  notFound: Search,
  validation: AlertTriangle,
  rateLimit: Clock,
  server: Server,
  provider: Server,
  storage: HardDrive,
  unknown: AlertTriangle,
};

const CATEGORY_COLORS: Record<
  ErrorCategory,
  { bg: string; border: string; text: string; icon: string }
> = {
  network: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/25",
    text: "text-amber-600 dark:text-amber-400",
    icon: "text-amber-500",
  },
  timeout: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/25",
    text: "text-amber-600 dark:text-amber-400",
    icon: "text-amber-500",
  },
  offline: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/25",
    text: "text-amber-600 dark:text-amber-400",
    icon: "text-amber-500",
  },
  auth: {
    bg: "bg-rose-500/5",
    border: "border-rose-500/25",
    text: "text-rose-600 dark:text-rose-400",
    icon: "text-rose-500",
  },
  permission: {
    bg: "bg-rose-500/5",
    border: "border-rose-500/25",
    text: "text-rose-600 dark:text-rose-400",
    icon: "text-rose-500",
  },
  notFound: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/25",
    text: "text-amber-600 dark:text-amber-400",
    icon: "text-amber-500",
  },
  validation: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/25",
    text: "text-amber-600 dark:text-amber-400",
    icon: "text-amber-500",
  },
  rateLimit: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/25",
    text: "text-amber-600 dark:text-amber-400",
    icon: "text-amber-500",
  },
  server: {
    bg: "bg-rose-500/5",
    border: "border-rose-500/25",
    text: "text-rose-600 dark:text-rose-400",
    icon: "text-rose-500",
  },
  provider: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/25",
    text: "text-amber-600 dark:text-amber-400",
    icon: "text-amber-500",
  },
  storage: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/25",
    text: "text-amber-600 dark:text-amber-400",
    icon: "text-amber-500",
  },
  unknown: {
    bg: "bg-rose-500/5",
    border: "border-rose-500/25",
    text: "text-rose-600 dark:text-rose-400",
    icon: "text-rose-500",
  },
};

interface ErrorStateProps {
  category?: ErrorCategory;
  title?: string;
  description?: string;
  hint?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

export function ErrorState({
  category = "unknown",
  title,
  description,
  hint,
  onRetry,
  retrying = false,
  className,
}: ErrorStateProps) {
  const Icon = CATEGORY_ICONS[category] ?? AlertTriangle;
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.unknown;

  return (
    <div
      dir="rtl"
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border py-10 text-center",
        colors.bg,
        colors.border,
        className
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl bg-background/60 shadow-sm",
          colors.icon
        )}
      >
        <Icon className="h-7 w-7" />
      </div>

      <div className="max-w-md space-y-1.5 px-4">
        {title && (
          <p className={cn("text-base font-bold", colors.text)}>{title}</p>
        )}
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {hint && (
          <p className="pt-1 text-xs font-medium text-muted-foreground/80">
            💡 {hint}
          </p>
        )}
      </div>

      {onRetry && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRetry}
          disabled={retrying}
          className="gap-1.5"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", retrying && "animate-spin")}
          />
          {retrying ? "بيحاول..." : "حاول تاني"}
        </Button>
      )}
    </div>
  );
}