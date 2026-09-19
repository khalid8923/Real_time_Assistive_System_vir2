interface RobotIconProps {
  className?: string;
}

export default function RobotIcon({ className }: RobotIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      fill="none"
    >
      {/* Antenna */}
      <circle cx="32" cy="7" r="2.5" fill="currentColor" />
      <rect x="31.25" y="9" width="1.5" height="5" fill="currentColor" rx="0.5" />

      {/* Graduation cap - mortarboard */}
      <polygon
        points="32,12 48,18 32,24 16,18"
        fill="currentColor"
        opacity="0.95"
      />
      {/* Cap tassel */}
      <line
        x1="44"
        y1="20"
        x2="44"
        y2="28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="44" cy="29" r="2" fill="currentColor" />

      {/* Head */}
      <rect
        x="18"
        y="24"
        width="28"
        height="22"
        rx="7"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="rgba(255,255,255,0.05)"
      />

      {/* Eyes */}
      <circle cx="26" cy="34" r="2.8" fill="currentColor" />
      <circle cx="38" cy="34" r="2.8" fill="currentColor" />

      {/* Smile */}
      <path
        d="M26 40 Q32 44 38 40"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Neck */}
      <rect x="30" y="46" width="4" height="3" fill="currentColor" />

      {/* Body */}
      <rect
        x="22"
        y="49"
        width="20"
        height="12"
        rx="4"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="rgba(255,255,255,0.05)"
      />

      {/* Pen (held at the side) */}
      <line
        x1="44"
        y1="50"
        x2="52"
        y2="58"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Pen tip */}
      <circle cx="52.5" cy="58.5" r="1.2" fill="currentColor" />

      {/* Body detail - small button */}
      <circle cx="32" cy="55" r="1.5" fill="currentColor" opacity="0.7" />
    </svg>
  );
}