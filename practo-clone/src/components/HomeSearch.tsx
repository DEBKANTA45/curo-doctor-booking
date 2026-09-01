"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin } from "lucide-react";
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
      className="w-full rounded-lg border border-line bg-surface p-4 shadow-[0_1px_0_rgba(16,32,28,0.03)] sm:p-5"
    >
      <p className="mb-3 text-sm font-medium text-ink">
        Search doctors by specialty and city
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-md border border-line px-3 py-2.5">
          <Search size={16} className="shrink-0 text-faint" />
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

        <div className="flex flex-1 items-center gap-2 rounded-md border border-line px-3 py-2.5">
          <MapPin size={16} className="shrink-0 text-faint" />
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

        <button
          type="submit"
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          Search
        </button>
      </div>
    </form>
  );
}
