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
 * Official TaSched Orange Mascot
 * A friendly, cute orange character with big expressive eyes,
 * rounded orange body, small paws, and playful peeking/waving/celebrating poses.
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
    setTimeout(() => setIsWink(false), 800);
    if (onClick) onClick();
  };

  return (
    <div
      className={`tasched-mascot-wrapper mascot-pose-${pose} ${animated ? "mascot-animated" : ""} ${interactive ? "mascot-interactive" : ""} ${className}`}
      onClick={handleMascotClick}
      style={{
        transform: flip ? "scaleX(-1)" : undefined,
      }}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label="TaSched Orange Mascot"
    >
      {/* Optional Mascot Speech Bubble */}
      {speech && (
        <div className="mascot-speech-bubble" style={{ transform: flip ? "scaleX(-1)" : undefined }}>
          {badge && <span className="mascot-badge">{badge}</span>}
          <p className="mascot-speech-text">{speech}</p>
          {subtitle && <p className="mascot-speech-sub">{subtitle}</p>}
          <div className="mascot-speech-tail" />
        </div>
      )}

      {/* SVG Mascot Graphic */}
      <div className="mascot-svg-wrap" style={{ width: size, height: size }}>
        {renderMascotSvg(pose, isWink)}
      </div>
    </div>
  );
}

function renderMascotSvg(pose: MascotPose, isWink: boolean) {
  switch (pose) {
    case "peeking-folder":
      return <PeekingFolderSvg isWink={isWink} />;
    case "waving":
      return <WavingSvg isWink={isWink} />;
    case "peeking-top":
      return <PeekingTopSvg isWink={isWink} />;
    case "peeking-side":
      return <PeekingSideSvg isWink={isWink} />;
    case "pointing":
      return <PointingSvg isWink={isWink} />;
    case "celebrating":
      return <CelebratingSvg isWink={isWink} />;
    default:
      return <PeekingFolderSvg isWink={isWink} />;
  }
}

