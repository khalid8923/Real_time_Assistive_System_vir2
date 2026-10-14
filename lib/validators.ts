/* ================================================================== */
/*  Validators — مدخلات أساسية                                        */
/* ================================================================== */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(v: unknown): v is string {
  return typeof v === "string" && EMAIL_REGEX.test(v.trim());
}

export function isNonEmpty(v: unknown, min = 1): v is string {
  return typeof v === "string" && v.trim().length >= min;
}

export function isValidUrl(v: unknown): v is string {
  if (typeof v !== "string") return false;
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

export function clampNumber(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function isValidLength(v: unknown, min: number, max: number): v is string {
  return typeof v === "string" && v.trim().length >= min && v.trim().length <= max;
}