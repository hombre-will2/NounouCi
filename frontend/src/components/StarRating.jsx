import React, { useState } from "react";
import { Star } from "lucide-react";

// value: 0..5 (or 0..5 with halves). onChange called when interactive.
export default function StarRating({
  value = 0,
  onChange,
  size = 18,
  readOnly = false,
  testId = "stars",
  showNumber = false,
}) {
  const [hover, setHover] = useState(0);
  const display = readOnly ? value : (hover || value);

  return (
    <div className="inline-flex items-center gap-1" data-testid={testId}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = display >= i;
          const half = !filled && display >= i - 0.5;
          return (
            <button
              key={i}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange?.(i)}
              onMouseEnter={() => !readOnly && setHover(i)}
              onMouseLeave={() => !readOnly && setHover(0)}
              data-testid={`${testId}-${i}`}
              aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
              className={readOnly ? "" : "cursor-pointer transition-transform hover:scale-110"}
              style={{ background: "none", border: "none", padding: 0 }}
            >
              <Star
                width={size}
                height={size}
                className={
                  filled
                    ? "fill-accent stroke-accent"
                    : half
                    ? "fill-accent/50 stroke-accent"
                    : "fill-none stroke-gray-300"
                }
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </div>
      {showNumber && value > 0 && (
        <span className="text-sm font-bold text-gray-700">{value.toFixed(1)}</span>
      )}
    </div>
  );
}
