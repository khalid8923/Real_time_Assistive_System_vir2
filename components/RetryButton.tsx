"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RetryButtonProps {
  onRetry: () => void;
  retrying?: boolean;
  label?: string;
  className?: string;
}

export default function RetryButton({
  onRetry,
  retrying = false,
  label = "حاول تاني",
  className,
}: RetryButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onRetry}
      disabled={retrying}
      className={cn("gap-1.5", className)}
    >
      <RefreshCw className={cn("h-3.5 w-3.5", retrying && "animate-spin")} />
      {retrying ? "بيحاول..." : label}
    </Button>
  );
}