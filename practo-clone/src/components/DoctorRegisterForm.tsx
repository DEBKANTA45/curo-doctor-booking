"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { specialties } from "@/lib/utils";
import { registerDoctor } from "@/lib/mock-db";
import { useAuth } from "@/context/AuthContext";

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
    router.push("/doctor/dashboard");
  };

  return (
    <div className="mx-auto max-w-content px-5 py-16">
      <div className="mx-auto max-w-sm">
        <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-ink">
          Doctor portal
        </span>
        <h1 className="mt-3 font-display text-2xl font-semibold text-ink">
          List your practice on Curo
        </h1>
        <p className="mt-1 text-sm text-muted">
          Create a profile and start receiving patient bookings. You'll appear
          on the doctor listing page right away.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-ink">
              Full name
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              placeholder="Dr. Aditi Sharma"
            />
          </div>

          <div>
            <label htmlFor="specialty" className="text-sm font-medium text-ink">
              Specialty
            </label>
            <select
              id="specialty"
              value={specialtyId}
              onChange={(e) => setSpecialtyId(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
            >
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="city" className="text-sm font-medium text-ink">
                City
              </label>
              <input
                id="city"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                placeholder="Bengaluru"
              />
            </div>
            <div>
              <label htmlFor="experience" className="text-sm font-medium text-ink">
                Experience (yrs)
              </label>
              <input
                id="experience"
                type="number"
                min={0}
                required
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="clinic" className="text-sm font-medium text-ink">
              Clinic / hospital name
            </label>
            <input
              id="clinic"
              required
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              placeholder="Sunrise Family Clinic"
            />
          </div>

          <div>
            <label htmlFor="fee" className="text-sm font-medium text-ink">
              Consultation fee (₹)
            </label>
            <input
              id="fee"
              type="number"
              min={0}
              required
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
            />
          </div>

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
              minLength={4}
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
            Create doctor account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already registered?{" "}
          <Link href="/doctor/login" className="font-medium text-info">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}