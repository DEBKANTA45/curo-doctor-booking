"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  /** Final number to count up to. */
  value: number;
  /** Decimal places to show, e.g. 1 for "4.7". */
  decimals?: number;
  /** Text appended after the number, e.g. "+". */
  suffix?: string;
  /** How long the count-up animation takes, in ms. */
  duration?: number;
  /** Add thousands separators, e.g. "10,000". */
  useGrouping?: boolean;
}

/**
 * Displays a number that animates from 0 up to `value` the first time it
 * scrolls into view, using an IntersectionObserver so it only plays once
 * and only when the user actually sees it.
 */
export default function AnimatedCounter({
  value,
  decimals = 0,
  suffix = "",
  duration = 1200,
  useGrouping = false,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const spanRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            const start = performance.now();
            const step = (now: number) => {
              const progress = Math.min((now - start) / duration, 1);
              // Ease-out cubic — fast at first, settles gently at the end.
              const eased = 1 - Math.pow(1 - progress, 3);
              setDisplay(value * eased);
              if (progress < 1) {
                requestAnimationFrame(step);
              } else {
                setDisplay(value);
              }
            };
            requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  const formatted = useGrouping
    ? display.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : display.toFixed(decimals);

  return (
    <span ref={spanRef}>
      {formatted}
      {suffix}
    </span>
  );
}