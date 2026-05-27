/**
 * Tipos para el módulo de Productos
 * Venta de productos entre usuarios/tiendas
 */

/**
 * Condición del producto
 */
export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair' | 'refurbished';

/**
 * Estado de un producto
 */
export type ProductStatus = 'available' | 'sold' | 'reserved' | 'archived';

/**
 * Tipos de transacción
 */
export type TransactionType = 'sale' | 'exchange' | 'auction';

/**
 * Estado de una venta
 */
export type SaleStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'dispute';

/**
 * Producto en venta
 */
export interface Product {
  id: string;
  userId: string; // Vendedor
  storeId?: string; // Tienda del vendedor (opcional)
  title: string;
  description: string;
  category: string; // "Electrónica", "Muebles", "Ropa", etc.
  subcategory?: string;
  condition: ProductCondition;
  price: number;
  currency: 'ARS' | 'USD';
  originalPrice?: number; // Precio original si es descuento
  images: string[]; // URLs de fotos
  location: {
    lat: number;
    lng: number;
    city: string;
    address?: string;
  };
  specs?: Record<string, string>; // Especificaciones: {color: "rojo", marca: "Samsung"}
  stock: number; // Cantidad disponible
  sold: number; // Cantidad vendida
  transactionType: TransactionType;
  shippingAvailable: boolean;
  shippingCost?: number;
  pickupAvailable: boolean;
  warranty?: string; // "6 meses"
  tags: string[];
  status: ProductStatus;
  views: number;
  favorites: number;
  rating: number; // Promedio del vendedor
  reviews: number; // Total de reviews
  createdAt: string;
  updatedAt: string;
}

/**
 * Input para crear un producto
 */
export interface CreateProductInput {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  condition: ProductCondition;
  price: number;
  currency?: 'ARS' | 'USD';
  originalPrice?: number;
  images: string[];
  location: {
    lat: number;
    lng: number;
    city: string;
    address?: string;
  };
  specs?: Record<string, string>;
  stock?: number;
  transactionType?: TransactionType;
  shippingAvailable?: boolean;
  shippingCost?: number;
  pickupAvailable?: boolean;
  warranty?: string;
  tags?: string[];
}

/**
 * Carrito de compras del usuario
 */
export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: string;
}

/**
 * Orden de compra
 */
export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    title: string;
  }>;
  totalAmount: number;
  currency: 'ARS' | 'USD';
  status: SaleStatus;
  shippingAddress?: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  trackingNumber?: string;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Input para crear una orden
 */
export interface CreateOrderInput {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress?: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod?: string;
  notes?: string;
}

/**
 * Reseña de producto/vendedor
 */
export interface ProductReview {
  id: string;
  orderId: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  rating: number; // 1-5 estrellas
  title: string;
  comment: string;
  aspectsRating?: {
    accuracy: number;
    communication: number;
    shipping: number;
  };
  images?: string[];
  status: 'pending' | 'published' | 'reported';
  createdAt: string;
  updatedAt: string;
}

/**
 * Input para crear una reseña
 */
export interface CreateProductReviewInput {
  rating: number;
  title: string;
  comment: string;
  aspectsRating?: {
    accuracy: number;
    communication: number;
    shipping: number;
  };
  images?: string[];
}

/**
 * Favorito del usuario
 */
export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  addedAt: string;
}

/**
 * Filtros para listar productos
 */
export interface ProductFilters {
  city?: string;
  category?: string;
  subcategory?: string;
  condition?: ProductCondition;
  priceMin?: number;
  priceMax?: number;
  keyword?: string;
  tags?: string[];
  transactionType?: TransactionType;
  shippingAvailable?: boolean;
  pickupAvailable?: boolean;
  status?: ProductStatus;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'views';
  limit?: number;
  offset?: number;
}

/**
 * Oferta de intercambio (exchange offer)
 */
export interface ExchangeOffer {
  id: string;
  fromUserId: string;
  toUserId: string;
  productId: string; // Producto que se vende
  offeredProductId?: string; // Producto que se ofrece a cambio (opcional si es dinero)
  offeredAmount?: number; // Dinero ofrecido (opcional)
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdAt: string;
  respondedAt?: string;
}
