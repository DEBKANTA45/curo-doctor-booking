"use client";

import { useEffect, useRef } from "react";

interface EcgOverlayProps {
  /** Whether the overlay should be visible and running. */
  show: boolean;
  /** Total time before onDone fires (ms). */
  duration?: number;
  /** Called once, after `duration` has elapsed. Use this to navigate. */
  onDone: () => void;
}

// A single PQRST-style heartbeat spike, flat baseline on either side.
const ECG_PATH =
  "M0,100 L400,100 L415,108 L430,40 L445,165 L460,100 L480,100 L500,80 L515,100 L530,88 L545,100 L1000,100";

/**
 * Full-page ECG "heartbeat" transition used right after login, signup, or
 * logout — matches the reference: the current page dims under a light
 * white wash, and a single blue line draws itself once across the
 * center of the screen, looping, until onDone fires and the caller
 * navigates away.
 */
export default function EcgOverlay({ show, duration = 1600, onDone }: EcgOverlayProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!show) return;
    // Schedule the navigation timer FIRST and unconditionally. The dash
    // measurement below is purely visual — if it throws for any reason
    // (e.g. the path hasn't been laid out with real dimensions yet), it
    // must not be able to stop onDone from firing, or the overlay gets
    // stuck on screen forever with nothing to dismiss it.
    const timer = setTimeout(onDone, duration);
    try {
      const el = pathRef.current;
      if (el) {
        const len = el.getTotalLength();
        el.style.setProperty("--ecg-len", String(len));
        el.style.strokeDasharray = String(len);
      }
    } catch {
      // Visual-only; safe to ignore. The dash pattern falls back to CSS defaults.
    }
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, duration]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex animate-ecg-fade-in items-center justify-center bg-surface/90">
      <svg
        viewBox="0 0 1000 200"
        preserveAspectRatio="none"
        className="h-20 w-[88%] max-w-2xl sm:h-24"
      >
        <path
          ref={pathRef}
          d={ECG_PATH}
          fill="none"
          stroke="#2563EB"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ecg-draw"
        />
      </svg>
    </div>
  );
}