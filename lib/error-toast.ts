/* ================================================================== */
/*  Toast helpers — رسائل أنيقة مع أيقونات                            */
/* ================================================================== */

import { toast } from "sonner";
import type { AppError, ErrorCategory } from "@/lib/errors";

/* ------------------------------------------------------------------ */

function getIcon(category: ErrorCategory): string {
  const icons: Record<ErrorCategory, string> = {
    network: "📡",
    timeout: "⏱️",
    offline: "🔌",
    auth: "🔐",
    permission: "🚫",
    notFound: "🔍",
    validation: "⚠️",
    rateLimit: "⏳",
    server: "🔧",
    provider: "🤖",
    storage: "💾",
    unknown: "❗",
  };
  return icons[category] ?? "❗";
}

/* ------------------------------------------------------------------ */
/* Error toast                                                        */
/* ------------------------------------------------------------------ */

export function toastError(err: AppError): void {
  const icon = getIcon(err.category);
  toast.error(`${icon} ${err.title}`, {
    description: err.hint
      ? `${err.userMessage}\n${err.hint}`
      : err.userMessage,
    duration: err.retryable ? 7000 : 5500,
  });
}

export function toastSuccess(message: string, description?: string): void {
  toast.success(`✅ ${message}`, { description, duration: 3500 });
}

export function toastInfo(message: string, description?: string): void {
  toast.info(`ℹ️ ${message}`, { description, duration: 4000 });
}

export function toastWarning(message: string, description?: string): void {
  toast.warning(`⚠️ ${message}`, { description, duration: 5500 });
}

/* ------------------------------------------------------------------ */
/* Promise helper                                                     */
/* ------------------------------------------------------------------ */

export function toastPromise<T>(
  promise: Promise<T>,
  messages: { loading: string; success: string; error?: string }
): void {
  toast.promise(promise, {
    loading: messages.loading,
    success: `✅ ${messages.success}`,
    error: messages.error ?? "❗ حصلت مشكلة، جرّب تاني.",
  });
}

/* ------------------------------------------------------------------ */
/* Retry-aware                                                        */
/* ------------------------------------------------------------------ */

export function toastWithRetry(
  message: string,
  onRetry: () => void,
  description?: string
): void {
  toast.error(message, {
    description,
    duration: 8000,
    action: {
      label: "حاول تاني",
      onClick: onRetry,
    },
  });
}