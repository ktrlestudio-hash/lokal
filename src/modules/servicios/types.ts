/**
 * Tipos para el módulo de Servicios
 * Servicios ofrecidos por usuarios/tiendas (limpieza, plomería, etc.)
 */

/**
 * Categoría de servicio
 */
export type ServiceCategory =
  | 'limpieza'
  | 'plomeria'
  | 'electricidad'
  | 'carpinteria'
  | 'jardineria'
  | 'mudanzas'
  | 'delivery'
  | 'asesoria'
  | 'reparaciones'
  | 'otros';

/**
 * Estado de una solicitud de servicio
 */
export type ServiceRequestStatus =
  | 'open'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'dispute';

/**
 * Servicio ofrecido
 */
export interface Service {
  id: string;
  userId: string; // Usuario que ofrece el servicio
  title: string; // "Limpieza de casas", "Reparación de smartphones"
  description: string;
  category: ServiceCategory;
  priceMin: number; // Precio mínimo en ARS
  priceMax: number; // Precio máximo en ARS
  currency: 'ARS' | 'USD';
  location: {
    lat: number;
    lng: number;
    city: string;
    address?: string;
    radius?: number; // Área de cobertura en km
  };
  availability: {
    monday?: { start: string; end: string }; // "09:00", "18:00"
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };
  images: string[]; // URLs de fotos del servicio
  experience: string; // Años de experiencia
  credentials?: string[]; // Certificaciones
  rating: number; // Calificación promedio (0-5)
  totalReviews: number;
  completedServices: number;
  status: 'active' | 'inactive';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Input para crear un servicio
 */
export interface CreateServiceInput {
  title: string;
  description: string;
  category: ServiceCategory;
  priceMin: number;
  priceMax: number;
  currency?: 'ARS' | 'USD';
  location: {
    lat: number;
    lng: number;
    city: string;
    address?: string;
    radius?: number;
  };
  availability?: Record<string, { start: string; end: string }>;
  images?: string[];
  experience?: string;
  credentials?: string[];
  tags?: string[];
}

/**
 * Solicitud de servicio (cuando alguien pide un servicio)
 */
export interface ServiceRequest {
  id: string;
  serviceId: string;
  userId: string; // Usuario que solicita
  providerId: string; // Usuario que ofrece el servicio
  title: string;
  description: string;
  preferredDate: string; // ISO 8601
  location: {
    lat: number;
    lng: number;
    city: string;
    address?: string;
  };
  estimatedBudget?: number;
  status: ServiceRequestStatus;
  acceptedAt?: string;
  completedAt?: string;
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input para solicitar un servicio
 */
export interface RequestServiceInput {
  title: string;
  description: string;
  preferredDate: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    address?: string;
  };
  estimatedBudget?: number;
}

/**
 * Filtros para listar servicios
 */
export interface ServiceFilters {
  city?: string;
  category?: ServiceCategory;
  priceMin?: number;
  priceMax?: number;
  radius?: number; // Buscar en radio (km)
  centerLat?: number;
  centerLng?: number;
  rating?: number; // Calificación mínima
  keyword?: string;
  tags?: string[];
  status?: 'active' | 'inactive';
  limit?: number;
  offset?: number;
}
