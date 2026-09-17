"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseInactivityLogoutOptions {
  timeoutMs?: number;
  warningMs?: number;
  onLogout: () => void;
  enabled?: boolean;
}

interface UseInactivityLogoutReturn {
  showWarning: boolean;
  secondsLeft: number;
  resetTimer: () => void;
  forceLogout: () => void;
}

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

export function useInactivityLogout({
  timeoutMs = 30 * 60 * 1000,
  warningMs = 60 * 1000,
  onLogout,
  enabled = true,
}: UseInactivityLogoutOptions): UseInactivityLogoutReturn {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastResetRef = useRef<number>(0);

  const clearAllTimers = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    logoutTimerRef.current = null;
    warningTimerRef.current = null;
    countdownRef.current = null;
  }, []);

  const startCountdown = useCallback(() => {
    setShowWarning(true);
    setSecondsLeft(Math.floor(warningMs / 1000));

    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [warningMs]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    if (now - lastResetRef.current < 1000) return;
    lastResetRef.current = now;

    clearAllTimers();
    setShowWarning(false);
    setSecondsLeft(0);

    warningTimerRef.current = setTimeout(() => {
      startCountdown();
    }, Math.max(0, timeoutMs - warningMs));

    logoutTimerRef.current = setTimeout(() => {
      onLogout();
    }, timeoutMs);
  }, [enabled, timeoutMs, warningMs, clearAllTimers, startCountdown, onLogout]);

  const forceLogout = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    onLogout();
  }, [clearAllTimers, onLogout]);

  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      return;
    }

    const handler = () => resetTimer();

    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, handler, { passive: true })
    );

    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, handler)
      );
      clearAllTimers();
    };
  }, [enabled, resetTimer, clearAllTimers]);

  return { showWarning, secondsLeft, resetTimer, forceLogout };
}

export default useInactivityLogout;