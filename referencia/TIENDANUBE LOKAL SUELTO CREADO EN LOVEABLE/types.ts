export type BusinessMode = "shop" | "service" | "hybrid";
export type StylePreset = "rounded" | "sharp" | "minimal" | "bold";
export type TypographyPreset = "modern" | "friendly" | "elegant" | "condensed";
export type LayoutPreset = "grid" | "cards" | "feed" | "hero-list";

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  featured?: boolean;
}

export interface Service {
  id: string;
  title: string;
  price: number | null; // null = "consultar"
  duration?: string;
  description?: string;
  image?: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number; // 1-5
  comment: string;
}

export interface Highlight {
  id: string;
  label: string;
  image: string;
}

export interface BusinessTheme {
  primary: string;   // HSL "H S% L%"
  secondary: string;
  accent: string;
  stylePreset: StylePreset;
  typography: TypographyPreset;
  layout: LayoutPreset;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string;
  mode: BusinessMode;
  logo?: string;        // URL or emoji fallback handled in UI
  cover?: string;
  whatsapp: string;     // E.164 digits only, no +
  instagram?: string;
  phone?: string;
  address?: string;
  mapQuery?: string;    // used for map embed
  rating: number;
  reviewCount: number;
  defaultMessage: string;
  theme: BusinessTheme;
  products: Product[];
  services: Service[];
  reviews: Review[];
  highlights: Highlight[];
  availability?: string;
}
