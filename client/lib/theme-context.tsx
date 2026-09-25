/**
 * Shim: re-exports from theme-store so existing `import { useTheme } from "@/lib/theme-context"` still works.
 * ThemeProvider is now a no-op — all theme state lives in Zustand (useThemeStore).
 */
"use client";

export { useThemeStore } from "@/lib/theme-store";

import { useThemeStore } from "@/lib/theme-store";

/** Direct Zustand hook — replaces useContext(ThemeContext). */
export function useTheme() {
  return useThemeStore();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
