import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { Doctor } from "@/lib/types";
import RatingStars from "./RatingStars";



export default function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="group flex flex-col gap-4 border-b border-line py-5 first:pt-0 last:border-b-0 sm:flex-row sm:items-center sm:gap-6">
      <Link href={`/doctors/${doctor.slug}`} className="shrink-0">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-line sm:h-24 sm:w-24">
         
          
          <Image
            src={doctor.photo}
            alt={doctor.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
      </Link>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/doctors/${doctor.slug}`}
            className="font-display text-base font-semibold text-ink hover:text-info"
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
          <div className="mt-2 flex items-center gap-2">
            <RatingStars rating={doctor.rating} />
            <span className="font-tabular text-xs text-muted">
              {doctor.rating} ({doctor.reviewCount})
            </span>
          </div>
        )}

        <p className="mt-2 flex items-center gap-1 text-sm text-muted">
          <MapPin size={14} className="shrink-0" />
          {doctor.clinicName}, {doctor.locality ? `${doctor.locality}, ` : ""}{doctor.city}
        </p>
      </div>

      <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-2">
        <div className="text-right">
          <p className="font-tabular text-base font-semibold text-ink">
            ₹{doctor.consultationFee}
          </p>
          <p className="text-xs text-muted">Consultation fee</p>
        </div>
        <Link
          href={`/doctors/${doctor.slug}/book`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          Book · {doctor.nextAvailable}
        </Link>
      </div>
    </div>
  );
}