"use client";

import { motion, useReducedMotion } from "motion/react";

interface RobotIconProps {
  className?: string;
  animated?: boolean;
}

export default function RobotIcon({ className, animated = false }: RobotIconProps) {
  const reduced = useReducedMotion();
  const shouldAnimate = animated && !reduced;

  return (
    <motion.svg
      className={className}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      fill="none"
      animate={
        shouldAnimate
          ? {
              rotate: [0, -8, 8, -6, 6, 0],
            }
          : {}
      }
      transition={{
        duration: 2.5,
        repeat: Infinity,
        repeatDelay: 2,
        ease: "easeInOut",
      }}
      style={{ originX: 0.5, originY: 0.9 }}
    >
      <circle cx="32" cy="7" r="2.5" fill="currentColor" />
      <rect x="31.25" y="9" width="1.5" height="5" fill="currentColor" rx="0.5" />

      <polygon points="32,12 48,18 32,24 16,18" fill="currentColor" opacity="0.95" />

      <motion.line
        x1="44" y1="20" x2="44" y2="28"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        animate={shouldAnimate ? { x2: [44, 48, 44, 40, 44] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <circle cx="44" cy="29" r="2" fill="currentColor" />

      <rect
        x="18" y="24" width="28" height="22" rx="7"
        stroke="currentColor" strokeWidth="2.2"
        fill="rgba(255,255,255,0.05)"
      />

      <motion.circle
        cx="26" cy="34" r="2.8" fill="currentColor"
        animate={shouldAnimate ? { cy: [34, 33, 34] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="38" cy="34" r="2.8" fill="currentColor"
        animate={shouldAnimate ? { cy: [34, 33, 34] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      <path
        d="M26 40 Q32 44 38 40"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      />

      <rect x="30" y="46" width="4" height="3" fill="currentColor" />

      <rect
        x="22" y="49" width="20" height="12" rx="4"
        stroke="currentColor" strokeWidth="2.2"
        fill="rgba(255,255,255,0.05)"
      />

      <line
        x1="44" y1="50" x2="52" y2="58"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      />
      <circle cx="52.5" cy="58.5" r="1.2" fill="currentColor" />
      <circle cx="32" cy="55" r="1.5" fill="currentColor" opacity="0.7" />
    </motion.svg>
  );
}
