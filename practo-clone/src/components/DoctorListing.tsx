"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import DoctorCard from "./DoctorCard";
import { specialties } from "@/lib/utils";
import { useAllDoctors } from "@/lib/hooks";

type SortKey = "relevance" | "rating" | "fee-low" | "fee-high" | "experience";

export default function DoctorListing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const allDoctors = useAllDoctors();

  const [specialty, setSpecialty] = useState(searchParams.get("specialty") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const cities = useMemo(
    () => Array.from(new Set(allDoctors.map((d) => d.city))).sort(),
    [allDoctors]
  );

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    let list = allDoctors.filter((d) => {
      const matchesSpecialty = specialty ? d.specialtyId === specialty : true;
      const matchesCity = city ? d.city === city : true;
      const matchesQuery = term
        ? d.name.toLowerCase().includes(term) || d.specialty.toLowerCase().includes(term)
        : true;
      return matchesSpecialty && matchesCity && matchesQuery;
    });

        switch (sort) {
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      case "fee-low":
        list = [...list].sort((a, b) => a.consultationFee - b.consultationFee);
        break;
      case "fee-high":
        list = [...list].sort((a, b) => b.consultationFee - a.consultationFee);
        break;
      case "experience":
        list = [...list].sort((a, b) => b.experienceYears - a.experienceYears);
        break;
    }
    return list;
  }, [allDoctors, specialty, city, query, sort]);

  const updateSpecialty = (value: string) => {
    setSpecialty(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("specialty", value);
    else params.delete("specialty");
    router.replace(`/doctors${params.toString() ? `?${params}` : ""}`);
  };

  const activeSpecialtyName = specialties.find((s) => s.id === specialty)?.name;

  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {activeSpecialtyName ? `${activeSpecialtyName}s` : "Find a doctor"}
          {city ? ` in ${city}` : ""}
        </h1>
        <p className="text-sm text-muted">
          {results.length} doctor{results.length !== 1 ? "s" : ""} available
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by doctor name or specialty"
          className="w-full rounded-md border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary sm:max-w-xs"
        />
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md border border-line px-4 py-2.5 text-sm text-ink hover:border-primary sm:hidden"
        >
          <SlidersHorizontal size={15} /> Filters
        </button>

        <div className="hidden items-center gap-3 sm:flex">
          <select
            value={specialty}
            onChange={(e) => updateSpecialty(e.target.value)}
            className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">All specialties</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="relevance">Relevance</option>
            <option value="rating">Highest rated</option>
            <option value="experience">Most experienced</option>
            <option value="fee-low">Fee: Low to high</option>
            <option value="fee-high">Fee: High to low</option>
          </select>
        </div>
      </div>

      {filtersOpen && (
        <div className="mt-3 flex flex-col gap-3 rounded-md border border-line p-4 sm:hidden">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Filters</p>
            <button onClick={() => setFiltersOpen(false)} aria-label="Close filters">
              <X size={16} />
            </button>
          </div>
          <select
            value={specialty}
            onChange={(e) => updateSpecialty(e.target.value)}
            className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink"
          >
            <option value="">All specialties</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink"
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink"
          >
            <option value="relevance">Relevance</option>
            <option value="experience">Most experienced</option>
            <option value="fee-low">Fee: Low to high</option>
            <option value="fee-high">Fee: High to low</option>
          </select>
        </div>
      )}

      <div className="mt-5 rounded-lg border border-line bg-surface px-5">
        {results.length > 0 ? (
          results.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-ink">No doctors match these filters</p>
            <p className="mt-1 text-sm text-muted">
              Try a different specialty, city, or search term.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}