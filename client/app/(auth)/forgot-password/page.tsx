"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, AlertCircle, Key, Lock, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Logo } from "@/components/ui/logo";

type Step = "EMAIL" | "OTP" | "SUCCESS";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await apiClient("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setStep("OTP");
    } catch (err: any) {
      setError(err.message || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !newPassword.trim()) return;
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiClient("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, code: otp, newPassword }),
      });
      setStep("SUCCESS");
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Check your code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <Link href="/" className="relative z-10 flex items-center gap-2 mb-8 group">
        <Logo className="w-8 h-8 group-hover:scale-105 transition-transform" />
        <span className="font-extrabold text-lg text-white tracking-tight">Littlelyst</span>
      </Link>

      <div className="relative z-10 w-full max-w-[340px] liquid-glass p-6 md:p-8 rounded-[24px] border border-white/5 shadow-2xl">
        {step === "EMAIL" && (
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-xs text-white/50">
              Enter your email address and we'll send you a code to reset your password.
            </p>
          </div>
        )}

        {step === "OTP" && (
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-white mb-2">Check Your Email</h1>
            <p className="text-xs text-white/50">
              We sent a 6-digit code to <strong className="text-white/80">{email}</strong>.
            </p>
          </div>
        )}

        {step === "SUCCESS" && (
          <div className="text-center mb-6 flex flex-col items-center">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Password Reset!</h1>
            <p className="text-xs text-white/50">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <Link
              href="/login"
              className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-bold text-xs flex items-center justify-center hover:opacity-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
            >
              Back to Sign In
            </Link>
          </div>
        )}

        {error && step !== "SUCCESS" && (
          <div className="mb-6 liquid-glass border border-red-500/30 text-red-300 rounded-xl p-3 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === "EMAIL" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seller@littlelyst.com"
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
              ) : (
                <>
                  Send Reset Code <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {step === "OTP" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">6-Digit Code</label>
              <div className="relative">
                <Key className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-colors font-mono tracking-widest"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
              ) : (
                <>
                  Reset Password <CheckCircle2 className="w-3.5 h-3.5" />
                </>
              )}
            </button>
            <div className="text-center mt-3">
               <button type="button" onClick={() => setStep("EMAIL")} className="text-[10px] text-white/40 hover:text-white">
                 Didn't get a code? Try again
               </button>
            </div>
          </form>
        )}

        {step !== "SUCCESS" && (
          <div className="mt-6 text-center text-xs text-white/50">
            Remembered your password?{" "}
            <Link href="/login" className="text-emerald-400 hover:underline font-semibold">
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
