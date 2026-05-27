/**
 * LOKAL Constants
 * Todas las constantes de la app centralizadas
 */

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORÍAS (basadas en categories.js existente)
// ─────────────────────────────────────────────────────────────────────────────

export const DEMANDA_CATEGORIES = [
  'Electrónica',
  'Ropa',
  'Hogar',
  'Deportes',
  'Otro',
];

export const JOB_CATEGORIES = [
  'Ventas',
  'Atención al cliente',
  'Cocina',
  'Limpieza',
  'Remoto',
  'Mantenimiento',
  'Otro',
];

export const SERVICE_CATEGORIES = [
  'Electricista',
  'Plomería',
  'Carpintería',
  'Limpieza',
  'Reparaciones',
  'Otro',
];

// ─────────────────────────────────────────────────────────────────────────────
// HORARIOS PREDEFINIDOS
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SCHEDULES = {
  lunes: '09:00-18:00',
  martes: '09:00-18:00',
  miercoles: '09:00-18:00',
  jueves: '09:00-18:00',
  viernes: '09:00-18:00',
  sabado: '09:00-14:00',
  domingo: 'Cerrado',
};

// ─────────────────────────────────────────────────────────────────────────────
// TIEMPOS (millisegundos)
// ─────────────────────────────────────────────────────────────────────────────

export const TIMING = {
  ANIMATION_FAST: 150,
  ANIMATION_DEFAULT: 300,
  ANIMATION_SLOW: 500,
  DEBOUNCE_SEARCH: 300,
  DEBOUNCE_INPUT: 500,
  THROTTLE_SCROLL: 200,
  POLL_INTERVAL: 2500,
  TOAST_DURATION: 3000,
};

// ─────────────────────────────────────────────────────────────────────────────
// LÍMITES Y VALIDACIONES
// ─────────────────────────────────────────────────────────────────────────────

export const LIMITS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_TITLE_LENGTH: 100,
  MAX_BIO_LENGTH: 500,
  MAX_SKILLS: 10,
  MAX_IMAGES_PER_POST: 5,
  MAX_IMAGE_SIZE_MB: 5,
  MAX_VIDEO_SIZE_MB: 50,
  DEBOUNCE_DELAY: 300,
  POLL_MAX_ATTEMPTS: 10,
};

// ─────────────────────────────────────────────────────────────────────────────
// MENSAJES DE ERROR/ÉXITO
// ─────────────────────────────────────────────────────────────────────────────

export const MESSAGES = {
  // Errores
  ERROR_GENERIC: 'Algo salió mal. Intenta de nuevo',
  ERROR_NETWORK: 'Error de conexión. Verifica tu internet',
  ERROR_AUTH: 'Credenciales inválidas',
  ERROR_UNAUTHORIZED: 'No tienes permiso para esta acción',
  ERROR_NOT_FOUND: 'No encontrado',
  ERROR_VALIDATION: 'Completa todos los campos correctamente',
  ERROR_FILE_TOO_LARGE: 'El archivo es demasiado grande',
  ERROR_INVALID_EMAIL: 'Email inválido',
  ERROR_INVALID_PHONE: 'Teléfono inválido',

  // Éxito
  SUCCESS_SAVED: 'Guardado correctamente',
  SUCCESS_CREATED: 'Creado correctamente',
  SUCCESS_UPDATED: 'Actualizado correctamente',
  SUCCESS_DELETED: 'Eliminado correctamente',
  SUCCESS_LOGIN: 'Bienvenido',
  SUCCESS_LOGOUT: 'Hasta pronto',

  // Info
  INFO_LOADING: 'Cargando...',
  INFO_NO_RESULTS: 'No hay resultados',
  INFO_NO_DATA: 'Sin datos disponibles',
};

// ─────────────────────────────────────────────────────────────────────────────
// CIUDADES
// ─────────────────────────────────────────────────────────────────────────────

export const CITIES = [
  { id: 'buenos_aires', name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
  { id: 'cordoba', name: 'Córdoba', lat: -31.4201, lng: -64.1888 },
  { id: 'rosario', name: 'Rosario', lat: -32.9442, lng: -60.6345 },
  { id: 'mendoza', name: 'Mendoza', lat: -32.8892, lng: -68.845 },
  { id: 'salta', name: 'Salta', lat: -24.7821, lng: -65.4115 },
];

// ─────────────────────────────────────────────────────────────────────────────
// MONEDAS
// ─────────────────────────────────────────────────────────────────────────────

export const CURRENCY = {
  ARS: {
    code: 'ARS',
    symbol: '$',
    name: 'Peso Argentino',
  },
  USD: {
    code: 'USD',
    symbol: 'U$',
    name: 'Dólar US',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// RANGOS DE CALIFICACIÓN
// ─────────────────────────────────────────────────────────────────────────────

export const RATING_LABELS = {
  1: 'Muy malo',
  2: 'Malo',
  3: 'Aceptable',
  4: 'Bueno',
  5: 'Excelente',
};

// ─────────────────────────────────────────────────────────────────────────────
// ESTADOS
// ─────────────────────────────────────────────────────────────────────────────

export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  ARCHIVED: 'archived',
};

// ─────────────────────────────────────────────────────────────────────────────
// RESPUESTAS PREDEFINIDAS PARA TIENDAS
// ─────────────────────────────────────────────────────────────────────────────

export const STORE_QUICK_REPLIES = [
  'Sí, tenemos stock. Pasa cuando quieras.',
  'Te lo separamos hasta mañana si nos avisas.',
  'El precio incluye garantía de 6 meses.',
  'También hacemos envío a domicilio.',
  'Qué horario te queda mejor para venir?',
  'Tenemos varios modelos, ¿cuál preferís?',
];

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULOS ACTIVOS (por defecto)
// ─────────────────────────────────────────────────────────────────────────────

export const ACTIVE_MODULES = {
  demandas: true,
  oportunidades: true,
  servicios: true,
  viajes: true,
  productos: true,
  miniwebs: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS DE LA APP
// ─────────────────────────────────────────────────────────────────────────────

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Main
  HOME: '/',
  EXPLORE: '/explore',
  PROFILE: '/profile',
  SETTINGS: '/settings',

  // Demandas
  DEMANDAS: '/demandas',
  DEMANDA_DETAIL: '/demandas/:id',
  CREATE_DEMANDA: '/demandas/new',

  // Jobs
  JOBS: '/jobs',
  JOB_DETAIL: '/jobs/:id',
  POST_JOB: '/jobs/post',

  // Services
  SERVICES: '/services',
  SERVICE_DETAIL: '/services/:id',

  // Map
  MAP: '/map',

  // Store
  STORE: '/store',
  STORE_SETTINGS: '/store/settings',
  STORE_ANALYTICS: '/store/analytics',

  // Legal
  TERMS: '/terms',
  PRIVACY: '/privacy',
};
