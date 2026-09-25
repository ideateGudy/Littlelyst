"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  RefreshCw,
  Search,
  ExternalLink,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  User,
  Mail,
  Phone,
  ArrowLeft,
  Calendar,
  Filter,
  Truck,
  PackageCheck,
  ChevronDown,
} from "lucide-react";

interface OrderItem {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  productTitle: string;
  quantity: number;
  totalMinor: string;
  sellerNetMinor: string;
  platformFeeMinor: string;
  status: "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "FAILED";
  trafficSource: string;
  paystackReference: string;
  paidAt?: string | null;
  createdAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const res = await apiClient<OrderItem[]>("/api/orders");
      if (res.data) {
        setOrders(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load seller orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === "buyer") {
      router.push("/buyer");
      return;
    }
    fetchOrders();
  }, [user, router]);

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "FAILED",
  ) => {
    try {
      setUpdatingId(orderId);
      const res = await apiClient<{ status: string; data: OrderItem }>(`/api/orders/${orderId}/status`, {
        method: "POST",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.data) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
      }
    } catch (err: any) {
      alert(err.message || "Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatNaira = (minor: string | number) => {
    const num = Number(minor) / 100;
    return `₦${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const copyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.productTitle.toLowerCase().includes(q) ||
      o.buyerName.toLowerCase().includes(q) ||
      o.buyerEmail.toLowerCase().includes(q) ||
      o.buyerPhone.toLowerCase().includes(q) ||
      o.paystackReference.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "PAID"
        ? o.status === "PAID"
        : statusFilter === "FULFILLED"
        ? o.status === "FULFILLED"
        : statusFilter === "PENDING"
        ? o.status === "PENDING"
        : statusFilter === "CANCELLED"
        ? o.status === "CANCELLED"
        : true;

    return matchesSearch && matchesStatus;
  });

  const totalPaidRevenue = orders
    .filter((o) => o.status === "PAID" || o.status === "FULFILLED")
    .reduce((acc, curr) => acc + BigInt(curr.sellerNetMinor || curr.totalMinor), 0n);

  const totalDeliveredOrders = orders.filter((o) => o.status === "FULFILLED").length;
  const totalPaidOrders = orders.filter((o) => o.status === "PAID" || o.status === "FULFILLED").length;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-xs text-white/50 hover:text-white flex items-center gap-1 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Store Orders & Receipts
          </h1>
          <p className="text-xs sm:text-sm text-white/50">
            Real-time sales, buyer contacts, and Paystack settlement statuses for your store.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            disabled={refreshing}
            className="liquid-glass-button p-2.5 rounded-xl text-white/70 hover:text-white cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-1.5 border border-white/10">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Total Sales Volume</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{formatNaira(totalPaidRevenue.toString())}</p>
          <span className="text-[10px] text-emerald-400 font-mono">Settled to bank</span>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-1.5 border border-white/10">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Successful Orders</span>
            <ShoppingBag className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{totalPaidOrders}</p>
          <span className="text-[10px] text-white/40 font-mono">Paid orders</span>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-1.5 border border-white/10">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>All Checkouts</span>
            <Clock className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{orders.length}</p>
          <span className="text-[10px] text-white/40 font-mono">Total initiated</span>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-1.5 border border-white/10">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Conversion Rate</span>
            <span className="text-emerald-400 font-bold text-xs">%</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {orders.length > 0 ? `${Math.round((totalPaidOrders / orders.length) * 100)}%` : "0%"}
          </p>
          <span className="text-[10px] text-white/40 font-mono">Initiation to payment</span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by buyer name, email, phone, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center bg-black/60 border border-white/10 p-1 rounded-xl gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: "ALL", label: "All Orders" },
            { id: "PAID", label: "Paid" },
            { id: "FULFILLED", label: "Delivered / Fulfilled" },
            { id: "PENDING", label: "Pending" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List / Table */}
      {loading ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-white/40 font-mono">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="liquid-glass-card rounded-2xl p-12 text-center space-y-3 border border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No orders found</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            {searchQuery
              ? "No orders match your search query."
              : "When customers buy products from your store link, their orders and payment details appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isFulfilled = order.status === "FULFILLED";
            const isPaid = order.status === "PAID";
            const isPending = order.status === "PENDING";
            const isCancelled = order.status === "CANCELLED";

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-white/20 transition-all space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isFulfilled
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          : isPaid
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : isCancelled
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {isFulfilled ? (
                        <PackageCheck className="w-5 h-5" />
                      ) : isPaid ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isCancelled ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{order.productTitle}</h4>
                        <span className="text-xs text-white/40">× {order.quantity}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            isFulfilled
                              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                              : isPaid
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : isCancelled
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          }`}
                        >
                          {isFulfilled ? "DELIVERED" : order.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/40 mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1 font-mono">
                          Ref: {order.paystackReference}
                        </span>
                        <button
                          onClick={() => copyReference(order.paystackReference)}
                          className="hover:text-emerald-400 transition-colors"
                          title="Copy Reference"
                        >
                          {copiedRef === order.paystackReference ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-left sm:text-right">
                      <span className="text-base font-black text-emerald-400">
                        {formatNaira(order.sellerNetMinor || order.totalMinor)}
                      </span>
                      <p className="text-[10px] text-white/40">
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Quick Fulfillment Status Dropdown / Action */}
                    <div className="flex items-center gap-1.5">
                      {order.status !== "FULFILLED" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "FULFILLED")}
                          disabled={updatingId === order.id}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                          title="Mark as Delivered / Fulfilled"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Mark Delivered</span>
                        </button>
                      )}

                      {order.status === "PENDING" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "PAID")}
                          disabled={updatingId === order.id}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                          title="Mark as Paid"
                        >
                          Mark Paid
                        </button>
                      )}

                      {order.status !== "CANCELLED" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                          disabled={updatingId === order.id}
                          className="px-2 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                          title="Cancel Order"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Customer Details Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-white/70 pt-0.5">
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                    <User className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    <span className="truncate font-semibold text-white">{order.buyerName}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                    <Mail className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    <a
                      href={`mailto:${order.buyerEmail}`}
                      className="truncate hover:text-emerald-400 transition-colors"
                    >
                      {order.buyerEmail}
                    </a>
                  </div>

                  <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                    <Phone className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    <a
                      href={`https://wa.me/${order.buyerPhone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate hover:text-emerald-400 transition-colors font-mono"
                    >
                      {order.buyerPhone}
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
