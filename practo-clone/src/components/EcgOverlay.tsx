"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect only works in the browser — on the server React just
// warns and no-ops it.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
 *
 * The line is only ever mounted client-side (see the `mounted` gate
 * below), never as part of the server-rendered HTML. If it were part of
 * the initial HTML, the browser would start the CSS draw animation the
 * instant it parses that HTML — before React/JS has had a chance to
 * measure the path and set the correct dash length — which shows up as
 * the line appearing "already drawn" instead of animating in. That race
 * is timing-dependent, so it can look fine on a slow/cold load and
 * clearly broken on a fast cached refresh. Gating the mount to after
 * React has hydrated guarantees the measurement always happens first.
 */
export default function EcgOverlay({ show, duration = 1600, onDone }: EcgOverlayProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!show || !mounted) return;
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
  }, [show, duration, mounted]);

  if (!show || !mounted) return null;

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