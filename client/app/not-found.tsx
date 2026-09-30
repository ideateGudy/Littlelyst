import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 text-center">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-2 flex items-center justify-center">
          <Logo size="lg" className="opacity-90 hover:opacity-100 transition-opacity" />
        </Link>

        {/* 404 */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[80px] font-black text-white/[0.06] leading-none tracking-tighter select-none">
            404
          </span>
          <h1 className="text-xl font-extrabold text-white -mt-4 tracking-tight">
            Page not found
          </h1>
          <p className="text-sm text-white/40 mt-1 leading-relaxed">
            This link doesn&apos;t exist or the store has moved.
            <br />
            Double-check the URL or head back home.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2 w-full">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-extrabold text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:opacity-90 transition-all text-center"
          >
            Go Home
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-semibold text-sm transition-all text-center"
          >
            Sign In
          </Link>
        </div>

        {/* Branding */}
        <p className="text-[11px] text-white/20 mt-4">
          Powered by{" "}
          <span className="text-emerald-500/60 font-semibold">Littlelyst</span>
        </p>
      </div>
    </div>
  );
}
