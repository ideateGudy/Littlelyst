"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/lib/api-client";
import { triggerPaystackCheckout } from "@/lib/paystack";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { AddToCartModal } from "@/components/ui/add-to-cart-modal";
import {
  X,
  ArrowLeft,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Zap,
  Tag,
  Clock,
  Check,
  Share2,
  Copy,
  Sparkles,
} from "lucide-react";

export interface PublicProductData {
  seller: {
    id: string;
    name: string;
    handle: string;
    bio?: string | null;
    avatarUrl?: string | null;
  };
  product: {
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
  };
}

export function ProductDetailView({ data }: { data: PublicProductData }) {
  const { product, seller } = data;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Checkout modal state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(
    product.variants?.[0] || null
  );
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<any | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [copiedLink, setCopiedLink] = useState(false);

  const formatNaira = (minor: string | number) => {
    const num = Number(minor) / 100;
    return `₦${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    try {
      const basePrice = product.activePromotion
        ? product.activePromotion.discountedPriceMinor
        : product.priceMinor;

      const res = await apiClient("/api/promotions/validate-coupon", {
        method: "POST",
        body: JSON.stringify({
          sellerId: seller.id,
          code: couponCode.trim(),
          productId: product.id,
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
    setCheckingOut(true);
    setCouponError("");

    try {
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
          sellerId: seller.id,
          productId: product.id,
          variantId: selectedVariant?.id,
          quantity: 1,
          buyerName,
          buyerEmail,
          buyerPhone,
          buyerAddress: product.productType === "PHYSICAL" ? buyerAddress : undefined,
          couponCode: couponApplied ? couponApplied.code : undefined,
          trafficSource: "direct",
          paymentMethod: paymentMethod === "pod" ? "PAY_ON_DELIVERY" : "PAYSTACK",
        }),
      });

      if (res.data) {
        const orderData = res.data;

        if (paymentMethod === "pod") {
          setCheckoutSuccess(orderData);
          setCheckingOut(false);
          return;
        }

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

  // Determine active unit price based on hierarchy: Original > Discount (if available) > Promo
  const originalPriceMinor = Number(product.priceMinor);
  const discountPriceMinor = product.discountPriceMinor ? Number(product.discountPriceMinor) : null;
  const promoPriceMinor = product.activePromotion ? Number(product.activePromotion.discountedPriceMinor) : null;

  const currentBasePriceMinor = promoPriceMinor
    ? promoPriceMinor
    : discountPriceMinor
    ? discountPriceMinor
    : originalPriceMinor;

  const variantDeltaMinor = selectedVariant ? Number(selectedVariant.priceDeltaMinor || 0) : 0;
  const currentPrice = currentBasePriceMinor + variantDeltaMinor;

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e4e2] px-4 py-6 sm:py-10 max-w-xl mx-auto space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${seller.handle}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to @{seller.handle}'s Store</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-emerald-500/30 text-xs text-white/70 hover:text-white transition-all cursor-pointer font-medium"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Link Copied!" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* Main Glass Product Card */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/15 space-y-5 shadow-2xl relative">
        {/* Product Image Gallery / Main Image */}
        <div className="space-y-3">
          <div 
            className="aspect-[4/3] w-full rounded-2xl bg-black/60 overflow-hidden relative group cursor-pointer"
            onClick={() => {
              // Open full screen image view by rendering a portal or simple fixed div
              const el = document.getElementById('lightbox');
              if(el) {
                el.style.display = 'flex';
                (document.getElementById('lightbox-img') as HTMLImageElement).src = product.images?.[selectedImageIndex] || product.images?.[0] || '';
              }
            }}
          >
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={`${product.title} - photo ${selectedImageIndex + 1}`}
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20">
                <ShoppingBag className="w-12 h-12" />
              </div>
            )}

            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-emerald-400 font-bold uppercase">
              {product.productType}
            </div>

            {/* Photo Counter Badge if multiple images */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/70">
                {selectedImageIndex + 1} / {product.images.length}
              </div>
            )}
          </div>
          
          {/* Lightbox Element */}
          <div 
            id="lightbox" 
            style={{display: 'none'}} 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
            onClick={(e) => {
               (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          >
            <img id="lightbox-img" src="" alt="Full screen view" className="max-w-full max-h-full object-contain rounded-xl" />
            <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10 backdrop-blur-md">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Multiple Image Thumbnails Slider */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border transition-all cursor-pointer ${
                    selectedImageIndex === idx
                      ? "border-emerald-400 ring-2 ring-emerald-500/40 scale-105"
                      : "border-white/15 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">
              Available from @{seller.handle}
            </span>
            {product.productType === "PHYSICAL" && (
              <span className="text-[10px] font-mono text-white/50">
                Stock: {product.stockQuantity > 0 ? `${product.stockQuantity} items` : "Out of Stock"}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
            {product.title}
          </h1>

          {/* Active Promotion Countdown Timer */}
          {product.activePromotion && (
            <div className="flex items-center gap-2">
              <CountdownTimer 
                targetDate={product.activePromotion.endAt} 
                onExpire={() => window.location.reload()}
              />
              {product.activePromotion.maxItems && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  Only {Math.max(0, product.activePromotion.maxItems - (product.activePromotion.itemsSold || 0))} left!
                </span>
              )}
            </div>
          )}

          {/* Pricing Hierarchy Display */}
          <div className="flex flex-wrap items-baseline gap-3 pt-1">
            {product.activePromotion ? (
              // Promo Active: Promo Price (main) > Discount (if available) / Original (slashed)
              <>
                <span className="text-2xl sm:text-3xl font-black text-rose-400">
                  {formatNaira(promoPriceMinor! + variantDeltaMinor)}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                  Promo Flash Sale
                </span>
                <span className="text-sm text-white/40 line-through font-mono">
                  {discountPriceMinor 
                    ? formatNaira(discountPriceMinor + variantDeltaMinor) 
                    : formatNaira(originalPriceMinor + variantDeltaMinor)}
                </span>
              </>
            ) : discountPriceMinor && discountPriceMinor < originalPriceMinor ? (
              // Discount Active: Discount Price (main) > Original (slashed)
              <>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {formatNaira(discountPriceMinor + variantDeltaMinor)}
                </span>
                <span className="text-sm text-white/40 line-through font-mono">
                  {formatNaira(originalPriceMinor + variantDeltaMinor)}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Save {formatNaira(originalPriceMinor - discountPriceMinor)}
                </span>
              </>
            ) : (
              // Normal Original Price
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                {formatNaira(originalPriceMinor + variantDeltaMinor)}
              </span>
            )}
          </div>

          {/* Realistic Product Variants Selector if available */}
          {product.hasVariants && product.variants && product.variants.length > 0 && (
            <div className="pt-2 space-y-2">
              <label className="text-xs font-bold text-white/80 uppercase tracking-wider">
                Select Option / Variant:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-purple-500/20 border-purple-400 text-white font-bold"
                          : "bg-white/5 border-white/10 text-white/70 hover:border-white/20"
                      }`}
                    >
                      <span>{v.title}</span>
                      {Number(v.priceDeltaMinor) > 0 && (
                        <span className="text-purple-300 ml-1.5 font-mono">
                          +{formatNaira(v.priceDeltaMinor)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {product.description && (
            <div className="pt-2 border-t border-white/10">
              <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                Description & Details
              </h4>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons: Add to Cart & Instant Purchase */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setCartModalOpen(true)}
            className="flex-1 py-3.5 px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-emerald-500/50 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Add to Cart</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCheckoutOpen(true)}
            className="flex-[1.5] py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
          >
            <span>Buy Now — {formatNaira(currentPrice)}</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Security & Guarantee Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-around text-[11px] text-white/50">
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-400" /> Pay via Paystack
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Verified Delivery
          </span>
        </div>
      </div>

      {/* Instant Checkout Drawer Modal */}
      <AnimatePresence>
        {checkoutOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCheckoutOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/15 rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
                    Secure Instant Checkout
                  </span>
                  <h3 className="text-base font-bold text-white line-clamp-1">
                    {product.title}
                  </h3>
                </div>
                <button
                  onClick={() => setCheckoutOpen(false)}
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

                  <button
                    onClick={() => {
                      setCheckoutOpen(false);
                      setCheckoutSuccess(null);
                    }}
                    className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer"
                  >
                    Close & Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePay} className="space-y-3.5">
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
                    <label className="text-xs font-semibold text-white/80">Email Address (For Receipt)</label>
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
                    <div className={`grid ${product.productType === "PHYSICAL" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"} gap-2.5`}>
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
                      {product.productType === "PHYSICAL" && (
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

                  {product.productType === "PHYSICAL" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/80">Delivery Address</label>
                      <textarea
                        required
                        value={buyerAddress}
                        onChange={(e) => setBuyerAddress(e.target.value)}
                        placeholder="12 Admiralty Way, Lekki Phase 1, Lagos"
                        rows={2}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
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
                        Place Order (Pay on Delivery) — {couponApplied ? formatNaira(couponApplied.finalPriceMinor) : formatNaira(currentPrice)} <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Pay Instantly — {couponApplied ? formatNaira(couponApplied.finalPriceMinor) : formatNaira(currentPrice)} <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add To Cart Preference & Variant Modal */}
      <AddToCartModal
        product={{
          ...product,
          sellerId: seller.id,
        }}
        sellerHandle={seller.handle}
        isOpen={cartModalOpen}
        onClose={() => setCartModalOpen(false)}
      />
    </div>
  );
}


