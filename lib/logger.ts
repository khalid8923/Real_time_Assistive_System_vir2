/* ================================================================== */
/*  Logger — dev logs كاملة، production مختصرة                        */
/* ================================================================== */

export const logger = {
  info(msg: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[info] ${msg}`, meta ?? "");
    }
  },
  warn(msg: string, meta?: Record<string, unknown>): void {
    console.warn(`[warn] ${msg}`, meta ?? "");
  },
  error(msg: string, err?: unknown): void {
    if (process.env.NODE_ENV === "production") {
      console.error(`[error] ${msg}`, err instanceof Error ? err.message : err);
    } else {
      console.error(`[error] ${msg}`, err);
    }
  },
};