/**
 * API functions para el módulo de Productos
 */

import type {
  Product,
  CreateProductInput,
  Order,
  CreateOrderInput,
  ProductReview,
  CreateProductReviewInput,
  ProductFilters,
  CartItem,
} from './types';

const API_BASE = '/.netlify/functions/productos';

/**
 * API object con métodos para gestionar productos
 */
export const productosAPI = {
  /**
   * Obtener lista de productos con filtros
   */
  async getAll(filters?: ProductFilters): Promise<Product[]> {
    const params = new URLSearchParams();
    if (filters?.city) params.append('city', filters.city);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.keyword) params.append('keyword', filters.keyword);
    if (filters?.priceMin) params.append('priceMin', filters.priceMin.toString());
    if (filters?.priceMax) params.append('priceMax', filters.priceMax.toString());
    if (filters?.condition) params.append('condition', filters.condition);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await fetch(`${API_BASE}?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching products: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtener detalle de un producto
   */
  async getById(productId: string): Promise<Product> {
    const response = await fetch(`${API_BASE}/${productId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching product: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Crear un nuevo producto
   */
  async create(data: CreateProductInput): Promise<Product> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error creating product: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Actualizar un producto
   */
  async update(productId: string, data: Partial<CreateProductInput>): Promise<Product> {
    const response = await fetch(`${API_BASE}/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error updating product: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Eliminar un producto
   */
  async delete(productId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${productId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error deleting product: ${response.statusText}`);
    }
  },

  /**
   * Obtener mis productos
   */
  async getMine(): Promise<Product[]> {
    const response = await fetch(`${API_BASE}?mine=true`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching my products: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Crear una orden de compra
   */
  async createOrder(data: CreateOrderInput): Promise<Order> {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error creating order: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtener mis órdenes como comprador
   */
  async getMyOrders(): Promise<Order[]> {
    const response = await fetch(`${API_BASE}/orders/my`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching my orders: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtener órdenes recibidas como vendedor
   */
  async getReceivedOrders(): Promise<Order[]> {
    const response = await fetch(`${API_BASE}/orders/received`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching received orders: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtener detalle de una orden
   */
  async getOrderById(orderId: string): Promise<Order> {
    const response = await fetch(`${API_BASE}/orders/${orderId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching order: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Actualizar estado de una orden
   */
  async updateOrderStatus(
    orderId: string,
    status: string,
    trackingNumber?: string
  ): Promise<Order> {
    const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, trackingNumber }),
    });

    if (!response.ok) {
      throw new Error(`Error updating order status: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Dejar reseña de un producto
   */
  async leaveReview(orderId: string, data: CreateProductReviewInput): Promise<ProductReview> {
    const response = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, ...data }),
    });

    if (!response.ok) {
      throw new Error(`Error leaving review: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtener reseñas de un producto
   */
  async getProductReviews(productId: string): Promise<ProductReview[]> {
    const response = await fetch(`${API_BASE}/${productId}/reviews`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching reviews: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Agregar a favoritos
   */
  async addToFavorites(productId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${productId}/favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error adding to favorites: ${response.statusText}`);
    }
  },

  /**
   * Remover de favoritos
   */
  async removeFromFavorites(productId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${productId}/favorite`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error removing from favorites: ${response.statusText}`);
    }
  },

  /**
   * Obtener mis favoritos
   */
  async getMyFavorites(): Promise<Product[]> {
    const response = await fetch(`${API_BASE}/favorites/my`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching favorites: ${response.statusText}`);
    }

    return response.json();
  },
};
