"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin, ArrowRight } from "lucide-react";
import { specialties, doctors } from "@/lib/utils";

const cities = Array.from(new Set(doctors.map((d) => d.city))).sort();

export default function HomeSearch() {
  const router = useRouter();
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (specialty) params.set("specialty", specialty);
    if (city) params.set("city", city);
    router.push(`/doctors${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="w-full rounded-lg border border-line bg-surface p-3 shadow-soft sm:p-3.5"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2.5 rounded-md border border-line bg-bg px-3.5 py-3 transition-colors focus-within:border-primary focus-within:bg-surface">
          <Search size={17} className="shrink-0 text-primary" />
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full bg-transparent text-sm text-ink outline-none"
          >
            <option value="">Any specialty</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden h-8 w-px bg-line sm:block" />

        <div className="flex flex-1 items-center gap-2.5 rounded-md border border-line bg-bg px-3.5 py-3 transition-colors focus-within:border-primary focus-within:bg-surface">
          <MapPin size={17} className="shrink-0 text-cyan-dark" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-transparent text-sm text-ink outline-none"
          >
            <option value="">Any city</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-primary btn-md w-full sm:w-auto">
          Search <ArrowRight size={15} />
        </button>
      </div>
    </form>
  );
}