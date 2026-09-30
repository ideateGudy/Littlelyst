"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  Share2,
  Check,
  Copy,
  Download,
  ShoppingBag,
  Store,
  CheckCircle2,
  Calendar,
  FileText,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

export interface ReceiptData {
  id: string;
  paystackReference: string;
  productTitle: string;
  quantity: number;
  totalMinor: string | number;
  subtotalMinor?: string | number;
  discountMinor?: string | number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string | null;
  buyerAddress?: string | null;
  sellerName?: string;
  sellerHandle?: string;
  status: string;
  paymentMethod?: string;
  paidAt?: string | null;
  createdAt: string;
}

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
}

export function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!receipt) return null;

  const formatNaira = (minor: string | number) => {
    const num = Number(minor) / 100;
    return `₦${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formattedDate = new Date(
    receipt.paidAt || receipt.createdAt
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleShare = async () => {
    const shareText = `Official Receipt #${receipt.paystackReference}\nItem: ${receipt.productTitle} (x${receipt.quantity})\nTotal: ${formatNaira(receipt.totalMinor)}\nMerchant: @${receipt.sellerHandle || "littlelyst"}\nStatus: ${receipt.status}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt #${receipt.paystackReference}`,
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0 text-white relative">
        {/* Printable Receipt Container */}
        <div className="p-6 sm:p-8 space-y-6 print:p-0 print:bg-white print:text-black">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 print:border-black/20">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Official Receipt
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition-colors print:hidden cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Receipt Status & Ref */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{receipt.status}</span>
            </div>
            <h2 className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
              {formatNaira(receipt.totalMinor)}
            </h2>
            <p className="text-xs text-white/50 font-mono">
              Ref: {receipt.paystackReference}
            </p>
          </div>

          {/* Details Table */}
          <div className="bg-black/40 rounded-2xl p-4 border border-white/10 space-y-3 text-xs">
            <div className="flex justify-between items-center text-white/60">
              <span>Date & Time</span>
              <span className="text-white font-mono">{formattedDate}</span>
            </div>

            {receipt.sellerHandle && (
              <div className="flex justify-between items-center text-white/60">
                <span>Merchant Store</span>
                <span className="text-emerald-400 font-bold">
                  @{receipt.sellerHandle}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-white/60">
              <span>Customer</span>
              <span className="text-white font-semibold">{receipt.buyerName}</span>
            </div>

            <div className="flex justify-between items-center text-white/60">
              <span>Customer Email</span>
              <span className="text-white font-mono">{receipt.buyerEmail}</span>
            </div>

            {receipt.paymentMethod && (
              <div className="flex justify-between items-center text-white/60">
                <span>Payment Channel</span>
                <span className="text-white uppercase font-mono">
                  {receipt.paymentMethod}
                </span>
              </div>
            )}
          </div>

          {/* Product Line Item */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <span className="text-[11px] font-mono text-white/40 uppercase tracking-wider block">
              Purchased Item
            </span>
            <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">
                  {receipt.productTitle}
                </h4>
                <span className="text-[10px] text-white/40 font-mono">
                  Quantity: {receipt.quantity}
                </span>
              </div>
              <span className="text-xs font-extrabold font-mono text-white">
                {formatNaira(receipt.totalMinor)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="bg-slate-950 p-4 border-t border-white/10 flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Download / Print</span>
          </button>

          <button
            onClick={handleShare}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied Receipt!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share Receipt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
