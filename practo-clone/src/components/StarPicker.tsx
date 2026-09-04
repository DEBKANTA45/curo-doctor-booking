"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export default function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const filled = starValue <= (hovered || value);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHovered(starValue)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
            className="p-0.5"
          >
            <Star
              size={22}
              className={filled ? "fill-primary text-primary" : "fill-line text-line"}
            />
          </button>
        );
      })}
    </div>
  );
}