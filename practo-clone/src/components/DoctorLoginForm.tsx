"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/mock-db";
import { useAuth } from "@/context/AuthContext";

export default function DoctorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/doctor/dashboard";
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(email, password, "doctor");
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    refresh();
    router.push(redirect);
  };

  return (
    <div className="mx-auto max-w-content px-5 py-16">
      <div className="mx-auto max-w-sm">
        <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary-dark">
          Doctor portal
        </span>
        <h1 className="mt-3 font-display text-2xl font-semibold text-ink">
          Log in to your practice
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage your appointments and patient bookings.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              placeholder="doctor@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-accent">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Log in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New to Curo?{" "}
          <Link href="/doctor/register" className="font-medium text-info">
            Register your practice
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted">
          Looking to book a visit instead?{" "}
          <Link href="/login" className="font-medium text-info">
            Patient login
          </Link>
        </p>
      </div>
    </div>
  );
}
