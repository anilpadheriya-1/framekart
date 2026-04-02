import React from "react";
import { Star } from "lucide-react";

export default function StarRating({ rating = 0, max = 5, size = 16, interactive = false, onChange }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type={interactive ? "button" : undefined}
          onClick={interactive ? () => onChange?.(star) : undefined}
          className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
          disabled={!interactive}
        >
          <Star
            size={size}
            className={star <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-600"}
          />
        </button>
      ))}
    </div>
  );
}
