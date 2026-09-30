"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  PackageCheck,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  Copy,
  Check,
  UserCheck,
  Store,
  MapPin,
  Calendar,
  Sparkles,
  FileText,
} from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ReceiptModal, ReceiptData } from "@/components/ui/receipt-modal";

interface BuyerOrder {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string | null;
  buyerAddress?: string | null;
  productTitle: string;
  productType: string;
  images?: string[] | null;
  digitalFileUrl?: string | null;
  digitalKeyOrNote?: string | null;
  sellerName: string;
  sellerHandle: string;
  quantity: number;
  totalMinor: string;
  status: "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "FAILED";
  paystackReference: string;
  paidAt?: string | null;
  createdAt: string;
}

export default function BuyerDashboardPage() {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
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

  const fetchPurchases = async () => {
    try {
      setRefreshing(true);
      const res = await apiClient<BuyerOrder[]>("/api/orders/my-purchases");
      if (res.data) {
        setOrders(res.data);
      }
    } catch (err: any) {
      console.warn("Failed to load buyer purchases:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const formatNaira = (minor: string | number) => {
    const num = Number(minor) / 100;
    return `₦${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleCopy = (ref: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(ref);
      setCopiedRef(ref);
      setTimeout(() => setCopiedRef(null), 2000);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.productTitle.toLowerCase().includes(q) ||
      o.sellerName.toLowerCase().includes(q) ||
      o.sellerHandle.toLowerCase().includes(q) ||
      o.paystackReference.toLowerCase().includes(q)
    );
  });

  const paidOrders = orders.filter((o) => o.status === "PAID" || o.status === "FULFILLED");
  const totalSpentMinor = paidOrders.reduce((sum, o) => sum + BigInt(o.totalMinor), 0n);

  if (loading) {
    return <LoadingScreen message="Loading your purchases..." subMessage="Fetching receipts and digital downloads" />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <section className="liquid-glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Shopper Account • No Storefront</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Welcome, {user?.name || "Shopper"}!
            </h1>
            <p className="text-xs text-white/60 max-w-xl leading-relaxed">
              Track all purchases you make across Littlelyst merchants. Your contact details are saved for 1-click checkout on all storefronts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={fetchPurchases}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Refresh Purchases"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-cyan-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/buyer/profile"
              className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <span>Auto-Fill Details</span>
            </Link>
            <button
              onClick={() => handleSwitchRole("seller")}
              disabled={switchingRole}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Start Selling</span>
            </button>
          </div>
        </div>

        {/* Shopper Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-[10px] font-mono uppercase text-white/40 block">
              Total Purchases
            </span>
            <span className="text-lg font-black text-white">
              {orders.length} Order{orders.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-[10px] font-mono uppercase text-white/40 block">
              Successful Payments
            </span>
            <span className="text-lg font-black text-emerald-400">
              {paidOrders.length} Completed
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono uppercase text-white/40 block">
              Total Spent
            </span>
            <span className="text-lg font-black text-cyan-400 font-mono">
              {formatNaira(totalSpentMinor.toString())}
            </span>
          </div>
        </div>
      </section>

      {/* Orders List Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Order History & Deliveries</h2>
          </div>

          {/* Search filter */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search product or seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
            <p className="text-xs text-white/50">Loading your purchase records...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="liquid-glass-card rounded-2xl p-12 text-center space-y-3 border border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No Purchases Found</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              When you buy items from Littlelyst stores using this account, your receipts and digital files will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isPaid = order.status === "PAID" || order.status === "FULFILLED";
              return (
                <div
                  key={order.id}
                  className="liquid-glass-subtle p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-all space-y-3.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      {order.images && order.images[0] ? (
                        <img
                          src={order.images[0]}
                          alt={order.productTitle}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 bg-black/50"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-white/30 shrink-0">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">
                          {order.productTitle}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <a
                            href={`/${order.sellerHandle}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <Store className="w-3 h-3" />
                            <span>@{order.sellerHandle}</span>
                          </a>
                          <span className="text-white/30 text-[10px]">•</span>
                          <span className="text-[10px] font-mono text-white/50 uppercase">
                            Qty: {order.quantity}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-white font-mono block">
                          {formatNaira(order.totalMinor)}
                        </span>
                        <span className="text-[10px] text-white/40">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border flex items-center gap-1 ${
                          order.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : order.status === "FULFILLED"
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                            : order.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {order.status === "PAID" || order.status === "FULFILLED" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{order.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Delivery & Digital Download Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      {order.buyerAddress && (
                        <div className="flex items-center gap-1.5 text-white/70">
                          <MapPin className="w-3.5 h-3.5 text-white/40 shrink-0" />
                          <span>Delivery: {order.buyerAddress}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-white/50 font-mono text-[11px]">
                        <span>Ref: {order.paystackReference}</span>
                        <button
                          onClick={() => handleCopy(order.paystackReference)}
                          className="hover:text-white cursor-pointer"
                          title="Copy Payment Reference"
                        >
                          {copiedRef === order.paystackReference ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Action buttons (Receipt, Digital Download, Store visit) */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedReceipt(order)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Receipt</span>
                      </button>

                      {isPaid && order.digitalFileUrl && (
                        <a
                          href={order.digitalFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Files</span>
                        </a>
                      )}

                      {isPaid && order.digitalKeyOrNote && (
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/80 font-mono">
                          Access Key: <strong className="text-cyan-400">{order.digitalKeyOrNote}</strong>
                        </div>
                      )}

                      <a
                        href={`/${order.sellerHandle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-xs flex items-center gap-1 transition-all"
                      >
                        <span>Visit Store</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Receipt Modal */}
      <ReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}
