"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type AuthCompanionState =
  | "idle"
  | "email-focus"
  | "password-focus"
  | "password-visible"
  | "error"
  | "submitting"
  | "success";

interface AuthCompanionProps {
  state?: AuthCompanionState;
  className?: string;
}

export default function AuthCompanion({
  state = "idle",
  className,
}: AuthCompanionProps) {
  const reduced = useReducedMotion();

  const accent =
    state === "error"
      ? "var(--destructive)"
      : state === "success"
        ? "#3ec972"
        : state === "password-visible"
          ? "var(--mark, #f7e28b)"
          : state === "idle"
            ? "var(--muted-foreground)"
            : "var(--primary)";

  const tilt =
    state === "email-focus" ? -20 : state === "password-focus" ? 25 : 0;

  const leftX =
    state === "email-focus" ? 62 : state === "password-focus" ? 78 : 70;
  const rightX =
    state === "email-focus" ? 122 : state === "password-focus" ? 138 : 130;
  const dotsOpacity = state === "idle" ? 0.35 : 0.95;

  return (
    <motion.div
      className={cn("relative aspect-square select-none", className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
      aria-hidden="true"
    >
      <motion.svg
        viewBox="0 0 200 200"
        className="h-full w-full overflow-visible"
        animate={
          state === "error" && !reduced
            ? { x: [0, -5, 5, -4, 4, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.g
          style={{ originX: 0.5, originY: 0.5 }}
          animate={reduced ? {} : { rotate: 360 }}
          transition={
            reduced
              ? {}
              : state === "submitting"
                ? { duration: 4, repeat: Infinity, ease: "linear" }
                : { duration: 80, repeat: Infinity, ease: "linear" }
          }
        >
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke={accent}
            strokeWidth="1"
            strokeDasharray="2 6"
            opacity="0.5"
          />
        </motion.g>

        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-border"
          opacity="0.35"
        />

        <motion.circle
          cx="100"
          cy="100"
          r="62"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          animate={
            reduced
              ? { opacity: 0.85 }
              : state === "idle"
                ? { opacity: [0.5, 0.85, 0.5] }
                : { opacity: 0.95 }
          }
          transition={
            reduced
              ? {}
              : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
          }
        />

        <line
          x1="42"
          y1="100"
          x2="158"
          y2="100"
          stroke={accent}
          strokeWidth="0.5"
          opacity="0.2"
        />

        <motion.g
          style={{ originX: 0.5, originY: 0.5 }}
          animate={{
            rotate: reduced ? 0 : tilt,
            scale: state === "success" ? 1.1 : 1,
          }}
          transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <path
            d="M 100 66 L 118 100 L 100 134 L 82 100 Z"
            fill={accent}
            opacity="0.12"
          />
          <path
            d="M 100 66 L 118 100 L 100 134 L 82 100 Z"
            fill="none"
            stroke={accent}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <line
            x1="100"
            y1="66"
            x2="100"
            y2="134"
            stroke={accent}
            strokeWidth="0.75"
            opacity="0.5"
          />
          <line
            x1="82"
            y1="100"
            x2="118"
            y2="100"
            stroke={accent}
            strokeWidth="0.75"
            opacity="0.5"
          />
          <circle cx="100" cy="100" r="2.5" fill={accent} />
        </motion.g>

        <motion.circle
          cx={70}
          cy={68}
          r="3.5"
          fill={accent}
          initial={{ opacity: 0.35 }}
          animate={{ cx: reduced ? 70 : leftX, opacity: dotsOpacity }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        <motion.circle
          cx={130}
          cy={68}
          r="3.5"
          fill={accent}
          initial={{ opacity: 0.35 }}
          animate={{ cx: reduced ? 130 : rightX, opacity: dotsOpacity }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />

        <motion.path
          d="M 78 100 L 94 116 L 124 84"
          fill="none"
          stroke={accent}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{
            opacity: state === "success" ? 1 : 0,
            pathLength: state === "success" ? 1 : 0,
          }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      </motion.svg>

      {state === "success" && !reduced && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, #3ec97280 0%, transparent 70%)",
          }}
          initial={{ opacity: 0.6, scale: 0.9 }}
          animate={{ opacity: 0, scale: 1.35 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      )}
    </motion.div>
  );
}