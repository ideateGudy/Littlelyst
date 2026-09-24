import React from "react";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark" | "gradient";
}

export function Logo({ className = "", iconOnly = false, size = "md", variant = "gradient" }: LogoProps) {
  // Dimensions based on size
  const sizes = {
    sm: { icon: "w-6 h-6", text: "text-sm", gap: "gap-2" },
    md: { icon: "w-8 h-8", text: "text-lg", gap: "gap-2.5" },
    lg: { icon: "w-10 h-10", text: "text-xl", gap: "gap-3" },
    xl: { icon: "w-12 h-12", text: "text-2xl", gap: "gap-3.5" },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`inline-flex items-center ${currentSize.gap} font-black tracking-tight select-none ${className}`}>
      {/* Icon Mark */}
      <div className={`relative ${currentSize.icon} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]"
        >
          <defs>
            <linearGradient id="littlelystGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="littlelystBag" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background rounded squircle card */}
          <rect x="5" y="5" width="90" height="90" rx="26" fill="url(#littlelystGrad)" fillOpacity="0.15" stroke="url(#littlelystGrad)" strokeWidth="2" />

          {/* Catalogue Card / Bag Silhouette */}
          <rect x="26" y="36" width="38" height="44" rx="8" fill="url(#littlelystBag)" fillOpacity="0.25" stroke="url(#littlelystGrad)" strokeWidth="4.5" />

          {/* Bag Handles / L-Shape Fold */}
          <path
            d="M38 36 V 26 C 38 20.5 42.5 16 48 16 C 53.5 16 58 20.5 58 26 V 36"
            stroke="url(#littlelystGrad)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* Stylized L-Swoosh Link */}
          <path
            d="M20 74 C 20 50 34 32 64 32 C 78 32 86 42 86 42"
            stroke="url(#littlelystGrad)"
            strokeWidth="5.5"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Instant Lightning / Sparkle Icon */}
          <polygon
            points="74,16 64,34 73,34 67,48 84,28 75,28"
            fill="url(#littlelystGrad)"
            filter="url(#glow)"
          />

          {/* Product Tag Badge */}
          <circle cx="58" cy="48" r="4.5" fill="#34d399" />
        </svg>
      </div>

      {/* Wordmark */}
      {!iconOnly && (
        <span className={`${currentSize.text} font-black tracking-tight text-white flex items-center`}>
          Little<span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">lyst</span>
        </span>
      )}
    </div>
  );
}
