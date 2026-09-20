// Simple pictogram-style illustrations for the "Common Health Concerns"
// cards. Each one visually depicts the symptom itself (not just a generic
// specialty icon) so someone can recognise their concern by the picture
// alone, without needing to read the label.
//
// Drawn with basic shapes/strokes so they render reliably at small sizes.
// `className` controls color via currentColor; pass a text-color utility.

type IllustrationProps = { className?: string };

function Base({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 70"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

const stroke = { stroke: "currentColor", strokeWidth: 3.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function CoughColdIllustration({ className }: IllustrationProps) {
  return (
    <Base className={className}>
      {/* head */}
      <circle cx="42" cy="32" r="16" {...stroke} fill="white" fillOpacity={0.9} />
      {/* open mouth */}
      <ellipse cx="53" cy="36" rx="4" ry="5" fill="currentColor" />
      {/* cough burst lines */}
      <path d="M62 26 L74 20" {...stroke} />
      <path d="M65 34 L78 33" {...stroke} />
      <path d="M62 42 L74 46" {...stroke} />
      {/* tissue */}
      <rect x="18" y="50" width="18" height="12" rx="2" {...stroke} fill="white" fillOpacity={0.9} />
    </Base>
  );
}

export function SkinCareIllustration({ className }: IllustrationProps) {
  return (
    <Base className={className}>
      {/* hand / palm outline */}
      <path
        d="M28 52c-4-6-6-14-4-22 1-5 4-9 8-9s6 4 6 9v4c2-4 5-7 9-6s5 6 3 10l-2 4c3-2 6-2 8 1s0 7-3 10l-6 6c-4 4-11 5-16 1z"
        {...stroke}
        fill="white"
        fillOpacity={0.9}
      />
      {/* spots */}
      <circle cx="35" cy="32" r="1.8" fill="currentColor" />
      <circle cx="42" cy="26" r="1.8" fill="currentColor" />
      <circle cx="46" cy="34" r="1.8" fill="currentColor" />
      {/* magnifying glass */}
      <circle cx="70" cy="24" r="10" {...stroke} />
      <path d="M77 31 L86 40" {...stroke} />
    </Base>
  );
}

export function PeriodTrackerIllustration({ className }: IllustrationProps) {
  return (
    <Base className={className}>
      {/* calendar */}
      <rect x="24" y="18" width="44" height="38" rx="4" {...stroke} fill="white" fillOpacity={0.9} />
      <path d="M24 30 H68" {...stroke} />
      <path d="M34 14 V22" {...stroke} />
      <path d="M58 14 V22" {...stroke} />
      {/* grid dots */}
      <circle cx="34" cy="40" r="2" fill="currentColor" opacity={0.35} />
      <circle cx="46" cy="40" r="2" fill="currentColor" opacity={0.35} />
      <circle cx="58" cy="40" r="2" fill="currentColor" opacity={0.35} />
      <circle cx="34" cy="49" r="2" fill="currentColor" opacity={0.35} />
      {/* highlighted day with drop */}
      <circle cx="52" cy="49" r="6" fill="currentColor" opacity={0.15} />
      <path d="M52 45c3 3 4 5 4 7a4 4 0 0 1-8 0c0-2 1-4 4-7z" fill="currentColor" />
    </Base>
  );
}

export function LowMoodIllustration({ className }: IllustrationProps) {
  return (
    <Base className={className}>
      {/* head + shoulders */}
      <circle cx="46" cy="30" r="13" {...stroke} fill="white" fillOpacity={0.9} />
      <path d="M24 60c0-12 10-18 22-18s22 6 22 18" {...stroke} fill="white" fillOpacity={0.9} />
      {/* downturned eyes */}
      <path d="M40 28c1-1.5 3-1.5 4 0" {...stroke} strokeWidth={2.4} />
      <path d="M49 28c1-1.5 3-1.5 4 0" {...stroke} strokeWidth={2.4} />
      {/* cloud above head */}
      <path
        d="M64 12c0-3 3-5 5-4 1-3 6-3 7 1 3 0 5 2 4 5h-16z"
        {...stroke}
        strokeWidth={2.4}
        fill="white"
        fillOpacity={0.9}
      />
      {/* rain */}
      <path d="M68 20 L66 25" {...stroke} strokeWidth={2.4} />
      <path d="M74 20 L72 25" {...stroke} strokeWidth={2.4} />
      <path d="M80 20 L78 25" {...stroke} strokeWidth={2.4} />
    </Base>
  );
}

export function SickChildIllustration({ className }: IllustrationProps) {
  return (
    <Base className={className}>
      {/* face */}
      <circle cx="42" cy="36" r="18" {...stroke} fill="white" fillOpacity={0.9} />
      {/* rosy cheeks */}
      <circle cx="33" cy="40" r="3" fill="currentColor" opacity={0.25} />
      <circle cx="51" cy="40" r="3" fill="currentColor" opacity={0.25} />
      {/* sad eyes */}
      <circle cx="36" cy="32" r="1.6" fill="currentColor" />
      <circle cx="48" cy="32" r="1.6" fill="currentColor" />
      {/* thermometer */}
      <rect x="66" y="14" width="7" height="30" rx="3.5" {...stroke} fill="white" fillOpacity={0.9} />
      <circle cx="69.5" cy="48" r="6" {...stroke} fill="white" fillOpacity={0.9} />
      <path d="M69.5 44 V24" stroke="currentColor" strokeWidth={2.2} />
    </Base>
  );
}

export function ToothacheIllustration({ className }: IllustrationProps) {
  return (
    <Base className={className}>
      {/* tooth */}
      <path
        d="M38 16c-9 0-14 6-14 14 0 8 3 16 6 22 2 4 6 3 6-1 0-4 1-7 4-7s4 3 4 7c0 4 4 5 6 1 3-6 6-14 6-22 0-8-5-14-14-14-1 2-3 2-4 0z"
        {...stroke}
        fill="white"
        fillOpacity={0.9}
      />
      {/* pain burst */}
      <path d="M70 18 L76 12" {...stroke} strokeWidth={2.6} />
      <path d="M72 26 L80 24" {...stroke} strokeWidth={2.6} />
      <path d="M68 32 L74 38" {...stroke} strokeWidth={2.6} />
    </Base>
  );
}

export function BackPainIllustration({ className }: IllustrationProps) {
  return (
    <Base className={className}>
      {/* bent figure */}
      <circle cx="30" cy="18" r="8" {...stroke} fill="white" fillOpacity={0.9} />
      <path d="M30 26c0 10 8 14 18 18 8 3 14 8 16 14" {...stroke} fill="none" />
      <path d="M34 34 L24 44" {...stroke} />
      <path d="M52 40 L58 52" {...stroke} />
      {/* pain mark on lower back */}
      <circle cx="48" cy="38" r="7" fill="currentColor" opacity={0.15} />
      <path d="M45 35 L51 41 M51 35 L45 41" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" />
    </Base>
  );
}

export function HeartHealthIllustration({ className }: IllustrationProps) {
  return (
    <Base className={className}>
      <path
        d="M50 58C30 45 18 34 18 22c0-8 6-13 13-13 7 0 11 5 14 5s7-5 14-5c7 0 13 5 13 13 0 12-12 23-32 36z"
        {...stroke}
        fill="white"
        fillOpacity={0.9}
      />
      <path d="M20 28 H36 L40 20 L46 36 L50 26 L54 28 H80" stroke="currentColor" strokeWidth={2.6} fill="none" />
    </Base>
  );
}

export function ThroatIssueIllustration({ className }: IllustrationProps) {
  return (
    <Base className={className}>
      {/* ear */}
      <path
        d="M42 14c-11 0-18 9-18 19 0 8 5 13 11 13 4 0 6-3 6-6 0-4-4-4-5-8-1-4 2-8 6-8 6 0 9 5 9 11 0 9-6 16-14 16"
        {...stroke}
        fill="white"
        fillOpacity={0.9}
      />
      {/* sound waves */}
      <path d="M64 24c4 4 4 12 0 16" {...stroke} strokeWidth={2.6} />
      <path d="M72 18c7 7 7 21 0 28" {...stroke} strokeWidth={2.6} />
    </Base>
  );
}

export function EyeStrainIllustration({ className }: IllustrationProps) {
  return (
    <Base className={className}>
      {/* eye */}
      <path d="M12 36c8-12 20-18 32-18s24 6 32 18c-8 12-20 18-32 18s-24-6-32-18z" {...stroke} fill="white" fillOpacity={0.9} />
      <circle cx="44" cy="36" r="9" {...stroke} fill="currentColor" fillOpacity={0.15} />
      <circle cx="44" cy="36" r="3.5" fill="currentColor" />
      {/* blur lines */}
      <path d="M14 52 H34" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" opacity={0.5} />
      <path d="M54 52 H80" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" opacity={0.5} />
    </Base>
  );
}