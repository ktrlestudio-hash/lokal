/**
 * Barrel exports para el módulo de Productos
 */

export * from './types';
export { productosAPI } from './api';
export {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useMyProducts,
  useCreateOrder,
  useMyOrders,
  useReceivedOrders,
  useOrder,
  useUpdateOrderStatus,
  useLeaveReview,
  useProductReviews,
  useAddToFavorites,
  useMyFavorites,
} from './hooks';
