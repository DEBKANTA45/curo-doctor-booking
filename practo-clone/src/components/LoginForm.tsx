"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Stethoscope } from "lucide-react";
import { login } from "@/lib/mock-db";
import { useAuth } from "@/context/AuthContext";

const points = [
  "Book verified doctors across specialties",
  "See your appointment history anytime",
  "Keep your medical details in one place",
];

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(email, password, "patient");
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    refresh();
    router.push(redirect);
  };

  return (
    <div className="grid lg:min-h-[620px] lg:grid-cols-2">
      <div className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-ink">
            Log in to Curo
          </h1>
          <p className="mt-1 text-sm text-muted">
            Book appointments and manage your visits.
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
                placeholder="you@example.com"
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
            <Link href="/register" className="font-medium text-primary">
              Create an account
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted">
            Are you a doctor?{" "}
            <Link href="/doctor/login" className="font-medium text-primary">
              Log in here
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden bg-primary-light lg:flex lg:flex-col lg:justify-center lg:border-l lg:border-line lg:px-14">
  <div className="max-w-sm">
    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white">
            <Stethoscope size={20} />
          </span>
         <h2 className="mt-5 font-display text-xl font-medium leading-snug text-ink">
            Your health, one login away.
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
  );
}