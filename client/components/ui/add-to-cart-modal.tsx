"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useCartStore } from "@/lib/cart-store";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Check,
  Zap,
  Tag,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";

export interface AddToCartProduct {
  id: string;
  sellerId: string;
  title: string;
  slug: string;
  description?: string | null;
  priceMinor: string;
  discountPriceMinor?: string | null;
  productType: string;
  images?: string[];
  stockQuantity: number;
  hasVariants: boolean;
  variants?: Array<{
    id: string;
    title: string;
    priceDeltaMinor: string | number | bigint;
    stockQuantity?: number;
  }>;
  activePromotion?: {
    discountedPriceMinor: string;
    endAt: string;
    maxItems?: number | null;
    itemsSold?: number | null;
  } | null;
}

interface AddToCartModalProps {
  product: AddToCartProduct | null;
  sellerHandle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddToCartModal({
  product,
  sellerHandle,
  isOpen,
  onClose,
}: AddToCartModalProps) {
  const addItem = useCartStore((s) => s.addItem);

  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // Initialize or reset variant and quantity whenever the active product changes
  useEffect(() => {
    if (product) {
      if (product.hasVariants && product.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0]);
      } else {
        setSelectedVariant(null);
      }
      setQuantity(1);
      setJustAdded(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const originalPriceMinor = Number(product.priceMinor);
  const discountPriceMinor = product.discountPriceMinor
    ? Number(product.discountPriceMinor)
    : null;
  const promoPriceMinor = product.activePromotion
    ? Number(product.activePromotion.discountedPriceMinor)
    : null;

  // Base unit price considering promo > discount > original
  const basePriceMinor = promoPriceMinor
    ? promoPriceMinor
    : discountPriceMinor
    ? discountPriceMinor
    : originalPriceMinor;

  const variantDeltaMinor = selectedVariant
    ? Number(selectedVariant.priceDeltaMinor || 0)
    : 0;

  const effectiveUnitPriceMinor = basePriceMinor + variantDeltaMinor;
  const effectiveOriginalUnitPriceMinor = originalPriceMinor + variantDeltaMinor;
  const subtotalMinor = effectiveUnitPriceMinor * quantity;

  // Determine available stock
  const isPhysical = product.productType === "PHYSICAL";
  const availableStock = selectedVariant?.stockQuantity !== undefined
    ? selectedVariant.stockQuantity
    : product.stockQuantity;

  const isOutOfStock = isPhysical && availableStock <= 0;
  const maxAllowedQty = isPhysical ? Math.max(1, availableStock) : 99;

  const formatNaira = (minor: number) => {
    return `₦${(minor / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleConfirmAddToCart = () => {
    if (isOutOfStock) return;

    addItem(
      {
        productId: product.id,
        sellerId: product.sellerId,
        title: product.title,
        slug: product.slug,
        image: product.images && product.images[0] ? product.images[0] : undefined,
        productType: product.productType,
        variantId: selectedVariant?.id,
        variantTitle: selectedVariant?.title,
        unitPriceMinor: effectiveUnitPriceMinor,
        originalPriceMinor: effectiveOriginalUnitPriceMinor,
        discountPriceMinor: discountPriceMinor
          ? discountPriceMinor + variantDeltaMinor
          : undefined,
        promoPriceMinor: promoPriceMinor
          ? promoPriceMinor + variantDeltaMinor
          : undefined,
        hasPromo: !!product.activePromotion,
      },
      quantity
    );

    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 400);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 320 }}
          className="relative w-full max-w-lg bg-[#0d0d0d] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl z-10 max-h-[92vh] overflow-y-auto text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">
                  Select Options & Quantity
                </span>
                <h3 className="text-sm font-bold text-white line-clamp-1">
                  Add to Shopping Cart
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Product Overview Summary */}
          <div className="flex gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            {product.images && product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0 bg-black/50"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-white/20 shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-white line-clamp-1">
                  {product.title}
                </h4>
                <span className="text-[10px] font-mono text-white/40 uppercase">
                  {product.productType}
                </span>
              </div>

              {/* Price display with promo highlight */}
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm font-extrabold text-emerald-400">
                  {formatNaira(effectiveUnitPriceMinor)}
                </span>
                {effectiveOriginalUnitPriceMinor > effectiveUnitPriceMinor && (
                  <span className="text-xs text-white/40 line-through">
                    {formatNaira(effectiveOriginalUnitPriceMinor)}
                  </span>
                )}
                {product.activePromotion && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Flash Sale
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Product Variants (Options) Selection */}
          {product.hasVariants && product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center justify-between">
                <span>Select Preference / Variant</span>
                {selectedVariant && (
                  <span className="text-[11px] text-purple-300 font-medium">
                    {selectedVariant.title}
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const delta = Number(v.priceDeltaMinor || 0);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-400 bg-emerald-500/10 text-white font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                          : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="line-clamp-1">{v.title}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      {delta !== 0 && (
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          {delta > 0 ? `+${formatNaira(delta)}` : formatNaira(delta)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white">Quantity</span>
              <p className="text-[11px] text-white/40">
                {isPhysical ? (
                  isOutOfStock ? (
                    <span className="text-rose-400 font-semibold">Out of Stock</span>
                  ) : (
                    <span>{availableStock} available in inventory</span>
                  )
                ) : (
                  <span>Instant digital access</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || isOutOfStock}
                className="p-1.5 rounded-lg text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="px-3 text-xs font-mono font-bold text-white min-w-[2rem] text-center">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => (q < maxAllowedQty ? q + 1 : q))
                }
                disabled={quantity >= maxAllowedQty || isOutOfStock}
                className="p-1.5 rounded-lg text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Subtotal & Confirm Action */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-white/60">Calculated Subtotal</span>
              <span className="text-base font-black text-emerald-400 font-mono">
                {formatNaira(subtotalMinor)}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: isOutOfStock ? 1 : 1.02 }}
              whileTap={{ scale: isOutOfStock ? 1 : 0.98 }}
              disabled={isOutOfStock}
              onClick={handleConfirmAddToCart}
              className={`w-full py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg ${
                isOutOfStock
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : justAdded
                  ? "bg-emerald-500 text-black"
                  : "bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:opacity-95"
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Cart!</span>
                </>
              ) : isOutOfStock ? (
                <span>Item Currently Out of Stock</span>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Confirm & Add to Cart — {formatNaira(subtotalMinor)}</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
