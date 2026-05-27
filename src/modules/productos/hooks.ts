/**
 * Custom hooks para el módulo de Productos
 */

import { useState, useCallback } from 'react';
import { useAsync } from '../../../hooks';
import { productosAPI } from './api';
import type {
  Product,
  CreateProductInput,
  Order,
  CreateOrderInput,
  ProductReview,
  CreateProductReviewInput,
  ProductFilters,
} from './types';

/**
 * Hook para obtener lista de productos
 */
export function useProducts(filters?: ProductFilters) {
  const { data: products, ...state } = useAsync<Product[]>(
    () => productosAPI.getAll(filters),
    [filters?.city, filters?.category, filters?.keyword]
  );

  const refetch = useCallback(() => {
    return productosAPI.getAll(filters);
  }, [filters]);

  return {
    products: products || [],
    ...state,
    refetch,
  };
}

/**
 * Hook para obtener detalle de un producto
 */
export function useProduct(productId: string | undefined) {
  const { data: product, ...state } = useAsync<Product>(
    () => (productId ? productosAPI.getById(productId) : Promise.reject('No product ID')),
    [productId]
  );

  return {
    product,
    ...state,
  };
}

/**
 * Hook para crear un producto
 */
export function useCreateProduct() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: CreateProductInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const product = await productosAPI.create(data);
      return product;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating product';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

/**
 * Hook para actualizar un producto
 */
export function useUpdateProduct() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (productId: string, data: Partial<CreateProductInput>) => {
    setIsLoading(true);
    setError(null);
    try {
      const product = await productosAPI.update(productId, data);
      return product;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating product';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { update, isLoading, error };
}

/**
 * Hook para obtener mis productos
 */
export function useMyProducts() {
  const { data: myProducts, ...state } = useAsync<Product[]>(
    () => productosAPI.getMine(),
    []
  );

  return {
    myProducts: myProducts || [],
    ...state,
  };
}

/**
 * Hook para crear una orden de compra
 */
export function useCreateOrder() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: CreateOrderInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const order = await productosAPI.createOrder(data);
      return order;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating order';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

/**
 * Hook para obtener mis órdenes como comprador
 */
export function useMyOrders() {
  const { data: myOrders, ...state } = useAsync<Order[]>(
    () => productosAPI.getMyOrders(),
    []
  );

  return {
    myOrders: myOrders || [],
    ...state,
  };
}

/**
 * Hook para obtener órdenes recibidas como vendedor
 */
export function useReceivedOrders() {
  const { data: receivedOrders, ...state } = useAsync<Order[]>(
    () => productosAPI.getReceivedOrders(),
    []
  );

  return {
    receivedOrders: receivedOrders || [],
    ...state,
  };
}

/**
 * Hook para obtener detalle de una orden
 */
export function useOrder(orderId: string | undefined) {
  const { data: order, ...state } = useAsync<Order>(
    () => (orderId ? productosAPI.getOrderById(orderId) : Promise.reject('No order ID')),
    [orderId]
  );

  return {
    order,
    ...state,
  };
}

/**
 * Hook para actualizar estado de una orden
 */
export function useUpdateOrderStatus() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (orderId: string, status: string, trackingNumber?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const order = await productosAPI.updateOrderStatus(orderId, status, trackingNumber);
      return order;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating order status';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { update, isLoading, error };
}

/**
 * Hook para dejar reseña de un producto
 */
export function useLeaveReview() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leave = useCallback(async (orderId: string, data: CreateProductReviewInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const review = await productosAPI.leaveReview(orderId, data);
      return review;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error leaving review';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { leave, isLoading, error };
}

/**
 * Hook para obtener reseñas de un producto
 */
export function useProductReviews(productId: string | undefined) {
  const { data: reviews, ...state } = useAsync<ProductReview[]>(
    () => (productId ? productosAPI.getProductReviews(productId) : Promise.reject('No product ID')),
    [productId]
  );

  return {
    reviews: reviews || [],
    ...state,
  };
}

/**
 * Hook para agregar a favoritos
 */
export function useAddToFavorites() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = useCallback(async (productId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await productosAPI.addToFavorites(productId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error adding to favorites';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { add, isLoading, error };
}

/**
 * Hook para obtener mis favoritos
 */
export function useMyFavorites() {
  const { data: favorites, ...state } = useAsync<Product[]>(
    () => productosAPI.getMyFavorites(),
    []
  );

  return {
    favorites: favorites || [],
    ...state,
  };
}
