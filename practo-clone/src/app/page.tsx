import Link from "next/link";
import { ArrowRight, CalendarCheck, ClipboardList, Search } from "lucide-react";
import HomeSearch from "@/components/HomeSearch";
import DoctorCard from "@/components/DoctorCard";
import { doctors, specialties } from "@/lib/utils";
import { getSpecialtyIcon } from "@/lib/icon-map";

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
  return (
    <div>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-content gap-10 px-5 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
          <div>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              Book a doctor you trust, on your schedule.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              Compare doctors by specialty, fee, and patient rating — then
              book an in-clinic visit in a couple of minutes.
            </p>
            <div className="mt-8">
              <HomeSearch />
            </div>
            <p className="mt-4 text-sm text-faint">
              {doctors.length} doctors across {new Set(doctors.map((d) => d.city)).size} cities
            </p>
          </div>

          <div className="hidden lg:block">
            <div className="ml-auto grid max-w-sm gap-3">
              {topDoctors.slice(0, 3).map((d) => (
                <Link
                  key={d.id}
                  href={`/doctors/${d.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-line bg-bg px-4 py-3 transition-colors hover:border-primary"
                >
                  <img
                    src={d.photo}
                    alt={d.name}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{d.name}</p>
                    <p className="truncate text-xs text-muted">
                      {d.specialty} &middot; {d.city}
                    </p>
                  </div>
                  <span className="ml-auto shrink-0 font-tabular text-xs text-primary">
                    ★ {d.rating}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-5 py-12">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Consult by specialty
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {specialties.map((s) => {
            const Icon = getSpecialtyIcon(s.icon);
            const count = doctors.filter((d) => d.specialtyId === s.id).length;
            return (
              <Link
                key={s.id}
                href={`/doctors?specialty=${s.id}`}
                className="group flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-primary"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-light text-primary-dark">
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
        <div className="mx-auto max-w-content px-5 py-12">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Top rated doctors
            </h2>
            <Link
              href="/doctors"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-2">
            {topDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-5 py-12">
        <h2 className="font-display text-2xl font-semibold text-ink">
          How booking works
        </h2>
        <div className="mt-7 grid gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title}>
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-light text-primary-dark">
                <step.icon size={18} />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-content px-5 pb-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-lg bg-primary px-8 py-9 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-xl font-semibold text-white">
              Are you a doctor or a clinic?
            </h3>
            <p className="mt-1 max-w-sm text-sm text-primary-light">
              List your practice on Curo and manage appointments from one dashboard.
            </p>
          </div>
          <Link
            href="/doctor/register"
            className="shrink-0 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-primary-dark hover:bg-primary-light"
          >
            Join as a doctor
          </Link>
        </div>
      </section>
    </div>
  );
}