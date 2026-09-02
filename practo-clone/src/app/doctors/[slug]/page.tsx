"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Globe2, MapPin, Clock } from "lucide-react";
import { getReviewsForDoctor } from "@/lib/utils";
import { useDoctorBySlug } from "@/lib/hooks";
import RatingStars from "@/components/RatingStars";

export default function DoctorProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const { doctor, ready } = useDoctorBySlug(params.slug);

  useEffect(() => {
    if (doctor) document.title = `${doctor.name} — Curo`;
  }, [doctor]);

  if (!doctor) {
    if (!ready) return null;
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <p className="text-sm text-muted">This doctor's profile couldn't be found.</p>
        <Link href="/doctors" className="mt-3 inline-block text-sm text-primary">
          Back to doctors
        </Link>
      </div>
    );
  }

  const reviews = getReviewsForDoctor(doctor.id);

  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-start">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-line">
              <Image src={doctor.photo} alt={doctor.name} fill sizes="112px" className="object-cover" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="font-display text-2xl font-semibold text-ink">
                  {doctor.name}
                </h1>
                {doctor.verified && (
                  <BadgeCheck size={18} className="text-primary" aria-label="Verified doctor" />
                )}
              </div>
              <p className="mt-1 text-sm text-muted">
                {doctor.specialty} &middot; {doctor.qualifications}
              </p>
              <p className="mt-1 text-sm text-faint">
                {doctor.experienceYears} years experience
              </p>
              {doctor.reviewCount > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <RatingStars rating={doctor.rating} />
                  <span className="font-tabular text-sm text-muted">
                    {doctor.rating} ({doctor.reviewCount} reviews)
                  </span>
                </div>
              )}
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
                <MapPin size={15} className="shrink-0" />
                {doctor.clinicName}{doctor.locality ? `, ${doctor.locality}` : ""}, {doctor.city}
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
                <Globe2 size={15} className="shrink-0" />
                {doctor.languages.join(", ")}
              </p>
            </div>
          </div>

          <div className="border-b border-line py-7">
            <h2 className="font-display text-lg font-semibold text-ink">About</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              {doctor.about}
            </p>
          </div>

          <div className="border-b border-line py-7">
            <h2 className="font-display text-lg font-semibold text-ink">
              Availability
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <span
                  key={day}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    doctor.availableDays.includes(day)
                      ? "bg-primary-light text-primary-dark"
                      : "bg-bg text-faint line-through"
                  }`}
                >
                  {day}
                </span>
              ))}
            </div>
          </div>

          <div className="py-7">
            <h2 className="font-display text-lg font-semibold text-ink">
              Patient reviews ({reviews.length})
            </h2>
            {reviews.length > 0 ? (
              <div className="mt-4 space-y-5">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-line pb-5 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink">{review.author}</p>
                      <RatingStars rating={review.rating} size={12} />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {review.comment}
                    </p>
                    <p className="mt-1.5 text-xs text-faint">{review.date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                No reviews yet for this doctor.
              </p>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-lg border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Consultation fee</span>
              <span className="font-tabular text-lg font-semibold text-ink">
                ₹{doctor.consultationFee}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-sm text-muted">
              <Clock size={15} />
              Next available: {doctor.nextAvailable}
            </div>
            <Link
              href={`/doctors/${doctor.slug}/book`}
              className="mt-5 block rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-white hover:bg-primary-dark"
            >
              Book appointment
            </Link>
            <p className="mt-3 text-center text-xs text-faint">
              Free cancellation up to 2 hours before your visit
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}