"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

export function ErrorState({
  title = "حصلت مشكلة",
  description = "في حاجة مش شغالة صح. جرّب تاني.",
  onRetry,
  retrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      dir="rtl"
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/25 bg-destructive/5 py-10 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
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
          <RefreshCw className={cn("h-3.5 w-3.5", retrying && "animate-spin")} />
          {retrying ? "بيحاول..." : "حاول تاني"}
        </Button>
      )}
    </div>
  );
}