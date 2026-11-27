import React, { useState } from "react";

export type MascotPose =
  | "peeking-folder"
  | "peeking-top"
  | "peeking-side"
  | "waving"
  | "pointing"
  | "celebrating";

export interface MascotProps {
  pose?: MascotPose;
  size?: number | string;
  className?: string;
  speech?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: string;
  animated?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  flip?: boolean;
}

/**
 * Official TaSched Cream Owl Mascot
 * Friendly chubby cream owl character with warm brown outlines,
 * fluffy ear tufts, rosy cheeks, expressive eyes, and playful poses.
 */
export default function Mascot({
  pose = "peeking-folder",
  size,
  className = "",
  speech,
  subtitle,
  badge,
  animated = true,
  interactive = true,
  onClick,
  flip = false,
}: MascotProps) {
  const [isWink, setIsWink] = useState(false);

  const handleMascotClick = () => {
    setIsWink(true);
    window.setTimeout(() => setIsWink(false), 800);
    if (onClick) onClick();
  };

  return (
    <div
      className={`tasched-mascot-wrapper mascot-pose-${pose} ${animated ? "mascot-animated" : ""} ${interactive ? "mascot-interactive" : ""} ${className}`}
      onClick={handleMascotClick}
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label="TaSched Owl Mascot"
    >
      {speech && (
        <div className="mascot-speech-bubble" style={{ transform: flip ? "scaleX(-1)" : undefined }}>
          {badge && <span className="mascot-badge">{badge}</span>}
          <p className="mascot-speech-text">{speech}</p>
          {subtitle && <p className="mascot-speech-sub">{subtitle}</p>}
          <div className="mascot-speech-tail" />
        </div>
      )}

      <div className="mascot-svg-wrap" style={{ width: size, height: size }}>
        <OwlSvg pose={pose} isWink={isWink} />
      </div>
    </div>
  );
}

