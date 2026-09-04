"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Stethoscope,
  User,
  MapPin,
  GraduationCap,
  Building2,
  Wallet,
  Mail,
  Lock,
} from "lucide-react";
import { specialties } from "@/lib/utils";
import { registerDoctor } from "@/lib/mock-db";
import { useAuth } from "@/context/AuthContext";
import { DoctorRegisterIllustration } from "@/components/illustrations/AuthIllustrations";

const points = [
  "List your practice in minutes",
  "Set your own hours and consultation fee",
  "Manage bookings from one dashboard",
];

export default function DoctorRegisterForm() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [specialtyId, setSpecialtyId] = useState(specialties[0]?.id ?? "");
  const [city, setCity] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [consultationFee, setConsultationFee] = useState("500");
  const [experienceYears, setExperienceYears] = useState("5");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const specialty = specialties.find((s) => s.id === specialtyId);
    if (!specialty) {
      setError("Please choose a specialty.");
      return;
    }
    const result = registerDoctor({
      name,
      email,
      password,
      specialtyId: specialty.id,
      specialty: specialty.name,
      city,
      clinicName,
      consultationFee: Number(consultationFee) || 0,
      experienceYears: Number(experienceYears) || 0,
    });
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    refresh();
    router.push("/doctor/home");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="grid overflow-hidden rounded-lg border border-line bg-surface shadow-sm lg:min-h-[820px] lg:grid-cols-2 lg:shadow-md">
        <div className="flex items-center justify-center px-6 py-12 sm:px-10 sm:py-14">
          <div className="w-full max-w-sm">
            <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary-dark">
              Doctor portal
            </span>
            <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
              List your practice on Curo
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              Create a profile and start receiving patient bookings. You'll
              appear on the doctor listing page right away.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-5">
                <p className="text-xs font-medium text-muted">Practice details</p>

                <div>
                  <label htmlFor="name" className="text-sm font-medium text-ink">
                    Full name
                  </label>
                  <div className="relative mt-1.5">
                    <User
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                    />
                    <input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-md border border-line bg-surface py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="Dr. Aditi Sharma"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="specialty" className="text-sm font-medium text-ink">
                    Specialty
                  </label>
                  <div className="relative mt-1.5">
                    <Stethoscope
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                    />
                    <select
                      id="specialty"
                      value={specialtyId}
                      onChange={(e) => setSpecialtyId(e.target.value)}
                      className="w-full appearance-none rounded-md border border-line bg-surface py-2.5 pl-10 pr-9 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                    >
                      {specialties.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-faint"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="city" className="text-sm font-medium text-ink">
                      City
                    </label>
                    <div className="relative mt-1.5">
                      <MapPin
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                      />
                      <input
                        id="city"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full rounded-md border border-line bg-surface py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                        placeholder="Bengaluru"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="experience" className="text-sm font-medium text-ink">
                      Experience (yrs)
                    </label>
                    <div className="relative mt-1.5">
                      <GraduationCap
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                      />
                      <input
                        id="experience"
                        type="number"
                        min={0}
                        required
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full rounded-md border border-line bg-surface py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="clinic" className="text-sm font-medium text-ink">
                    Clinic / hospital name
                  </label>
                  <div className="relative mt-1.5">
                    <Building2
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                    />
                    <input
                      id="clinic"
                      required
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      className="w-full rounded-md border border-line bg-surface py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="Sunrise Family Clinic"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="fee" className="text-sm font-medium text-ink">
                    Consultation fee (₹)
                  </label>
                  <div className="relative mt-1.5">
                    <Wallet
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                    />
                    <input
                      id="fee"
                      type="number"
                      min={0}
                      required
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      className="w-full rounded-md border border-line bg-surface py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-5 border-t border-line pt-6">
                <p className="text-xs font-medium text-muted">Login details</p>

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
                      minLength={4}
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
              </div>

              {error && <p className="text-sm text-accent">{error}</p>}

              <button
                type="submit"
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark"
              >
                Create doctor account
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Already registered?{" "}
              <Link href="/doctor/login" className="font-medium text-primary hover:text-primary-dark">
                Log in
              </Link>
            </p>
          </div>
        </div>

        <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary-light via-white to-primary-light lg:flex lg:flex-col lg:justify-center lg:border-l lg:border-line lg:px-14">
          <div className="relative max-w-sm">
            <DoctorRegisterIllustration className="mb-8 h-auto w-full max-w-[280px]" />
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white">
              <Stethoscope size={20} />
            </span>
            <h2 className="mt-5 font-display text-xl font-medium leading-snug text-ink">
              Grow your practice online.
            </h2>
            <ul className="mt-6 space-y-4">
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
    </div>
  );
}