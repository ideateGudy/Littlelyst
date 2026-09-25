"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { initTheme } from "@/lib/theme-store";

/**
 * AppInitializer: mounts once at the root layout.
 * - Hydrates the theme from localStorage (no flash after <script> sets the class)
 * - Calls initAuth() to check the session cookie and populate Zustand auth state
 * No context, no providers — pure Zustand.
 */
export function AppInitializer() {
  const initAuth = useAuthStore((s) => s.initAuth);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    // Sync Zustand theme state with what the inline script already applied to the DOM
    initTheme();
    // Boot auth session check
    if (!initialized) {
      initAuth();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
