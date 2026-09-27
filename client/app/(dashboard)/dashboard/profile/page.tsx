"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { motion } from "motion/react";
import {
  User,
  Camera,
  Lock,
  MapPin,
  Store,
  Phone,
  Mail,
  FileText,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AtSign,
} from "lucide-react";
import Link from "next/link";

/* ─────────────────────────── types ─────────────────────────── */
type Address = {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

/* ─────────────────────────── helpers ─────────────────────────── */
function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`liquid-glass-card rounded-2xl border border-white/10 p-6 sm:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-6">
      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <Icon className="w-4 h-4 text-emerald-400" />
      </div>
      <h2 className="text-base font-bold text-white">{label}</h2>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
  readOnly,
  children,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ElementType;
  readOnly?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        )}
        {children ? (
          children
        ) : (
          <input
            type={type}
            value={value}
            readOnly={readOnly}
            placeholder={placeholder}
            onChange={(e) => onChange?.(e.target.value)}
            className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder-white/25 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all ${readOnly ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Profile Page
═══════════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { user, updateUser, loading } = useAuth();

  /* ── Profile state ── */
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  /* ── Password state ── */
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  /* ── Address state ── */
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [newAddr, setNewAddr] = useState<Partial<Address>>({});
  const [addrSaving, setAddrSaving] = useState(false);

  /* ── Populate from auth ── */
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setBio(user.bio ?? "");
      setPhone(user.phone ?? "");
      setAvatarUrl(user.avatarUrl ?? "");
    }
  }, [user]);

  /* ── Load addresses ── */
  useEffect(() => {
    apiClient<Address[]>("/api/addresses")
      .then((res) => setAddresses(res.data ?? []))
      .catch(() =>
        toast({ title: "Failed to load addresses", variant: "destructive" })
      )
      .finally(() => setAddrLoading(false));
  }, []);

  /* ───── Handlers ───── */
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatarUploading(true);
      const url = await uploadToCloudinary(file);
      setAvatarUrl(url);
      toast({ title: "Photo uploaded – save profile to apply" });
    } catch {
      toast({ title: "Failed to upload photo", variant: "destructive" });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Name cannot be empty", variant: "destructive" });
      return;
    }
    setProfileSaving(true);
    try {
      const res = await apiClient<{ status: string; user: any }>(
        "/api/auth/profile",
        {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            bio: bio.trim() || undefined,
            phone: phone.trim() || undefined,
            avatarUrl: avatarUrl || undefined,
          }),
        }
      );
      if (res.user) {
        updateUser(res.user);
        toast({ title: "Profile saved!", variant: "default" });
      }
    } catch (err: any) {
      toast({
        title: err.message ?? "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPwd || !newPwd) {
      toast({ title: "Fill in all password fields", variant: "destructive" });
      return;
    }
    if (newPwd !== confirmPwd) {
      toast({ title: "New passwords do not match", variant: "destructive" });
      return;
    }
    if (newPwd.length < 8) {
      toast({
        title: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    setPwdSaving(true);
    try {
      await apiClient("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      toast({ title: "Password updated successfully", variant: "default" });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err: any) {
      toast({
        title: err.message ?? "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setPwdSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!newAddr.label || !newAddr.line1 || !newAddr.city) {
      toast({
        title: "Label, Line 1, and City are required",
        variant: "destructive",
      });
      return;
    }
    setAddrSaving(true);
    try {
      const resp = await apiClient<Address>("/api/addresses", {
        method: "POST",
        body: JSON.stringify(newAddr),
      });
      const created = resp.data;
      if (created) {
        setAddresses((prev) => [...prev, created]);
        toast({ title: "Address saved", variant: "default" });
      }
      setNewAddr({});
      setShowAddrForm(false);
    } catch {
      toast({ title: "Could not save address", variant: "destructive" });
    } finally {
      setAddrSaving(false);
    }
  };

  if (loading) return null;

  /* ─────────────────────────── render ─────────────────────────── */
  return (
    <div className="space-y-8 pb-12">
      {/* ── Page Header ── */}
      <div>
        <Link
          href="/dashboard"
          className="text-xs text-white/50 hover:text-white flex items-center gap-1 font-semibold transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Account &amp; Profile
        </h1>
        <p className="text-xs sm:text-sm text-white/50 mt-1">
          Manage your personal info, security settings, and saved addresses.
        </p>
      </div>

      {/* ══════════ Profile card ══════════ */}
      <GlassCard>
        <SectionTitle icon={Store} label="Store Profile" />
        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 bg-black/40 flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white/20" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center cursor-pointer hover:bg-emerald-400 transition-colors shadow-lg">
                {avatarUploading ? (
                  <Loader2 className="w-4 h-4 text-black animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-black" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-bold text-white">{user?.name || "—"}</p>
              <p className="text-xs text-white/40">{user?.email}</p>
              {user?.handle && (
                <p className="text-xs text-emerald-400 font-mono">
                  @{user.handle}
                </p>
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Display Name"
              value={name}
              onChange={setName}
              placeholder="Your store name"
              icon={Store}
            />
            <InputField
              label="Email"
              value={user?.email ?? ""}
              icon={Mail}
              readOnly
            />
            <InputField
              label="Phone"
              value={phone}
              onChange={setPhone}
              placeholder="+234 800 000 0000"
              icon={Phone}
            />
            {user?.handle && (
              <InputField
                label="Store Handle"
                value={`@${user.handle}`}
                icon={AtSign}
                readOnly
              />
            )}
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Store Bio
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-white/30 pointer-events-none" />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your store…"
                rows={3}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder-white/25 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-sm transition-all"
            >
              {profileSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {profileSaving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* ══════════ Password card ══════════ */}
      <GlassCard>
        <SectionTitle icon={Lock} label="Change Password" />
        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Current password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder-white/25 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                {showCurrent ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New + confirm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  type={showNew ? "text" : "password"}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder-white/25 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  {showNew ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder-white/25 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
                {confirmPwd && newPwd === confirmPwd && (
                  <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwdSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold text-sm transition-all border border-white/10"
            >
              {pwdSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {pwdSaving ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* ══════════ Addresses card ══════════ */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <SectionTitle icon={MapPin} label="Saved Addresses" />
          <button
            type="button"
            onClick={() => setShowAddrForm((v) => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddrForm ? "Cancel" : "Add address"}
          </button>
        </div>

        {/* Address list */}
        {addrLoading ? (
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading addresses…
          </div>
        ) : addresses.length === 0 && !showAddrForm ? (
          <div className="text-center py-10 space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 mx-auto">
              <MapPin className="w-5 h-5" />
            </div>
            <p className="text-xs text-white/40">No addresses saved yet.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {addresses.map((addr) => (
              <motion.div
                key={addr.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-black/30 border border-white/5"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{addr.label}</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city},{" "}
                    {addr.state} {addr.zip}, {addr.country}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* New address form */}
        {showAddrForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-5 rounded-2xl bg-black/30 border border-white/10 space-y-4"
          >
            <p className="text-xs font-bold text-white/60 uppercase tracking-wider">
              New Address
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "label", placeholder: "Label (Home, Work…)" },
                { key: "line1", placeholder: "Street Line 1" },
                { key: "line2", placeholder: "Line 2 (optional)" },
                { key: "city", placeholder: "City" },
                { key: "state", placeholder: "State / Province" },
                { key: "zip", placeholder: "ZIP / Postcode" },
                { key: "country", placeholder: "Country" },
              ].map(({ key, placeholder }) => (
                <input
                  key={key}
                  placeholder={placeholder}
                  value={(newAddr as any)[key] ?? ""}
                  onChange={(e) =>
                    setNewAddr({ ...newAddr, [key]: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder-white/25 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={addrSaving}
                onClick={handleSaveAddress}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-sm transition-all"
              >
                {addrSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Address
              </button>
            </div>
          </motion.div>
        )}
      </GlassCard>
    </div>
  );
}
