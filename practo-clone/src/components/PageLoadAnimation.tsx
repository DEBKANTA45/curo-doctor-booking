"use client";

/**
 * Previously played the ECG heartbeat overlay once on every hard page
 * load. Removed — the animation is now reserved for login/signup/logout
 * transitions only (see EcgOverlay usage in LoginForm, RegisterForm,
 * DoctorRegisterForm, DoctorLoginForm, Navbar).
 */
export default function PageLoadAnimation({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}