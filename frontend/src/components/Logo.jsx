import React from "react";

// Reusable brand logo component with updated NounouCI baby icon.
export default function Logo({ size = 36, withWordmark = true, className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo.svg"
        alt="NounouCI Logo"
        width={size}
        height={size}
        className="rounded-2xl object-contain shadow-sm flex-shrink-0"
        style={{ width: size, height: size }}
        data-testid="brand-logo"
      />
      {withWordmark && (
        <span className="font-display font-bold text-xl text-gray-900 tracking-tight">
          Nounou<span className="text-terracotta">CI</span>
        </span>
      )}
    </div>
  );
}
