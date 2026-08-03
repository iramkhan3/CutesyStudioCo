"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLineItem, CartLineItemInput } from "@/lib/types";

type CartState = {
  items: CartLineItem[];
  couponCode: string | null;
  addItem: (item: CartLineItemInput, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => void;
  clearCoupon: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      couponCode: null,
      addItem: (item, quantity = 1) =>
        set((state) => {
          // Custom builds always get their own id (each note/selection is
          // distinct), so only product-kind items dedupe by id.
          const existing =
            item.kind === "product"
              ? state.items.find((i) => i.id === item.id)
              : undefined;
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity } as CartLineItem] };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),
      clearCart: () => set({ items: [], couponCode: null }),
      applyCoupon: (code) => set({ couponCode: code.trim().toUpperCase() }),
      clearCoupon: () => set({ couponCode: null }),
    }),
    {
      // Cart persists in localStorage until checkout completes (clearCart()
      // is called on successful payment verification).
      name: "cutesystudioco-cart",
    }
  )
);

export function cartSubtotalInr(items: CartLineItem[]): number {
  return items.reduce((sum, i) => sum + i.priceInr * i.quantity, 0);
}

export function cartItemCount(items: CartLineItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
