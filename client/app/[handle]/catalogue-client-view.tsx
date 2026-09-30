"use client";

import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { AddToCartModal } from "@/components/ui/add-to-cart-modal";
import AddressSelector from "@/components/ui/address-selector";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/lib/api-client";
import { triggerPaystackCheckout } from "@/lib/paystack";
import { useAuth } from "@/lib/auth-context";
import {
  ShoppingBag,
  Sparkles,
  Share2,
  Check,
  Tag,
  ArrowRight, ArrowLeft,
  ShieldCheck,
  Zap,
  Clock,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Copy,
  UserCheck,
  Eye,
  X,
  Layers,
  Flame,
  CheckCircle2,
} from "lucide-react";

export interface CatalogueData {
  seller: {
    id: string;
    name: string;
    handle: string;
    bio?: string | null;
    avatarUrl?: string | null;
  };
  products: Array<{
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    priceMinor: string;
    discountPriceMinor?: string | null;
    productType: string;
    images?: string[];
    stockQuantity: number;
    hasVariants: boolean;
    variants: Array<any>;
    activePromotion?: {
      discountedPriceMinor: string;
      endAt: string;
      maxItems?: number | null;
      itemsSold?: number | null;
    } | null;
  }>;
}

export function CatalogueClientView({
  initialData,
  handle,
}: {
  initialData: CatalogueData | null;
  handle: string;
}) {
  const searchParams = useSearchParams();
  const utmSource = searchParams?.get("utm_source") || "direct";

  const [catalogue, setCatalogue] = useState<CatalogueData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(initialData ? "" : "");
  const [copiedLink, setCopiedLink] = useState(false);

  // Category and Type Filters ('ALL' | 'PHYSICAL' | 'DIGITAL' | 'PROMO' or custom category)
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Flash Sales View Modal State
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyProductIndex, setStoryProductIndex] = useState(0);
  const [storyImageIndex, setStoryImageIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [storyPaused, setStoryPaused] = useState(false);

  const { user: currentUser } = useAuth();

  // Checkout modal state
  const [activeProduct, setActiveProduct] = useState<any | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [cartProduct, setCartProduct] = useState<any | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<any | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<any | null>(null);

  // Auto-populate customer info if logged in as buyer or user
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name && !buyerName) setBuyerName(currentUser.name);
      if (currentUser.email && !buyerEmail) setBuyerEmail(currentUser.email);
      if (currentUser.phone && !buyerPhone) setBuyerPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Auto-advance Flash Sales Stories
  useEffect(() => {
    if (!storyOpen || !catalogue) return;
    const promoProducts = (catalogue.products || []).filter((p) => !!p.activePromotion);
    if (promoProducts.length === 0) return;
    const currentStoryProduct = promoProducts[storyProductIndex] || promoProducts[0];
    const storyImages = currentStoryProduct.images && currentStoryProduct.images.length > 0
      ? currentStoryProduct.images
      : ["https://images.unsplash.com/photo-1556742049-0a67e55722c0?auto=format&fit=crop&w=800&q=80"];

    const timer = setTimeout(() => {
      if (storyImageIndex < storyImages.length - 1) {
        setStoryImageIndex((prev) => prev + 1);
      } else if (storyProductIndex < promoProducts.length - 1) {
        setStoryProductIndex((prev) => prev + 1);
        setStoryImageIndex(0);
      } else {
        setStoryOpen(false);
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [storyOpen, storyProductIndex, storyImageIndex, catalogue]);

  useEffect(() => {
      async function loadCatalogue() {
      if (initialData) return;
      try {
        setLoading(true);
        const res = await apiClient<CatalogueData>(
          `/api/catalogue/${handle}?utm_source=${utmSource}`
        );
        if (res.data) {
          setCatalogue(res.data);
        } else {
          setError("Catalogue not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load seller catalogue");
      } finally {
        setLoading(false);
      }
    }

    loadCatalogue();
  }, [handle, utmSource, initialData]);

  const formatNaira = (minor: string | number) => {
    const num = Number(minor) / 100;
    return `₦${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleCopyStore = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !activeProduct || !catalogue) return;
    setCouponError("");
    try {
      const basePrice = activeProduct.activePromotion
        ? activeProduct.activePromotion.discountedPriceMinor
        : activeProduct.priceMinor;

      const res = await apiClient("/api/promotions/validate-coupon", {
        method: "POST",
        body: JSON.stringify({
          sellerId: catalogue.seller.id,
          code: couponCode.trim(),
          productId: activeProduct.id,
          basePriceMinor: basePrice,
        }),
      });

      if (res.data) {
        setCouponApplied(res.data);
      }
    } catch (err: any) {
      setCouponError(err.message || "Coupon is invalid or expired");
      setCouponApplied(null);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !catalogue) return;
    setCheckingOut(true);
    setCouponError("");

    try {
      // 1. Initialize order record on backend
      const res = await apiClient<{
        orderId: string;
        paystackReference: string;
        totalMinor: string;
        buyerEmail: string;
        subaccount?: string | null;
        platformFeeMinor?: string;
      }>("/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify({
          sellerId: catalogue.seller.id,
          productId: activeProduct.id,
          variantId: selectedVariant?.id,
          quantity: 1,
          buyerId: currentUser?.id,
          buyerName,
          buyerEmail,
          buyerPhone,
          buyerAddress: activeProduct.productType === "PHYSICAL" ? buyerAddress : undefined,
          couponCode: couponApplied ? couponApplied.code : undefined,
          trafficSource: utmSource,
          paymentMethod: paymentMethod === "pod" ? "PAY_ON_DELIVERY" : "PAYSTACK",
        }),
      });

      if (res.data) {
        const orderData = res.data;

        // If Pay on Delivery, directly set checkoutSuccess without launching Paystack
        if (paymentMethod === "pod") {
          setCheckoutSuccess(orderData);
          setCheckingOut(false);
          return;
        }

        // 2. Launch Paystack Pop-up (Card, Transfer, USSD, Mobile Money)
        await triggerPaystackCheckout({
          email: orderData.buyerEmail,
          amountMinor: Number(orderData.totalMinor),
          reference: orderData.paystackReference,
          subaccount: orderData.subaccount,
          platformFeeMinor: orderData.platformFeeMinor ? Number(orderData.platformFeeMinor) : undefined,
          buyerName,
          buyerPhone,
          selectedChannel: paymentMethod,
          onSuccess: (verifiedRef) => {
            setCheckoutSuccess({
              ...orderData,
              paystackReference: verifiedRef,
            });
            setCheckingOut(false);
          },
          onClose: () => {
            setCheckingOut(false);
          },
          onError: (errMessage) => {
            setCouponError(errMessage);
            setCheckingOut(false);
          },
        });
      } else {
        setCheckingOut(false);
      }
    } catch (err: any) {
      setCouponError(err.message || "Payment checkout failed");
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#e5e4e2] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-white/50 font-mono">Opening catalogue...</p>
        </div>
      </div>
    );
  }

  if (error || !catalogue) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#e5e4e2] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="liquid-glass-card rounded-3xl p-8 max-w-sm text-center space-y-4 w-full"
        >
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Store Not Found</h2>
          <p className="text-xs text-white/50">
            The catalogue link you opened does not exist or has been made private.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e4e2] selection:bg-emerald-500 selection:text-black relative">
      {/* Floating Theme Toggle */}
      <div className="absolute top-4 right-4 z-40">
        <ThemeToggle size="sm" />
      </div>

      {/* Ambient background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[130px] pointer-events-none" />

      {/* Seller Profile Header (Strictly Mobile-First) */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto pt-6 sm:pt-8 px-4 pb-5 sm:pb-6 space-y-3.5 sm:space-y-4 text-center"
      >
        {/* Verified Status & Story Ring on Avatar */}
        <div className="relative inline-block">
          {(() => {
            const hasPromos = (catalogue.products || []).some((p) => !!p.activePromotion);
            return (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (hasPromos) {
                    setStoryProductIndex(0);
                    setStoryImageIndex(0);
                    setStoryOpen(true);
                  }
                }}
                className={`group relative p-1 rounded-full ${
                  hasPromos
                    ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-emerald-400 cursor-pointer shadow-[0_0_25px_rgba(244,63,94,0.3)]"
                    : "border-2 border-white/10 cursor-default"
                } block`}
                title={hasPromos ? "Click to watch product flash sales" : catalogue.seller.name}
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-0.5 bg-black overflow-hidden">
                  {catalogue.seller.avatarUrl ? (
                    <img
                      src={catalogue.seller.avatarUrl}
                      alt={catalogue.seller.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#0d0d0d] rounded-full flex items-center justify-center text-emerald-400 font-extrabold text-2xl">
                      {catalogue.seller.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Tap to view story pill ONLY if active promo exists */}
                {hasPromos && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-rose-500 hover:bg-rose-400 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-lg border border-white/30 flex items-center gap-1 uppercase tracking-wider">
                    <Flame className="w-2.5 h-2.5 animate-bounce" />
                    <span>Flash Sales</span>
                  </div>
                )}
              </motion.button>
            );
          })()}
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {catalogue.seller.name}
            </h1>
            <span
              className="w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[10px] font-black inline-flex"
              title="Verified Merchant"
            >
              ✓
            </span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <p className="text-xs font-mono text-emerald-400">@{catalogue.seller.handle}</p>
            <span className="text-white/30">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Accepting Orders
            </span>
          </div>

          {catalogue.seller.bio && (
            <p className="text-xs text-white/60 max-w-md mx-auto pt-1 leading-relaxed px-2">
              {catalogue.seller.bio}
            </p>
          )}
        </div>

        {/* Share Button & Watch Stories Pill */}
        <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCopyStore}
            className="liquid-glass-button text-xs font-semibold px-4 py-2 rounded-xl text-white/80 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Link Copied!" : "Share Catalogue"}</span>
          </motion.button>

          {/* Watch Flash Sales Button (Only if there are running promotional products) */}
          {(() => {
            const promoProducts = (catalogue.products || []).filter((p) => !!p.activePromotion);
            if (promoProducts.length === 0) return null;

            return (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setStoryProductIndex(0);
                  setStoryImageIndex(0);
                  setStoryOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(244,63,94,0.35)] transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Watch Flash Sales ({promoProducts.length})</span>
              </motion.button>
            );
          })()}
        </div>

        {/* Value trust strip */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-[11px] text-white/50">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-400" /> Instant Paystack Checkout
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-cyan-400" /> No Account Needed
          </span>
        </div>
      </motion.header>

      {/* Instagram Story Highlights Row (ONLY for products with running promotions) */}
      {(() => {
        const promoProducts = (catalogue.products || []).filter((p) => !!p.activePromotion);
        if (promoProducts.length === 0) return null;

        return (
          <section className="max-w-2xl mx-auto px-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Live Promotions
              </span>
              <span className="text-[10px] text-white/40 font-mono">Tap circle to view</span>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {promoProducts.slice(0, 10).map((prod, idx) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => {
                    setStoryProductIndex(idx);
                    setStoryImageIndex(0);
                    setStoryOpen(true);
                  }}
                  className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none"
                >
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-pink-500 group-hover:scale-105 transition-transform duration-200 shadow-md">
                    <div className="w-full h-full rounded-full bg-black p-0.5 overflow-hidden">
                      {prod.images && prod.images[0] ? (
                        <img
                          src={prod.images[0]}
                          alt={prod.title}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#121216] rounded-full flex items-center justify-center text-white/40">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-white/70 group-hover:text-white max-w-[70px] truncate text-center font-medium">
                    {prod.title}
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Categorization & Filter Navigation Bar */}
      <section className="max-w-2xl mx-auto px-4 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition-all ${
              selectedCategory === "ALL"
                ? "bg-white text-black shadow-sm"
                : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10"
            }`}
          >
            All Items ({catalogue.products.length})
          </button>

          {catalogue.products.some((p) => p.activePromotion) && (
            <button
              onClick={() => setSelectedCategory("PROMO")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition-all flex items-center gap-1.5 ${
                selectedCategory === "PROMO"
                  ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                  : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Flash Sales</span>
            </button>
          )}

          {catalogue.products.some((p) => p.productType === "PHYSICAL") && (
            <button
              onClick={() => setSelectedCategory("PHYSICAL")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition-all ${
                selectedCategory === "PHYSICAL"
                  ? "bg-emerald-500 text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10"
              }`}
            >
              Physical Products
            </button>
          )}

          {catalogue.products.some((p) => p.productType === "DIGITAL") && (
            <button
              onClick={() => setSelectedCategory("DIGITAL")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition-all ${
                selectedCategory === "DIGITAL"
                  ? "bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10"
              }`}
            >
              Digital Downloads
            </button>
          )}
        </div>
      </section>

      {/* Product List */}
      <main className="max-w-2xl mx-auto px-4 pb-20 space-y-3.5 sm:space-y-4">
        {(() => {
          const filtered = catalogue.products.filter((item) => {
            if (selectedCategory === "PROMO") return !!item.activePromotion;
            if (selectedCategory === "PHYSICAL") return item.productType === "PHYSICAL";
            if (selectedCategory === "DIGITAL") return item.productType === "DIGITAL";
            return true;
          });

          if (filtered.length === 0) {
            return (
              <div className="liquid-glass-card rounded-2xl p-8 text-center space-y-2">
                <p className="text-xs text-white/40">No products found in this category.</p>
                <button
                  onClick={() => setSelectedCategory("ALL")}
                  className="text-xs text-emerald-400 underline cursor-pointer"
                >
                  Show all products
                </button>
              </div>
            );
          }

          return filtered.map((item, index) => {
            const originalPriceMinor = Number(item.priceMinor);
            const discountPriceMinor = item.discountPriceMinor ? Number(item.discountPriceMinor) : null;
            const promoPriceMinor = item.activePromotion ? Number(item.activePromotion.discountedPriceMinor) : null;
            const activePriceMinor = promoPriceMinor || discountPriceMinor || originalPriceMinor;

            return (
              <motion.div
                key={item.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                className="liquid-glass-card rounded-2xl p-3.5 sm:p-5 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row gap-3.5 sm:gap-4"
              >
                {/* Product Image */}
                <div
                  onClick={() => {
                      if (item.activePromotion) {
                        const promoProducts = (catalogue.products || []).filter((p) => !!p.activePromotion);
                        const promoIdx = promoProducts.findIndex((p) => p.id === item.id);
                        setStoryProductIndex(promoIdx >= 0 ? promoIdx : 0);
                        setStoryImageIndex(0);
                        setStoryOpen(true);
                      } else if (item.images && item.images.length > 0) {
                        setLightboxImages(item.images);
                        setLightboxIndex(0);
                      }
                    }}
                  className="w-full sm:w-36 h-48 sm:h-36 rounded-xl bg-black/50 overflow-hidden relative shrink-0 cursor-pointer group"
                >
                  {item.images && item.images[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                  )}

                  {/* Story preview overlay badge ONLY if product has running promo */}
                  {item.activePromotion && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                      <Eye className="w-4 h-4 text-rose-400" />
                      <span>Flash Sale</span>
                    </div>
                  )}

                  {item.images && item.images.length > 1 && (
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/85 backdrop-blur-md text-[9px] font-mono text-white/90 border border-white/20">
                      {item.images.length} photos
                    </span>
                  )}
                </div>

                {/* Info & Buy Button */}
                <div className="flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-white/50 uppercase">
                        {item.productType}
                      </span>
                      {item.activePromotion && (
                        <div className="flex items-center gap-2">
                          <CountdownTimer targetDate={item.activePromotion.endAt} />
                          {item.activePromotion.maxItems && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
                              {Math.max(0, item.activePromotion.maxItems - (item.activePromotion.itemsSold || 0))} left
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <a
                      href={`/${catalogue.seller.handle}/products/${item.slug}`}
                      className="text-base font-extrabold text-white leading-snug hover:text-emerald-400 transition-colors"
                    >
                      {item.title}
                    </a>
                    {item.description && (
                      <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {/* Price display with hierarchy */}
                    <div className="space-y-0.5">
                      {item.activePromotion ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-rose-400">
                            {formatNaira(promoPriceMinor!)}
                          </span>
                          <span className="text-xs text-white/40 line-through">
                            {discountPriceMinor ? formatNaira(discountPriceMinor) : formatNaira(originalPriceMinor)}
                          </span>
                        </div>
                      ) : discountPriceMinor && discountPriceMinor < originalPriceMinor ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-emerald-400">
                            {formatNaira(discountPriceMinor)}
                          </span>
                          <span className="text-xs text-white/40 line-through">
                            {formatNaira(originalPriceMinor)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-black text-emerald-400">
                          {formatNaira(originalPriceMinor)}
                        </span>
                      )}
                    </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const originalIdx = catalogue.products.findIndex((p) => p.id === item.id);
                            setStoryProductIndex(originalIdx >= 0 ? originalIdx : 0);
                            setStoryImageIndex(0);
                            setStoryOpen(true);
                          }}
                          className="p-2.5 rounded-xl border border-white/10 hover:border-emerald-500/40 text-white/70 hover:text-white text-xs font-semibold flex items-center justify-center cursor-pointer transition-all"
                          title="View Fullscreen Story"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCartProduct({
                              ...item,
                              sellerId: catalogue.seller.id,
                            });
                          }}
                          className="px-3 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-emerald-500/40 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Configure Preferences & Add to Cart"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden xs:inline sm:inline">Add to Cart</span>
                        </button>

                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            setActiveProduct(item);
                            setSelectedVariant(item.variants?.[0] || null);
                            setCouponApplied(null);
                            setCheckoutSuccess(null);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                        >
                          <span>Buy Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                  </div>
                </div>
              </motion.div>
            );
          });
        })()}
      </main>

      {/* Guest Checkout Sheet Modal (Optimized for Mobile Keyboards) */}
      <AnimatePresence>
        {activeProduct && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 120, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-[#0d0d0d] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-400">
                    Guest Checkout • No Account Needed
                  </span>
                  <h3 className="text-base font-extrabold text-white line-clamp-1">
                    {activeProduct.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveProduct(null)}
                  className="text-white/40 hover:text-white text-sm p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {checkoutSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                    className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto"
                  >
                    <Check className="w-6 h-6" />
                  </motion.div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-white">Order Confirmed!</h4>
                    <p className="text-xs text-white/50 max-w-xs mx-auto">
                      Payment reference:{" "}
                      <span className="font-mono text-emerald-400">{checkoutSuccess.paystackReference}</span>
                    </p>
                  </div>

                  {activeProduct.productType === "DIGITAL" && (
                    <div className="liquid-glass-subtle p-4 rounded-2xl border border-emerald-500/30 text-left space-y-2">
                      <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                        Digital Delivery Link
                      </span>
                      <p className="text-xs text-white/80">
                        Your download link is ready! A copy was also sent to{" "}
                        <span className="text-white font-bold">{buyerEmail}</span>.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveProduct(null)}
                    className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer"
                  >
                    Close & Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePay} className="space-y-3.5">
                  {/* Variant Selector if present */}
                  {activeProduct.variants && activeProduct.variants.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/80">Select Option</label>
                      <div className="grid grid-cols-2 gap-2">
                        {activeProduct.variants.map((v: any) => (
                          <button
                            type="button"
                            key={v.id}
                            onClick={() => setSelectedVariant(v)}
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                              selectedVariant?.id === v.id
                                ? "border-emerald-400 bg-emerald-500/10 text-white font-bold"
                                : "border-white/10 text-white/60 hover:border-white/20"
                            }`}
                          >
                            <div className="line-clamp-1">{v.title}</div>
                            {Number(v.priceDeltaMinor) !== 0 && (
                              <div className="text-[10px] text-emerald-400 font-mono">
                                +{formatNaira(v.priceDeltaMinor)}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Logged in buyer banner */}
                  {currentUser && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300">
                      <span className="flex items-center gap-1.5 font-medium text-[11px]">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        Signed in as <strong className="text-white">{currentUser.name}</strong>
                      </span>
                      <span className="text-[10px] text-emerald-400/80">Auto-filled</span>
                    </div>
                  )}

                  {/* Buyer Contact Details */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Chioma Adeleke"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80">Email (For Receipt / Digital Files)</label>
                    <input
                      type="email"
                      required
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="chioma@example.com"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80">Phone Number (WhatsApp)</label>
                    <input
                      type="tel"
                      required
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="+234 801 234 5678"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  {/* Payment Gateway Selector */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-semibold text-white/80 uppercase tracking-wider flex items-center justify-between">
                      <span>Payment Method</span>
                      <span className="text-[10px] text-emerald-400 font-normal">Secure Checkout</span>
                    </label>
                    <div className={`grid ${activeProduct.productType === "PHYSICAL" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"} gap-2.5`}>
                      {/* Paystack - Active */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("paystack")}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          paymentMethod === "paystack"
                            ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                            : "border-white/10 bg-white/[0.02] hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-white">Paystack</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Instant
                          </span>
                        </div>
                        <p className="text-[10px] text-white/50 mt-1 leading-snug">
                          Cards, Bank Transfer & USSD
                        </p>
                      </button>

                      {/* Pay on Delivery - Available for Physical Products */}
                      {activeProduct.productType === "PHYSICAL" && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("pod")}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            paymentMethod === "pod"
                              ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                              : "border-white/10 bg-white/[0.02] hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-white">Pay on Delivery</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                              Cash / POS
                            </span>
                          </div>
                          <p className="text-[10px] text-white/50 mt-1 leading-snug">
                            Pay when your item arrives
                          </p>
                        </button>
                      )}

                      {/* Stripe - Coming Soon */}
                      <div
                        className="p-3 rounded-2xl border border-white/5 bg-white/[0.01] text-left opacity-50 cursor-not-allowed select-none relative overflow-hidden hidden sm:block"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white/60">Stripe</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-white/50 border border-white/10">
                            Soon
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40 mt-1 leading-snug">
                          Intl Cards & Apple Pay
                        </p>
                      </div>
                    </div>
                  </div>

                  {activeProduct.productType === "PHYSICAL" && (
                    <AddressSelector value={buyerAddress} onChange={setBuyerAddress} />
                  )}

                  {/* Coupon Code Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80">Coupon Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="e.g. FIRST10"
                        className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase font-mono placeholder-white/30 focus:border-emerald-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="text-[11px] text-rose-400">{couponError}</p>}
                    {couponApplied && (
                      <p className="text-[11px] text-emerald-400 font-bold">
                        ✓ Coupon applied! Saved {formatNaira(couponApplied.discountMinor)}
                      </p>
                    )}
                  </div>

                  {/* Payment Breakdown */}
                  <div className="liquid-glass-subtle p-3.5 rounded-xl border border-white/10 space-y-1.5 text-xs">
                    <div className="flex justify-between text-white/60">
                      <span>Item Total</span>
                      <span>
                        {formatNaira(
                          activeProduct.activePromotion
                            ? activeProduct.activePromotion.discountedPriceMinor
                            : activeProduct.priceMinor
                        )}
                      </span>
                    </div>
                    {couponApplied && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>Discount ({couponApplied.code})</span>
                        <span>-{formatNaira(couponApplied.discountMinor)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white font-extrabold pt-1 border-t border-white/10">
                      <span>Payable Now</span>
                      <span className="text-sm text-emerald-400">
                        {couponApplied
                          ? formatNaira(couponApplied.finalPriceMinor)
                          : formatNaira(
                              activeProduct.activePromotion
                                ? activeProduct.activePromotion.discountedPriceMinor
                                : activeProduct.priceMinor
                            )}
                      </span>
                    </div>
                  </div>

                  {/* Submit Checkout Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={checkingOut}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {checkingOut ? (
                      <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    ) : paymentMethod === "pod" ? (
                      <>
                        Place Order (Pay on Delivery) <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Pay Instantly <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Flash Sales View Modal (Promotions Only) */}
      <AnimatePresence>
        {storyOpen && (() => {
          const promoProducts = (catalogue.products || []).filter((p) => !!p.activePromotion);
          if (promoProducts.length === 0) return null;

          const currentStoryProduct = promoProducts[storyProductIndex] || promoProducts[0];
          const storyImages = currentStoryProduct.images && currentStoryProduct.images.length > 0
            ? currentStoryProduct.images
            : ["https://images.unsplash.com/photo-1556742049-0a67e55722c0?auto=format&fit=crop&w=800&q=80"];
          const currentImg = storyImages[storyImageIndex] || storyImages[0];

          

          const handleNext = () => {
            if (storyImageIndex < storyImages.length - 1) {
              setStoryImageIndex((prev) => prev + 1);
            } else if (storyProductIndex < promoProducts.length - 1) {
              setStoryProductIndex((prev) => prev + 1);
              setStoryImageIndex(0);
            } else {
              setStoryOpen(false);
            }
          };

          const handlePrev = () => {
            if (storyImageIndex > 0) {
              setStoryImageIndex((prev) => prev - 1);
            } else if (storyProductIndex > 0) {
              const prevProdIdx = storyProductIndex - 1;
              const prevProd = promoProducts[prevProdIdx];
              setStoryProductIndex(prevProdIdx);
              setStoryImageIndex(Math.max(0, (prevProd.images?.length || 1) - 1));
            }
          };

          const originalPriceMinor = Number(currentStoryProduct.priceMinor);
          const discountPriceMinor = currentStoryProduct.discountPriceMinor ? Number(currentStoryProduct.discountPriceMinor) : null;
          const promoPriceMinor = currentStoryProduct.activePromotion ? Number(currentStoryProduct.activePromotion.discountedPriceMinor) : null;
          const activePriceMinor = promoPriceMinor || discountPriceMinor || originalPriceMinor;

          return (
            <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 select-none">
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md h-full sm:h-[90vh] sm:max-h-[820px] bg-black sm:rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl border border-white/10"
              >
                {/* Story Image Background */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={currentImg}
                    alt={currentStoryProduct.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Dark gradients for top and bottom readability */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />
                </div>

                {/* Left / Right Screen Tap Zones for Navigation */}
                <div
                  onClick={handlePrev}
                  className="absolute left-0 top-16 bottom-24 w-1/3 z-10 cursor-pointer"
                  title="Previous image"
                />
                <div
                  onClick={handleNext}
                  className="absolute right-0 top-16 bottom-24 w-1/3 z-10 cursor-pointer"
                  title="Next image"
                />

                {/* Top Section: Segmented Progress Bars & Merchant Status */}
                <div className="relative z-20 p-4 space-y-3">
                  {/* Segmented Progress Bars for Current Product Photos */}
                  <div className="flex items-center gap-1.5 w-full">
                    {storyImages.map((_, i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
                      >
                        <div
                          className={`h-full bg-white transition-all duration-300 ${
                            i < storyImageIndex
                              ? "w-full"
                              : i === storyImageIndex
                              ? "w-full animate-pulse"
                              : "w-0"
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Merchant Header + Close Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full ring-2 ring-emerald-400 overflow-hidden bg-black shrink-0">
                        {catalogue.seller.avatarUrl ? (
                          <img
                            src={catalogue.seller.avatarUrl}
                            alt={catalogue.seller.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-xs">
                            {catalogue.seller.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white leading-tight">
                            {catalogue.seller.name}
                          </span>
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[8px] font-black">
                            ✓
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-rose-400">
                          Promo Deal {storyProductIndex + 1} of {promoProducts.length}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setStoryOpen(false)}
                      className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center cursor-pointer border border-white/20 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom Section: Minimal Product Info & CTA */}<div className="relative z-20 p-4 pb-6 space-y-3"><div className="space-y-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"><div className="flex items-center gap-2">{currentStoryProduct.activePromotion && (<CountdownTimer targetDate={currentStoryProduct.activePromotion.endAt} onExpire={() => window.location.reload()} className="bg-black/40 backdrop-blur-md" />)}</div><h2 className="text-lg font-black text-white leading-snug line-clamp-2">{currentStoryProduct.title}</h2><div className="flex items-baseline gap-2 pb-2"><span className="text-2xl font-black text-emerald-400 drop-shadow-md">{formatNaira(activePriceMinor)}</span>{promoPriceMinor && promoPriceMinor < originalPriceMinor && (<span className="text-sm text-white/70 line-through font-mono drop-shadow-md">{formatNaira(originalPriceMinor)}</span>)}</div></div><button onClick={() => { setStoryOpen(false); setActiveProduct(currentStoryProduct); setSelectedVariant(currentStoryProduct.variants?.[0] || null); setCouponApplied(null); setCheckoutSuccess(null); }} className="w-full py-3.5 rounded-2xl bg-white text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.3)] cursor-pointer hover:scale-[1.02] transition-all"><span>Swipe up to Buy Now</span><ArrowRight className="w-4 h-4" /></button></div></motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

              <AnimatePresence>
          {lightboxImages && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 select-none"
              onClick={() => setLightboxImages(null)}
            >
              <button className="absolute top-4 right-4 z-50 text-white/70 hover:text-white p-2 rounded-full bg-white/10 backdrop-blur-md cursor-pointer transition-all hover:scale-110">
                <X className="w-6 h-6" />
              </button>

              <div 
                className="relative w-full max-w-4xl max-h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.img 
                  key={lightboxIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  src={lightboxImages[lightboxIndex]} 
                  alt="Full screen view" 
                  className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
                />

                {lightboxImages.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => Math.max(0, prev - 1)); }}
                      className={"absolute left-2 md:-left-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer " + (lightboxIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:scale-110")}
                      disabled={lightboxIndex === 0}
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => Math.min(lightboxImages.length - 1, prev + 1)); }}
                      className={"absolute right-2 md:-right-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer " + (lightboxIndex === lightboxImages.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:scale-110")}
                      disabled={lightboxIndex === lightboxImages.length - 1}
                    >
                      <ArrowRight className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 text-white/70 text-xs font-mono backdrop-blur-md">
                      {lightboxIndex + 1} / {lightboxImages.length}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add To Cart Preference & Variant Modal */}
      <AddToCartModal
        product={cartProduct}
        sellerHandle={catalogue.seller.handle}
        isOpen={!!cartProduct}
        onClose={() => setCartProduct(null)}
      />

      {/* Powered by Littlelyst Footer */}
      <footer className="mt-12 mb-8 text-center">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all text-xs text-white/50 hover:text-white group"
        >
          <span>Powered by</span>
          <Logo size="sm" />
        </a>
      </footer>
    </div>
  );
}















