"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

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
  const reduceMotion = useReducedMotion();

  const accentMap: Record<AuthCompanionState, string> = {
    idle: "var(--primary)",
    "email-focus": "var(--accent-2, #67bfff)",
    "password-focus": "var(--primary)",
    "password-visible": "var(--mark, #f0bb33)",
    error: "var(--destructive, #ff5656)",
    submitting: "var(--primary)",
    success: "var(--green-500, #3ec972)",
  };

  const tiltMap: Record<AuthCompanionState, number> = {
    idle: 0,
    "email-focus": -20,
    "password-focus": 25,
    "password-visible": 25,
    error: 0,
    submitting: 0,
    success: 0,
  };

  const eyesMap: Record<AuthCompanionState, { x: number; y: number }> = {
    idle: { x: 0, y: 0 },
    "email-focus": { x: -4, y: -2 },
    "password-focus": { x: 4, y: 2 },
    "password-visible": { x: 4, y: 2 },
    error: { x: 0, y: 0 },
    submitting: { x: 0, y: 0 },
    success: { x: 0, y: 0 },
  };

  const rotationMap: Record<AuthCompanionState, number> = {
    idle: 80,
    "email-focus": 60,
    "password-focus": 60,
    "password-visible": 60,
    error: 60,
    submitting: 4,
    success: 20,
  };

  const accent = accentMap[state];
  const tilt = tiltMap[state];
  const eyes = eyesMap[state];
  const rotationDuration = rotationMap[state];

  const softTransition = {
    duration: reduceMotion ? 0 : 0.5,
    ease: [0.2, 0.7, 0.2, 1] as [number, number, number, number],
  };

  const shake =
    state === "error" && !reduceMotion
      ? { x: [0, -6, 6, -6, 6, -3, 3, 0] }
      : { x: 0 };

  return (
    <motion.div
      aria-hidden="true"
      animate={shake}
      transition={{ duration: state === "error" ? 0.4 : 0 }}
      className={
        "relative mx-auto flex w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 items-center justify-center " +
        (className ?? "")
      }
    >
      <svg viewBox="0 0 200 200" className="h-full w-full" style={{ color: accent }}>
        {/* Outer dashed circle */}
        <motion.g
          style={{ transformOrigin: "100px 100px" }}
          animate={reduceMotion ? {} : { rotate: 360 }}
          transition={{
            duration: rotationDuration,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 8"
            opacity="0.4"
          />
        </motion.g>

        {/* Idle pulse */}
        {state === "idle" && !reduceMotion && (
          <motion.circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            animate={{ r: [88, 100, 88], opacity: [0, 0.18, 0] }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Diamond */}
        <motion.g
          style={{ transformOrigin: "100px 100px" }}
          animate={{ rotate: tilt }}
          transition={softTransition}
        >
          <polygon
            points="100,52 148,100 100,148 52,100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="100" cy="100" r="4" fill="currentColor" opacity="0.7" />
        </motion.g>

        {/* Eyes */}
        <motion.g animate={{ x: eyes.x, y: eyes.y }} transition={softTransition}>
          <circle cx="86" cy="42" r="3.5" fill="currentColor" />
          <circle cx="114" cy="42" r="3.5" fill="currentColor" />
        </motion.g>

        {/* Success checkmark */}
        {state === "success" && !reduceMotion && (
          <motion.path
            d="M 78 100 L 94 116 L 126 82"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        )}
      </svg>
    </motion.div>
  );
}