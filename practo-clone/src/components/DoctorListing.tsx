"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, Search, Zap } from "lucide-react";
import DoctorCard from "./DoctorCard";
import { specialties } from "@/lib/utils";
import { useAllDoctors } from "@/lib/hooks";
import { EmptyStateIllustration } from "@/components/illustrations/BrandIllustrations";

type SortKey = "relevance" | "rating" | "fee-low" | "fee-high" | "experience";

export default function DoctorListing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const allDoctors = useAllDoctors();

  const [specialty, setSpecialty] = useState(searchParams.get("specialty") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>((searchParams.get("sort") as SortKey) || "relevance");
  const [availableToday, setAvailableToday] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const cities = useMemo(
    () => Array.from(new Set(allDoctors.map((d) => d.city))).sort(),
    [allDoctors]
  );

  const todayCount = useMemo(
    () => allDoctors.filter((d) => d.nextAvailable === "Today").length,
    [allDoctors]
  );

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    let list = allDoctors.filter((d) => {
      const matchesSpecialty = specialty ? d.specialtyId === specialty : true;
      const matchesCity = city ? d.city === city : true;
      const matchesToday = availableToday ? d.nextAvailable === "Today" : true;
      const matchesQuery = term
        ? d.name.toLowerCase().includes(term) || d.specialty.toLowerCase().includes(term)
        : true;
      return matchesSpecialty && matchesCity && matchesToday && matchesQuery;
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
  }, [allDoctors, specialty, city, query, sort, availableToday]);

  const updateSpecialty = (value: string) => {
    setSpecialty(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("specialty", value);
    else params.delete("specialty");
    router.replace(`/doctors${params.toString() ? `?${params}` : ""}`);
  };

  const activeSpecialtyName = specialties.find((s) => s.id === specialty)?.name;
  const selectClass =
    "rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";

  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          {activeSpecialtyName ? `${activeSpecialtyName}s` : "Find a doctor"}
          {city ? ` in ${city}` : ""}
        </h1>
        <p className="text-sm text-muted">
          {results.length} doctor{results.length !== 1 ? "s" : ""} available
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by doctor name or specialty"
            className="field pl-9"
          />
        </div>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="btn-secondary btn-md sm:hidden"
        >
          <SlidersHorizontal size={15} /> Filters
        </button>

        <div className="hidden items-center gap-3 sm:flex">
          <select
            value={specialty}
            onChange={(e) => updateSpecialty(e.target.value)}
            className={selectClass}
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
            className={selectClass}
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
            className={selectClass}
          >
            <option value="relevance">Relevance</option>
            <option value="rating">Highest rated</option>
            <option value="experience">Most experienced</option>
            <option value="fee-low">Fee: Low to high</option>
            <option value="fee-high">Fee: High to low</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setAvailableToday((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150 ${
            availableToday
              ? "border-success bg-success-light text-success"
              : "border-line bg-surface text-muted hover:border-success/40 hover:text-success"
          }`}
        >
          <Zap size={12} className={availableToday ? "fill-success" : ""} />
          Available today ({todayCount})
        </button>
      </div>

      {filtersOpen && (
        <div className="mt-3 flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 shadow-card sm:hidden">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Filters</p>
            <button onClick={() => setFiltersOpen(false)} aria-label="Close filters">
              <X size={16} className="text-muted" />
            </button>
          </div>
          <select
            value={specialty}
            onChange={(e) => updateSpecialty(e.target.value)}
            className={selectClass}
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
            className={selectClass}
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
            className={selectClass}
          >
            <option value="relevance">Relevance</option>
            <option value="experience">Most experienced</option>
            <option value="fee-low">Fee: Low to high</option>
            <option value="fee-high">Fee: High to low</option>
          </select>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {results.length > 0 ? (
          results.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)
        ) : (
          <div className="card flex flex-col items-center py-16 text-center">
            <EmptyStateIllustration className="h-32 w-32" />
            <p className="mt-2 text-sm font-medium text-ink">No doctors match these filters</p>
            <p className="mt-1 text-sm text-muted">
              Try a different specialty, city, or search term.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}