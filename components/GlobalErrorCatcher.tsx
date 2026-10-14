"use client";

import { useEffect } from "react";

export default function GlobalErrorCatcher() {
  useEffect(() => {
    const onUnhandled = (e: PromiseRejectionEvent) => {
      console.error("[unhandled-rejection]", e.reason);
      e.preventDefault();
    };
    const onError = (e: ErrorEvent) => {
      console.error("[window-error]", e.error ?? e.message);
    };
    window.addEventListener("unhandledrejection", onUnhandled);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandled);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}