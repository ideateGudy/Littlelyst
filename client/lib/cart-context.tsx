/**
 * Shim: re-exports from cart-store so existing `import { useCart } from "@/lib/cart-context"` still works.
 * CartProvider is now a no-op — all cart state lives in Zustand (useCartStore).
 */
"use client";

export { useCartStore, type CartItem } from "@/lib/cart-store";

import { useCartStore } from "@/lib/cart-store";

/** Direct Zustand hook — replaces useContext(CartContext). */
export function useCart() {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const setIsOpen = useCartStore((s) => s.setIsOpen);

  const totalCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalAmountMinor = items.reduce((acc, i) => acc + i.unitPriceMinor * i.quantity, 0);

  return { items, addItem, removeItem, updateQuantity, clearCart, totalCount, totalAmountMinor, isOpen, setIsOpen };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
