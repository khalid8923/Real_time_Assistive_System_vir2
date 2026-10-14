/* ================================================================== */
/*  API Client — fetch wrapper مع timeout و retry و error handling     */
/* ================================================================== */

import {
  normalizeError,
  createError,
  categoryFromStatus,
  USER_MESSAGES,
  type AppError,
} from "@/lib/errors";

export interface RequestOptions extends RequestInit {
  /** مهلة بالمللي ثانية (افتراضي 45 ثانية) */
  timeoutMs?: number;
  /** عدد محاولات إعادة التنفيذ للأخطاء القابلة (افتراضي 2) */
  retries?: number;
  /** إظهار toast تلقائي عند الفشل (افتراضي true) */
  showToast?: boolean;
  /** دالة تُنادى عند الفشل */
  onError?: (err: AppError) => void;
}

const DEFAULT_TIMEOUT = 45_000;
const DEFAULT_RETRIES = 2;
const RETRY_BASE_DELAY = 600;

/* ------------------------------------------------------------------ */

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status === 502 || status === 503 || status === 504;
}

/* ------------------------------------------------------------------ */
/* Main                                                               */
/* ------------------------------------------------------------------ */

export async function apiRequest<T = unknown>(
  input: RequestInfo | URL,
  options: RequestOptions = {}
): Promise<{ ok: true; data: T } | { ok: false; error: AppError }> {
  const {
    timeoutMs = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    showToast = false,
    onError,
    ...fetchOptions
  } = options;

  const requestId = generateRequestId();
  let lastError: AppError | null = null;

  // Offline check أول
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const err = createError("offline", { requestId });
    if (showToast) await showErrorToast(err);
    onError?.(err);
    return { ok: false, error: err };
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          "X-Request-Id": requestId,
          ...(fetchOptions.headers ?? {}),
        },
      });

      clearTimeout(timer);

      // نجاح
      if (response.ok) {
        const contentType = response.headers.get("content-type") ?? "";
        const data = contentType.includes("application/json")
          ? ((await response.json()) as T)
          : ((await response.text()) as unknown as T);
        return { ok: true, data };
      }

      // فشل HTTP
      let errBody: { error?: string } = {};
      try {
        errBody = await response.json();
      } catch {
        /* ignore */
      }

      const category = categoryFromStatus(response.status);
      const err = createError(category, {
        code: `HTTP_${response.status}`,
        httpStatus: response.status,
        technicalMessage: errBody.error ?? response.statusText,
        requestId,
        userMessage: errBody.error || USER_MESSAGES[category],
      });

      lastError = err;

      // retry للأخطاء المؤقتة فقط
      if (attempt < retries && isRetryableStatus(response.status)) {
        const delay = RETRY_BASE_DELAY * Math.pow(2, attempt);
        console.warn(
          `[api] retry ${attempt + 1}/${retries} after ${delay}ms (status ${response.status})`
        );
        await sleep(delay);
        continue;
      }

      if (showToast) await showErrorToast(err);
      onError?.(err);
      return { ok: false, error: err };
    } catch (thrown) {
      clearTimeout(timer);
      const err = normalizeError(thrown, requestId);
      lastError = err;

      // retry لأخطاء الشبكة فقط
      if (attempt < retries && err.retryable) {
        const delay = RETRY_BASE_DELAY * Math.pow(2, attempt);
        console.warn(
          `[api] retry ${attempt + 1}/${retries} after ${delay}ms (${err.code})`
        );
        await sleep(delay);
        continue;
      }

      if (showToast) await showErrorToast(err);
      onError?.(err);
      return { ok: false, error: err };
    }
  }

  const final = lastError ?? createError("unknown", { requestId });
  if (showToast) await showErrorToast(final);
  onError?.(final);
  return { ok: false, error: final };
}

/* ------------------------------------------------------------------ */
/* Toast helper (dynamic import — avoids circular dep)                */
/* ------------------------------------------------------------------ */

async function showErrorToast(err: AppError): Promise<void> {
  try {
    const { toast } = await import("sonner");
    toast.error("حصلت مشكلة", {
      description: err.userMessage,
      duration: 6000,
      action: err.retryable
        ? undefined
        : undefined,
    });
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Convenience helpers                                                */
/* ------------------------------------------------------------------ */

export async function apiGet<T = unknown>(url: string, opts?: RequestOptions) {
  return apiRequest<T>(url, { ...opts, method: "GET" });
}

export async function apiPost<T = unknown>(
  url: string,
  body: unknown,
  opts?: RequestOptions
) {
  return apiRequest<T>(url, {
    ...opts,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(opts?.headers ?? {}),
    },
    body: JSON.stringify(body),
  });
}

export async function apiPostForm<T = unknown>(
  url: string,
  formData: FormData,
  opts?: RequestOptions
) {
  return apiRequest<T>(url, {
    ...opts,
    method: "POST",
    body: formData,
  });
}