// -------------------------------------------------------------
// Shared SVG Gradients & Filters
// -------------------------------------------------------------
function MascotDefs({ idPrefix = "m" }: { idPrefix?: string }) {
  return (
    <defs>
      {/* Orange Body Gradient */}
      <radialGradient id={`${idPrefix}-bodyGrad`} cx="42%" cy="32%" r="65%">
        <stop offset="0%" stopColor="#FFA726" />
        <stop offset="45%" stopColor="#FB8C00" />
        <stop offset="85%" stopColor="#F57C00" />
        <stop offset="100%" stopColor="#E65100" />
      </radialGradient>

      {/* Subtle Highlights on Head */}
      <linearGradient id={`${idPrefix}-highlight`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFE0B2" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#FFA726" stopOpacity="0" />
      </linearGradient>

      {/* Yellow Folder Front Gradient */}
      <linearGradient id={`${idPrefix}-folderGrad`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="50%" stopColor="#FACC15" />
        <stop offset="100%" stopColor="#EAB308" />
      </linearGradient>

      {/* Folder Back Tab Gradient */}
      <linearGradient id={`${idPrefix}-folderBackGrad`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FACC15" />
        <stop offset="100%" stopColor="#CA8A04" />
      </linearGradient>

      {/* Eye Shading */}
      <linearGradient id={`${idPrefix}-eyeSclera`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="85%" stopColor="#F8FAFC" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>

      {/* Pupil Gradient */}
      <linearGradient id={`${idPrefix}-pupilGrad`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#1E293B" />
      </linearGradient>

      {/* Soft Drop Shadow */}
      <filter id={`${idPrefix}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.16" />
      </filter>

      {/* Folder Inner Shadow */}
      <filter id={`${idPrefix}-folderShadow`} x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#854D0E" floodOpacity="0.22" />
      </filter>
    </defs>
  );
}

// -------------------------------------------------------------
// 1. PEEKING FROM BEHIND YELLOW FOLDER (Iconic Reference Mascot)
// -------------------------------------------------------------
function PeekingFolderSvg({ isWink }: { isWink: boolean }) {
  return (
    <svg
      viewBox="0 0 240 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mascot-svg mascot-folder-svg"
    >
      <MascotDefs idPrefix="pf" />

      {/* Shadow under folder */}
      <ellipse cx="120" cy="208" rx="85" ry="9" fill="#0F172A" fillOpacity="0.12" />

      {/* Folder Back and Tab */}
      <g className="folder-back">
        {/* Back folder body */}
        <path
          d="M 28 85 C 28 78 33 73 40 73 L 78 73 C 83 73 88 70 91 66 L 98 56 C 101 52 106 50 111 50 L 200 50 C 207 50 212 55 212 62 L 212 175 C 212 182 207 187 200 187 L 40 187 C 33 187 28 182 28 175 Z"
          fill="url(#pf-folderBackGrad)"
        />
        {/* White schedule document peeking out */}
        <rect x="42" y="44" width="156" height="110" rx="8" fill="#FFFFFF" opacity="0.95" />
        {/* Schedule lines on paper */}
        <rect x="54" y="56" width="36" height="5" rx="2.5" fill="#10B981" />
        <rect x="54" y="66" width="70" height="3" rx="1.5" fill="#E2E8F0" />
        <rect x="54" y="73" width="55" height="3" rx="1.5" fill="#E2E8F0" />
        <rect x="156" y="56" width="30" height="20" rx="4" fill="#F1F5F9" />
        <rect x="162" y="62" width="18" height="2" rx="1" fill="#94A3B8" />
        <rect x="162" y="68" width="12" height="2" rx="1" fill="#94A3B8" />
      </g>

      {/* Orange Mascot Peeking Behind the Folder */}
      <g className="mascot-peeking-body">
        {/* Orange Rounded Body */}
        <path
          d="M 68 140 C 68 62 82 24 120 24 C 158 24 172 62 172 140 Z"
          fill="url(#pf-bodyGrad)"
        />

        {/* Head highlight shine */}
        <ellipse cx="120" cy="40" rx="34" ry="12" fill="url(#pf-highlight)" />

        {/* Big Expressive Eyes */}
        <g className="mascot-eyes">
          {/* Left Eye */}
          <ellipse cx="98" cy="74" rx="15" ry="19" fill="url(#pf-eyeSclera)" stroke="#7C2D12" strokeWidth="1.5" />
          {/* Right Eye */}
          <ellipse cx="142" cy="74" rx="15" ry="19" fill="url(#pf-eyeSclera)" stroke="#7C2D12" strokeWidth="1.5" />

          {isWink ? (
            <>
              {/* Winking left eye */}
              <path d="M 86 75 Q 98 84 110 75" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              {/* Normal right eye */}
              <ellipse cx="142" cy="74" rx="9" ry="12" fill="url(#pf-pupilGrad)" />
              <circle cx="138" cy="69" r="4.5" fill="#FFFFFF" />
              <circle cx="146" cy="78" r="2" fill="#FFFFFF" />
            </>
          ) : (
            <>
              {/* Left Pupil */}
              <ellipse cx="100" cy="74" rx="9.5" ry="12.5" fill="url(#pf-pupilGrad)" />
              {/* Left Eye Highlights (cute shine) */}
              <circle cx="96" cy="68" r="4.5" fill="#FFFFFF" />
              <circle cx="104" cy="78" r="2.2" fill="#FFFFFF" />

              {/* Right Pupil */}
              <ellipse cx="140" cy="74" rx="9.5" ry="12.5" fill="url(#pf-pupilGrad)" />
              {/* Right Eye Highlights */}
              <circle cx="136" cy="68" r="4.5" fill="#FFFFFF" />
              <circle cx="144" cy="78" r="2.2" fill="#FFFFFF" />
            </>
          )}

          {/* Cute subtle eyelids for depth */}
          <path d="M 84 62 Q 98 55 112 62" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M 128 62 Q 142 55 156 62" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </g>

        {/* Rosy Blushing Cheeks */}
        <ellipse cx="80" cy="92" rx="9" ry="5.5" fill="#FF5252" fillOpacity="0.45" />
        <ellipse cx="160" cy="92" rx="9" ry="5.5" fill="#FF5252" fillOpacity="0.45" />

        {/* Cute Smiling Mouth */}
        <g className="mascot-mouth">
          <path
            d="M 111 92 Q 120 102 129 92"
            stroke="#7C2D12"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Smile Dimple ticks */}
          <path d="M 109 91 Q 111 93 110 95" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 131 91 Q 129 93 130 95" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </g>

      {/* Front Yellow Folder Flap (Mascot hides behind this) */}
      <g className="folder-front" filter="url(#pf-folderShadow)">
        <path
          d="M 24 100 C 24 93 29 87 36 87 L 204 87 C 211 87 216 93 216 100 L 216 182 C 216 190 210 196 202 196 L 38 196 C 30 196 24 190 24 182 Z"
          fill="url(#pf-folderGrad)"
        />
        {/* Folder top edge highlight */}
        <path
          d="M 26 89 L 214 89"
          stroke="#FEF08A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />

        {/* Folder clasp/label badge (TaSched calendar mark) */}
        <rect x="94" y="126" width="52" height="38" rx="10" fill="#FFFFFF" fillOpacity="0.92" />
        <rect x="100" y="132" width="40" height="6" rx="3" fill="#10B981" />
        <circle cx="107" cy="147" r="2.5" fill="#047857" />
        <circle cx="116" cy="147" r="2.5" fill="#10B981" />
        <circle cx="125" cy="147" r="2.5" fill="#10B981" />
        <circle cx="134" cy="147" r="2.5" fill="#6EE7B7" />
        <circle cx="107" cy="154" r="2.5" fill="#10B981" />
        <circle cx="116" cy="154" r="2.5" fill="#047857" />
        <circle cx="125" cy="154" r="2.5" fill="#10B981" />
        <circle cx="134" cy="154" r="2.5" fill="#10B981" />
      </g>

      {/* Small Orange Hands Clasping the Folder Rim */}
      <g className="mascot-paws">
        {/* Left Hand / Paw (3 rounded little fingers over top edge) */}
        <path
          d="M 72 87 C 72 80 77 78 81 80 C 84 76 90 77 92 81 C 95 77 100 79 101 84 C 102 91 95 96 86 96 C 77 96 72 92 72 87 Z"
          fill="url(#pf-bodyGrad)"
          stroke="#C2410C"
          strokeWidth="1.2"
        />
        {/* Right Hand / Paw */}
        <path
          d="M 139 84 C 140 79 145 77 148 81 C 150 77 156 76 159 80 C 163 78 168 80 168 87 C 168 92 163 96 154 96 C 145 96 138 91 139 84 Z"
          fill="url(#pf-bodyGrad)"
          stroke="#C2410C"
          strokeWidth="1.2"
        />
      </g>
    </svg>
  );
}

// -------------------------------------------------------------
// 2. WAVING MASCOT (Friendly greeting for Welcome / Onboarding intro)
// -------------------------------------------------------------
function WavingSvg({ isWink }: { isWink: boolean }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mascot-svg mascot-waving-svg"
    >
      <MascotDefs idPrefix="wv" />

      {/* Shadow */}
      <ellipse cx="100" cy="188" rx="58" ry="8" fill="#0F172A" fillOpacity="0.12" />

      {/* Rounded Orange Body */}
      <path
        d="M 52 178 C 50 115 62 52 100 52 C 138 52 150 115 148 178 Z"
        fill="url(#wv-bodyGrad)"
      />

      {/* Head highlight */}
      <ellipse cx="100" cy="66" rx="30" ry="10" fill="url(#wv-highlight)" />

      {/* Left arm resting gently */}
      <path
        d="M 56 120 C 44 126 38 138 42 148 C 45 154 52 155 58 149 C 62 143 65 133 65 125 Z"
        fill="url(#wv-bodyGrad)"
        stroke="#C2410C"
        strokeWidth="1.2"
      />

      {/* Right Waving Arm (animated via CSS) */}
      <g className="mascot-wave-arm">
        <path
          d="M 140 115 C 154 105 168 85 174 68 C 177 60 171 54 163 58 C 154 64 145 84 135 102 Z"
          fill="url(#wv-bodyGrad)"
          stroke="#C2410C"
          strokeWidth="1.2"
        />
        {/* Cute Waving Paw with 3 fingers */}
        <circle cx="170" cy="62" r="9" fill="url(#wv-bodyGrad)" stroke="#C2410C" strokeWidth="1.2" />
        <circle cx="165" cy="54" r="4.5" fill="#FFA726" />
        <circle cx="174" cy="55" r="4.5" fill="#FFA726" />
        <circle cx="179" cy="63" r="4.5" fill="#FFA726" />
      </g>

      {/* Big Expressive Eyes */}
      <g className="mascot-eyes">
        <ellipse cx="82" cy="95" rx="14" ry="18" fill="url(#wv-eyeSclera)" stroke="#7C2D12" strokeWidth="1.5" />
        <ellipse cx="118" cy="95" rx="14" ry="18" fill="url(#wv-eyeSclera)" stroke="#7C2D12" strokeWidth="1.5" />

        {isWink ? (
          <>
            <path d="M 72 95 Q 82 103 92 95" stroke="#1E293B" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <ellipse cx="118" cy="95" rx="9" ry="12" fill="url(#wv-pupilGrad)" />
            <circle cx="114" cy="90" r="4.5" fill="#FFFFFF" />
            <circle cx="122" cy="98" r="2" fill="#FFFFFF" />
          </>
        ) : (
          <>
            <ellipse cx="84" cy="95" rx="9" ry="12" fill="url(#wv-pupilGrad)" />
            <circle cx="80" cy="90" r="4" fill="#FFFFFF" />
            <circle cx="88" cy="98" r="2" fill="#FFFFFF" />

            <ellipse cx="116" cy="95" rx="9" ry="12" fill="url(#wv-pupilGrad)" />
            <circle cx="112" cy="90" r="4" fill="#FFFFFF" />
            <circle cx="120" cy="98" r="2" fill="#FFFFFF" />
          </>
        )}

        <path d="M 70 83 Q 82 76 94 83" stroke="#EA580C" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        <path d="M 106 83 Q 118 76 130 83" stroke="#EA580C" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </g>

      {/* Rosy Cheeks */}
      <ellipse cx="68" cy="112" rx="8" ry="5" fill="#FF5252" fillOpacity="0.45" />
      <ellipse cx="132" cy="112" rx="8" ry="5" fill="#FF5252" fillOpacity="0.45" />

      {/* Cheerful Open Smile */}
      <g className="mascot-mouth">
        <path
          d="M 91 113 Q 100 110 109 113 Q 109 125 100 125 Q 91 125 91 113 Z"
          fill="#881337"
          stroke="#7C2D12"
          strokeWidth="1.5"
        />
        {/* Pink Tongue */}
        <path
          d="M 94 121 Q 100 117 106 121 Q 104 125 100 125 Q 96 125 94 121 Z"
          fill="#FB7185"
        />
      </g>
    </svg>
  );
}

// -------------------------------------------------------------
// 3. PEEKING FROM TOP (Peeking over role cards / form headers)
// -------------------------------------------------------------
function PeekingTopSvg({ isWink }: { isWink: boolean }) {
  return (
    <svg
      viewBox="0 0 180 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mascot-svg mascot-peeking-top-svg"
    >
      <MascotDefs idPrefix="pt" />

      {/* Orange Head Peeking Up */}
      <g className="mascot-head-peek">
        <path
          d="M 40 110 C 40 45 55 12 90 12 C 125 12 140 45 140 110 Z"
          fill="url(#pt-bodyGrad)"
        />

        {/* Head highlight */}
        <ellipse cx="90" cy="24" rx="26" ry="8" fill="url(#pt-highlight)" />

        {/* Big Expressive Eyes looking down curiously */}
        <g className="mascot-eyes">
          <ellipse cx="72" cy="54" rx="13" ry="17" fill="url(#pt-eyeSclera)" stroke="#7C2D12" strokeWidth="1.5" />
          <ellipse cx="108" cy="54" rx="13" ry="17" fill="url(#pt-eyeSclera)" stroke="#7C2D12" strokeWidth="1.5" />

          {isWink ? (
            <>
              <path d="M 62 55 Q 72 63 82 55" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
              <ellipse cx="108" cy="57" rx="8" ry="11" fill="url(#pt-pupilGrad)" />
              <circle cx="105" cy="53" r="3.8" fill="#FFFFFF" />
              <circle cx="111" cy="61" r="1.8" fill="#FFFFFF" />
            </>
          ) : (
            <>
              {/* Pupils tilted down towards options */}
              <ellipse cx="74" cy="57" rx="8.5" ry="11.5" fill="url(#pt-pupilGrad)" />
              <circle cx="71" cy="52" r="3.8" fill="#FFFFFF" />
              <circle cx="77" cy="60" r="1.8" fill="#FFFFFF" />

              <ellipse cx="106" cy="57" rx="8.5" ry="11.5" fill="url(#pt-pupilGrad)" />
              <circle cx="103" cy="52" r="3.8" fill="#FFFFFF" />
              <circle cx="109" cy="60" r="1.8" fill="#FFFFFF" />
            </>
          )}

          <path d="M 60 42 Q 72 36 84 42" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M 96 42 Q 108 36 120 42" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>

        {/* Rosy Cheeks */}
        <ellipse cx="56" cy="70" rx="7" ry="4.5" fill="#FF5252" fillOpacity="0.45" />
        <ellipse cx="124" cy="70" rx="7" ry="4.5" fill="#FF5252" fillOpacity="0.45" />

        {/* Sweet Smile */}
        <path
          d="M 82 72 Q 90 80 98 72"
          stroke="#7C2D12"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Paws Resting on the top border line */}
      <g className="mascot-paws">
        <path
          d="M 46 104 C 46 98 50 96 54 98 C 57 95 62 96 64 99 C 67 96 71 97 72 101 C 72 107 67 111 59 111 C 52 111 46 108 46 104 Z"
          fill="url(#pt-bodyGrad)"
          stroke="#C2410C"
          strokeWidth="1.2"
        />
        <path
          d="M 108 101 C 109 97 113 96 116 99 C 118 96 123 95 126 98 C 130 96 134 98 134 104 C 134 108 129 111 121 111 C 114 111 108 107 108 101 Z"
          fill="url(#pt-bodyGrad)"
          stroke="#C2410C"
          strokeWidth="1.2"
        />
      </g>
    </svg>
  );
}

// -------------------------------------------------------------
// 4. PEEKING FROM SIDE (Form edge interaction for Student/Teacher info)
// -------------------------------------------------------------
function PeekingSideSvg({ isWink }: { isWink: boolean }) {
  return (
    <svg
      viewBox="0 0 130 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mascot-svg mascot-peeking-side-svg"
    >
      <MascotDefs idPrefix="ps" />

      {/* Body peeking from left edge */}
      <g className="mascot-side-peek">
        <path
          d="M 0 145 C 45 145 88 128 88 80 C 88 32 45 15 0 15 Z"
          fill="url(#ps-bodyGrad)"
        />

        {/* Head highlight */}
        <ellipse cx="35" cy="30" rx="22" ry="7" fill="url(#ps-highlight)" />

        {/* Eyes peeking around the corner */}
        <g className="mascot-eyes">
          <ellipse cx="38" cy="70" rx="12" ry="16" fill="url(#ps-eyeSclera)" stroke="#7C2D12" strokeWidth="1.5" />
          <ellipse cx="68" cy="70" rx="12" ry="16" fill="url(#ps-eyeSclera)" stroke="#7C2D12" strokeWidth="1.5" />

          {isWink ? (
            <>
              <path d="M 28 71 Q 38 78 48 71" stroke="#1E293B" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <ellipse cx="70" cy="71" rx="7.5" ry="10" fill="url(#ps-pupilGrad)" />
              <circle cx="68" cy="67" r="3.5" fill="#FFFFFF" />
            </>
          ) : (
            <>
              <ellipse cx="41" cy="71" rx="7.5" ry="10.5" fill="url(#ps-pupilGrad)" />
              <circle cx="39" cy="67" r="3.5" fill="#FFFFFF" />
              <circle cx="44" cy="74" r="1.6" fill="#FFFFFF" />

              <ellipse cx="71" cy="71" rx="7.5" ry="10.5" fill="url(#ps-pupilGrad)" />
              <circle cx="69" cy="67" r="3.5" fill="#FFFFFF" />
              <circle cx="74" cy="74" r="1.6" fill="#FFFFFF" />
            </>
          )}

          <path d="M 28 59 Q 38 53 48 59" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M 58 59 Q 68 53 78 59" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>

        {/* Cheeks */}
        <ellipse cx="28" cy="85" rx="6" ry="4" fill="#FF5252" fillOpacity="0.45" />
        <ellipse cx="80" cy="85" rx="6" ry="4" fill="#FF5252" fillOpacity="0.45" />

        {/* Inquisitive cute smile */}
        <path
          d="M 50 86 Q 58 93 64 87"
          stroke="#7C2D12"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Paws gripping the side edge */}
      <g className="mascot-side-paws">
        <path
          d="M 78 48 C 84 48 88 52 87 56 C 89 58 91 62 89 65 C 87 69 82 70 78 68 Z"
          fill="url(#ps-bodyGrad)"
          stroke="#C2410C"
          strokeWidth="1.2"
        />
        <path
          d="M 78 98 C 84 98 88 102 87 106 C 89 108 91 112 89 115 C 87 119 82 120 78 118 Z"
          fill="url(#ps-bodyGrad)"
          stroke="#C2410C"
          strokeWidth="1.2"
        />
      </g>
    </svg>
  );
}

// -------------------------------------------------------------
// 5. POINTING MASCOT (Guiding attention to preferences & form fields)
// -------------------------------------------------------------
function PointingSvg({ isWink }: { isWink: boolean }) {
  return (
    <svg
      viewBox="0 0 200 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mascot-svg mascot-pointing-svg"
    >
      <MascotDefs idPrefix="ptg" />

      {/* Shadow */}
      <ellipse cx="100" cy="180" rx="55" ry="7" fill="#0F172A" fillOpacity="0.12" />

      {/* Rounded Body */}
      <path
        d="M 54 172 C 52 108 64 48 100 48 C 136 48 148 108 146 172 Z"
        fill="url(#ptg-bodyGrad)"
      />

      {/* Head highlight */}
      <ellipse cx="100" cy="60" rx="28" ry="9" fill="url(#ptg-highlight)" />

      {/* Left Hand resting on hip */}
      <path
        d="M 56 122 C 46 126 40 134 44 142 C 48 148 56 148 62 140 Z"
        fill="url(#ptg-bodyGrad)"
        stroke="#C2410C"
        strokeWidth="1.2"
      />

      {/* Right Arm Pointing Downward/Forward toward fields */}
      <g className="mascot-pointing-arm">
        <path
          d="M 138 118 C 152 122 172 135 186 148 C 190 152 184 158 178 155 C 166 148 148 138 135 132 Z"
          fill="url(#ptg-bodyGrad)"
          stroke="#C2410C"
          strokeWidth="1.2"
        />
        {/* Cute hand with extended pointing index finger */}
        <circle cx="184" cy="150" r="7.5" fill="url(#ptg-bodyGrad)" stroke="#C2410C" strokeWidth="1.2" />
        {/* Pointing index finger */}
        <path
          d="M 186 148 L 198 158 C 200 160 197 163 194 162 L 184 155 Z"
          fill="#FFA726"
        />
      </g>

      {/* Big Expressive Eyes looking eagerly toward target */}
      <g className="mascot-eyes">
        <ellipse cx="84" cy="88" rx="13.5" ry="17.5" fill="url(#ptg-eyeSclera)" stroke="#7C2D12" strokeWidth="1.5" />
        <ellipse cx="118" cy="88" rx="13.5" ry="17.5" fill="url(#ptg-eyeSclera)" stroke="#7C2D12" strokeWidth="1.5" />

        {isWink ? (
          <>
            <path d="M 74 88 Q 84 96 94 88" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
            <ellipse cx="120" cy="89" rx="8.5" ry="11.5" fill="url(#ptg-pupilGrad)" />
            <circle cx="117" cy="85" r="4" fill="#FFFFFF" />
            <circle cx="123" cy="92" r="1.8" fill="#FFFFFF" />
          </>
        ) : (
          <>
            {/* Pupils looking slightly right/down */}
            <ellipse cx="88" cy="90" rx="8.5" ry="11.5" fill="url(#ptg-pupilGrad)" />
            <circle cx="85" cy="85" r="4" fill="#FFFFFF" />
            <circle cx="91" cy="93" r="1.8" fill="#FFFFFF" />

            <ellipse cx="122" cy="90" rx="8.5" ry="11.5" fill="url(#ptg-pupilGrad)" />
            <circle cx="119" cy="85" r="4" fill="#FFFFFF" />
            <circle cx="125" cy="93" r="1.8" fill="#FFFFFF" />
          </>
        )}

        <path d="M 72 76 Q 84 70 96 76" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M 106 76 Q 118 70 130 76" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>

      {/* Cheeks */}
      <ellipse cx="70" cy="104" rx="7.5" ry="4.5" fill="#FF5252" fillOpacity="0.45" />
      <ellipse cx="132" cy="104" rx="7.5" ry="4.5" fill="#FF5252" fillOpacity="0.45" />

      {/* Friendly Smile */}
      <path
        d="M 94 105 Q 102 114 110 105"
        stroke="#7C2D12"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// -------------------------------------------------------------
// 6. CELEBRATING MASCOT (Happy expression, arms in air, confetti!)
// -------------------------------------------------------------
function CelebratingSvg({ isWink }: { isWink: boolean }) {
  return (
    <svg
      viewBox="0 0 220 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mascot-svg mascot-celebrating-svg"
    >
      <MascotDefs idPrefix="clb" />

      {/* Floating Sparkles & Confetti around mascot */}
      <g className="mascot-confetti-burst">
        {/* Stars */}
        <path d="M 35 45 L 37 40 L 42 38 L 37 36 L 35 31 L 33 36 L 28 38 L 33 40 Z" fill="#FBBF24" />
        <path d="M 185 45 L 187 40 L 192 38 L 187 36 L 185 31 L 183 36 L 178 38 L 183 40 Z" fill="#F59E0B" />
        <path d="M 110 18 L 112 14 L 116 12 L 112 10 L 110 6 L 108 10 L 104 12 L 108 14 Z" fill="#10B981" />

        {/* Confetti ribbons */}
        <rect x="25" y="70" width="8" height="4" rx="2" fill="#3B82F6" transform="rotate(25 25 70)" />
        <rect x="190" y="75" width="8" height="4" rx="2" fill="#EC4899" transform="rotate(-30 190 75)" />
        <rect x="45" y="115" width="7" height="3.5" rx="1.5" fill="#10B981" transform="rotate(45 45 115)" />
        <rect x="175" y="120" width="7" height="3.5" rx="1.5" fill="#FBBF24" transform="rotate(-15 175 120)" />
        <circle cx="30" cy="95" r="2.5" fill="#EC4899" />
        <circle cx="192" cy="100" r="2.5" fill="#3B82F6" />
      </g>

      {/* Shadow */}
      <ellipse cx="110" cy="195" rx="60" ry="8" fill="#0F172A" fillOpacity="0.12" />

      {/* Joyful Bouncing Body */}
      <g className="mascot-celebrate-jump">
        <path
          d="M 64 186 C 62 120 74 62 110 62 C 146 62 158 120 156 186 Z"
          fill="url(#clb-bodyGrad)"
        />

        {/* Head highlight */}
        <ellipse cx="110" cy="74" rx="30" ry="10" fill="url(#clb-highlight)" />

        {/* Left Arm Raised High (\o/) */}
        <g className="mascot-arm-left-up">
          <path
            d="M 75 118 C 60 102 44 78 38 60 C 35 52 42 48 49 53 C 58 60 70 82 82 105 Z"
            fill="url(#clb-bodyGrad)"
            stroke="#C2410C"
            strokeWidth="1.2"
          />
          <circle cx="40" cy="54" r="8" fill="url(#clb-bodyGrad)" stroke="#C2410C" strokeWidth="1.2" />
          <circle cx="34" cy="48" r="3.5" fill="#FFA726" />
          <circle cx="42" cy="47" r="3.5" fill="#FFA726" />
          <circle cx="47" cy="53" r="3.5" fill="#FFA726" />
        </g>

        {/* Right Arm Raised High (\o/) */}
        <g className="mascot-arm-right-up">
          <path
            d="M 145 118 C 160 102 176 78 182 60 C 185 52 178 48 171 53 C 162 60 150 82 138 105 Z"
            fill="url(#clb-bodyGrad)"
            stroke="#C2410C"
            strokeWidth="1.2"
          />
          <circle cx="180" cy="54" r="8" fill="url(#clb-bodyGrad)" stroke="#C2410C" strokeWidth="1.2" />
          <circle cx="173" cy="53" r="3.5" fill="#FFA726" />
          <circle cx="178" cy="47" r="3.5" fill="#FFA726" />
          <circle cx="186" cy="48" r="3.5" fill="#FFA726" />
        </g>

        {/* Happy Joyful Eyes (Crescent Arc Eyes ^ ^) */}
        <g className="mascot-celebrate-eyes">
          {isWink ? (
            <>
              {/* Left wink */}
              <path d="M 82 98 Q 94 108 104 98" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              {/* Right open sparkle eye */}
              <ellipse cx="126" cy="96" rx="12" ry="15" fill="url(#clb-eyeSclera)" stroke="#7C2D12" strokeWidth="1.5" />
              <ellipse cx="126" cy="96" rx="7.5" ry="10" fill="url(#clb-pupilGrad)" />
              <circle cx="123" cy="92" r="3.5" fill="#FFFFFF" />
            </>
          ) : (
            <>
              {/* Happy curved eyes ^ ^ */}
              <path
                d="M 80 100 Q 94 85 106 100"
                stroke="#1E293B"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 114 100 Q 128 85 140 100"
                stroke="#1E293B"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}

          {/* Happy raised brows */}
          <path d="M 80 82 Q 94 74 106 82" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M 114 82 Q 128 74 140 82" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>

        {/* Rosy Celebration Cheeks */}
        <ellipse cx="76" cy="112" rx="9" ry="6" fill="#FF5252" fillOpacity="0.55" />
        <ellipse cx="144" cy="112" rx="9" ry="6" fill="#FF5252" fillOpacity="0.55" />

        {/* Big Joyful Open Mouth Grin */}
        <g className="mascot-mouth">
          <path
            d="M 96 114 Q 110 110 124 114 Q 124 133 110 133 Q 96 133 96 114 Z"
            fill="#881337"
            stroke="#7C2D12"
            strokeWidth="1.8"
          />
          {/* Tongue */}
          <path
            d="M 100 125 Q 110 118 120 125 Q 116 133 110 133 Q 104 133 100 125 Z"
            fill="#FB7185"
          />
        </g>
      </g>
    </svg>
  );
}

