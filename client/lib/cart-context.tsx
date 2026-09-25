"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useCartStore, CartItem } from "@/lib/cart-store";

export type { CartItem };

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  totalCount: number;
  totalAmountMinor: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalCount: 0,
  totalAmountMinor: 0,
  isOpen: false,
  setIsOpen: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const setIsOpen = useCartStore((state) => state.setIsOpen);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCount = mounted ? items.reduce((acc, i) => acc + i.quantity, 0) : 0;
  const totalAmountMinor = mounted
    ? items.reduce((acc, i) => acc + i.unitPriceMinor * i.quantity, 0)
    : 0;

  return (
    <CartContext.Provider
      value={{
        items: mounted ? items : [],
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        totalAmountMinor,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
