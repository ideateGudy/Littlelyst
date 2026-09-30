"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  ShoppingBag,
  Wallet,
  PlusCircle,
  LogOut,
  Shield,
  ExternalLink,
  Package,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout, updateUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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
    if (!loading && !user) {
      if (
        typeof document !== "undefined" &&
        !document.cookie.includes("littlelyst_logged_in=1")
      ) {
        router.push("/login");
      }
    } else if (!loading && user?.role === "buyer") {
      router.push("/buyer");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <LoadingScreen
        fullScreen
        message="Loading merchant dashboard..."
        subMessage="Authenticating store session"
      />
    );
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/orders", label: "Orders" },
    { href: "/dashboard/coupons", label: "Coupons" },
    { href: "/dashboard/profile", label: "Profile" },
  ];

  const mobileNavItems = [
    { href: "/dashboard", label: "Home", icon: ShoppingBag },
    { href: "/dashboard/orders", label: "Orders", icon: Wallet },
    { href: "/dashboard/new", label: "Add Item", icon: PlusCircle, isFab: true },
    ...(user?.handle ? [{ href: `/${user.handle}`, label: "Store", icon: ExternalLink, isExternal: true }] : []),
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col transition-colors duration-200">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 liquid-glass border-b border-[var(--border-glass)] px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
          >
            <Logo size="md" />
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:inline-block">
              Catalogue
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            {/* Public Store Link — always visible if handle exists */}
            {user?.handle && (
              <a
                href={`/${user.handle}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl hover:bg-emerald-500/20 transition-all items-center gap-1.5"
              >
                <span>View Store</span>
                <span className="text-[10px] text-white/50 font-mono">@{user.handle}</span>
              </a>
            )}

            {/* Desktop page links — hide current page link */}
            {navLinks.map((link) =>
              pathname !== link.href ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs font-semibold text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors hidden sm:block"
                >
                  {link.label}
                </Link>
              ) : null,
            )}

            {/* Admin link */}
            {(user?.role === "super-admin" || user?.role === "admin") && (
              <Link
                href="/admin"
                className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin</span>
              </Link>
            )}

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

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-24 sm:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 liquid-glass border-t border-white/10 px-2 py-2 flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const isActive = !item.isExternal && pathname === item.href;
          const Icon = item.icon;

          if (item.isFab) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg -mt-5 transition-all ${
                    isActive
                      ? "bg-emerald-400 scale-110"
                      : "bg-emerald-500 hover:bg-emerald-400"
                  }`}
                >
                  <Icon className="w-5 h-5 text-black" />
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    isActive ? "text-emerald-400" : "text-white/50"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          if (item.isExternal) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-0.5 relative px-2 py-1"
              >
                <Icon className="w-5 h-5 text-teal-400" />
                <span className="text-[10px] font-semibold text-white/50">Store</span>
              </a>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 relative px-2 py-1"
            >
              {isActive && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? "text-emerald-400" : "text-white/50"
                }`}
              />
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  isActive ? "text-emerald-400" : "text-white/50"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Admin shortcut if applicable */}
        {(user?.role === "super-admin" || user?.role === "admin") && (
          <Link
            href="/admin"
            className={`flex flex-col items-center gap-0.5 relative px-2 py-1 ${
              pathname === "/admin" ? "text-amber-400" : "text-amber-400/60"
            }`}
          >
            {pathname === "/admin" && (
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
            <Shield className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Admin</span>
          </Link>
        )}
      </div>
    </div>
  );
}
