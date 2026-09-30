"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";
import { motion } from "motion/react";
import {
  ShoppingBag,
  RefreshCw,
  Search,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  User,
  Mail,
  Phone,
  Truck,
  PackageCheck,
  XCircle,
  Bell,
  RotateCcw,
  FileText,
} from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ReceiptModal, ReceiptData } from "@/components/ui/receipt-modal";

interface OrderItem {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  productTitle: string;
  productType?: "PHYSICAL" | "DIGITAL";
  quantity: number;
  totalMinor: string;
  sellerNetMinor: string;
  platformFeeMinor: string;
  status: "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "FAILED" | "REFUNDED";
  paymentMethod?: "PAYSTACK" | "PAY_ON_DELIVERY" | string;
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
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);
      const res = await apiClient<OrderItem[]>("/api/orders");
      if (res.data) {
        setOrders(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load seller orders:", err);
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (user?.role === "buyer") {
      router.push("/buyer");
      return;
    }
    fetchOrders();

    // Real-time background update every 10s for orders & top KPI cards
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [user, router]);

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "FAILED" | "REFUNDED",
  ) => {
    try {
      setUpdatingId(orderId);
      const res = await apiClient<{ status: string; data: OrderItem }>(
        `/api/orders/${orderId}/status`,
        {
          method: "POST",
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (res.data) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
        toast({
          title: `Order marked as ${newStatus.toLowerCase()}`,
          variant: "default",
        });
      }
    } catch (err: any) {
      toast({
        title: err.message || "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendReminder = async (orderId: string) => {
    try {
      setRemindingId(orderId);
      await apiClient(`/api/orders/${orderId}/remind`, { method: "POST" });
      toast({ title: "Payment reminder sent to buyer", variant: "default" });
    } catch (err: any) {
      toast({
        title: err.message || "Failed to send reminder",
        variant: "destructive",
      });
    } finally {
      setRemindingId(null);
    }
  };

  const formatNaira = (minor: string | number) => {
    const num = Number(minor) / 100;
    return `₦${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
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
      (o.buyerPhone || "").toLowerCase().includes(q) ||
      o.paystackReference.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL" ? true : o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Use Number not BigInt to avoid serialization errors
  const totalPaidRevenue = orders
    .filter((o) => o.status === "PAID" || o.status === "FULFILLED")
    .reduce((acc, curr) => acc + Number(curr.sellerNetMinor || curr.totalMinor), 0);

  const totalPaidOrders = orders.filter(
    (o) => o.status === "PAID" || o.status === "FULFILLED",
  ).length;

  if (loading) {
    return (
      <LoadingScreen
        message="Loading store orders..."
        subMessage="Fetching buyer payments and fulfillment tracking"
      />
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-xs text-white/50 hover:text-white flex items-center gap-1 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Store Orders &amp; Receipts
          </h1>
          <p className="text-xs sm:text-sm text-white/50">
            Real-time sales, buyer contacts, and Paystack settlement statuses.
          </p>
        </div>
        <button
          onClick={() => fetchOrders()}
          disabled={refreshing}
          className="liquid-glass-button p-2.5 rounded-xl text-white/70 hover:text-white cursor-pointer self-start sm:self-auto"
          title="Refresh Orders"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-1.5 border border-white/10">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Net Revenue</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {formatNaira(totalPaidRevenue)}
          </p>
          <span className="text-[10px] text-emerald-400 font-mono">Settled to bank</span>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-1.5 border border-white/10">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Paid Orders</span>
            <ShoppingBag className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{totalPaidOrders}</p>
          <span className="text-[10px] text-white/40 font-mono">Paid + Delivered</span>
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
            {orders.length > 0
              ? `${Math.round((totalPaidOrders / orders.length) * 100)}%`
              : "0%"}
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
            placeholder="Search by buyer, product, email, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center bg-black/60 border border-white/10 p-1 rounded-xl gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: "ALL", label: "All" },
            { id: "PAID", label: "Paid" },
            { id: "FULFILLED", label: "Delivered" },
            { id: "PENDING", label: "Pending" },
            { id: "CANCELLED", label: "Cancelled" },
            { id: "REFUNDED", label: "Refunded" },
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

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="liquid-glass-card rounded-2xl p-12 text-center space-y-3 border border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No orders found</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            {searchQuery
              ? "No orders match your search query."
              : "When customers buy products from your store link, their orders appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isFulfilled = order.status === "FULFILLED";
            const isPaid = order.status === "PAID";
            const isPending = order.status === "PENDING";
            const isCancelled = order.status === "CANCELLED";
            const isPhysical = !order.productType || order.productType === "PHYSICAL";
            const isUpdating = updatingId === order.id;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-white/20 transition-all space-y-3.5"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
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
                        <XCircle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          {order.productTitle}
                        </h4>
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
                        {order.productType && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border border-white/10 text-white/30">
                            {order.productType}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/40 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="font-mono">Ref: {order.paystackReference}</span>
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
                        <span className="text-white/20">·</span>
                        <span>
                          {new Date(order.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Amount + Action buttons */}
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <span className="text-base font-black text-emerald-400">
                      {formatNaira(order.sellerNetMinor || order.totalMinor)}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* View Receipt Button */}
                      <button
                        onClick={() =>
                          setSelectedReceipt({
                            ...order,
                            sellerName: user?.name,
                            sellerHandle: user?.handle,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/10 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="View Official Receipt"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Receipt</span>
                      </button>

                      {/* Mark Delivered — only for PHYSICAL products that are not already fulfilled */}
                      {isPhysical && !isFulfilled && !isCancelled && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "FULFILLED")}
                          disabled={isUpdating}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                          title="Mark as Delivered"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Mark Delivered</span>
                        </button>
                      )}

                      {/* Mark Paid — only for products where buyer selected pay on delivery */}
                      {isPending && order.paymentMethod === "PAY_ON_DELIVERY" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "PAID")}
                          disabled={isUpdating}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                          title="Mark as Paid"
                        >
                          Mark Paid
                        </button>
                      )}

                      {/* Send Reminder — only for PENDING orders */}
                      {isPending && (
                        <button
                          onClick={() => handleSendReminder(order.id)}
                          disabled={remindingId === order.id}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                          title="Send payment reminder email"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>
                            {remindingId === order.id ? "Sending…" : "Remind"}
                          </span>
                        </button>
                      )}

                      {/* Refund — available for successful payments (PAID or FULFILLED) */}
                      {(isPaid || isFulfilled) && order.status !== "REFUNDED" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "REFUNDED")}
                          disabled={isUpdating}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                          title="Refund this order"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Refund</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Customer Details Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-white/70">
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                    <User className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    <span className="truncate font-semibold text-white">
                      {order.buyerName}
                    </span>
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
                    {order.buyerPhone ? (
                      <a
                        href={`https://wa.me/${order.buyerPhone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate hover:text-emerald-400 transition-colors font-mono"
                      >
                        {order.buyerPhone}
                      </a>
                    ) : (
                      <span className="text-white/30 italic">No phone</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}
