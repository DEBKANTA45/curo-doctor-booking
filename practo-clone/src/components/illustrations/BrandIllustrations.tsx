// Lightweight, original SVG illustrations used across the app.
// All colors are defined inline via gradients so they stay consistent
// with the blue/cyan brand palette without depending on any images.

export function HeroBlobs({ className = "" }: { className?: string }) {
  // A quiet, minimal accent: a single thin ring, a few soft dots, and a
  // faint cross mark — reads as a subtle medical motif without competing
  // with the hero copy.
  return (
    <svg
      className={className}
      viewBox="0 0 600 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heroRingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>

      <circle
        cx="430"
        cy="170"
        r="190"
        stroke="url(#heroRingGrad)"
        strokeOpacity="0.14"
        strokeWidth="1.5"
      />
      <circle
        cx="430"
        cy="170"
        r="130"
        stroke="url(#heroRingGrad)"
        strokeOpacity="0.1"
        strokeWidth="1"
      />

      <circle cx="430" cy="170" r="5" fill="#2563EB" fillOpacity="0.14" />
      <circle cx="330" cy="270" r="3.5" fill="#06B6D4" fillOpacity="0.18" />
      <circle cx="520" cy="90" r="3" fill="#2563EB" fillOpacity="0.16" />

      <g opacity="0.12" stroke="#2563EB" strokeWidth="4" strokeLinecap="round">
        <line x1="430" y1="150" x2="430" y2="190" />
        <line x1="410" y1="170" x2="450" y2="170" />
      </g>
    </svg>
  );
}

export function AppointmentIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="apptGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="apptGradSoft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EFF6FF" />
          <stop offset="100%" stopColor="#ECFEFF" />
        </linearGradient>
      </defs>

      <rect x="20" y="30" width="320" height="260" rx="24" fill="url(#apptGradSoft)" />

      {/* calendar card */}
      <rect x="70" y="70" width="220" height="180" rx="16" fill="white" stroke="#E2E8F0" strokeWidth="2" />
      <rect x="70" y="70" width="220" height="46" rx="16" fill="url(#apptGrad)" />
      <rect x="70" y="98" width="220" height="18" fill="url(#apptGrad)" />
      <circle cx="105" cy="93" r="6" fill="white" fillOpacity="0.85" />
      <circle cx="255" cy="93" r="6" fill="white" fillOpacity="0.85" />

      {/* grid dots */}
      {[0, 1, 2, 3, 4, 5].map((row) =>
        [0, 1, 2, 3, 4, 5].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={100 + col * 32}
            cy={150 + row * 20}
            r={row === 2 && col === 3 ? 8 : 3}
            fill={row === 2 && col === 3 ? "url(#apptGrad)" : "#CBD5E1"}
          />
        ))
      )}

      {/* floating check badge */}
      <circle cx="285" cy="235" r="26" fill="white" stroke="#E2E8F0" strokeWidth="2" />
      <path
        d="M275 235l7 7 14-14"
        stroke="url(#apptGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* floating stethoscope hint */}
      <circle cx="60" cy="240" r="22" fill="white" stroke="#E2E8F0" strokeWidth="2" />
      <path
        d="M52 232v8a8 8 0 0 0 16 0v-8"
        stroke="#06B6D4"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="68" cy="248" r="3.5" fill="#06B6D4" />
    </svg>
  );
}

export function EmptyStateIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="emptyGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <circle cx="110" cy="90" r="72" fill="#EFF6FF" />
      <rect x="66" y="52" width="88" height="76" rx="10" fill="white" stroke="#E2E8F0" strokeWidth="2" />
      <rect x="80" y="70" width="60" height="8" rx="4" fill="#E2E8F0" />
      <rect x="80" y="86" width="44" height="8" rx="4" fill="#E2E8F0" />
      <rect x="80" y="102" width="52" height="8" rx="4" fill="#E2E8F0" />
      <circle cx="146" cy="118" r="22" fill="white" stroke="url(#emptyGrad)" strokeWidth="3" />
      <line x1="162" y1="134" x2="176" y2="148" stroke="url(#emptyGrad)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function NotFoundIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 260 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nfGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <circle cx="130" cy="100" r="88" fill="#EFF6FF" />
      <circle cx="130" cy="100" r="56" fill="white" stroke="url(#nfGrad)" strokeWidth="4" />
      <line x1="171" y1="141" x2="205" y2="175" stroke="url(#nfGrad)" strokeWidth="8" strokeLinecap="round" />
      <path
        d="M112 92c0-10 8-18 18-18s18 8 18 18c0 8-6 12-12 16-4 2.5-6 5-6 9"
        stroke="url(#nfGrad)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="130" cy="128" r="4.5" fill="url(#nfGrad)" />
    </svg>
  );
}

export function ClinicIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="clinicGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <rect x="30" y="50" width="140" height="90" rx="14" fill="url(#clinicGrad)" />
      <rect x="52" y="70" width="30" height="30" rx="6" fill="white" fillOpacity="0.9" />
      <rect x="118" y="70" width="30" height="30" rx="6" fill="white" fillOpacity="0.9" />
      <rect x="85" y="108" width="30" height="32" rx="6" fill="white" fillOpacity="0.9" />
      <path d="M100 20l60 34H40l60-34z" fill="white" fillOpacity="0.9" />
      <line x1="63" y1="80" x2="71" y2="80" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
      <line x1="67" y1="76" x2="67" y2="84" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
      <line x1="129" y1="80" x2="137" y2="80" stroke="#06B6D4" strokeWidth="3" strokeLinecap="round" />
      <line x1="133" y1="76" x2="133" y2="84" stroke="#06B6D4" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}