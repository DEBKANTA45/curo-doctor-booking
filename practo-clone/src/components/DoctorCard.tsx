import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  MapPin,
  ArrowRight,
  Zap,
  Languages as LanguagesIcon,
} from "lucide-react";
import { Doctor } from "@/lib/types";
import RatingStars from "./RatingStars";

// Today / Tomorrow gets its own colour so it reads instantly in a scanning
// list; anything further out still shows the exact day, just muted.
function getAvailability(doctor: Doctor) {
  if (doctor.nextAvailable === "Today") {
    return { label: "Available today", dot: "bg-success", text: "text-success" };
  }
  if (doctor.nextAvailable === "Tomorrow") {
    return { label: "Available tomorrow", dot: "bg-primary", text: "text-primary" };
  }
  return {
    label: `Available ${doctor.nextAvailable}`,
    dot: "bg-cyan-dark",
    text: "text-cyan-dark",
  };
}

// Below this many open slots, scarcity is worth calling out — it's the single
// biggest nudge to book now instead of "checking a few more doctors" first.
const LIMITED_SLOT_THRESHOLD = 3;

export default function DoctorCard({ doctor }: { doctor: Doctor }) {
  const availability = getAvailability(doctor);
  const slotCount = doctor.slots?.length ?? 0;
  const isLimited = slotCount > 0 && slotCount <= LIMITED_SLOT_THRESHOLD;
  const visibleSlots = doctor.slots?.slice(0, 3) ?? [];
  const extraSlots = slotCount - visibleSlots.length;

  return (
    <div className="card card-hover flex flex-col gap-5 p-5 sm:flex-row sm:items-start">
      <Link href={`/doctors/${doctor.slug}`} className="mx-auto shrink-0 sm:mx-0">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white shadow-sm ring-1 ring-line transition-shadow duration-150 hover:ring-primary/40 sm:h-24 sm:w-24">
          <Image
            src={doctor.photo}
            alt={doctor.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
      </Link>

      <div className="min-w-0 flex-1 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
          <Link
            href={`/doctors/${doctor.slug}`}
            className="font-display text-base font-semibold text-ink transition-colors hover:text-primary"
          >
            {doctor.name}
          </Link>
          {doctor.verified && (
            <BadgeCheck size={16} className="text-primary" aria-label="Verified" />
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted">
          {doctor.specialty} &middot; {doctor.qualifications}
        </p>
        <p className="mt-0.5 text-sm text-faint">
          {doctor.experienceYears} years experience
        </p>

        {doctor.reviewCount > 0 && (
          <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
            <RatingStars rating={doctor.rating} />
            <span className="font-tabular text-xs text-muted">
              {doctor.rating} ({doctor.reviewCount})
            </span>
          </div>
        )}

        <p className="mt-2 flex items-center justify-center gap-1 text-sm text-muted sm:justify-start">
          <MapPin size={14} className="shrink-0 text-cyan-dark" />
          {doctor.clinicName}, {doctor.locality ? `${doctor.locality}, ` : ""}{doctor.city}
        </p>

        {doctor.languages?.length > 0 && (
          <p className="mt-1.5 flex items-center justify-center gap-1 text-xs text-faint sm:justify-start">
            <LanguagesIcon size={12} className="shrink-0" />
            Speaks {doctor.languages.slice(0, 3).join(", ")}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-line pt-4 sm:w-52 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${availability.dot}`} />
          <span className={availability.text}>{availability.label}</span>
        </div>

        {visibleSlots.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleSlots.map((slot) => (
              <span
                key={slot}
                className="rounded-md border border-line bg-bg px-2 py-1 font-tabular text-[11px] font-medium text-muted"
              >
                {slot}
              </span>
            ))}
            {extraSlots > 0 && (
              <span className="rounded-md border border-line bg-bg px-2 py-1 text-[11px] font-medium text-faint">
                +{extraSlots} more
              </span>
            )}
          </div>
        )}

        {isLimited && (
          <p className="flex items-center gap-1 text-xs font-semibold text-accent">
            <Zap size={12} className="shrink-0 fill-accent" />
            Only {slotCount} slot{slotCount !== 1 ? "s" : ""} left
          </p>
        )}

        <div className="mt-1 flex items-center justify-between gap-3">
          <div>
            <p className="font-tabular text-base font-semibold text-ink">
              ₹{doctor.consultationFee}
            </p>
            <p className="text-xs text-muted">Consultation fee</p>
          </div>
          <Link href={`/doctors/${doctor.slug}/book`} className="btn-primary btn-sm shrink-0">
            Book <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}