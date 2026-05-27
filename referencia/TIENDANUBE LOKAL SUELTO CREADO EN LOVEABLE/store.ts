import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Business, Product, Service, BusinessTheme, BusinessMode } from "./types";
import { seedBusinesses } from "./seedData";

interface LokalState {
  businesses: Business[];
  getBusiness: (slug: string) => Business | undefined;
  updateTheme: (id: string, theme: Partial<BusinessTheme>) => void;
  updateBusiness: (id: string, patch: Partial<Business>) => void;
  upsertProduct: (id: string, product: Product) => void;
  removeProduct: (id: string, productId: string) => void;
  upsertService: (id: string, service: Service) => void;
  removeService: (id: string, serviceId: string) => void;
  setMode: (id: string, mode: BusinessMode) => void;
  resetAll: () => void;
}

export const useLokalStore = create<LokalState>()(
  persist(
    (set, get) => ({
      businesses: seedBusinesses,
      getBusiness: (slug) => get().businesses.find((b) => b.slug === slug),
      updateTheme: (id, theme) =>
        set((s) => ({
          businesses: s.businesses.map((b) =>
            b.id === id ? { ...b, theme: { ...b.theme, ...theme } } : b,
          ),
        })),
      updateBusiness: (id, patch) =>
        set((s) => ({
          businesses: s.businesses.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      upsertProduct: (id, product) =>
        set((s) => ({
          businesses: s.businesses.map((b) => {
            if (b.id !== id) return b;
            const exists = b.products.some((p) => p.id === product.id);
            return {
              ...b,
              products: exists
                ? b.products.map((p) => (p.id === product.id ? product : p))
                : [...b.products, product],
            };
          }),
        })),
      removeProduct: (id, productId) =>
        set((s) => ({
          businesses: s.businesses.map((b) =>
            b.id === id ? { ...b, products: b.products.filter((p) => p.id !== productId) } : b,
          ),
        })),
      upsertService: (id, service) =>
        set((s) => ({
          businesses: s.businesses.map((b) => {
            if (b.id !== id) return b;
            const exists = b.services.some((p) => p.id === service.id);
            return {
              ...b,
              services: exists
                ? b.services.map((p) => (p.id === service.id ? service : p))
                : [...b.services, service],
            };
          }),
        })),
      removeService: (id, serviceId) =>
        set((s) => ({
          businesses: s.businesses.map((b) =>
            b.id === id ? { ...b, services: b.services.filter((p) => p.id !== serviceId) } : b,
          ),
        })),
      setMode: (id, mode) =>
        set((s) => ({
          businesses: s.businesses.map((b) => (b.id === id ? { ...b, mode } : b)),
        })),
      resetAll: () => set({ businesses: seedBusinesses }),
    }),
    { name: "lokal-store-v1" },
  ),
);
