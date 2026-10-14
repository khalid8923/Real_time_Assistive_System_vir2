/* ================================================================== */
/*  Safe storage — يتعامل مع quota / disabled / corrupt data         */
/* ================================================================== */

export const safeStorage = {
  get(key: string): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key: string, value: string): boolean {
    if (typeof window === "undefined") return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "QuotaExceededError") {
        console.warn("[safe-storage] quota exceeded");
      }
      return false;
    }
  },

  remove(key: string): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },

  getJSON<T>(key: string, fallback: T): T {
    const raw = this.get(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  setJSON(key: string, value: unknown): boolean {
    try {
      return this.set(key, JSON.stringify(value));
    } catch {
      return false;
    }
  },
};