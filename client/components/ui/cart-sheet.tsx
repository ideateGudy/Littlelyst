"use client";

import React, { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { triggerPaystackCheckout } from "@/lib/paystack";
import { apiClient } from "@/lib/api-client";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Check,
} from "lucide-react";

export function CartSheet() {
  const {
    items,
    isOpen,
    setIsOpen,
    updateQuantity,
    removeItem,
    clearCart,
    totalCount,
    totalAmountMinor,
  } = useCart();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutSuccess, setCheckoutSuccess] = useState<any | null>(null);

  const formatNaira = (minor: number) => {
    return `₦${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const hasPhysical = items.some((i) => i.productType === "PHYSICAL");

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setCheckingOut(true);
    setCheckoutError("");

    try {
      // Process first item as primary order checkout or batch
      const primaryItem = items[0];
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
          sellerId: primaryItem.sellerId,
          productId: primaryItem.productId,
          variantId: primaryItem.variantId,
          quantity: primaryItem.quantity,
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim(),
          buyerPhone: buyerPhone.trim(),
          buyerAddress: hasPhysical ? buyerAddress.trim() : undefined,
          trafficSource: "cart",
        }),
      });

      if (res.data) {
        const orderData = res.data;

        await triggerPaystackCheckout({
          email: orderData.buyerEmail,
          amountMinor: totalAmountMinor,
          reference: orderData.paystackReference,
          subaccount: orderData.subaccount,
          platformFeeMinor: orderData.platformFeeMinor ? Number(orderData.platformFeeMinor) : undefined,
          buyerName,
          buyerPhone,
          selectedChannel: paymentMethod,
          onSuccess: (verifiedRef) => {
            setCheckoutSuccess({
              reference: verifiedRef,
              count: totalCount,
            });
            clearCart();
            setCheckingOut(false);
          },
          onClose: () => {
            setCheckingOut(false);
          },
          onError: (err) => {
            setCheckoutError(err);
            setCheckingOut(false);
          },
        });
      } else {
        setCheckingOut(false);
      }
    } catch (err: any) {
      setCheckoutError(err.message || "Failed to process checkout");
      setCheckingOut(false);
    }
  };

  return (
    <>
      {/* Floating Cart Trigger Pill if items exist */}
      {totalCount > 0 && !isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 sm:bottom-8 right-5 z-40 px-4 py-3 rounded-full bg-emerald-500 text-black font-extrabold text-xs flex items-center gap-2.5 shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4" />
            <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-black text-emerald-400 text-[10px] font-bold flex items-center justify-center">
              {totalCount}
            </span>
          </div>
          <span>Cart ({formatNaira(totalAmountMinor)})</span>
        </motion.button>
      )}

      {/* Cart Drawer Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border-l border-white/10 h-full flex flex-col justify-between z-10 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Your Shopping Cart</h3>
                    <p className="text-[11px] text-white/50">{totalCount} item{totalCount === 1 ? "" : "s"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {items.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mx-auto">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-white/50">Your cart is currently empty</p>
                  </div>
                ) : (
                  items.map((item, idx) => (
                    <div
                      key={`${item.productId}-${item.variantId || idx}`}
                      className="liquid-glass-subtle p-3 rounded-2xl border border-white/10 flex gap-3 items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 bg-black/50"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center text-white/20 shrink-0">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                          {item.variantTitle && (
                            <p className="text-[10px] text-purple-400 font-medium">{item.variantTitle}</p>
                          )}
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-xs font-bold text-emerald-400">
                              {formatNaira(item.unitPriceMinor)}
                            </span>
                            {item.originalPriceMinor > item.unitPriceMinor && (
                              <span className="text-[10px] text-white/40 line-through">
                                {formatNaira(item.originalPriceMinor)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-black/60 border border-white/10 rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                            className="p-1 text-white/50 hover:text-white cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-mono text-white font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                            className="p-1 text-white/50 hover:text-white cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="p-1 text-white/40 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Footer */}
              {items.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-white/10 space-y-3 bg-black/40">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Cart Subtotal</span>
                    <span className="text-base font-extrabold text-white">
                      {formatNaira(totalAmountMinor)}
                    </span>
                  </div>

                  <button
                    onClick={() => setCheckoutOpen(true)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:opacity-95 transition-all cursor-pointer"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center justify-around text-[10px] text-white/40 pt-1">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" /> Paystack Instant Checkout
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-cyan-400" /> Verified Merchant
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Checkout Modal */}
      <AnimatePresence>
        {checkoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCheckoutOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 space-y-4 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-bold text-white">Guest Checkout Details</h3>
                <button
                  onClick={() => setCheckoutOpen(false)}
                  className="p-1 rounded-lg text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {checkoutSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Payment Successful!</h4>
                  <p className="text-xs text-white/50">
                    Reference: <span className="font-mono text-emerald-400">{checkoutSuccess.reference}</span>
                  </p>
                  <button
                    onClick={() => {
                      setCheckoutSuccess(null);
                      setCheckoutOpen(false);
                      setIsOpen(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCheckout} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/70">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Chioma Adeleke"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/70">Email Address (For Receipt)</label>
                    <input
                      type="email"
                      required
                      placeholder="chioma@example.com"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/70">Phone Number (WhatsApp)</label>
                    <input
                      type="tel"
                      required
                      placeholder="+234..."
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-semibold text-white/80 uppercase tracking-wider flex items-center justify-between">
                      <span>Choose Payment Method</span>
                      <span className="text-[10px] text-emerald-400 font-normal">Via Paystack Secure</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "card", name: "Debit / Credit Card", desc: "Mastercard, Visa, Verve" },
                        { id: "bank_transfer", name: "Bank Transfer", desc: "Instant transfer to account" },
                        { id: "ussd", name: "USSD (*737#, etc.)", desc: "GTB, Zenith, UBA & more" },
                        { id: "mobile_money", name: "Mobile Money / Barter", desc: "Opay, PalmPay & wallets" },
                      ].map((pm) => {
                        const isSelected = paymentMethod === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                                : "border-white/10 bg-white/[0.02] hover:border-white/20"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white line-clamp-1">{pm.name}</span>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            </div>
                            <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">{pm.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {hasPhysical && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-white/70">Delivery Address</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Your physical delivery address..."
                        value={buyerAddress}
                        onChange={(e) => setBuyerAddress(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                  )}

                  {checkoutError && <p className="text-[11px] text-rose-400">{checkoutError}</p>}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={checkingOut}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {checkingOut ? "Connecting to Paystack..." : `Pay ${formatNaira(totalAmountMinor)} Now`}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
