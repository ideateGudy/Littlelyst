"use client";

import { Logo } from "@/components/ui/logo";
import toast from "react-hot-toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import {
  Smartphone,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  Store,
  Link as LinkIcon,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  KeyRound,
  Check,
  ShoppingBag,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  // Multi-step state: 1 = Phone, 2 = Verify Code, 3 = Brand & Catalogue Link, 4 = Account Details
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // OTP Channel: "phone" | "email"
  const [otpChannel, setOtpChannel] = useState<"phone" | "email">("email");

  const [selectedRole, setSelectedRole] = useState<"seller" | "buyer">("seller");

  // Form Fields
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);

  const [brandName, setBrandName] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [handle, setHandle] = useState("");
  const [isHandleCustomized, setIsHandleCustomized] = useState(false);
  const [handleLoading, setHandleLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Auto-generate clean, guaranteed unique handle when brand name changes
  useEffect(() => {
    if (!isHandleCustomized && brandName.trim()) {
      const timer = setTimeout(async () => {
        setHandleLoading(true);
        try {
          const res = await apiClient<{ handle: string }>(
            `/api/auth/suggest-handle?brand=${encodeURIComponent(brandName.trim())}`,
          );
          if (res.handle) {
            setHandle(res.handle);
          }
        } catch {
          // Fallback local cleanup
          const fallback = brandName
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 30);
          setHandle(fallback || "store");
        } finally {
          setHandleLoading(false);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [brandName, isHandleCustomized]);

  // Step 1: Send OTP to Phone or Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpChannel === "phone" && !phone.trim()) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (otpChannel === "email" && !email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setLoading(true);

    try {
      const payload = otpChannel === "email" ? { email: email.trim() } : { phone: phone.trim() };
      const res = await apiClient<{ status: string; message: string; simulatedCode?: string }>(
        "/api/auth/send-otp",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      if (res.simulatedCode) {
        setSimulatedOtp(res.simulatedCode);
        setOtpCode(res.simulatedCode); // Auto-fill for developer convenience
      }
      const destination = otpChannel === "email" ? email : phone;
      toast.success(`Verification code sent to ${destination}`);
      setStep(2);
    } catch (err: any) {
      toast.error(err.message || `Failed to send verification code to ${otpChannel}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      toast.error("Please enter the 6-digit confirmation code");
      return;
    }
    
    setLoading(true);

    try {
      const payload =
        otpChannel === "email"
          ? { email: email.trim(), code: otpCode }
          : { phone: phone.trim(), code: otpCode };

      const res = await apiClient<{ status: string; valid: boolean; message: string }>(
        "/api/auth/verify-otp",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      if (res.valid) {
        toast.success("Verification successful!");
        setStep(3);
      } else {
        toast.error(res.message || "Invalid or expired code");
      }
    } catch (err: any) {
      toast.error(err.message || "Code verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Brand/Buyer Details & Handle
  const handleBrandNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === "seller") {
      if (!brandName.trim()) {
        toast.error("Please enter your brand or store name");
        return;
      }
      if (!handle.trim()) {
        toast.error("Please specify a catalogue link");
        return;
      }
    } else {
      if (!buyerName.trim()) {
        toast.error("Please enter your full name");
        return;
      }
    }
    
    setStep(4);
  };

  // Step 4: Account Password & Final Registration
  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      const isBuyer = selectedRole === "buyer";
      const name = isBuyer ? buyerName.trim() : brandName.trim();
      const generatedHandle = isBuyer ? undefined : handle.trim().toLowerCase();

      const res = await apiClient<{
        status: string;
        token: string;
        user: any;
        message?: string;
      }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined,
          handle: generatedHandle,
          role: selectedRole,
        }),
      });

      if (res.user) {
        login(res.user);
        if (isBuyer) {
          window.location.href = "/buyer";
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        throw new Error(res.message || "Registration failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to complete account registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-black relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle size="sm" />
      </div>
      <div className="w-full max-w-md liquid-glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-white/15 shadow-2xl">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 mb-5">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
            <Logo iconOnly size="lg" className="mx-auto" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {selectedRole === "seller" ? "Launch Your Littlelyst" : "Join as a Shopper"}
          </h1>
          <p className="text-xs text-white/50">
            {selectedRole === "seller"
              ? "Turn your phone into a live, payable storefront in under 5 minutes."
              : "Save your details once, track your orders & checkout in 1-click."}
          </p>
        </div>

        {/* Account Type Selector (Seller vs Buyer) */}
        {step === 1 && (
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 text-xs mb-5">
            <button
              type="button"
              onClick={() => {
                setSelectedRole("seller");
                
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                selectedRole === "seller"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-md"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Store className="w-3.5 h-3.5" /> Merchant / Seller
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole("buyer");
                
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                selectedRole === "buyer"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-md"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Customer / Buyer
            </button>
          </div>
        )}

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-between mb-6 px-1">
          {[
            { num: 1, label: otpChannel === "email" ? "Email" : "Mobile" },
            { num: 2, label: "Verify" },
            { num: 3, label: selectedRole === "seller" ? "Brand" : "Profile" },
            { num: 4, label: "Account" },
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center gap-1.5 flex-1 relative">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                  step === s.num
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/40"
                    : step > s.num
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-white/5 text-white/30 border border-white/10"
                }`}
              >
                {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight ${
                  step === s.num ? "text-emerald-400 font-bold" : "text-white/40"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Alerts */}
        

        {/* Multi-step Transitions */}
        <AnimatePresence mode="wait">
          {/* STEP 1: VERIFICATION (EMAIL OR MOBILE) */}
          {step === 1 && (
            <motion.form
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSendOtp}
              className="space-y-4"
            >
              {/* Channel Toggle */}
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setOtpChannel("email");
                    
                  }}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 font-semibold transition-all cursor-pointer ${
                    otpChannel === "email"
                      ? "bg-emerald-500 text-black shadow-md"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" /> Email OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpChannel("phone");
                    
                  }}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 font-semibold transition-all cursor-pointer ${
                    otpChannel === "phone"
                      ? "bg-emerald-500 text-black shadow-md"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile SMS
                </button>
              </div>

              {otpChannel === "email" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    Email Address
                  </label>
                  <p className="text-[11px] text-white/50">
                    We'll send a 6-digit confirmation code directly to your email inbox.
                  </p>
                  <div className="relative pt-1">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seller@example.com"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    Mobile Phone Number
                  </label>
                  <p className="text-[11px] text-white/50">
                    We'll send a 6-digit confirmation code via SMS to verify your mobile storefront.
                  </p>
                  <div className="relative pt-1">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 08012345678 or +234..."
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading || (otpChannel === "email" ? !email.trim() : !phone.trim())
                }
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                ) : (
                  <>
                    Send Confirmation Code <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* STEP 2: ENTER OTP CODE */}
          {step === 2 && (
            <motion.form
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOtp}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    Enter Confirmation Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Change {otpChannel === "email" ? "Email" : "Number"}
                  </button>
                </div>
                <p className="text-[11px] text-white/50">
                  Sent to{" "}
                  <span className="text-emerald-400 font-mono">
                    {otpChannel === "email" ? email : phone}
                  </span>
                </p>

                {otpChannel === "phone" && simulatedOtp && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center justify-between">
                    <span>Developer Demo Code (SMS):</span>
                    <span className="font-mono font-bold tracking-widest text-emerald-400 text-sm">
                      {simulatedOtp}
                    </span>
                  </div>
                )}

                <div className="pt-1">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit code"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-center text-base tracking-[0.3em] font-mono text-emerald-400 placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3.5 py-3 rounded-xl liquid-glass text-white/70 hover:text-white text-xs flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  ) : (
                    <>
                      Verify & Continue <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}

          {/* STEP 3: BRAND NAME (SELLER) OR FULL NAME (BUYER) */}
          {step === 3 && (
            <motion.form
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleBrandNext}
              className="space-y-4"
            >
              {selectedRole === "seller" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-emerald-400" />
                      Your Brand / Store Name
                    </label>
                    <input
                      type="text"
                      required
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="e.g. Ada Cosmetics, Kicks By Tim"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-teal-400" />
                        Autogenerated Catalogue Link
                      </label>
                      {handleLoading ? (
                        <span className="text-[10px] text-teal-400 animate-pulse flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Checking DB...
                        </span>
                      ) : handle ? (
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Unique & Available
                        </span>
                      ) : (
                        <span className="text-[10px] text-white/40">Can be edited anytime</span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-xs text-white/40 font-mono">
                        lyst.me/
                      </span>
                      <input
                        type="text"
                        required
                        value={handle}
                        onChange={(e) => {
                          setIsHandleCustomized(true);
                          setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""));
                        }}
                        placeholder="brand-name"
                        className="w-full bg-black/60 border border-white/10 rounded-xl pl-20 pr-9 py-2.5 text-xs font-mono text-emerald-400 placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-colors"
                      />
                      {handleLoading && (
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400 absolute right-3 animate-spin" />
                      )}
                    </div>
                    <p className="text-[11px] text-white/40">
                      Automatically checked against database records to prevent duplicate store links.
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                    Full Legal Name
                  </label>
                  <p className="text-[11px] text-white/50">
                    This will be prefilled automatically whenever you place orders across merchant catalogues.
                  </p>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Chioma Okeke"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-3.5 py-3 rounded-xl liquid-glass text-white/70 hover:text-white text-xs flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="submit"
                  disabled={selectedRole === "seller" ? (!brandName.trim() || !handle.trim()) : !buyerName.trim()}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer disabled:opacity-50"
                >
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.form>
          )}

          {/* STEP 4: EMAIL & SECURE PASSWORD */}
          {step === 4 && (
            <motion.form
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleFinalRegister}
              className="space-y-4"
            >
              {selectedRole === "seller" ? (
                <div className="p-3 rounded-2xl liquid-glass-subtle border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-white/40 block">Your Store Link</span>
                    <span className="font-mono text-emerald-400 font-bold">lyst.me/{handle}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-[10px] text-white/60 hover:text-emerald-400 underline"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-2xl liquid-glass-subtle border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-white/40 block">Account Role</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" /> Shopper Account ({buyerName})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-[10px] text-white/60 hover:text-emerald-400 underline"
                  >
                    Edit
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    Email Address
                  </label>
                  {otpChannel === "email" && (
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified via OTP
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  required
                  readOnly={otpChannel === "email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seller@example.com"
                  className={`w-full bg-black/60 border rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors ${
                    otpChannel === "email"
                      ? "border-emerald-500/40 bg-emerald-950/20 cursor-not-allowed"
                      : "border-white/10 focus:border-emerald-400"
                  }`}
                />
              </div>

              {otpChannel === "email" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-white/40" />
                    Mobile Phone Number <span className="text-white/40 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 08012345678"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      Mobile Phone Number
                    </label>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified via SMS
                    </span>
                  </div>
                  <input
                    type="tel"
                    readOnly
                    value={phone}
                    className="w-full bg-emerald-950/20 border border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-white cursor-not-allowed"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-white/40" />
                  Create Password
                </label>
                                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-colors"
                />
                {password.length > 0 && (
                  <div className="flex flex-col gap-1 pt-1">
                    <div className="flex gap-1 w-full">
                      {[1, 2, 3, 4].map((level) => {
                        const score = password.length < 6 ? 1 : password.length < 8 ? 2 : (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) ? 3 : 4;
                        const color = score === 1 ? 'bg-rose-500' : score === 2 ? 'bg-amber-500' : score === 3 ? 'bg-teal-400' : 'bg-emerald-500';
                        return (
                          <div key={level} className={`h-1.5 flex-1 rounded-full ${level <= score ? color : 'bg-white/10'}`} />
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-white/50 text-right">
                      {password.length < 6 ? 'Too short' : password.length < 8 ? 'Weak' : (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) ? 'Good' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-3.5 py-3 rounded-xl liquid-glass text-white/70 hover:text-white text-xs flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !email.trim() || password.length < 6}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  ) : selectedRole === "buyer" ? (
                    <>
                      Complete Registration <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      Launch My Storefront <Sparkles className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}



