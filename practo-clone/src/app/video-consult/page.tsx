"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Video,
  Mic,
  Phone,
  ShieldCheck,
  FileCheck2,
  Sparkles,
  Star,
  Clock,
  Lock,
  Search,
  ClipboardList,
} from "lucide-react";
import { doctors, specialties, reviews } from "@/lib/utils";
import { getSpecialtyIcon } from "@/lib/icon-map";
import {
  CoughColdIllustration,
  SkinCareIllustration,
  PeriodTrackerIllustration,
  LowMoodIllustration,
  SickChildIllustration,
  ToothacheIllustration,
  BackPainIllustration,
  HeartHealthIllustration,
  ThroatIssueIllustration,
  EyeStrainIllustration,
} from "@/components/illustrations/ConcernIllustrations";

// ---- Derived data ----

function startingFeeFor(specialtyId: string) {
  const fees = doctors.filter((d) => d.specialtyId === specialtyId).map((d) => d.consultationFee);
  return fees.length ? Math.min(...fees) : 499;
}

const topConsultDoctors = [...doctors]
  .filter((d) => d.verified)
  .sort((a, b) => b.reviewCount - a.reviewCount)
  .slice(0, 4);

const commonConcerns = [
  { question: "Cough or cold?", specialtyId: "general-physician", Illustration: CoughColdIllustration },
  { question: "Skin or hair problems?", specialtyId: "dermatologist", Illustration: SkinCareIllustration },
  { question: "Period problems?", specialtyId: "gynecologist", Illustration: PeriodTrackerIllustration },
  { question: "Feeling low or anxious?", specialtyId: "psychiatrist", Illustration: LowMoodIllustration },
  { question: "Child not keeping well?", specialtyId: "pediatrician", Illustration: SickChildIllustration },
  { question: "Tooth or gum pain?", specialtyId: "dentist", Illustration: ToothacheIllustration },
  { question: "Joint or back pain?", specialtyId: "orthopedic", Illustration: BackPainIllustration },
  { question: "Heart palpitations?", specialtyId: "cardiologist", Illustration: HeartHealthIllustration },
  { question: "Ear, nose or throat issue?", specialtyId: "ent-specialist", Illustration: ThroatIssueIllustration },
  { question: "Blurry vision or eye strain?", specialtyId: "ophthalmologist", Illustration: EyeStrainIllustration },
];

// Fixed literal class names (Tailwind can't detect dynamically built ones)
// cycled across concern cards so each illustration gets a distinct tone.
const CONCERN_TONES = [
  { bg: "bg-primary-light", icon: "text-primary-dark" },
  { bg: "bg-cyan-light", icon: "text-cyan-dark" },
  { bg: "bg-accent-light", icon: "text-accent" },
  { bg: "bg-success-light", icon: "text-success" },
];

const howItWorks = [
  {
    icon: Search,
    title: "Pick a specialist or symptom",
    description: "Choose from 10+ specialities or tell us what's bothering you — we'll match you with the right doctor.",
  },
  {
    icon: Video,
    title: "Start your video consultation",
    description: "Connect over a private video or audio call the moment your doctor is ready — no waiting rooms.",
  },
  {
    icon: ClipboardList,
    title: "Get your prescription & follow-up",
    description: "Walk away with a digital prescription and a free 7-day follow-up window for any questions.",
  },
];

const benefits = [
  {
    icon: Clock,
    title: "Available 24x7",
    description: "Connect with a verified doctor any time of day — no appointment queues, no travel.",
  },
  {
    icon: Video,
    title: "Real video consultations",
    description: "Face-to-face conversations with your doctor from wherever you are, on any device.",
  },
  {
    icon: Lock,
    title: "Private & secure",
    description: "Every consultation is confidential and encrypted end-to-end, just like an in-clinic visit.",
  },
  {
    icon: FileCheck2,
    title: "Digital prescription + follow-up",
    description: "Get a valid e-prescription instantly, plus a free follow-up window if symptoms don't settle.",
  },
];

const userReviews = reviews.slice(0, 6).map((r) => {
  const doc = doctors.find((d) => d.id === r.doctorId);
  return { ...r, doctorName: doc?.name, doctorSpecialty: doc?.specialty };
});

