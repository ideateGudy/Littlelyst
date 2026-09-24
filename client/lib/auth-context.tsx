"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authStore } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";

interface User {
  id: string;
  name: string;
  email: string;
  handle?: string;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  paystackSubaccountCode?: string | null;
  role?: string;
  systemUser?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  updateUser: (userData: Partial<User>) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  updateUser: () => {},
  logout: async () => {},
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from express-session & httpOnly cookie fallback
  useEffect(() => {
    async function initAuth() {
      try {
        const res = await apiClient("/api/auth/current-user");
        if (res.user) {
          setUser(res.user);
          authStore.setLoggedInMarker(true);
        } else {
          // Fallback to refresh token rotation
          const refreshRes = await apiClient("/api/auth/refresh", { method: "POST" });
          if (refreshRes.user) {
            setUser(refreshRes.user);
            authStore.setLoggedInMarker(true);
          } else {
            setUser(null);
            authStore.clearSession();
          }
        }
      } catch (err) {
        try {
          // Attempt automatic token refresh on reload
          const refreshRes = await apiClient("/api/auth/refresh", { method: "POST" });
          if (refreshRes.user) {
            setUser(refreshRes.user);
            authStore.setLoggedInMarker(true);
          } else {
            setUser(null);
            authStore.clearSession();
          }
        } catch {
          setUser(null);
          authStore.clearSession();
        }
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    authStore.setLoggedInMarker(true);
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  const logout = async () => {
    try {
      await apiClient("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      authStore.clearSession();
      setUser(null);
      window.location.href = "/login";
    }
  };

  const refreshAuth = async () => {
    try {
      const res = await apiClient("/api/auth/current-user");
      if (res.user) {
        setUser(res.user);
        authStore.setLoggedInMarker(true);
      } else {
        const refreshRes = await apiClient("/api/auth/refresh", { method: "POST" });
        if (refreshRes.user) {
          setUser(refreshRes.user);
          authStore.setLoggedInMarker(true);
        }
      }
    } catch {
      try {
        const refreshRes = await apiClient("/api/auth/refresh", { method: "POST" });
        if (refreshRes.user) {
          setUser(refreshRes.user);
          authStore.setLoggedInMarker(true);
        } else {
          authStore.clearSession();
          setUser(null);
        }
      } catch {
        authStore.clearSession();
        setUser(null);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, updateUser, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
