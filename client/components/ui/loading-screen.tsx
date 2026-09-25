"use client";

import React from "react";
import { motion } from "motion/react";
import { Logo } from "./logo";

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({
  message = "Loading...",
  subMessage = "Setting up your workspace",
  fullScreen = false,
}: LoadingScreenProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 select-none transition-all duration-300 ${
        fullScreen
          ? "fixed inset-0 z-50 bg-[#090b0e]/95 backdrop-blur-xl"
          : "min-h-[60vh] w-full"
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Ambient Gradient Glow Orb */}
        <div className="absolute -inset-8 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-teal-500/20 rounded-full blur-2xl animate-pulse pointer-events-none" />

        {/* Pulsating Logo Container */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            filter: [
              "drop-shadow(0 0 15px rgba(16, 185, 129, 0.3))",
              "drop-shadow(0 0 35px rgba(16, 185, 129, 0.65))",
              "drop-shadow(0 0 15px rgba(16, 185, 129, 0.3))",
            ],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative z-10 flex items-center justify-center mb-6"
        >
          <Logo size="xl" />
        </motion.div>

        {/* Sleek Progress / Shimmer Bar */}
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden relative mb-4">
          <motion.div
            className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 rounded-full"
            animate={{
              x: [-100, 200],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Text Details */}
        <div className="text-center space-y-1 relative z-10">
          <p className="text-sm font-bold text-white/90 tracking-wide font-sans">{message}</p>
          <p className="text-xs text-white/40 font-mono">{subMessage}</p>
        </div>
      </div>
    </div>
  );
}
