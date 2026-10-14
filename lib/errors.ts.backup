/* ================================================================== */
/*  CaptionBridge — Unified Error System                              */
/*  تصنيفات الأخطاء + رسائل عربية جاهزة                              */
/* ================================================================== */

export type ErrorCategory =
  | "network"
  | "timeout"
  | "offline"
  | "auth"
  | "permission"
  | "notFound"
  | "validation"
  | "rateLimit"
  | "server"
  | "provider"
  | "storage"
  | "unknown";

export interface AppError {
  category: ErrorCategory;
  code: string;
  userMessage: string;
  technicalMessage: string;
  httpStatus?: number;
  retryable: boolean;
  requestId?: string;
  timestamp: number;
}

/* ------------------------------------------------------------------ */
/* Arabic messages per category                                       */
/* ------------------------------------------------------------------ */

export const USER_MESSAGES: Record<ErrorCategory, string> = {
  network: "في مشكلة في الاتصال بالإنترنت. اتأكد إن الشبكة شغالة وحاول تاني.",
  timeout: "الخدمة اتأخرت في الرد. جرّب تاني بعد لحظة.",
  offline: "إنت مش متصل بالإنترنت. لما ترجع الاتصال هيكمل الشغل.",
  auth: "الجلسة انتهت. من فضلك سجّل دخول من جديد.",
  permission: "معندكش صلاحية للعملية دي. راجع الأدمن لو محتاجها.",
  notFound: "اللي بتدور عليه مش موجود أو اتحذف.",
  validation: "في بيانات ناقصة أو غير صحيحة. راجعها وحاول تاني.",
  rateLimit: "طلبات كثيرة بسرعة. استنى شوية وحاول تاني.",
  server: "في مشكلة في السيرفر. فريقنا بيراجعها دلوقتي.",
  provider: "خدمة الذكاء الاصطناعي مشغولة. جرّب بعد لحظة.",
  storage: "مش قادرين نحفظ البيانات مؤقتاً. جرّب تمسح بيانات المتصفح.",
  unknown: "في مشكلة غير متوقعة حصلت. حاول تاني ولو استمرت كلّم الدعم.",
};

/* ------------------------------------------------------------------ */
/* HTTP status → category mapping                                     */
/* ------------------------------------------------------------------ */

export function categoryFromStatus(status: number): ErrorCategory {
  if (status === 401) return "auth";
  if (status === 403) return "permission";
  if (status === 404) return "notFound";
  if (status === 408 || status === 504) return "timeout";
  if (status === 413 || status === 422) return "validation";
  if (status === 429) return "rateLimit";
  if (status === 500 || status === 502 || status === 503) return "server";
  if (status >= 400 && status < 500) return "validation";
  if (status >= 500) return "server";
  return "unknown";
}

/* ------------------------------------------------------------------ */
/* Normalize any thrown error → AppError                              */
/* ------------------------------------------------------------------ */

export function normalizeError(err: unknown, requestId?: string): AppError {
  const ts = Date.now();

  // Already an AppError
  if (err && typeof err === "object" && "category" in err && "userMessage" in err) {
    return err as AppError;
  }

  // DOMException (fetch abort / network)
  if (err instanceof DOMException) {
    if (err.name === "AbortError") {
      return {
        category: "timeout",
        code: "REQUEST_ABORTED",
        userMessage: USER_MESSAGES.timeout,
        technicalMessage: err.message,
        retryable: true,
        requestId,
        timestamp: ts,
      };
    }
    return {
      category: "network",
      code: "DOM_EXCEPTION",
      userMessage: USER_MESSAGES.network,
      technicalMessage: `${err.name}: ${err.message}`,
      retryable: true,
      requestId,
      timestamp: ts,
    };
  }

  // TypeError — غالباً فشل شبكة في fetch
  if (err instanceof TypeError) {
    return {
      category: navigator?.onLine === false ? "offline" : "network",
      code: "NETWORK_ERROR",
      userMessage:
        navigator?.onLine === false
          ? USER_MESSAGES.offline
          : USER_MESSAGES.network,
      technicalMessage: err.message,
      retryable: true,
      requestId,
      timestamp: ts,
    };
  }

  // Error عادي
  if (err instanceof Error) {
    return {
      category: "unknown",
      code: "GENERIC_ERROR",
      userMessage: USER_MESSAGES.unknown,
      technicalMessage: err.message,
      retryable: true,
      requestId,
      timestamp: ts,
    };
  }

  // نص أو أي حاجة تانية
  return {
    category: "unknown",
    code: "UNKNOWN_THROWN",
    userMessage: USER_MESSAGES.unknown,
    technicalMessage: String(err),
    retryable: true,
    requestId,
    timestamp: ts,
  };
}

/* ------------------------------------------------------------------ */
/* Factory                                                            */
/* ------------------------------------------------------------------ */

export function createError(
  category: ErrorCategory,
  options?: {
    code?: string;
    technicalMessage?: string;
    httpStatus?: number;
    requestId?: string;
    userMessage?: string;
  }
): AppError {
  return {
    category,
    code: options?.code ?? category.toUpperCase(),
    userMessage: options?.userMessage ?? USER_MESSAGES[category],
    technicalMessage: options?.technicalMessage ?? "",
    httpStatus: options?.httpStatus,
    requestId: options?.requestId,
    retryable: ["network", "timeout", "server", "provider", "rateLimit"].includes(
      category
    ),
    timestamp: Date.now(),
  };
}

/* ------------------------------------------------------------------ */
/* Logging                                                            */
/* ------------------------------------------------------------------ */

export function logError(err: AppError): void {
  if (process.env.NODE_ENV === "production") {
    // في الإنتاج: ممكن ترسله لخدمة monitoring
    console.error("[app-error]", {
      code: err.code,
      category: err.category,
      status: err.httpStatus,
      requestId: err.requestId,
    });
  } else {
    console.error("[app-error]", err);
  }
}
