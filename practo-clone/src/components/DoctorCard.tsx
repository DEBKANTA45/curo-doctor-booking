import Image from "next/image";
import Link from "next/link";
import { MapPin, Video, Home as HomeIcon, CalendarClock, MessageCircle, Star } from "lucide-react";
import { Doctor } from "@/lib/types";
import RatingStars from "./RatingStars";
import StatusBadge from "@/components/admin/StatusBadge";

// The app doesn't track separate online vs in-clinic schedules — patients
// choose the consultation type at booking time, and either type draws from
// the same slot list. So both availability pills show this same next slot,
// just labeled differently.
function nextAvailableText(doctor: Doctor) {
  const slot = doctor.slots?.[0];
  return slot ? `${doctor.nextAvailable}, ${slot} (IST)` : doctor.nextAvailable;
}

export default function DoctorCard({ doctor }: { doctor: Doctor }) {
  const availableText = nextAvailableText(doctor);

  return (
    <div className="card card-hover flex flex-col gap-4 p-5 sm:flex-row sm:items-stretch sm:gap-5">
      <Link href={`/doctors/${doctor.slug}`} className="relative shrink-0 self-center">
        <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-line sm:h-32 sm:w-32">
          <Image
            src={doctor.photo}
            alt={doctor.name}
            fill
            sizes="128px"
            className="object-cover"
          />
        </div>
        <span className="absolute bottom-1.5 left-1.5 rounded-md bg-ink/75 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {doctor.experienceYears} years exp
        </span>
      </Link>

      {/* Identity */}
      <div className="min-w-0 flex-1 self-center">
        {doctor.featured && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <Star size={11} className="fill-amber-500 text-amber-500" />
            Featured Doctor
          </span>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Link
            href={`/doctors/${doctor.slug}`}
            className="font-display text-base font-semibold text-ink transition-colors hover:text-primary"
          >
            {doctor.name}
          </Link>
          {doctor.verified && <StatusBadge label="Verified" />}
        </div>

        <p className="mt-0.5 text-sm text-muted">{doctor.qualifications}</p>
        <p className="mt-0.5 text-sm font-semibold text-ink">{doctor.specialty}</p>

        {doctor.reviewCount > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <RatingStars rating={doctor.rating} />
            <span className="font-tabular text-xs text-muted">
              {doctor.rating} ({doctor.reviewCount})
            </span>
          </div>
        )}

        <p className="mt-2 flex items-center gap-1 text-sm text-muted">
          <MapPin size={14} className="shrink-0 text-cyan-dark" />
          {doctor.clinicName}, {doctor.locality ? `${doctor.locality}, ` : ""}
          {doctor.city}
        </p>

        {doctor.languages?.length > 0 && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-faint">
            <MessageCircle size={13} className="shrink-0 text-cyan-dark" />
            {doctor.languages.slice(0, 3).join(", ")}
          </p>
        )}
      </div>

      {/* RIGHT — availability + fee + CTAs */}
      <div className="flex shrink-0 flex-col gap-3 border-t border-line pt-4 sm:w-64 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-600">
          <CalendarClock size={15} />
          Next Available
        </p>

        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 rounded-md border border-cyan/30 bg-cyan-light px-2.5 py-1.5 text-xs font-medium text-cyan-dark">
            <Video size={13} className="shrink-0" />
            Online &middot; {availableText}
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-cyan/30 bg-cyan-light px-2.5 py-1.5 text-xs font-medium text-cyan-dark">
            <HomeIcon size={13} className="shrink-0" />
            In-Clinic &middot; {availableText}
          </span>
        </div>

        <p className="font-tabular text-xl font-bold text-ink">₹{doctor.consultationFee}</p>

        <Link href={`/doctors/${doctor.slug}/book`} className="btn-primary w-full justify-center">
          Book an Appointment
        </Link>
        <Link href={`/doctors/${doctor.slug}`} className="btn-secondary w-full justify-center">
          View Profile
        </Link>
      </div>
    </div>
  );
}