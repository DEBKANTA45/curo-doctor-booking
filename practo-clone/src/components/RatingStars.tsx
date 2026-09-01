import { Star } from "lucide-react";

export default function RatingStars({
  rating,
  size = 14,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < Math.round(rating)
              ? "fill-primary text-primary"
              : "fill-line text-line"
          }
        />
      ))}
    </div>
  );
}
