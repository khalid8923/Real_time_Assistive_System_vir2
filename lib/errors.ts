/* ================================================================== */
/*  CaptionBridge — Unified Error System                              */
/*  تصنيفات + عنوان + شرح بسيط + نصيحة                                */
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
  title: string;
  userMessage: string;
  hint?: string;
  technicalMessage: string;
  httpStatus?: number;
  retryable: boolean;
  requestId?: string;
  timestamp: number;
}

/* ------------------------------------------------------------------ */
/* Metadata لكل تصنيف                                                 */
/* ------------------------------------------------------------------ */

export interface CategoryMeta {
  title: string;
  description: string;
  hint: string;
  icon:
    | "wifi"
    | "clock"
    | "lock"
    | "shield"
    | "search"
    | "alert"
    | "server"
    | "hard-drive"
    | "refresh";
  color: string;
}

export const CATEGORY_META: Record<ErrorCategory, CategoryMeta> = {
  network: {
    title: "مشكلة في الاتصال",
    description: "مقدرناش نوصل للسيرفر. الشبكة ممكن تكون ضعيفة.",
    hint: "اتأكد إن الإنترنت شغال وحاول تاني",
    icon: "wifi",
    color: "amber",
  },
  timeout: {
    title: "الخدمة اتأخرت",
    description: "الرد أخد وقت أطول من المتوقع.",
    hint: "جرّب تاني بعد لحظة",
    icon: "clock",
    color: "amber",
  },
  offline: {
    title: "مفيش إنترنت",
    description: "إنت مش متصل بالإنترنت حالياً.",
    hint: "لما الاتصال يرجع هنكمل تلقائياً",
    icon: "wifi",
    color: "amber",
  },
  auth: {
    title: "انتهت الجلسة",
    description: "محتاج تسجّل دخول من جديد عشان تكمّل.",
    hint: "سجّل دخولك وهنرجعك لنفس المكان",
    icon: "lock",
    color: "rose",
  },
  permission: {
    title: "معندكش صلاحية",
    description: "الحساب ده مش مسموح له بالعملية دي.",
    hint: "كلّم الأدمن لو محتاج الصلاحية",
    icon: "shield",
    color: "rose",
  },
  notFound: {
    title: "مش موجود",
    description: "اللي بتدور عليه مش موجود أو اتحذف.",
    hint: "جرّب ترجع للصفحة السابقة",
    icon: "search",
    color: "amber",
  },
  validation: {
    title: "بيانات غير صحيحة",
    description: "في بيانات ناقصة أو مش مطابقة للمطلوب.",
    hint: "راجع البيانات وحاول تاني",
    icon: "alert",
    color: "amber",
  },
  rateLimit: {
    title: "طلبات كثيرة",
    description: "بعتنالك طلبات كتير في وقت قصير.",
    hint: "استنى دقيقة وحاول تاني",
    icon: "clock",
    color: "amber",
  },
  server: {
    title: "مشكلة في السيرفر",
    description: "السيرفر مش قادر يكمّل الطلب حالياً.",
    hint: "مش مشكلة عندك — جرّب تاني بعد لحظة",
    icon: "server",
    color: "rose",
  },
  provider: {
    title: "خدمة الذكاء الاصطناعي مشغولة",
    description: "مزود الذكاء الاصطناعي بيرد ببطء أو مش متاح.",
    hint: "جرّب تاني — بنحول تلقائياً لمزود تاني",
    icon: "server",
    color: "amber",
  },
  storage: {
    title: "مشكلة في التخزين",
    description: "مقدرناش نحفظ البيانات مؤقتاً على الجهاز.",
    hint: "جرّب تمسح بيانات المتصفح لمدة دقيقة",
    icon: "hard-drive",
    color: "amber",
  },
  unknown: {
    title: "حصلت مشكلة غير متوقعة",
    description: "في حاجة مش عادية حصلت. مش عارفين سببها بالظبط.",
    hint: "جرّب تاني — لو استمرت كلّم الدعم",
    icon: "alert",
    color: "rose",
  },
};

/* ------------------------------------------------------------------ */
/* HTTP status → category                                             */
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
/* Create error                                                       */
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
  const meta = CATEGORY_META[category];
  return {
    category,
    code: options?.code ?? category.toUpperCase(),
    title: meta.title,
    userMessage: options?.userMessage ?? meta.description,
    hint: meta.hint,
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
/* Normalize any thrown error                                         */
/* ------------------------------------------------------------------ */

export function normalizeError(err: unknown, requestId?: string): AppError {
  // Already AppError
  if (
    err &&
    typeof err === "object" &&
    "category" in err &&
    "title" in err &&
    "userMessage" in err
  ) {
    return err as AppError;
  }

  // DOMException (abort)
  if (err instanceof DOMException) {
    if (err.name === "AbortError") {
      return createError("timeout", {
        code: "REQUEST_ABORTED",
        technicalMessage: err.message,
        requestId,
      });
    }
    return createError("network", {
      code: "DOM_EXCEPTION",
      technicalMessage: `${err.name}: ${err.message}`,
      requestId,
    });
  }

  // TypeError — network error
  if (err instanceof TypeError) {
    const offline =
      typeof navigator !== "undefined" && navigator.onLine === false;
    return createError(offline ? "offline" : "network", {
      code: "NETWORK_ERROR",
      technicalMessage: err.message,
      requestId,
    });
  }

  // Error
  if (err instanceof Error) {
    return createError("unknown", {
      code: "GENERIC_ERROR",
      technicalMessage: err.message,
      requestId,
    });
  }

  // غير معروف
  return createError("unknown", {
    code: "UNKNOWN_THROWN",
    technicalMessage: String(err),
    requestId,
  });
}

/* ------------------------------------------------------------------ */
/* Logging                                                            */
/* ------------------------------------------------------------------ */

export function logError(err: AppError): void {
  if (process.env.NODE_ENV === "production") {
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