"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import {
  Wallet,
  ShoppingBag,
  PlusCircle,
  LogOut,
  User,
  Shield,
  ExternalLink,
} from "lucide-react";

import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout, updateUser } = useAuth();
  const router = useRouter();
  const [switchingToBuyer, setSwitchingToBuyer] = useState(false);

  const handleSwitchToBuyer = async () => {
    try {
      setSwitchingToBuyer(true);
      const res = await apiClient<{ status: string; user: any; message?: string }>("/api/auth/switch-role", {
        method: "POST",
        body: JSON.stringify({ targetRole: "buyer" }),
      });
      if (res.user) {
        updateUser(res.user);
        router.push("/buyer");
      }
    } catch (err: any) {
      alert(err.message || "Failed to switch to shopper mode");
    } finally {
      setSwitchingToBuyer(false);
    }
  };

  useEffect(() => {
    // If auth state resolved and no user, route to login
    if (!loading && !user) {
      // Check if logged in cookie marker exists before redirecting
      if (typeof document !== "undefined" && !document.cookie.includes("littlelyst_logged_in=1")) {
        router.push("/login");
      }
    } else if (!loading && user?.role === "buyer") {
      router.push("/buyer");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col transition-colors duration-200">
      {/* Liquid Glass Navigation Bar */}
      <header className="sticky top-0 z-50 liquid-glass border-b border-[var(--border-glass)] px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
            <Logo size="md" />
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:inline-block">
              Catalogue
            </span>
          </Link>

          <nav className="flex items-center gap-3">
            {user?.handle && (
              <a
                href={`/${user.handle}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl hover:bg-emerald-500/20 transition-all items-center gap-1.5"
              >
                <span>View Store</span>
                <span className="text-[10px] text-white/50 font-mono hidden sm:inline">@{user.handle}</span>
              </a>
            )}

            <Link
              href="/dashboard"
              className="text-xs font-semibold text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors hidden sm:block"
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/orders"
              className="text-xs font-semibold text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors hidden sm:block"
            >
              Orders
            </Link>

            {(user?.role === "super-admin" || user?.role === "admin" || user?.systemUser === true) && (
              <Link
                href="/admin"
                className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin</span>
              </Link>
            )}

            <button
              onClick={handleSwitchToBuyer}
              disabled={switchingToBuyer}
              className="hidden sm:flex text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-xl hover:bg-cyan-500/20 transition-all items-center gap-1.5 disabled:opacity-50"
              title="Switch to Shopper / Buyer mode"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>{switchingToBuyer ? "Switching..." : "Shopper Mode"}</span>
            </button>

            <Link
              href="/dashboard/new"
              className="hidden sm:flex bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold px-3.5 py-1.5 rounded-xl items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </Link>

            <ThemeToggle size="sm" />

            <div className="h-4 w-[1px] bg-white/15 mx-1" />

            <button
              onClick={() => logout()}
              className="text-xs font-medium text-white/60 hover:text-red-400 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Mobile Bottom Fixed Nav Bar (Strictly Mobile First) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 liquid-glass border-t border-white/10 px-6 py-2.5 flex items-center justify-around">
        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-white/70 hover:text-white"
        >
          <ShoppingBag className="w-4 h-4 text-emerald-400" />
          <span>Home</span>
        </Link>

        <Link
          href="/dashboard/orders"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-white/70 hover:text-white"
        >
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span>Orders</span>
        </Link>

        {(user?.role === "super-admin" || user?.role === "admin" || user?.systemUser === true) && (
          <Link
            href="/admin"
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-amber-400"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Admin</span>
          </Link>
        )}

        <Link
          href="/dashboard/new"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-emerald-400"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg -mt-3">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span>Add Item</span>
        </Link>

        {user?.handle ? (
          <a
            href={`/${user.handle}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-white/70 hover:text-white"
          >
            <ExternalLink className="w-4 h-4 text-teal-400" />
            <span>Store</span>
          </a>
        ) : (
          <button
            onClick={() => logout()}
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-white/50"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit</span>
          </button>
        )}
      </div>

      {/* Minimal Footer */}
      <footer className="liquid-glass border-t border-white/5 py-4 px-4 text-center text-xs text-white/40 pb-16 sm:pb-4">
        Littlelyst Social-Commerce Platform. Fast mobile catalogue with instant online checkout.
      </footer>
    </div>
  );
}
