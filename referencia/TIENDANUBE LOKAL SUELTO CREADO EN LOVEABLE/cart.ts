import { create } from "zustand";
import type { CartItem } from "./whatsapp";
import type { Product } from "./types";

interface CartState {
  byBusiness: Record<string, CartItem[]>;
  add: (businessId: string, product: Product) => void;
  remove: (businessId: string, productId: string) => void;
  setQty: (businessId: string, productId: string, qty: number) => void;
  clear: (businessId: string) => void;
  items: (businessId: string) => CartItem[];
}

export const useCart = create<CartState>((set, get) => ({
  byBusiness: {},
  items: (businessId) => get().byBusiness[businessId] ?? [],
  add: (businessId, product) =>
    set((s) => {
      const current = s.byBusiness[businessId] ?? [];
      const existing = current.find((i) => i.productId === product.id);
      const next = existing
        ? current.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...current, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
      return { byBusiness: { ...s.byBusiness, [businessId]: next } };
    }),
  remove: (businessId, productId) =>
    set((s) => ({
      byBusiness: {
        ...s.byBusiness,
        [businessId]: (s.byBusiness[businessId] ?? []).filter((i) => i.productId !== productId),
      },
    })),
  setQty: (businessId, productId, qty) =>
    set((s) => ({
      byBusiness: {
        ...s.byBusiness,
        [businessId]: (s.byBusiness[businessId] ?? [])
          .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, qty) } : i))
          .filter((i) => i.quantity > 0),
      },
    })),
  clear: (businessId) => set((s) => ({ byBusiness: { ...s.byBusiness, [businessId]: [] } })),
}));
