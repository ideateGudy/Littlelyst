/**
 * Shim: re-exports useAuth from auth-store so existing `import { useAuth } from "@/lib/auth-context"`
 * still works without any changes to other files.
 * AuthProvider is now a no-op wrapper — all state lives in Zustand (useAuthStore).
 */
"use client";

export { useAuth, useAuthStore, type AuthUser, type User } from "@/lib/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
