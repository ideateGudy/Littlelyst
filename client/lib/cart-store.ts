import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  productId: string;
  sellerId: string;
  title: string;
  slug: string;
  image?: string;
  productType: string;
  variantId?: string;
  variantTitle?: string;
  unitPriceMinor: number;
  originalPriceMinor: number;
  discountPriceMinor?: number;
  promoPriceMinor?: number;
  hasPromo?: boolean;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  getTotalCount: () => number;
  getTotalAmountMinor: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item, quantity = 1) => {
        set((state) => {
          const index = state.items.findIndex(
            (i) =>
              i.productId === item.productId &&
              (i.variantId || null) === (item.variantId || null)
          );

          if (index >= 0) {
            const next = [...state.items];
            next[index] = {
              ...next[index],
              quantity: next[index].quantity + quantity,
            };
            return { items: next, isOpen: true };
          }

          return {
            items: [...state.items, { ...item, quantity }],
            isOpen: true,
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(
                i.productId === productId &&
                (i.variantId || null) === (variantId || null)
              )
          ),
        }));
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        set((state) => ({
          items: state.items.map((i) => {
            if (
              i.productId === productId &&
              (i.variantId || null) === (variantId || null)
            ) {
              return { ...i, quantity };
            }
            return i;
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      setIsOpen: (isOpen: boolean) => set({ isOpen }),

      getTotalCount: () => {
        return get().items.reduce((acc, i) => acc + i.quantity, 0);
      },

      getTotalAmountMinor: () => {
        return get().items.reduce((acc, i) => acc + i.unitPriceMinor * i.quantity, 0);
      },
    }),
    {
      name: "littlelyst_cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
