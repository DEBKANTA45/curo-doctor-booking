"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Stethoscope, Mail, Lock } from "lucide-react";
import { login } from "@/lib/mock-db";
import { useAuth } from "@/context/AuthContext";
import { DoctorLoginIllustration } from "@/components/illustrations/AuthIllustrations";
import EcgOverlay from "@/components/EcgOverlay";

const points = [
  "Manage your appointment requests",
  "Update your schedule anytime",
  "Reach new patients searching your specialty",
];

export default function DoctorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/doctor/home";
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showEcg, setShowEcg] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(email, password, "doctor");
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    refresh();
    setShowEcg(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="grid overflow-hidden rounded-lg border border-line bg-surface shadow-sm lg:min-h-[620px] lg:grid-cols-2 lg:shadow-md">
        <div className="flex items-center justify-center px-6 py-12 sm:px-10 sm:py-14">
          <div className="w-full max-w-sm">
            <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary-dark">
              Doctor portal
            </span>
            <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
              Log in to your practice
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              Manage your appointments and patient bookings.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-ink">
                  Email
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                  />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-line bg-surface py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="doctor@example.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium text-ink">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-line bg-surface py-2.5 pl-10 pr-10 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-faint transition-colors hover:text-ink"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-accent">{error}</p>}

              <button
                type="submit"
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark"
              >
                Log in
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              New to Curo?{" "}
              <Link href="/doctor/register" className="font-medium text-primary hover:text-primary-dark">
                Register your practice
              </Link>
            </p>
            <p className="mt-2 text-center text-sm text-muted">
              Looking to book a visit instead?{" "}
              <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
                Patient login
              </Link>
            </p>
          </div>
        </div>

        <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary-light via-white to-primary-light lg:flex lg:flex-col lg:justify-center lg:border-l lg:border-line lg:px-14">
          <div className="relative max-w-sm">
            <DoctorLoginIllustration className="mb-8 h-auto w-full max-w-[280px]" />
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white">
              <Stethoscope size={20} />
            </span>
            <h2 className="mt-5 font-display text-xl font-medium leading-snug text-ink">
              Welcome back, doctor.
            </h2>
            <ul className="mt-5 space-y-3">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-muted">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <EcgOverlay
        show={showEcg}
        onDone={() => router.push(redirect)}
      />
    </div>
  );
}