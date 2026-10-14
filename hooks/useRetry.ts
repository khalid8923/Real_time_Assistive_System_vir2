"use client";

import { useCallback, useState } from "react";

export function useRetry() {
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const run = useCallback(async (fn: () => Promise<void>) => {
    setRetrying(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e);
    } finally {
      setRetrying(false);
    }
  }, []);

  return { retrying, error, run };
}