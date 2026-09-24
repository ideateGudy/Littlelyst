import { NewListingForm } from "./new-listing-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewListingPage() {
  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-xl mx-auto mb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors liquid-glass-subtle px-3 py-1.5 rounded-full"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>

      <main>
        <NewListingForm />
      </main>
    </div>
  );
}
