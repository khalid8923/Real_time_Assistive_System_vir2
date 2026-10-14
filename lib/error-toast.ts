/* ================================================================== */
/*  Toast helpers — رسائل موحدة                                       */
/* ================================================================== */

import { toast } from "sonner";
import type { AppError } from "@/lib/errors";

export function toastError(err: AppError): void {
  toast.error("حصلت مشكلة", {
    description: err.userMessage,
    duration: 6000,
  });
}

export function toastSuccess(message: string, description?: string): void {
  toast.success(message, { description, duration: 3500 });
}

export function toastInfo(message: string, description?: string): void {
  toast.info(message, { description, duration: 4000 });
}

export function toastWarning(message: string, description?: string): void {
  toast.warning(message, { description, duration: 5500 });
}

/** fire-and-forget: يعرض toast بحالات loading/success/error تلقائياً */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: { loading: string; success: string; error?: string }
): void {
  toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error ?? "حصلت مشكلة، جرّب تاني.",
  });
}

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