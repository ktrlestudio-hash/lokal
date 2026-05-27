/**
 * LOKAL Feature Flags & Configuration
 * Sistema centralizado para activar/desactivar módulos, beta features, limitar por ciudad/usuario
 */

import type { FeatureFlag, AppConfig } from '../types/index';

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE FLAGS: Define qué módulos y features están disponibles
// ─────────────────────────────────────────────────────────────────────────────

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Core features
  DEMANDAS: {
    key: 'module.demandas',
    name: 'Demandas',
    description: 'Usuarios publican necesidades/productos buscados',
    enabled: true,
    beta: false,
  },

  OPORTUNIDADES: {
    key: 'module.oportunidades',
    name: 'Oportunidades Laborales',
    description: 'Publicación de trabajos y búsqueda de candidatos',
    enabled: true,
    beta: false,
  },

  SERVICIOS: {
    key: 'module.servicios',
    name: 'Servicios',
    description: 'Personas ofrecen habilidades y changas',
    enabled: true,
    beta: true, // En beta
  },

  VIAJES: {
    key: 'module.viajes',
    name: 'Compartir Viajes',
    description: 'Compartir viajes y gastos',
    enabled: true,
    beta: true,
    limitByPercentage: 20, // Solo 20% de usuarios ven esto
  },

  PRODUCTOS: {
    key: 'module.productos',
    name: 'Productos',
    description: 'Catálogos locales y marketplace',
    enabled: true,
    beta: false,
  },

  MINIWEBS: {
    key: 'module.miniwebs',
    name: 'Miniwebs Comerciales',
    description: 'Presencia digital simple para tiendas',
    enabled: true,
    beta: true,
    limitByUserRole: ['entrepreneur', 'verified_store'],
  },

  MAPA_AVANZADO: {
    key: 'feature.mapa-avanzado',
    name: 'Mapa Avanzado',
    description: 'Filtros avanzados de mapa (todos los módulos)',
    enabled: true,
    beta: false,
  },

  ESTADISTICAS: {
    key: 'feature.estadisticas',
    name: 'Estadísticas',
    description: 'Dashboards de estadísticas para usuarios y tiendas',
    enabled: true,
    beta: true,
  },

  MENSAJERIA: {
    key: 'feature.mensajeria',
    name: 'Mensajería',
    description: 'Sistema de mensajes directos',
    enabled: true,
    beta: false,
  },

  NOTIFICACIONES_PUSH: {
    key: 'feature.notificaciones-push',
    name: 'Notificaciones Push',
    description: 'Envío de notificaciones push',
    enabled: true,
    beta: true,
  },

  VERIFICACION_GOBIERNO: {
    key: 'feature.verificacion-gobierno',
    name: 'Verificación con Documento',
    description: 'Verificación de identidad con documento',
    enabled: false,
    beta: true,
  },

  SISTEMA_PAGOS: {
    key: 'feature.pagos',
    name: 'Sistema de Pagos',
    description: 'Integración con MercadoPago',
    enabled: true,
    beta: true,
    limitByUserRole: ['verified_store'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULOS: Configuración de módulos activos
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_MODULES = {
  demandas: true,
  oportunidades: true,
  servicios: true,
  viajes: true,
  productos: true,
  miniwebs: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN POR CIUDAD
// Permite limitar features por región geográfica
// ─────────────────────────────────────────────────────────────────────────────

export const CITY_CONFIGS: Record<string, { enabled: boolean; modules: Record<string, boolean> }> = {
  // Ejemplo: CABA tiene todos los módulos
  'buenos_aires': {
    enabled: true,
    modules: {
      demandas: true,
      oportunidades: true,
      servicios: true,
      viajes: true,
      productos: true,
      miniwebs: true,
    },
  },

  // Ejemplo: Cordoba con algunos módulos limitados
  'cordoba': {
    enabled: true,
    modules: {
      demandas: true,
      oportunidades: true,
      servicios: true,
      viajes: false, // No activo
      productos: true,
      miniwebs: true,
    },
  },

  // Por defecto, todos los módulos para ciudades no configuradas
  '__default__': {
    enabled: true,
    modules: DEFAULT_MODULES,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES PARA FEATURE FLAGS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica si un feature flag está habilitado
 * Considera: estado general, beta, ciudad, rol de usuario, A/B testing
 */
export function isFlagEnabled(
  flagKey: string,
  options?: {
    userCity?: string;
    userRole?: string;
    userId?: string; // Para A/B testing
  }
): boolean {
  const flag = Object.values(FEATURE_FLAGS).find(f => f.key === flagKey);
  if (!flag) return false;

  // 1. Verificar si está globalmente habilitado
  if (!flag.enabled) return false;

  // 2. Si es beta, permitir solo en desarrollo o para usuarios específicos
  if (flag.beta) {
    const isBetaTester = localStorage.getItem('lokal-beta-tester') === 'true';
    if (!isBetaTester && import.meta.env.PROD) {
      return false;
    }
  }

  // 3. Verificar limitación por ciudad
  if (flag.limitByCity && options?.userCity) {
    if (!flag.limitByCity.includes(options.userCity)) {
      return false;
    }
  }

  // 4. Verificar limitación por rol
  if (flag.limitByUserRole && options?.userRole) {
    if (!flag.limitByUserRole.includes(options.userRole)) {
      return false;
    }
  }

  // 5. Verificar A/B testing (porcentaje de usuarios)
  if (flag.limitByPercentage && options?.userId) {
    const hash = hashUserId(options.userId);
    const percentage = (hash % 100) + 1;
    if (percentage > flag.limitByPercentage) {
      return false;
    }
  }

  return true;
}

/**
 * Simple hash function para A/B testing
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convertir a 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Obtiene módulos habilitados según la ciudad
 */
export function getModulesForCity(city: string): Record<string, boolean> {
  const cityConfig = CITY_CONFIGS[city] || CITY_CONFIGS['__default__'];
  return cityConfig.modules;
}

/**
 * Verifica si un módulo específico está disponible
 */
export function isModuleEnabled(
  moduleName: string,
  options?: {
    userCity?: string;
    userRole?: string;
    userId?: string;
  }
): boolean {
  const flagKey = `module.${moduleName}`;
  return isFlagEnabled(flagKey, options);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE LA APP
// ─────────────────────────────────────────────────────────────────────────────

export const APP_CONFIG: AppConfig = {
  featureFlags: Object.values(FEATURE_FLAGS),

  modules: DEFAULT_MODULES,

  theme: {
    brand: '#00B8D9', // Color LOKAL
    colors: {
      primary: '#00B8D9',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      neutral: '#6B7280',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE = '/.netlify/functions';
export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'katryelmmartinez@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export const POLLINTERVAL_MS = 2500;
export const POLL_MAX_ATTEMPTS = 10;
