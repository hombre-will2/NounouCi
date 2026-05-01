import React from "react";

// Reusable logo. Includes the brand image from /logo.jpg + wordmark (optional).
export default function Logo({ size = 36, withWordmark = true, className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.jpg"
        alt="NounouCI"
        width={size}
        height={size}
        className="rounded-xl object-cover shadow-sm"
        style={{ width: size, height: size }}
        data-testid="brand-logo"
      />
      {withWordmark && (
        <span className="font-display text-xl text-gray-900">
          Nounou<span className="text-terracotta">CI</span>
        </span>
      )}
    </div>
  );
}
