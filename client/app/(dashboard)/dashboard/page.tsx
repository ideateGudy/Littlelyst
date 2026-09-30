"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  PlusCircle,
  ArrowUpRight,
  RefreshCw,
  Eye,
  TrendingUp,
  Share2,
  Tag,
  DollarSign,
  Copy,
  Check,
  Sparkles,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  Settings,
  Camera,
  Upload,
  Store,
  Layers,
  Clock,
} from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface ProductItem {
  id: string;
  title: string;
  priceMinor: string;
  slug: string;
  description?: string | null;
  productType: string;
  images: string[];
  stockQuantity: number;
  visibility: string;
  activePromotion?: any;
}

interface DailyTrend {
  date: string;
  dayName: string;
  revenueMinor: string;
  orders: number;
}

interface AnalyticsData {
  totalRevenueMinor: string;
  totalOrders: number;
  totalViews: number;
  conversionRate: string;
  dailyTrends?: DailyTrend[];
  trafficSources: Array<{ source: string; count: number }>;
  salesBySource: Array<{ source: string; revenueMinor: string; orders: number }>;
  recentSales: Array<any>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedGbp, setCopiedGbp] = useState(false);

  // Active / Inactive Tab Filter ('ALL' | 'PUBLIC' | 'DRAFT')
  const [productTab, setProductTab] = useState<"ALL" | "PUBLIC" | "DRAFT">("ALL");

  // Edit Handle State
  const [editingHandle, setEditingHandle] = useState(false);
  const [newHandle, setNewHandle] = useState("");
  const [handleSaving, setHandleSaving] = useState(false);
  const [handleError, setHandleError] = useState("");

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriceNaira, setEditPriceNaira] = useState<number | "">("");
  const [editDescription, setEditDescription] = useState("");
  const [editStock, setEditStock] = useState<number>(1);
  const [editVisibility, setEditVisibility] = useState<string>("PUBLIC");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Edit Store Details & Profile Picture Modal State
  const [editingStoreModal, setEditingStoreModal] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeBio, setStoreBio] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAvatarUrl, setStoreAvatarUrl] = useState("");
  const [storeReminderTemplate, setStoreReminderTemplate] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeError, setStoreError] = useState("");
  const [storeSuccess, setStoreSuccess] = useState(false);

  const openStoreModal = () => {
    setStoreName(user?.name || "");
    setStoreBio(user?.bio || "");
    setStorePhone(user?.phone || "");
    setStoreAvatarUrl(user?.avatarUrl || "");
    setStoreReminderTemplate(user?.reminderEmailTemplate || "");
    setStoreError("");
    setStoreSuccess(false);
    setEditingStoreModal(true);
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAvatarUploading(true);
      setStoreError("");
      const url = await uploadToCloudinary(file);
      setStoreAvatarUrl(url);
    } catch (err: any) {
      setStoreError(err.message || "Failed to upload store profile photo");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setStoreError("Store name cannot be empty");
      return;
    }

    setStoreSaving(true);
    setStoreError("");

    try {
      const res = await apiClient<{ status: string; user: any; message?: string }>("/api/auth/profile", {
        method: "POST",
        body: JSON.stringify({
          name: storeName.trim(),
          bio: storeBio.trim() || undefined,
          phone: storePhone.trim() || undefined,
          avatarUrl: storeAvatarUrl || undefined,
          reminderEmailTemplate: storeReminderTemplate.trim() || undefined,
        }),
      });

      if (res.user) {
        updateUser(res.user);
        setStoreSuccess(true);
        setTimeout(() => {
          setEditingStoreModal(false);
          setStoreSuccess(false);
        }, 1200);
      }
    } catch (err: any) {
      setStoreError(err.message || "Failed to update store details");
    } finally {
      setStoreSaving(false);
    }
  };

  // Delete Product Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Toggle Visibility (Active / Inactive)
  const toggleVisibility = async (prod: ProductItem) => {
    const nextVis = prod.visibility === "PUBLIC" ? "DRAFT" : "PUBLIC";
    try {
      const res = await apiClient<ProductItem>(`/api/products/${prod.id}`, {
        method: "PUT",
        body: JSON.stringify({ visibility: nextVis }),
      });
      if (res.data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, visibility: nextVis } : p))
        );
      }
    } catch (err: any) {
      alert(err.message || "Failed to toggle product status");
    }
  };

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      // 1. Fetch seller's products
      try {
        const prodRes = await apiClient<ProductItem[]>("/api/products");
        if (prodRes.data) {
          setProducts(prodRes.data);
        }
      } catch (err) {
        console.warn("Could not fetch products:", err);
      }

      // 2. Fetch Analytics
      try {
        const analyticsRes = await apiClient<AnalyticsData>("/api/analytics/dashboard");
        if (analyticsRes.data) {
          setAnalytics(analyticsRes.data);
        }
      } catch (err) {
        console.warn("Could not fetch analytics:", err);
      }
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
    fetchDashboardData();
  }, [user, router]);

  const handleStartEditHandle = () => {
    setNewHandle(user?.handle || "");
    setHandleError("");
    setEditingHandle(true);
  };

  const handleSaveHandle = async () => {
    if (!newHandle.trim()) {
      setHandleError("Handle cannot be empty");
      return;
    }
    const cleanHandle = newHandle.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
    setHandleSaving(true);
    setHandleError("");

    try {
      const res = await apiClient<{ status: string; user: any; message?: string }>("/api/auth/profile", {
        method: "POST",
        body: JSON.stringify({ handle: cleanHandle }),
      });

      if (res.user) {
        updateUser({ handle: res.user.handle });
        setEditingHandle(false);
      }
    } catch (err: any) {
      setHandleError(err.message || "Failed to update catalogue link");
    } finally {
      setHandleSaving(false);
    }
  };

  // Open Edit Product Modal
  const openEditModal = (prod: ProductItem) => {
    setEditingProduct(prod);
    setEditTitle(prod.title);
    setEditPriceNaira(Number(prod.priceMinor) / 100);
    setEditDescription(prod.description || "");
    setEditStock(prod.stockQuantity);
    setEditVisibility(prod.visibility || "PUBLIC");
    setEditError("");
  };

  // Submit Product Update (PUT /api/products/:id)
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editTitle.trim()) {
      setEditError("Product title is required.");
      return;
    }

    if (!editPriceNaira || Number(editPriceNaira) <= 0) {
      setEditError("Please specify a valid price.");
      return;
    }

    setEditSaving(true);
    setEditError("");

    try {
      const priceMinor = Math.round(Number(editPriceNaira) * 100);
      const res = await apiClient<ProductItem>(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editTitle.trim(),
          priceMinor,
          description: editDescription.trim() || undefined,
          stockQuantity: Number(editStock),
          visibility: editVisibility,
        }),
      });

      if (res.data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...res.data } : p))
        );
        setEditingProduct(null);
      }
    } catch (err: any) {
      setEditError(err.message || "Failed to update product.");
    } finally {
      setEditSaving(false);
    }
  };

  // Delete Product (DELETE /api/products/:id)
  const handleDeleteProduct = async (id: string) => {
    setIsDeleting(true);
    try {
      await apiClient(`/api/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeletingId(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatNaira = (minor: string | number | bigint) => {
    const num = typeof minor === "string" ? Number(minor) : Number(minor);
    const value = num / 100;
    return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const catalogueUrl = typeof window !== "undefined" && user?.handle
    ? `${window.location.origin}/${user.handle}`
    : `https://littlelyst.com/${user?.handle || "store"}`;

  const gbpTrackedUrl = `${catalogueUrl}?utm_source=gbp`;

  const copyCatalogueLink = () => {
    navigator.clipboard.writeText(catalogueUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyGbpLink = () => {
    navigator.clipboard.writeText(gbpTrackedUrl);
    setCopiedGbp(true);
    setTimeout(() => setCopiedGbp(false), 2000);
  };

  if (loading) {
    return <LoadingScreen message="Syncing catalogue & metrics..." subMessage="Fetching your products, orders, and sales trends" />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Greeting & Store Link Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono uppercase text-emerald-400 font-semibold tracking-wider">
              Live Catalogue
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {user?.name ? `${user.name}'s Littlelyst` : "Seller Dashboard"}
          </h1>
          <p className="text-xs sm:text-sm text-white/50">
            Share your link on WhatsApp, Instagram, or Google Business Profile to get paid.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="liquid-glass-button p-2.5 rounded-xl text-white/70 hover:text-white cursor-pointer"
            title="Refresh Store"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={openStoreModal}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Update Store Details & Logo"
          >
            <Store className="w-4 h-4 text-emerald-400" />
            <span>Edit Store Details</span>
          </button>

          <Link
            href="/dashboard/new"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:opacity-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Shareable Store Link */}
      {user?.handle && (
        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-500/20 bg-emerald-950/10">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Your Public Storefront Link</span>
              {!editingHandle && (
                <button
                  onClick={handleStartEditHandle}
                  className="text-[11px] text-white/50 hover:text-emerald-400 flex items-center gap-1 ml-2 underline cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Edit Link
                </button>
              )}
            </div>

            {editingHandle ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex items-center">
                    <span className="text-xs font-mono text-white/50 pl-3">lyst.me/</span>
                    <input
                      type="text"
                      value={newHandle}
                      onChange={(e) => setNewHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                      className="bg-black/80 border border-emerald-400/60 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-400 focus:outline-none"
                      placeholder="new-handle"
                    />
                  </div>
                  <button
                    onClick={handleSaveHandle}
                    disabled={handleSaving}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
                  >
                    {handleSaving ? "Saving..." : "Save Link"}
                  </button>
                  <button
                    onClick={() => setEditingHandle(false)}
                    className="p-1.5 rounded-lg text-white/50 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {handleError && (
                  <p className="text-[11px] text-rose-400">{handleError}</p>
                )}
              </div>
            ) : (
              <p className="text-sm font-mono text-white font-bold break-all">
                {catalogueUrl}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={copyCatalogueLink}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Copied!" : "Copy WhatsApp Link"}</span>
            </button>

            <button
              onClick={copyGbpLink}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-white/10 hover:border-emerald-500/40 text-white/80 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Includes ?utm_source=gbp for Google Business Profile"
            >
              {copiedGbp ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedGbp ? "Copied GBP Link!" : "Copy GBP Link"}</span>
            </button>

            <a
              href={`/${user.handle}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl liquid-glass-button text-xs font-semibold text-emerald-400 flex items-center gap-1"
            >
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Analytics KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-2 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Net Sales</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {formatNaira(analytics?.totalRevenueMinor || "0")}
          </p>
          <span className="text-[10px] text-emerald-400 font-mono">Paid via Paystack</span>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-2 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Orders</span>
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {analytics?.totalOrders ?? 0}
          </p>
          <span className="text-[10px] text-white/40 font-mono">Zero buyer accounts</span>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-2 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Total Views</span>
            <Eye className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {analytics?.totalViews ?? 0}
          </p>
          <span className="text-[10px] text-white/40 font-mono">WhatsApp & Social clicks</span>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-2 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Conversion</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {analytics?.conversionRate ?? "0.0%"}
          </p>
          <span className="text-[10px] text-emerald-400 font-mono">Views to Purchases</span>
        </div>
      </div>

      {/* Visual Revenue & Traffic Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 7-Day Performance & Revenue Bar Chart */}
        <div className="lg:col-span-2 liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Sales & Revenue Activity
              </h3>
              <p className="text-xs text-white/40">Daily merchant revenue performance</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Last 7 Days
            </span>
          </div>

          {/* Bar Chart Visualization */}
          {(() => {
            // Build 7 days array
            const days: { label: string; dateStr: string; revNaira: number; orders: number }[] = [];
            for (let i = 6; i >= 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              const dateStr = d.toISOString().split("T")[0];
              const label = d.toLocaleDateString("en-US", { weekday: "short" });
              const found = analytics?.dailyTrends?.find((t) => t.date === dateStr);
              const revNaira = found ? Number(found.revenueMinor) / 100 : 0;
              const orders = found ? found.orders : 0;
              days.push({ label, dateStr, revNaira, orders });
            }

            const maxRev = Math.max(...days.map((d) => d.revNaira), 5000);

            return (
              <div className="space-y-3 pt-2">
                <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6 pb-2 border-b border-white/10 relative">
                  {/* Subtle Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                    <div className="border-b border-white w-full" />
                    <div className="border-b border-white w-full" />
                    <div className="border-b border-white w-full" />
                  </div>

                  {days.map((day, idx) => {
                    const heightPercent = maxRev > 0 ? Math.max((day.revNaira / maxRev) * 100, 4) : 4;
                    const hasSales = day.revNaira > 0;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative z-10 h-full justify-end">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-black/90 text-white text-[10px] font-mono px-2 py-1 rounded-md border border-white/15 pointer-events-none whitespace-nowrap shadow-lg">
                          ₦{day.revNaira.toLocaleString()} ({day.orders} orders)
                        </div>

                        {/* Bar */}
                        <div className="w-full max-w-[36px] bg-white/5 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercent}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.05 }}
                            className={`w-full rounded-t-lg transition-colors ${
                              hasSales
                                ? "bg-gradient-to-t from-emerald-500 to-teal-400 group-hover:from-emerald-400 group-hover:to-teal-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                : "bg-white/10 group-hover:bg-white/20"
                            }`}
                          />
                        </div>

                        <span className="text-[10px] font-mono text-white/50 group-hover:text-white">
                          {day.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                  <span>Baseline: ₦0</span>
                  <span>Peak: ₦{maxRev.toLocaleString()}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Traffic Channels Breakdown */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-cyan-400" />
              Traffic Sources
            </h3>
            <p className="text-xs text-white/40">Buyer click channels</p>
          </div>

          <div className="space-y-3 my-auto">
            {(() => {
              const totalClicks = (analytics?.trafficSources || []).reduce((acc, t) => acc + t.count, 0) || 1;
              const channels = [
                { id: "whatsapp", label: "WhatsApp Direct", color: "bg-emerald-400", bg: "bg-emerald-500/20" },
                { id: "instagram", label: "Instagram Bio", color: "bg-pink-400", bg: "bg-pink-500/20" },
                { id: "gbp", label: "Google Business", color: "bg-cyan-400", bg: "bg-cyan-500/20" },
                { id: "direct", label: "Direct / QR Code", color: "bg-white/60", bg: "bg-white/10" },
              ];

              return channels.map((c) => {
                const item = analytics?.trafficSources.find((s) => s.source === c.id);
                const count = item ? item.count : 0;
                const percent = Math.round((count / totalClicks) * 100);

                return (
                  <div key={c.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/80 font-medium flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${c.color}`} />
                        {c.label}
                      </span>
                      <span className="text-white/50 font-mono text-[11px]">{count} ({percent}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          <div className="pt-2 border-t border-white/10 text-[11px] text-white/40 flex items-center justify-between">
            <span>Customer Conversion</span>
            <span className="text-emerald-400 font-bold">{analytics?.conversionRate || "0.0%"}</span>
          </div>
        </div>
      </div>

      {/* Products Section with Active / Inactive Tabs & Quick Toggles */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Catalogue Products ({products.length})
            </h2>
            <p className="text-xs text-white/50">
              Manage live storefront items, draft listings, pricing, and stock.
            </p>
          </div>

          {/* Active / Inactive Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10 self-start sm:self-auto">
            <button
              onClick={() => setProductTab("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                productTab === "ALL" ? "bg-white/15 text-white shadow-sm" : "text-white/50 hover:text-white"
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setProductTab("PUBLIC")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                productTab === "PUBLIC" ? "bg-emerald-500/20 text-emerald-400" : "text-white/50 hover:text-white"
              }`}
            >
              Active ({products.filter((p) => p.visibility === "PUBLIC").length})
            </button>
            <button
              onClick={() => setProductTab("DRAFT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                productTab === "DRAFT" ? "bg-amber-500/20 text-amber-400" : "text-white/50 hover:text-white"
              }`}
            >
              Inactive / Draft ({products.filter((p) => p.visibility !== "PUBLIC").length})
            </button>
          </div>
        </div>

        {(() => {
          const displayedProducts = products.filter((p) => {
            if (productTab === "PUBLIC") return p.visibility === "PUBLIC";
            if (productTab === "DRAFT") return p.visibility !== "PUBLIC";
            return true;
          });

          return loading ? (
            <div className="text-center py-12 text-white/40 text-xs">
              Loading catalogue products...
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="liquid-glass-card rounded-2xl p-8 text-center space-y-4 border border-dashed border-white/15">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  {productTab === "ALL"
                    ? "No products in your catalogue yet"
                    : `No ${productTab.toLowerCase()} products found`}
                </h3>
                <p className="text-xs text-white/50 max-w-sm mx-auto">
                  {productTab === "ALL"
                    ? "Snap an item or upload a digital file to start sharing your Littlelyst link on WhatsApp Status."
                    : `You do not have any items marked as ${productTab.toLowerCase()}.`}
                </p>
              </div>
              {productTab === "ALL" && (
                <Link
                  href="/dashboard/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Your First Product
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedProducts.map((item) => {
                const isActive = item.visibility === "PUBLIC";
                const originalPriceMinor = Number(item.priceMinor);
                const promoPriceMinor = item.activePromotion ? Number(item.activePromotion.discountedPriceMinor) : null;
                const activePriceMinor = promoPriceMinor || originalPriceMinor;

                return (
                  <div
                    key={item.id}
                    className={`liquid-glass-card rounded-2xl overflow-hidden border transition-all flex flex-col group ${
                      isActive
                        ? "border-[var(--border-glass)] hover:border-emerald-500/40 shadow-sm hover:shadow-md"
                        : "border-[var(--border-glass)] opacity-75 hover:opacity-100 bg-black/5 dark:bg-white/[0.02]"
                    }`}
                  >
                    {/* Product Image Area with High-Contrast Protected Capsule Badges & Actions */}
                    <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-black/60 relative overflow-hidden">
                      {item.images && item.images[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-white/20">
                          <ShoppingBag className="w-10 h-10" />
                        </div>
                      )}

                      {/* Top Badges: Product Type + Visibility Status */}
                      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
                        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-900/90 dark:bg-slate-950/90 text-white border border-white/20 shadow-md backdrop-blur-md uppercase tracking-wider font-semibold">
                          {item.productType}
                        </span>

                        <button
                          onClick={() => toggleVisibility(item)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all border shadow-md backdrop-blur-md flex items-center gap-1 ${
                            isActive
                              ? "bg-slate-900/90 dark:bg-slate-950/90 text-emerald-400 border-emerald-500/40 hover:bg-slate-900"
                              : "bg-slate-900/90 dark:bg-slate-950/90 text-amber-300 border-amber-500/40 hover:bg-slate-900"
                          }`}
                          title="Click to toggle Active / Draft"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                          <span>{isActive ? "Live Store" : "Draft"}</span>
                        </button>
                      </div>

                      {/* Top Action Buttons (Protected high-contrast dark pills for 100% visibility on white & colored images) */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-xl bg-slate-900/90 dark:bg-slate-950/90 hover:bg-emerald-500 text-white hover:text-black border border-white/20 shadow-md backdrop-blur-md transition-all cursor-pointer"
                          title="Edit Product Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="p-2 rounded-xl bg-slate-900/90 dark:bg-slate-950/90 hover:bg-rose-600 text-white hover:text-white border border-white/20 shadow-md backdrop-blur-md transition-all cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Multiple Photos indicator */}
                      {item.images && item.images.length > 1 && (
                        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-slate-900/90 dark:bg-slate-950/90 text-white text-[10px] font-mono border border-white/20 shadow-md backdrop-blur-sm">
                          {item.images.length} photos
                        </div>
                      )}
                    </div>

                    {/* Card Content & Details Section */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                      <div className="space-y-2">
                        {/* Countdown Timer in Card Content flow if promo is active */}
                        {item.activePromotion &&
                          item.activePromotion.isActive !== false &&
                          new Date(item.activePromotion.endAt).getTime() > Date.now() && (
                            <div className="flex items-center gap-2">
                              <CountdownTimer targetDate={item.activePromotion.endAt} />
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 uppercase tracking-wide">
                                Flash Sale
                              </span>
                            </div>
                          )}

                        <h3 className="text-base font-extrabold text-[var(--foreground)] line-clamp-1 group-hover:text-emerald-500 transition-colors">
                          {item.title}
                        </h3>

                        {item.description && (
                          <p className="text-xs text-slate-700 dark:text-white/60 line-clamp-2 leading-relaxed font-normal">
                            {item.description}
                          </p>
                        )}

                        {/* Price & Stock Display */}
                        <div className="flex items-baseline justify-between pt-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                              {formatNaira(activePriceMinor)}
                            </span>
                            {promoPriceMinor && promoPriceMinor < originalPriceMinor && (
                              <span className="text-xs text-slate-400 line-through font-mono">
                                {formatNaira(originalPriceMinor)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-white/50">
                            {item.productType === "PHYSICAL" ? (
                              <span className={`px-2 py-0.5 rounded font-semibold ${item.stockQuantity > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-500"}`}>
                                {item.stockQuantity > 0 ? `${item.stockQuantity} in stock` : "Out of Stock"}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold">
                                Instant Digital
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Bar with explicit light/dark background and borders */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-glass)]">
                        <button
                          onClick={() => toggleVisibility(item)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isActive
                              ? "bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-500/20 shadow-xs"
                              : "bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-500/20 shadow-xs"
                          }`}
                        >
                          {isActive ? "Deactivate" : "Publish Live"}
                        </button>

                        {user?.handle && (
                          <a
                            href={`/${user.handle}/products/${item.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-emerald-500/15 text-slate-800 dark:bg-white/5 dark:hover:bg-emerald-500/15 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-300/60 dark:border-white/10 transition-all shadow-xs hover:border-emerald-500/40"
                          >
                            <span>Preview</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProduct(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 space-y-4 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  Edit Product Details
                </h3>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="text-white/40 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/80">Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/80">Price (₦)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editPriceNaira}
                      onChange={(e) => setEditPriceNaira(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/80">Visibility</label>
                    <select
                      value={editVisibility}
                      onChange={(e) => setEditVisibility(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    >
                      <option value="PUBLIC">PUBLIC (Live)</option>
                      <option value="DRAFT">DRAFT (Hidden)</option>
                    </select>
                  </div>
                </div>

                {editingProduct.productType === "PHYSICAL" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/80">Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={editStock}
                      onChange={(e) => setEditStock(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/80">Description</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Product specs, features, condition..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                {editError && <p className="text-xs text-rose-400 font-semibold">{editError}</p>}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    {editSaving ? "Saving..." : "Update Product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 text-center space-y-4 shadow-2xl z-10"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Delete Product?</h3>
                <p className="text-xs text-white/50">
                  This item will be permanently removed from your Littlelyst storefront link.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProduct(deletingId)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete Item"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Store Details & Profile Picture Modal */}
      <AnimatePresence>
        {editingStoreModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingStoreModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 space-y-4 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Edit Store Details</h3>
                    <p className="text-[11px] text-white/50">Update store brand, profile pic & bio</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingStoreModal(false)}
                  className="p-1 rounded-lg text-white/40 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {storeSuccess ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Store Updated!</h4>
                  <p className="text-xs text-white/50">Your storefront changes are live immediately.</p>
                </div>
              ) : (
                <form onSubmit={handleSaveStoreProfile} className="space-y-4">
                  {/* Store Profile Picture / Avatar */}
                  <div className="space-y-2 text-center pb-2">
                    <div className="relative inline-block mx-auto group">
                      <div className="w-20 h-20 rounded-full bg-black/60 border-2 border-emerald-500/40 overflow-hidden flex items-center justify-center">
                        {storeAvatarUrl ? (
                          <img
                            src={storeAvatarUrl}
                            alt="Store avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="w-8 h-8 text-white/30" />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-500 text-black hover:bg-emerald-400 transition-colors shadow-lg cursor-pointer">
                        <Camera className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Store Logo / Profile Picture</p>
                      <p className="text-[11px] text-white/40">
                        {avatarUploading ? "Uploading image..." : "PNG, JPG or WebP (max 5MB)"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/80">Store / Business Name *</label>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Chioma's Luxury Boutique"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/80">Store Bio / Description</label>
                    <textarea
                      rows={3}
                      value={storeBio}
                      onChange={(e) => setStoreBio(e.target.value)}
                      placeholder="Brief bio about what you sell, dispatch location, or return policy..."
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/80">WhatsApp Contact Number</label>
                    <input
                      type="tel"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="+234 801 234 5678"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-white/80">Abandoned Checkout Email Template</label>
                      <span className="text-[10px] text-emerald-400 font-mono">Dynamic</span>
                    </div>
                    <textarea
                      rows={3}
                      value={storeReminderTemplate}
                      onChange={(e) => setStoreReminderTemplate(e.target.value)}
                      placeholder="Hi {buyerName}, we noticed you didn't finish checking out {productTitle}. Complete your order here: {storeLink}"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none leading-relaxed"
                    />
                    <p className="text-[10px] text-white/40">
                      Use tags: <code className="text-emerald-400 font-mono">{"{buyerName}"}</code>, <code className="text-emerald-400 font-mono">{"{productTitle}"}</code>, <code className="text-emerald-400 font-mono">{"{storeLink}"}</code>
                    </p>
                  </div>

                  {storeError && <p className="text-xs text-rose-400 font-semibold">{storeError}</p>}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingStoreModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={storeSaving || avatarUploading}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold cursor-pointer disabled:opacity-50"
                    >
                      {storeSaving ? "Saving..." : "Save Store Details"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
