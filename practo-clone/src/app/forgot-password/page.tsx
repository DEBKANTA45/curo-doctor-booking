"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, Lock, Eye, EyeOff, ArrowLeft, Info } from "lucide-react";
import { requestPasswordReset, resetPassword } from "@/lib/mock-db";

type Step = "email" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = requestPasswordReset(email);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    setDemoCode(result.code ?? "");
    setStep("reset");
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const result = resetPassword(email, code, newPassword);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-16">
      <div className="overflow-hidden rounded-lg border border-line bg-surface p-8 shadow-sm">
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-light text-primary">
          <KeyRound size={20} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink">
          Reset your password
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {step === "email"
            ? "Enter the email on your account and we'll send you a reset code."
            : "Enter the code and choose a new password."}
        </p>

        {done ? (
          <div className="mt-8 rounded-md bg-primary-light p-4 text-sm text-primary-dark">
            Password updated! Redirecting you to log in...
          </div>
        ) : step === "email" ? (
          <form onSubmit={handleRequestCode} className="mt-8 space-y-5">
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
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {error && <p className="text-sm text-accent">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              Send reset code
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="mt-8 space-y-5">
            <div className="flex items-start gap-2 rounded-md bg-primary-light p-3 text-xs text-primary-dark">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>
                This app has no real email service, so here's your demo reset code:{" "}
                <strong className="font-tabular">{demoCode}</strong>
              </span>
            </div>

            <div>
              <label htmlFor="code" className="text-sm font-medium text-ink">
                Reset code
              </label>
              <input
                id="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-line bg-surface py-2.5 px-3.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="6-digit code"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="text-sm font-medium text-ink">
                New password
              </label>
              <div className="relative mt-1.5">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                />
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-ink">
                Confirm new password
              </label>
              <div className="relative mt-1.5">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-line bg-surface py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <p className="text-sm text-accent">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              Reset password
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
        >
          <ArrowLeft size={14} /> Back to log in
        </Link>
      </div>
    </div>
  );
}