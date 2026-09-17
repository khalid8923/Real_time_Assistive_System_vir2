"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cb_login_attempts";
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 60 * 1000;

interface AttemptsData {
  count: number;
  lockedUntil: number | null;
}

function readAttempts(): AttemptsData {
  if (typeof window === "undefined") {
    return { count: 0, lockedUntil: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, lockedUntil: null };
    const data = JSON.parse(raw) as AttemptsData;
    if (typeof data.count !== "number") return { count: 0, lockedUntil: null };
    return data;
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

function writeAttempts(data: AttemptsData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export interface UseLoginRateLimitReturn {
  attemptsLeft: number;
  isLocked: boolean;
  secondsLeft: number;
  registerFailure: () => void;
  registerSuccess: () => void;
  reset: () => void;
}

export function useLoginRateLimit(): UseLoginRateLimitReturn {
  const [count, setCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const data = readAttempts();
    if (data.lockedUntil && data.lockedUntil > Date.now()) {
      setCount(data.count);
      setLockedUntil(data.lockedUntil);
      setSecondsLeft(Math.ceil((data.lockedUntil - Date.now()) / 1000));
    } else if (data.lockedUntil && data.lockedUntil <= Date.now()) {
      writeAttempts({ count: 0, lockedUntil: null });
    } else {
      setCount(data.count);
    }
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;

    const tick = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setCount(0);
        setSecondsLeft(0);
        writeAttempts({ count: 0, lockedUntil: null });
      } else {
        setSecondsLeft(remaining);
      }
    }, 500);

    return () => clearInterval(tick);
  }, [lockedUntil]);

  const registerFailure = useCallback(() => {
    setCount((prev) => {
      const next = prev + 1;
      if (next >= MAX_ATTEMPTS) {
        const lockTime = Date.now() + COOLDOWN_MS;
        setLockedUntil(lockTime);
        setSecondsLeft(Math.ceil(COOLDOWN_MS / 1000));
        writeAttempts({ count: next, lockedUntil: lockTime });
      } else {
        writeAttempts({ count: next, lockedUntil: null });
      }
      return next;
    });
  }, []);

  const registerSuccess = useCallback(() => {
    setCount(0);
    setLockedUntil(null);
    setSecondsLeft(0);
    writeAttempts({ count: 0, lockedUntil: null });
  }, []);

  const reset = useCallback(() => {
    registerSuccess();
  }, [registerSuccess]);

  return {
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - count),
    isLocked: !!lockedUntil && lockedUntil > Date.now(),
    secondsLeft,
    registerFailure,
    registerSuccess,
    reset,
  };
}

export default useLoginRateLimit;