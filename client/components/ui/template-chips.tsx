import React from "react";

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

export function TemplateChip({ label, selected, onClick, icon }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap select-none active:scale-95 ${
        selected
          ? "bg-emerald-500 text-black font-semibold shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400"
          : "liquid-glass-subtle text-white/80 hover:text-white hover:border-white/20 hover:bg-white/[0.08]"
      }`}
    >
      {icon && <span className="opacity-80">{icon}</span>}
      {label}
    </button>
  );
}

interface ProgressBarProps {
  progress: number;
}

export function UploadProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between text-xs text-white/70 font-mono">
        <span>Publishing to Littlelyst...</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden liquid-glass">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
