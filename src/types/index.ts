/**
 * LOKAL Core Types
 * Tipos centrales del ecosistema: identidad única, roles dinámicos, reputación, ubicación, actividad
 * Siguiendo la filosofía: UNA identidad con múltiples capacidades (no múltiples cuentas)
 */

// ─────────────────────────────────────────────────────────────────────────────
// IDENTIDAD CENTRAL
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'entrepreneur' | 'verified_store' | 'admin';

export type UserCapabilities = {
  canCreateDemandas: boolean;
  canExploreMap: boolean;
  canApplyForJobs: boolean;
  canPublishServices: boolean;
  canPublishJobs: boolean;
  canPublishProducts: boolean;
  canAccessStats: boolean;
  canCreateMiniWeb: boolean;
  canManageStore: boolean;
};

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  
  // ─── Ubicación ───────────────────────────────────────────────────────
  location?: {
    lat: number;
    lng: number;
    city: string;
    neighborhood?: string;
  };
  
  // ─── Identidad: Sistema de roles dinámicos ────────────────────────────
  // NO: cuenta usuario, cuenta empresa, cuenta CV
  // SÍ: una identidad con capacidades habilitadas
  roles: UserRole[];
  capabilities: UserCapabilities;
  
  // ─── Perfil de Usuario ────────────────────────────────────────────────
  bio?: string;
  skills?: string[];
  interests?: string[];
  availability?: {
    status: 'available' | 'unavailable' | 'searching';
    from?: string; // ISO date
    to?: string;   // ISO date
  };
  
  // ─── Reputación ──────────────────────────────────────────────────────
  reputation: {
    rating: number; // 0-5
    reviewCount: number;
    completionRate: number; // porcentaje
  };
  
  // ─── Estadísticas de Actividad ─────────────────────────────────────
  stats: {
    profileViews: number;
    interactions: number;
    savedItems: number;
    applications: number; // si es candidato
  };
  
  // ─── Preferencias ────────────────────────────────────────────────────
  preferences?: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: {
      enabled: boolean;
      email: boolean;
      push: boolean;
    };
  };
  
  // ─── Métadata ───────────────────────────────────────────────────────
  lastActiveAt: string;
  isVerified: boolean;
  isSuspended: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// IDENTIDAD DE TIENDA (Empresa/Comercio)
// Puede ser la misma persona si tiene rol "entrepreneur" o "verified_store"
// ─────────────────────────────────────────────────────────────────────────────

export interface StoreProfile {
  id: string;
  userId: string; // FK a UserProfile.id
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  
  // ─── Ubicación ───────────────────────────────────────────────────────
  location: {
    lat: number;
    lng: number;
    city: string;
    address: string;
    phone?: string;
    whatsapp?: string;
  };
  
  // ─── Identidad de Tienda ──────────────────────────────────────────────
  category: string; // Retail, Servicios, etc.
  tags?: string[];
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  
  // ─── Horarios ────────────────────────────────────────────────────────
  schedules?: {
    lunes?: string; // "09:00-18:00"
    martes?: string;
    miercoles?: string;
    jueves?: string;
    viernes?: string;
    sabado?: string;
    domingo?: string;
  };
  
  // ─── Verificación y Reputación ───────────────────────────────────────
  isVerified: boolean;
  verifiedAt?: string;
  reputation: {
    rating: number; // 0-5
    reviewCount: number;
  };
  
  // ─── Estadísticas ────────────────────────────────────────────────────
  stats: {
    views: number;
    interactions: number;
    jobsPosted: number;
    applicants: number;
    productsPublished: number;
  };
  
  // ─── Estado ──────────────────────────────────────────────────────────
  isActive: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULOS: TIPOS DE CONTENIDO
// ─────────────────────────────────────────────────────────────────────────────

// ──── Demandas (productos buscados, necesidades) ──────────────────────────────
export interface Demanda {
  id: string;
  userId: string; // Quien busca
  title: string;
  description: string;
  category: string;
  tags?: string[];
  location: {
    lat: number;
    lng: number;
    city: string;
    radius?: number; // km
  };
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'resolved' | 'expired';
  responses?: string[]; // IDs de respuestas
}

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
  category: 'demanda' | 'oportunidad' | 'servicio' | 'producto' | 'viaje' | 'general';
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
  | 'demanda_created'
  | 'demanda_responded'
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
  relatedItemType?: 'job' | 'product' | 'service' | 'demanda';
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
    demandas: boolean;
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
