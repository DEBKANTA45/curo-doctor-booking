"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import toast from "react-hot-toast";

// One seeded account per role, so every permission level can be tried out.
const DEMO_ACCOUNTS = [
  { role: "Super Admin", email: "admin@curo.com", password: "admin@curo1" },
  { role: "Admin", email: "manager@curo.com", password: "manager@curo2" },
  { role: "Support", email: "support@curo.com", password: "support@curo3" },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(email, password);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      toast.error(result.error ?? "Login failed.");
      return;
    }
    toast.success("Logged in successfully!");
    router.push("/admin");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8 shadow-sm">
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-light text-primary">
          <ShieldCheck size={20} />
        </span>
        <h1 className="mt-5 font-display text-xl font-semibold text-ink">Admin login</h1>
        <p className="mt-1.5 text-sm text-muted">Sign in to manage the Curo platform.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-ink">
              Email
            </label>
            <div className="relative mt-1.5">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-line bg-surface py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="admin@curo.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
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

        <div className="mt-6 border-t border-line pt-4">
          <p className="text-xs font-medium text-muted">Demo accounts — click to fill</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => {
                  setEmail(a.email);
                  setPassword(a.password);
                  setError("");
                }}
                className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-left text-xs transition-colors hover:border-primary/40 hover:bg-primary-light"
              >
                <span className="font-medium text-ink">{a.role}</span>
                <span className="text-faint">{a.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}