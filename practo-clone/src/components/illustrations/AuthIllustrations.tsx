import type { SVGProps } from "react";

/**
 * Decorative, hand-built illustrations for the auth screens.
 * Palette is intentionally restricted to the existing blue/indigo
 * design tokens (primary, primary-light, ink) — no new colors.
 * Purely visual — no interactivity, no effect on page functionality.
 */

const BASE_PROPS = {
  viewBox: "0 0 480 420",
  fill: "none",
  role: "img" as const,
  "aria-hidden": true,
};

function Backdrop() {
  return (
    <>
      <circle cx="82" cy="66" r="64" fill="#EEF2FF" />
      <circle cx="404" cy="348" r="88" fill="#EEF2FF" />
      <circle
        cx="240"
        cy="208"
        r="152"
        stroke="#C7D2FE"
        strokeWidth="1.5"
        strokeDasharray="3 9"
      />
      <circle cx="118" cy="330" r="4" fill="#A5B4FC" />
      <circle cx="368" cy="96" r="4" fill="#A5B4FC" />
      <circle cx="404" cy="200" r="3" fill="#A5B4FC" />
    </>
  );
}

/** Patient — Login: a phone with a booking calendar and a confirmed slot */
export function PatientLoginIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <Backdrop />
      <rect x="168" y="66" width="144" height="288" rx="28" fill="#FFFFFF" stroke="#C7D2FE" strokeWidth="2" />
      <rect x="222" y="80" width="36" height="6" rx="3" fill="#C7D2FE" />
      <rect x="182" y="100" width="116" height="36" rx="9" fill="#4F46E5" />
      <circle cx="200" cy="118" r="9" fill="#FFFFFF" />
      <rect x="218" y="112" width="58" height="5" rx="2.5" fill="#FFFFFF" opacity="0.85" />
      <rect x="218" y="122" width="38" height="4" rx="2" fill="#FFFFFF" opacity="0.55" />
      <rect x="182" y="150" width="116" height="94" rx="10" fill="#EEF2FF" />
      <rect x="196" y="164" width="18" height="18" rx="4" fill="#C7D2FE" />
      <rect x="222" y="164" width="18" height="18" rx="4" fill="#C7D2FE" />
      <rect x="248" y="164" width="18" height="18" rx="4" fill="#4F46E5" />
      <rect x="196" y="190" width="18" height="18" rx="4" fill="#C7D2FE" />
      <rect x="222" y="190" width="18" height="18" rx="4" fill="#C7D2FE" />
      <rect x="248" y="190" width="18" height="18" rx="4" fill="#C7D2FE" />
      <path
        d="M182 268 H222 L232 250 L244 284 L254 262 L262 268 H298"
        stroke="#818CF8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="300" cy="322" r="27" fill="#4F46E5" />
      <path
        d="M289 322 L297 330 L312 313"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Patient — Register: patient and doctor connecting, plus a new profile card */
export function PatientRegisterIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <Backdrop />
      <circle cx="168" cy="176" r="27" fill="#C7D2FE" />
      <path d="M136 246 Q168 208 200 246 Z" fill="#818CF8" />
      <circle cx="316" cy="160" r="27" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2.5" />
      <path d="M284 236 Q316 194 348 236 Z" fill="#4F46E5" />
      <path
        d="M304 154 q0 12 12 12 q12 0 12 -12"
        stroke="#4F46E5"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="242" cy="198" r="24" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2.5" />
      <path d="M242 188 V208 M232 198 H252" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" />
      <rect x="146" y="292" width="188" height="64" rx="14" fill="#FFFFFF" stroke="#C7D2FE" strokeWidth="2" />
      <circle cx="172" cy="324" r="15" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2" />
      <rect x="198" y="313" width="98" height="6" rx="3" fill="#C7D2FE" />
      <rect x="198" y="327" width="66" height="5" rx="2.5" fill="#E0E7FF" />
    </svg>
  );
}

/** Doctor — Login: a dashboard with a vitals chart and a stethoscope badge */
export function DoctorLoginIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <Backdrop />
      <rect x="122" y="252" width="228" height="14" rx="5" fill="#C7D2FE" />
      <rect x="146" y="98" width="188" height="154" rx="12" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2" />
      <rect x="146" y="98" width="188" height="30" rx="12" fill="#4F46E5" />
      <rect x="146" y="112" width="188" height="16" fill="#4F46E5" />
      <circle cx="164" cy="113" r="5" fill="#FFFFFF" opacity="0.9" />
      <circle cx="180" cy="113" r="5" fill="#FFFFFF" opacity="0.55" />
      <path
        d="M168 214 L188 214 L200 190 L216 232 L230 202 L242 214 L312 214"
        stroke="#818CF8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="168" y1="230" x2="312" y2="230" stroke="#EEF2FF" strokeWidth="2" />
      <circle cx="352" cy="146" r="30" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2.5" />
      <path
        d="M338 134 C338 148 344 154 352 154 C360 154 366 148 366 134"
        stroke="#4F46E5"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="338" cy="132" r="3" fill="#4F46E5" />
      <circle cx="366" cy="132" r="3" fill="#4F46E5" />
      <line x1="352" y1="154" x2="352" y2="164" stroke="#4F46E5" strokeWidth="2.5" />
      <circle cx="352" cy="170" r="7" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2" />
    </svg>
  );
}

/** Doctor — Register: a clinic building growing a patient base */
export function DoctorRegisterIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <Backdrop />
      <rect x="164" y="178" width="152" height="146" rx="10" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2" />
      <rect x="222" y="148" width="36" height="36" rx="9" fill="#4F46E5" />
      <line x1="240" y1="158" x2="240" y2="174" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <line x1="232" y1="166" x2="248" y2="166" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <rect x="182" y="198" width="26" height="26" rx="5" fill="#EEF2FF" />
      <rect x="272" y="198" width="26" height="26" rx="5" fill="#EEF2FF" />
      <rect x="182" y="238" width="26" height="26" rx="5" fill="#EEF2FF" />
      <rect x="272" y="238" width="26" height="26" rx="5" fill="#EEF2FF" />
      <rect x="222" y="278" width="36" height="46" rx="4" fill="#EEF2FF" />
      <g>
        <rect x="112" y="268" width="16" height="30" rx="3" fill="#C7D2FE" />
        <rect x="134" y="252" width="16" height="46" rx="3" fill="#818CF8" />
        <rect x="156" y="234" width="16" height="64" rx="3" fill="#4F46E5" />
      </g>
      <path
        d="M112 240 L150 206 L182 226 L214 176"
        stroke="#4338CA"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M200 178 L214 176 L212 190" stroke="#4338CA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="332" cy="158" r="17" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2" />
      <circle cx="356" cy="150" r="17" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2" />
      <circle cx="356" cy="176" r="17" fill="#C7D2FE" stroke="#4F46E5" strokeWidth="2" />
    </svg>
  );
}