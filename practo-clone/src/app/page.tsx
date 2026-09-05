"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck, ClipboardList, Search, ShieldCheck, Sparkles } from "lucide-react";
import HomeSearch from "@/components/HomeSearch";
import DoctorCard from "@/components/DoctorCard";
import { doctors, specialties } from "@/lib/utils";
import { getSpecialtyIcon } from "@/lib/icon-map";
import { useAuth } from "@/context/AuthContext";
import { ClinicIllustration } from "@/components/illustrations/BrandIllustrations";

const topDoctors = [...doctors].sort((a, b) => b.rating - a.rating).slice(0, 4);

const steps = [
  {
    icon: Search,
    title: "Search by specialty or symptom",
    description: "Filter doctors by city, fee, and availability to find the right fit.",
  },
  {
    icon: CalendarCheck,
    title: "Pick a convenient slot",
    description: "See real-time availability and book the time that works for you.",
  },
  {
    icon: ClipboardList,
    title: "Visit and track your history",
    description: "Keep every appointment — past and upcoming — in one place.",
  },
];

export default function HomePage() {
  const { account } = useAuth();
  const isDoctor = account?.role === "doctor";
  const isPatient = account?.role === "patient";

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute inset-0 bg-hero-radial" />

        <div className="relative mx-auto grid max-w-content gap-10 px-5 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div>
            <span className="section-eyebrow inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1.5">
              <Sparkles size={13} /> Trusted by patients across India
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              Book a doctor you trust,{" "}
              <span className="bg-brand-gradient bg-clip-text text-transparent">
                on your schedule.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              Compare doctors by specialty, fee, and patient rating — then
              book an in-clinic visit in a couple of minutes.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={isDoctor ? "/doctor/dashboard" : "/doctors"}
                className="btn-primary btn-lg"
              >
                {isDoctor ? "Open dashboard" : "Find a doctor"} <ArrowRight size={16} />
              </Link>
              <Link
                href={isDoctor ? "/doctor/schedule" : isPatient ? "/appointments" : "/doctor/register"}
                className="btn-secondary btn-lg"
              >
                {isDoctor ? "Manage schedule" : isPatient ? "My appointments" : "List your practice"}
              </Link>
            </div>
            <div className="mt-8">
              <HomeSearch />
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-sm text-faint">
              <ShieldCheck size={14} className="text-cyan-dark" />
              {doctors.length} doctors across {new Set(doctors.map((d) => d.city)).size} cities
            </p>
          </div>

          <div className="hidden lg:block">
            <div className="ml-auto grid max-w-sm gap-3">
              {topDoctors.slice(0, 3).map((d) => (
                <Link
                  key={d.id}
                  href={`/doctors/${d.slug}`}
                  className="card card-hover flex items-center gap-3 px-4 py-3.5"
                >
                  <img
                    src={d.photo}
                    alt={d.name}
                    className="h-11 w-11 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{d.name}</p>
                    <p className="truncate text-xs text-muted">
                      {d.specialty} &middot; {d.city}
                    </p>
                  </div>
                  <span className="badge-primary ml-auto shrink-0 font-tabular">
                    ★ {d.rating}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-5 py-16">
        <div className="flex items-end justify-between">
          <div>
            <span className="section-eyebrow">Browse</span>
            <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink sm:text-3xl">
              Consult by specialty
            </h2>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
          {specialties.map((s) => {
            const Icon = getSpecialtyIcon(s.icon);
            const count = doctors.filter((d) => d.specialtyId === s.id).length;
            return (
              <Link
                key={s.id}
                href={`/doctors?specialty=${s.id}`}
                className="card card-hover group flex flex-col gap-3 p-4"
              >
                <span className="icon-tile-soft transition-colors duration-150 group-hover:bg-brand-gradient group-hover:text-white">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{s.name}</p>
                  <p className="mt-0.5 text-xs text-faint">{count} doctors</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-content px-5 py-16">
          <div className="flex items-end justify-between">
            <div>
              <span className="section-eyebrow">Highly rated</span>
              <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Top rated doctors
              </h2>
            </div>
            <Link
              href="/doctors"
              className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-dark"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
                    <div className="mt-6 flex flex-col gap-4">
            {topDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-5 py-16">
        <span className="section-eyebrow">Simple process</span>
        <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink sm:text-3xl">
          How booking works
        </h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="card p-5">
              <span className="icon-tile">
                <step.icon size={18} />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink">
                {i + 1}. {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-content px-5 pb-20">
        <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-xl bg-brand-gradient px-8 py-10 sm:flex-row sm:items-center">
          <ClinicIllustration className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 opacity-90 sm:h-48 sm:w-48" />
          <div className="relative">
            <h3 className="font-display text-xl font-semibold text-white sm:text-2xl">
              Are you a doctor or a clinic?
            </h3>
            <p className="mt-1.5 max-w-sm text-sm text-white/85">
              List your practice on Curo and manage appointments from one dashboard.
            </p>
          </div>
          <Link
            href="/doctor/register"
            className="relative shrink-0 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-primary-dark shadow-sm transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.97]"
          >
            Join as a doctor
          </Link>
        </div>
      </section>
    </div>
  );
}