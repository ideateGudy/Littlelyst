"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import {
  User,
  Mail,
  Phone,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

export default function BuyerProfilePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();

  // Profile Form State
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Seller Mode Activation State
  const [storeHandle, setStoreHandle] = useState(
    user?.handle && !user.handle.startsWith("buyer")
      ? user.handle
      : (user?.name?.toLowerCase().replace(/[^a-z0-9]/g, "") || "")
  );
  const [switching, setSwitching] = useState(false);
  const [switchSuccess, setSwitchSuccess] = useState(false);
  const [switchError, setSwitchError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await apiClient<{ status: string; user: any; message?: string }>("/api/auth/profile", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
        }),
      });

      if (res.user) {
        updateUser(res.user);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile details");
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchToSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHandle = storeHandle.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
    if (!cleanHandle || cleanHandle.length < 3) {
      setSwitchError("Store handle must be at least 3 characters");
      return;
    }

    setSwitching(true);
    setSwitchError("");
    setSwitchSuccess(false);

    try {
      const res = await apiClient<{ status: string; user: any; message?: string }>("/api/auth/switch-role", {
        method: "POST",
        body: JSON.stringify({
          targetRole: "seller",
          handle: cleanHandle,
        }),
      });

      if (res.user) {
        updateUser(res.user);
        setSwitchSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      }
    } catch (err: any) {
      setSwitchError(err.message || "Failed to switch to seller account");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-white">Shopper Checkout Profile</h1>
        <p className="text-xs text-white/50">
          Manage your saved name and WhatsApp phone number. These details automatically populate when you buy items across all Littlelyst seller stores.
        </p>
      </div>

      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Checkout profile updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Buyer Autofill Details Form */}
      <form onSubmit={handleSave} className="liquid-glass-card rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Chioma Adeleke"
            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-white/40" />
            Account Email Address
          </label>
          <input
            type="email"
            readOnly
            value={user?.email || ""}
            className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white/50 cursor-not-allowed font-mono"
          />
          <span className="text-[10px] text-white/40">
            Email address is tied to your account receipt and login credentials.
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-cyan-400" />
            WhatsApp Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234 801 234 5678"
            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
          />
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-white/10">
          <div className="flex items-center gap-1.5 text-[11px] text-white/40">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Encrypted & secure auto-fill</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Become a Seller / Storefront Switch Section */}
      <div id="mode-toggle" className="liquid-glass-card rounded-3xl p-6 sm:p-8 space-y-5 border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Merchant Activation</span>
            </div>
            <h2 className="text-lg font-bold text-white">Want to start selling on Littlelyst?</h2>
            <p className="text-xs text-white/50 max-w-lg leading-relaxed">
              Switch seamlessly to a Merchant Account. You will unlock a personal storefront (<span className="text-emerald-400 font-mono">/[handle]</span>), order management, Paystack direct payouts, and product catalogue without losing any of your saved purchase history.
            </p>
          </div>
        </div>

        {switchSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Store activated! Redirecting to your merchant dashboard...</span>
          </div>
        )}

        {switchError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{switchError}</span>
          </div>
        )}

        <form onSubmit={handleSwitchToSeller} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80 flex items-center justify-between">
              <span>Choose your unique store handle</span>
              <span className="text-[10px] text-white/40 font-mono">littlelyst.com/{storeHandle || "your-store"}</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-emerald-400">@</span>
              <input
                type="text"
                required
                value={storeHandle}
                onChange={(e) => setStoreHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                placeholder="chiomasboutique"
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-colors font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-white/10">
            <span className="text-[11px] text-white/40">
              No data lost • Instant switch to merchant tools
            </span>

            <button
              type="submit"
              disabled={switching}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {switching ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Activate Seller Storefront</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
