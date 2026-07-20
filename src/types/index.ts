/**
 * LOKAL Core Types
 * Tipos centrales del ecosistema: identidad única, roles dinámicos, reputación, ubicación, actividad
 * Siguiendo la filosofía: UNA identidad con múltiples capacidades (no múltiples cuentas)
 */

// ─────────────────────────────────────────────────────────────────────────────
// IDENTIDAD CENTRAL
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'entrepreneur' | 'verified_store' | 'admin';

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULOS: TIPOS DE CONTENIDO
// ─────────────────────────────────────────────────────────────────────────────

// ──── Oportunidades Laborales ────────────────────────────────────────────────
export interface JobOpportunity {
  id: string;
  storeId: string; // Quien publica
  title: string;
  description: string;
  category: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  location: {
    lat: number;
    lng: number;
    city: string;
    remote: boolean;
  };
  requirements?: string[];
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'closed' | 'filled';
  applications?: string[]; // IDs de applicants
}

// ──── Servicios (personas ofrecen habilidades/changas) ────────────────────────
export interface Service {
  id: string;
  userId: string; // Quien ofrece
  title: string;
  description: string;
  category: string;
  skillsTags: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  location: {
    lat: number;
    lng: number;
    city: string;
  };
  availability: {
    status: 'available' | 'limited' | 'unavailable';
    responseTime?: string; // "24h", "1week"
  };
  createdAt: string;
  rating: number;
  reviewCount: number;
}

// ──── Productos (catálogos locales, marketplace) ─────────────────────────────
export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
  images?: string[];
  location: {
    lat: number;
    lng: number;
    city: string;
  };
  createdAt: string;
  rating: number;
  reviewCount: number;
}

// ──── Viajes (compartir viajes, gastos) ──────────────────────────────────────
export interface Trip {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  origin: {
    lat: number;
    lng: number;
    address: string;
  };
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
  departureTime: string; // ISO datetime
  seats: number;
  seatsAvailable: number;
  costPerSeat: number;
  currency: string;
  status: 'active' | 'completed' | 'cancelled';
  passengers: string[]; // IDs de pasajeros
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// REPUTACIÓN Y CALIFICACIONES
// ─────────────────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  fromUserId: string;
  toUserId: string;
  rating: number; // 1-5
  comment: string;
  category: 'oportunidad' | 'servicio' | 'producto' | 'viaje' | 'general';
  relatedItemId?: string; // ID de lo que se califica
  createdAt: string;
}

export interface ReputationRecord {
  userId: string;
  rating: number; // promedio
  totalReviews: number;
  completionRate: number;
  verificationLevel: 'none' | 'email' | 'phone' | 'government';
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVIDAD Y NOTIFICACIONES
// ─────────────────────────────────────────────────────────────────────────────

export type ActivityType =
  | 'job_applied'
  | 'job_rejected'
  | 'job_accepted'
  | 'service_requested'
  | 'product_purchased'
  | 'trip_joined'
  | 'review_received'
  | 'message_received';

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  relatedItemId: string;
  relatedUserId?: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: ActivityType;
  relatedItemId?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  deliveryChannels: ('in-app' | 'email' | 'push')[];
}

// ─────────────────────────────────────────────────────────────────────────────
// MENSAJERÍA
// ─────────────────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  attachments?: string[];
  read: boolean;
  readAt?: string;
  createdAt: string;
  conversationId: string;
}

export interface Conversation {
  id: string;
  participantIds: [string, string];
  lastMessage?: Message;
  lastMessageAt: string;
  unreadCount: number;
  relatedItemId?: string; // Si vino de un job, producto, etc.
  relatedItemType?: 'job' | 'product' | 'service';
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN Y FEATURE FLAGS
// ─────────────────────────────────────────────────────────────────────────────

export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  beta?: boolean;
  limitByCity?: string[];
  limitByUserRole?: UserRole[];
  limitByPercentage?: number; // A/B testing
}

export interface AppConfig {
  featureFlags: FeatureFlag[];
  modules: {
    oportunidades: boolean;
    servicios: boolean;
    viajes: boolean;
    productos: boolean;
    miniwebs: boolean;
  };
  theme: {
    brand: string;
    colors: Record<string, string>;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO GLOBAL DE LA APP
// ─────────────────────────────────────────────────────────────────────────────

export interface AppState {
  // Autenticación
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Identidad: Rol actual en contexto
  // Una persona puede ser usuario + entrepreneur + verified_store
  // pero en un momento está en "modo" usuario o "modo" tienda
  currentMode: 'user' | 'store';
  currentStoreId?: string; // Si está en modo store
  
  // Configuración
  config: AppConfig;
  
  // UI
  theme: 'light' | 'dark';
  language: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES DE TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export type AsyncStatus = 'idle' | 'pending' | 'success' | 'error';

export interface AsyncRequest<T> {
  status: AsyncStatus;
  data?: T;
  error?: Error;
  loading: boolean;
}

export type Optional<T> = T | undefined;
export type Nullable<T> = T | null;
