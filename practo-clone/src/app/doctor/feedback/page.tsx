"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquare, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getAllDoctors, getAllReviewsForDoctor, getRatingSummary } from "@/lib/mock-db";
import { Review } from "@/lib/types";

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5 text-accent">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < Math.round(rating) ? "currentColor" : "none"}
          className={i < Math.round(rating) ? "text-accent" : "text-faint"}
        />
      ))}
    </div>
  );
}

export default function DoctorFeedbackPage() {
  const { account, loading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);

  const doctorRecord = useMemo(
    () => (account?.role === "doctor" ? getAllDoctors().find((d) => d.id === account.doctorId) : undefined),
    [account]
  );

  useEffect(() => {
    if (account?.role === "doctor") {
      setReviews(getAllReviewsForDoctor(account.doctorId));
    }
  }, [account]);

  const ratingSummary = useMemo(() => (doctorRecord ? getRatingSummary(doctorRecord) : null), [doctorRecord]);

  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // index 0 = 1 star ... index 4 = 5 star
    reviews.forEach((r) => {
      const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
      counts[idx]++;
    });
    return counts;
  }, [reviews]);
  const maxCount = Math.max(1, ...distribution);

  if (loading) return null;

  if (!account || account.role !== "doctor") {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">
          Log in to view your feedback
        </h1>
        <Link
          href="/doctor/login"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Doctor login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content px-5 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Patient feedback</h1>
      <p className="mt-1 text-sm text-muted">What your patients are saying after their visits.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr] lg:items-start">
        <div className="card p-6">
          <p className="font-tabular text-4xl font-semibold text-ink">
            {ratingSummary?.rating || "New"}
          </p>
          <div className="mt-1.5">
            <StarRow rating={ratingSummary?.rating ?? 0} size={14} />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {ratingSummary?.reviewCount ?? 0} review{(ratingSummary?.reviewCount ?? 0) !== 1 ? "s" : ""}
          </p>

          <div className="mt-5 space-y-2 border-t border-line pt-4">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 text-xs text-muted">
                <span className="w-3">{star}</span>
                <div className="h-1.5 flex-1 rounded-full bg-bg">
                  <div
                    className="h-1.5 rounded-full bg-accent"
                    style={{ width: `${(distribution[star - 1] / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-4 text-right font-tabular">{distribution[star - 1]}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line py-14 text-center">
              <MessageSquare className="text-faint" size={26} />
              <p className="text-sm text-muted">
                No feedback yet — reviews from your patients will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ink">{r.author}</p>
                    <StarRow rating={r.rating} />
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-muted">{r.comment}</p>}
                  <p className="mt-2 text-xs text-faint">{formatDate(r.date)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}