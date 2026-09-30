"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient } from "@/lib/api-client";
import {
  ShoppingBag,
  PackageCheck,
  User,
  LogOut,
  Shield,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout, updateUser } = useAuthStore();
  const router = useRouter();
  const [switchingRole, setSwitchingRole] = useState(false);

  const handleSwitchRole = async (targetRole: "seller" | "buyer") => {
    if (switchingRole || user?.role === targetRole) return;
    try {
      setSwitchingRole(true);
      const res = await apiClient<{ status: string; user: any; message?: string }>(
        "/api/auth/switch-role",
        {
          method: "POST",
          body: JSON.stringify({ targetRole }),
        },
      );
      if (res.user) {
        updateUser(res.user);
        router.push(targetRole === "buyer" ? "/buyer" : "/dashboard");
      }
    } catch (err: any) {
      alert(err.message || "Failed to switch mode");
    } finally {
      setSwitchingRole(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (
          typeof document !== "undefined" &&
          !document.cookie.includes("littlelyst_logged_in=1")
        ) {
          router.push("/login");
        }
      } else if (user.role === "seller") {
        // Sellers belong in the seller management dashboard
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <LoadingScreen fullScreen message="Loading shopper portal..." subMessage="Fetching your order profile" />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col transition-colors duration-200">
      {/* Shopper Navigation Header */}
      <header className="sticky top-0 z-50 liquid-glass border-b border-[var(--border-glass)] px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/buyer"
            className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
          >
            <Logo size="md" />
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hidden sm:inline-block">
              Shopper Portal
            </span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/buyer"
              className="text-xs font-semibold text-white/80 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              My Purchases
            </Link>

            <Link
              href="/buyer/profile"
              className="text-xs font-semibold text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors hidden sm:block"
            >
              Checkout Profile
            </Link>

            {/* Seller / Buyer mode toggle */}
            <div className="hidden sm:flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => handleSwitchRole("seller")}
                disabled={switchingRole || user.role === "seller"}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  user.role === "seller"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-white/40 hover:text-white cursor-pointer"
                }`}
                title="Switch to Seller mode"
              >
                Seller
              </button>
              <button
                onClick={() => handleSwitchRole("buyer")}
                disabled={switchingRole || user.role === "buyer"}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  user.role === "buyer"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "text-white/40 hover:text-white cursor-pointer"
                }`}
                title="Switch to Buyer mode"
              >
                Buyer
              </button>
            </div>

            {(user?.role === "super-admin" || user?.role === "admin") && (
              <Link
                href="/admin"
                className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Console</span>
              </Link>
            )}

            <ThemeToggle size="sm" />

            <div className="h-4 w-[1px] bg-white/15 mx-1" />

            <button
              onClick={() => logout()}
              className="text-xs font-medium text-white/60 hover:text-red-400 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Shopper Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Mobile Bottom Fixed Nav Bar for Shoppers */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 liquid-glass border-t border-white/10 px-8 py-2.5 flex items-center justify-around">
        <Link
          href="/buyer"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-white/70 hover:text-white"
        >
          <PackageCheck className="w-4 h-4 text-cyan-400" />
          <span>Purchases</span>
        </Link>

        <Link
          href="/buyer/profile"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-white/70 hover:text-white"
        >
          <User className="w-4 h-4 text-emerald-400" />
          <span>Profile</span>
        </Link>

        <button
          onClick={() => handleSwitchRole("seller")}
          disabled={switchingRole}
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-emerald-400 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4 text-emerald-400" />
          <span>Sell</span>
        </button>

        <button
          onClick={() => logout()}
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-white/50 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Minimal Footer */}
      <footer className="liquid-glass border-t border-white/5 py-4 px-4 text-center text-xs text-white/40 pb-16 sm:pb-4">
        Littlelyst Shopper Account. Instant auto-fill, verified receipts, and order delivery downloads.
      </footer>
    </div>
  );
}
