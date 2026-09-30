"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient } from "@/lib/api-client";
import { motion, AnimatePresence } from "motion/react";
import {
  Tag,
  Plus,
  ArrowLeft,
  Search,
  CheckCircle2,
  Package,
  X,
  Edit2,
  Trash2,
  Power,
} from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import toast from "react-hot-toast";

interface CouponItem {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "OVERRIDE_PRICE";
  discountValue: string;
  maxRedemptions: number;
  redemptionsCount: number;
  productId: string | null;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
}

interface ProductItem {
  id: string;
  title: string;
}

export default function CouponsDashboard() {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT" | "OVERRIDE_PRICE",
    discountValue: "",
    maxRedemptions: "",
    productId: "all",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchCouponsAndProducts = async () => {
    if (!user) return;
    try {
      setIsFetchingData(true);
      const [couponsRes, productsRes] = await Promise.all([
        apiClient<CouponItem[]>("/api/promotions/coupons"),
        apiClient<ProductItem[]>("/api/products"),
      ]);
      
      if (couponsRes.data) setCoupons(couponsRes.data);
      if (productsRes.data) setProducts(productsRes.data);
    } catch (err) {
      console.error("Failed to load data", err);
      toast.error("Failed to load coupons");
    } finally {
      setIsFetchingData(false);
    }
  };

  useEffect(() => {
    fetchCouponsAndProducts();
  }, [user]);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      discountType: "PERCENTAGE",
      discountValue: "",
      maxRedemptions: "",
      productId: "all",
    });
    setShowModal(true);
  };

  const openEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxRedemptions: coupon.maxRedemptions.toString(),
      productId: coupon.productId || "all",
    });
    setShowModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue || !formData.maxRedemptions) return;
    
    try {
      setSubmitting(true);
      
      const payload = {
        code: formData.code.toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue.replace(/,/g, "")),
        maxRedemptions: Number(formData.maxRedemptions),
        productId: formData.productId === "all" ? undefined : formData.productId,
      };

      if (editingCoupon) {
        const res = await apiClient<CouponItem>(`/api/promotions/coupons/${editingCoupon.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        if (res.data) {
          setCoupons(coupons.map(c => c.id === editingCoupon.id ? res.data! : c));
          setShowModal(false);
          toast.success("Coupon updated successfully!");
        } else {
          toast.error(res.message || "Failed to update coupon");
        }
      } else {
        const res = await apiClient<CouponItem>("/api/promotions/coupons", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (res.data) {
          setCoupons([res.data, ...coupons]);
          setShowModal(false);
          toast.success("Coupon created successfully!");
        } else {
          toast.error(res.message || "Failed to create coupon");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCoupon = async (coupon: CouponItem) => {
    try {
      const res = await apiClient<CouponItem>(`/api/promotions/coupons/${coupon.id}/toggle`, {
        method: "PUT",
      });
      if (res.data) {
        setCoupons(coupons.map(c => c.id === coupon.id ? res.data! : c));
        toast.success(`Coupon ${res.data.isActive ? "activated" : "deactivated"}`);
      }
    } catch (err: any) {
      toast.error("Failed to toggle coupon state");
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await apiClient(`/api/promotions/coupons/${id}`, { method: "DELETE" });
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success("Coupon deleted");
    } catch (err: any) {
      toast.error("Failed to delete coupon");
    }
  };

  if (loading || (isFetchingData && !coupons.length)) {
    return <LoadingScreen />;
  }

  const filteredCoupons = coupons.filter(c => c.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e4e2] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </button>
            <h1 className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-rose-500" />
              Coupons
            </h1>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-white text-black text-sm font-medium rounded-full flex items-center gap-2 hover:bg-white/90 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Coupon
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search coupon codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-rose-500/50 transition-colors"
          />
        </div>

        {/* Coupons List */}
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-20 border border-white/5 rounded-3xl bg-[#0a0a0a] flex flex-col items-center">
            <Tag className="w-12 h-12 text-white/20 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No coupons found</h3>
            <p className="text-white/60 mb-6 max-w-sm mx-auto">
              {search ? "No coupons match your search." : "You haven't created any discount codes yet."}
            </p>
            {!search && (
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-all cursor-pointer"
              >
                Create your first coupon
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors relative overflow-hidden group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-mono font-bold tracking-wider text-rose-400">
                          {coupon.code}
                        </h3>
                        {!coupon.isActive || coupon.redemptionsCount >= coupon.maxRedemptions ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/50 uppercase">Inactive</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase">Active</span>
                        )}
                      </div>
                      <p className="text-2xl font-semibold text-white">
                        {coupon.discountType === "PERCENTAGE" 
                          ? `${coupon.discountValue}% OFF` 
                          : `₦${Number(coupon.discountValue).toLocaleString()} OFF`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <Package className="w-4 h-4 text-white/40" />
                      <span>
                        {coupon.productId 
                          ? products.find(p => p.id === coupon.productId)?.title || "Specific Product" 
                          : "Store-wide"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <CheckCircle2 className="w-4 h-4 text-white/40" />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1 text-xs">
                          <span>{coupon.redemptionsCount} used</span>
                          <span>{coupon.maxRedemptions} max</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-rose-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (coupon.redemptionsCount / coupon.maxRedemptions) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleToggleCoupon(coupon)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      coupon.isActive 
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20" 
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{coupon.isActive ? "Deactivate" : "Activate"}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(coupon)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
                      title="Edit Coupon"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-rose-500" />
                </div>
                <h2 className="text-xl font-medium text-white">
                  {editingCoupon ? "Edit Coupon" : "Create Coupon"}
                </h2>
              </div>

              <form onSubmit={handleSaveCoupon} className="space-y-6">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Coupon Code</label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    placeholder="e.g. SUMMER20"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white font-mono uppercase focus:outline-none focus:border-rose-500/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Discount Type</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500/50 appearance-none"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED_AMOUNT">Fixed Amount (₦)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Value</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder={formData.discountType === "PERCENTAGE" ? "20" : "5000"}
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Usage Limit</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="Maximum number of times this can be used"
                    value={formData.maxRedemptions}
                    onChange={(e) => setFormData({ ...formData, maxRedemptions: e.target.value })}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500/50 transition-colors"
                  />
                  <p className="text-xs text-white/40 mt-2">After this limit, the coupon becomes invalid automatically.</p>
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Apply To</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500/50 appearance-none"
                  >
                    <option value="all">Entire Store (All Products)</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-white text-black font-medium py-3 rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    editingCoupon ? "Save Changes" : "Create Coupon"
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