export default function VideoConsultPage() {
  const concernsTrackRef = useRef<HTMLDivElement>(null);

  const scrollConcerns = (direction: "left" | "right") => {
    const el = concernsTrackRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div>
      {/* 1. Banner */}
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute inset-0 bg-hero-radial" />

        <div className="relative mx-auto grid max-w-content gap-10 px-5 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div>
            <span className="section-eyebrow inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1.5">
              <Sparkles size={13} /> Skip the travel
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              Take an online{" "}
              <span className="bg-brand-gradient bg-clip-text text-transparent">
                video doctor consultation
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              Private video or audio consultations with verified doctors, starting at just ₹199.
              Get a digital prescription and a free follow-up — from home.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/doctors" className="btn-primary btn-lg">
                Consult now <ArrowRight size={16} />
              </Link>
              <Link href="#specialities" className="btn-secondary btn-lg">
                Browse specialities
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-cyan-dark" /> Verified doctors
              </span>
              <span className="flex items-center gap-1.5">
                <FileCheck2 size={15} className="text-success" /> Digital prescription
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={15} className="text-accent" /> Free follow-up
              </span>
            </div>
          </div>

          {/* Mock video-call card */}
          <div className="hidden lg:block">
            <div className="card ml-auto max-w-sm overflow-hidden p-0 shadow-soft">
              <div className="relative flex aspect-[4/3] flex-col items-center justify-center bg-brand-gradient">
                <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-xs font-medium text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> Live
                </span>
                <img
                  src={topConsultDoctors[0]?.photo}
                  alt={topConsultDoctors[0]?.name}
                  className="h-24 w-24 rounded-full border-4 border-white/80 object-cover shadow-lg"
                />
                <p className="mt-3 text-sm font-medium text-white">{topConsultDoctors[0]?.name}</p>
                <p className="text-xs text-white/80">{topConsultDoctors[0]?.specialty}</p>
                <div className="mt-4 flex items-end gap-1">
                  {[8, 14, 6, 18, 10, 16, 7].map((h, i) => (
                    <span key={i} className="w-1 rounded-full bg-white/70" style={{ height: `${h}px` }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg text-muted">
                  <Mic size={16} />
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-sm">
                  <Phone size={17} className="rotate-[135deg]" />
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg text-muted">
                  <Video size={16} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Specialities */}
      <section id="specialities" className="mx-auto max-w-content px-5 py-16">
        <div className="flex items-end justify-between">
          <div>
            <span className="section-eyebrow">Video consult</span>
            <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink sm:text-3xl">
              Consult top doctors across specialities
            </h2>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
          {specialties.map((s) => {
            const Icon = getSpecialtyIcon(s.icon);
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
                  <p className="mt-0.5 text-xs text-faint">₹{startingFeeFor(s.id)} onwards</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Common Health Concerns */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-content px-5 py-16">
          <span className="section-eyebrow">Not sure who to consult?</span>
          <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink sm:text-3xl">
            Common health concerns
          </h2>
          <p className="mt-1.5 text-sm text-muted">Consult a doctor online for any health issue</p>

          <div className="relative mt-6">
            <button
              type="button"
              onClick={() => scrollConcerns("left")}
              aria-label="Scroll left"
              className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-soft transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary-dark sm:flex"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollConcerns("right")}
              aria-label="Scroll right"
              className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-soft transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary-dark sm:flex"
            >
              <ChevronRight size={16} />
            </button>

            <div
              ref={concernsTrackRef}
              className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
            >
              {commonConcerns.map((c, i) => {
                const tone = CONCERN_TONES[i % CONCERN_TONES.length];
                return (
                  <div
                    key={c.question}
                    className="card card-hover flex w-52 shrink-0 snap-start flex-col overflow-hidden sm:w-56"
                  >
                    <div className={`flex h-28 w-full items-center justify-center ${tone.bg}`}>
                      <c.Illustration className={`h-20 w-28 ${tone.icon}`} />
                    </div>
                    <div className="flex flex-1 flex-col p-3.5">
                      <p className="text-sm font-medium leading-snug text-ink">{c.question}</p>
                      <p className="mt-1 text-xs text-faint">₹{startingFeeFor(c.specialtyId)}</p>
                      <Link
                        href={`/doctors?specialty=${c.specialtyId}`}
                        className="btn-primary btn-sm mt-3 justify-center"
                      >
                        Consult Now
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Our Doctors (compact) */}
      <section className="mx-auto max-w-content px-5 py-16">
        <div className="flex items-end justify-between">
          <div>
            <span className="section-eyebrow">Meet our specialists</span>
            <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink sm:text-3xl">Our doctors</h2>
          </div>
          <Link
            href="/doctors"
            className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-dark"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          {topConsultDoctors.map((d) => (
            <Link key={d.id} href={`/doctors/${d.slug}`} className="card card-hover flex flex-col items-center p-4 text-center">
              <img src={d.photo} alt={d.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-line" />
              <p className="mt-3 truncate text-sm font-medium text-ink">{d.name}</p>
              <p className="truncate text-xs text-muted">{d.specialty}</p>
              <p className="mt-1 text-xs text-faint">{d.experienceYears} yrs exp.</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. How it works */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-content px-5 py-16">
          <span className="section-eyebrow">Simple process</span>
          <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink sm:text-3xl">
            How video consultation works
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {howItWorks.map((step, i) => (
              <div key={step.title} className="card p-5">
                <span className="icon-tile">
                  <step.icon size={18} />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-ink">
                  {i + 1}. {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Benefits of consultation */}
      <section className="mx-auto max-w-content px-5 py-16">
        <span className="section-eyebrow">Why go online</span>
        <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink sm:text-3xl">
          Benefits of video consultation
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} className="card p-5">
              <span className="icon-tile-soft">
                <b.icon size={18} />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. User Reviews */}
      <section className="mx-auto max-w-content px-5 py-16">
        <span className="section-eyebrow">Patient ratings</span>
        <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink sm:text-3xl">What users are saying</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {userReviews.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-center gap-1 text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} fill={i < r.rating ? "currentColor" : "none"} className="text-accent" />
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink/90">{r.comment}</p>
              <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-xs font-medium text-white">
                  {r.author.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-ink">{r.author}</p>
                  {r.doctorName && (
                    <p className="truncate text-[11px] text-faint">
                      Consulted {r.doctorName} &middot; {r.doctorSpecialty}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-content px-5 pb-20">
        <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-xl bg-brand-gradient px-8 py-10 sm:flex-row sm:items-center">
          <div className="relative">
            <h3 className="font-display text-xl font-semibold text-white sm:text-2xl">
              Still delaying your health concerns?
            </h3>
            <p className="mt-1.5 max-w-sm text-sm text-white/85">
              Connect with verified doctors online — starting at just ₹199.
            </p>
          </div>
          <Link
            href="/doctors"
            className="relative flex shrink-0 items-center gap-1.5 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-primary-dark shadow-sm transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.97]"
          >
            Consult now <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}