function OwlDefs({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`${id}-cream`} cx="45%" cy="32%" r="68%">
        <stop offset="0%" stopColor="#FFFDF9" />
        <stop offset="55%" stopColor="#F6EBDC" />
        <stop offset="100%" stopColor="#E6D2B8" />
      </radialGradient>
      <linearGradient id={`${id}-wing`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F5E8D7" />
        <stop offset="100%" stopColor="#DEC5A6" />
      </linearGradient>
      <linearGradient id={`${id}-belly`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFBF5" />
        <stop offset="100%" stopColor="#F1E2CE" />
      </linearGradient>
      <linearGradient id={`${id}-beak`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#9E7E6B" />
        <stop offset="100%" stopColor="#6D4C41" />
      </linearGradient>
      <linearGradient id={`${id}-folder`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#3B5BDB" />
      </linearGradient>
    </defs>
  );
}

function OwlFace({
  id,
  cx = 120,
  cy = 94,
  isWink,
}: {
  id: string;
  cx?: number;
  cy?: number;
  isWink: boolean;
}) {
  return (
    <g>
      {/* Subtle facial disc shading */}
      <ellipse cx={cx - 24} cy={cy} rx="22" ry="20" fill="#FFFDF9" fillOpacity="0.65" />
      <ellipse cx={cx + 24} cy={cy} rx="22" ry="20" fill="#FFFDF9" fillOpacity="0.65" />

      {/* Cute expressive brow tufts */}
      <path
        d={`M ${cx - 35} ${cy - 20} Q ${cx - 22} ${cy - 25} ${cx - 12} ${cy - 17}`}
        stroke="#5D4037"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M ${cx + 35} ${cy - 20} Q ${cx + 22} ${cy - 25} ${cx + 12} ${cy - 17}`}
        stroke="#5D4037"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Big glossy dark brown eyes */}
      {isWink ? (
        <>
          <path
            d={`M ${cx - 34} ${cy} Q ${cx - 22} ${cy + 9} ${cx - 10} ${cy}`}
            stroke="#4E342E"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx={cx + 23} cy={cy} r="13.5" fill="#3E2723" stroke="#5D4037" strokeWidth="1.5" />
          <circle cx={cx + 18} cy={cy - 5} r="4.8" fill="#FFFFFF" />
          <circle cx={cx + 27} cy={cy + 4} r="2.2" fill="#FFFFFF" />
        </>
      ) : (
        <>
          <circle cx={cx - 23} cy={cy} r="13.5" fill="#3E2723" stroke="#5D4037" strokeWidth="1.5" />
          <circle cx={cx - 28} cy={cy - 5} r="4.8" fill="#FFFFFF" />
          <circle cx={cx - 19} cy={cy + 4} r="2.2" fill="#FFFFFF" />

          <circle cx={cx + 23} cy={cy} r="13.5" fill="#3E2723" stroke="#5D4037" strokeWidth="1.5" />
          <circle cx={cx + 18} cy={cy - 5} r="4.8" fill="#FFFFFF" />
          <circle cx={cx + 27} cy={cy + 4} r="2.2" fill="#FFFFFF" />
        </>
      )}

      {/* Rosy blushing cheeks */}
      <ellipse cx={cx - 38} cy={cy + 14} rx="8.5" ry="5" fill="#F29F9E" fillOpacity="0.65" />
      <ellipse cx={cx + 38} cy={cy + 14} rx="8.5" ry="5" fill="#F29F9E" fillOpacity="0.65" />

      {/* Cute rounded beak */}
      <path
        d={`M ${cx - 6} ${cy + 7} Q ${cx} ${cy + 4} ${cx + 6} ${cy + 7} Q ${cx + 5} ${cy + 18} ${cx} ${cy + 19} Q ${cx - 5} ${cy + 18} ${cx - 6} ${cy + 7} Z`}
        fill={`url(#${id}-beak)`}
        stroke="#4E342E"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d={`M ${cx - 2} ${cy + 10} Q ${cx} ${cy + 8} ${cx + 2} ${cy + 10}`} stroke="#D7CCC8" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </g>
  );
}

function OwlSvg({ pose, isWink }: { pose: MascotPose; isWink: boolean }) {
  const id = `owl-${pose}`;

  if (pose === "peeking-top") {
    return (
      <svg viewBox="0 0 220 170" fill="none" className="mascot-svg">
        <OwlDefs id={id} />
        {/* Head + Ear tufts peeking cleanly */}
        <path
          d="M 44 150 C 42 104 54 62 72 44 L 60 20 Q 82 26 92 38 Q 110 32 128 38 Q 138 26 160 20 L 148 44 C 166 62 178 104 176 150 Z"
          fill={`url(#${id}-cream)`}
          stroke="#5D4037"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <OwlFace id={id} cx={110} cy={92} isWink={isWink} />
        {/* Tiny paws resting at bottom */}
        <ellipse cx="66" cy="146" rx="14" ry="9" fill={`url(#${id}-wing)`} stroke="#5D4037" strokeWidth="3" />
        <ellipse cx="154" cy="146" rx="14" ry="9" fill={`url(#${id}-wing)`} stroke="#5D4037" strokeWidth="3" />
      </svg>
    );
  }

  if (pose === "peeking-folder") {
    return (
      <svg viewBox="0 0 240 220" fill="none" className="mascot-svg">
        <OwlDefs id={id} />
        <ellipse cx="120" cy="206" rx="80" ry="8" fill="#0F172A" fillOpacity="0.14" />
        {/* Folder behind */}
        <path
          d="M 30 98 C 30 91 36 86 43 86 L 82 86 C 88 86 92 83 95 78 L 101 70 C 104 66 109 64 115 64 L 197 64 C 204 64 210 70 210 77 L 210 182 C 210 189 204 195 197 195 L 43 195 C 36 195 30 189 30 182 Z"
          fill="#2B449E"
        />
        {/* Owl peeking */}
        <path
          d="M 60 154 C 56 102 68 58 84 42 L 73 16 Q 94 23 103 34 Q 120 28 137 34 Q 146 23 167 16 L 156 42 C 172 58 184 102 180 154 Z"
          fill={`url(#${id}-cream)`}
          stroke="#5D4037"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <OwlFace id={id} cx={120} cy={84} isWink={isWink} />
        {/* Front Sapphire Planner Folder */}
        <path
          d="M 26 112 C 26 105 32 100 39 100 L 201 100 C 208 100 214 105 214 112 L 214 184 C 214 191 208 197 201 197 L 39 197 C 32 197 26 191 26 184 Z"
          fill={`url(#${id}-folder)`}
        />
        <rect x="92" y="128" width="56" height="44" rx="12" fill="#FFFFFF" fillOpacity="0.95" />
        <rect x="102" y="138" width="36" height="5" rx="2.5" fill="#3B5BDB" />
        <rect x="102" y="148" width="26" height="4" rx="2" fill="#CBD5E1" />
        <rect x="102" y="156" width="30" height="4" rx="2" fill="#CBD5E1" />
        {/* Owl wing tips gripping top of folder */}
        <ellipse cx="76" cy="102" rx="13" ry="8" fill={`url(#${id}-wing)`} stroke="#5D4037" strokeWidth="3" />
        <ellipse cx="164" cy="102" rx="13" ry="8" fill={`url(#${id}-wing)`} stroke="#5D4037" strokeWidth="3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 240 230" fill="none" className="mascot-svg">
      <OwlDefs id={id} />
      {/* Soft shadow */}
      <ellipse cx="120" cy="210" rx="58" ry="9" fill="#64748B" fillOpacity="0.22" />

      {/* Cute little owl feet */}
      <path d="M 92 195 L 88 207 M 96 196 L 96 208 M 101 195 L 104 206" stroke="#6D4C41" strokeWidth="4" strokeLinecap="round" />
      <path d="M 148 195 L 152 207 M 144 196 L 144 208 M 139 195 L 136 206" stroke="#6D4C41" strokeWidth="4" strokeLinecap="round" />

      {/* Left Wing */}
      <path
        d={
          pose === "celebrating"
            ? "M 64 134 C 34 114 28 82 44 74 C 58 68 68 96 72 116 Z"
            : "M 64 128 C 40 138 38 168 54 176 C 66 180 72 162 72 146 Z"
        }
        fill={`url(#${id}-wing)`}
        stroke="#5D4037"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Right Wing (pointing/waving/celebrating) */}
      <path
        d={
          pose === "pointing" || pose === "waving" || pose === "celebrating"
            ? "M 172 134 C 198 118 214 96 202 84 C 192 75 180 96 172 112 Z"
            : "M 176 128 C 200 138 202 168 186 176 C 174 180 168 162 168 146 Z"
        }
        fill={`url(#${id}-wing)`}
        stroke="#5D4037"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Chubby Owl Body & Head with Fluffy Ear Tufts */}
      <path
        d="M 64 138 C 60 88 70 52 84 38 L 70 16 Q 92 22 102 32 Q 120 26 138 32 Q 148 22 170 16 L 156 38 C 170 52 180 88 176 138 C 174 184 152 199 120 199 C 88 199 66 184 64 138 Z"
        fill={`url(#${id}-cream)`}
        stroke="#5D4037"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Soft Cream Belly Patch & Scalloped Feather Tufts */}
      <ellipse cx="120" cy="154" rx="40" ry="34" fill={`url(#${id}-belly)`} />
      <path d="M 96 144 Q 103 151 110 144 M 113 144 Q 120 151 127 144 M 130 144 Q 137 151 144 144" stroke="#C7B299" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M 102 160 Q 109 167 116 160 M 124 160 Q 131 167 138 160" stroke="#C7B299" strokeWidth="2.2" strokeLinecap="round" fill="none" />

      {/* Cute Owl Face */}
      <OwlFace id={id} cx={120} cy={88} isWink={isWink} />

      {/* Optional Sparkles when celebrating */}
      {pose === "celebrating" && (
        <g fill="#3B5BDB">
          <path d="M 38 44 L 42 52 L 50 56 L 42 60 L 38 68 L 34 60 L 26 56 L 34 52 Z" />
          <path d="M 200 42 L 203 48 L 209 51 L 203 54 L 200 60 L 197 54 L 191 51 L 197 48 Z" fill="#0CA678" />
        </g>
      )}
    </svg>
  );
}
