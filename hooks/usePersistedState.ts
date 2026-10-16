"use client";

import * as React from "react";

/**
 * useState-like hook that persists to sessionStorage.
 * Survives component unmount/remount (feature switching).
 * Auto-clears when browser tab closes.
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = window.sessionStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch {
      /* ignore */
    }
    return initialValue;
  });

  React.useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [key, state]);

  return [state, setState];
}

export default usePersistedState;