"use client";

import { useState } from "react";
import EcgOverlay from "@/components/EcgOverlay";

/**
 * Plays the ECG heartbeat animation once when the app is first loaded
 * (hard refresh / first visit), then reveals the app underneath. Because
 * this wraps the root layout, it mounts once per full page load and is
 * unaffected by client-side navigation between pages — the login/signup/
 * logout overlay elsewhere in the app is untouched by this.
 */
export default function PageLoadAnimation({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <>
          <EcgOverlay show={showIntro} onDone={() => setShowIntro(false)} />
      {!showIntro && children}
    </>
  );
}