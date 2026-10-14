/* ================================================================== */
/*  Safe JSON.parse / stringify                                       */
/* ================================================================== */

export function safeParse<T = unknown>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeStringify(value: unknown, fallback = ""): string {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}