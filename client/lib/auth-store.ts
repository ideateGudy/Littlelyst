import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import { authStore } from "@/lib/auth";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  handle?: string;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  paystackSubaccountCode?: string | null;
  paystackBankName?: string | null;
  paystackAccountNumber?: string | null;
  role?: "seller" | "buyer" | "admin" | "super-admin";
  reminderEmailTemplate?: string | null;
}

export type User = AuthUser;

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  login: (userData: AuthUser) => void;
  updateUser: (userData: Partial<AuthUser>) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  initAuth: async () => {
    if (get().initialized) return;
    try {
      const res = await apiClient("/api/auth/current-user");
      if (res.user) {
        set({ user: res.user, loading: false, initialized: true });
        authStore.setLoggedInMarker(true);
        return;
      }
      // Fallback to refresh token rotation
      const refreshRes = await apiClient("/api/auth/refresh", { method: "POST" });
      if (refreshRes.user) {
        set({ user: refreshRes.user, loading: false, initialized: true });
        authStore.setLoggedInMarker(true);
      } else {
        set({ user: null, loading: false, initialized: true });
        authStore.clearSession();
      }
    } catch {
      try {
        const refreshRes = await apiClient("/api/auth/refresh", { method: "POST" });
        if (refreshRes.user) {
          set({ user: refreshRes.user, loading: false, initialized: true });
          authStore.setLoggedInMarker(true);
        } else {
          set({ user: null, loading: false, initialized: true });
          authStore.clearSession();
        }
      } catch {
        set({ user: null, loading: false, initialized: true });
        authStore.clearSession();
      }
    }
  },

  login: (userData: AuthUser) => {
    set({ user: userData, loading: false });
    authStore.setLoggedInMarker(true);
  },

  updateUser: (updatedFields: Partial<AuthUser>) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...updatedFields } });
    }
  },

  logout: async () => {
    try {
      await apiClient("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      authStore.clearSession();
      set({ user: null, loading: false, initialized: false });
    }
  },

  refreshAuth: async () => {
    try {
      const res = await apiClient("/api/auth/current-user");
      if (res.user) {
        set({ user: res.user, loading: false });
        authStore.setLoggedInMarker(true);
      } else {
        set({ user: null, loading: false });
        authStore.clearSession();
      }
    } catch {
      set({ user: null, loading: false });
      authStore.clearSession();
    }
  },
}));

/**
 * Direct Zustand hook — replaces useContext(AuthContext).
 * Use this everywhere instead of useAuth().
 */
export const useAuth = () => useAuthStore();
