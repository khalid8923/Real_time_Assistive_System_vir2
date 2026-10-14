/* ================================================================== */
/*  API Client — fetch wrapper مع timeout و retry                     */
/* ================================================================== */

import {
  normalizeError,
  createError,
  categoryFromStatus,
  CATEGORY_META,
  type AppError,
} from "@/lib/errors";

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  showToast?: boolean;
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
  return (
    status === 408 ||
    status === 429 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

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

  // Offline check
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
        userMessage: errBody.error || CATEGORY_META[category].description,
      });

      lastError = err;

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

async function showErrorToast(err: AppError): Promise<void> {
  try {
    const { toastError } = await import("@/lib/error-toast");
    toastError(err);
  } catch {
    /* ignore */
  }
}

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