/**
 * LOKAL Core Helpers & Utilities
 * Funciones puras y reutilizables para toda la app
 * Basadas en helpers existentes de App.jsx
 */

// ─────────────────────────────────────────────────────────────────────────────
// HORARIOS Y TIEMPO
// ─────────────────────────────────────────────────────────────────────────────

export const DAY_NAMES = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];

export const DAY_LABELS: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

/**
 * Verifica si una tienda está abierta ahora
 * @param horarios - Objeto con keys de días y valores "HH:MM-HH:MM"
 */
export function isStoreOpen(
  horarios?: Record<string, string> | null
): boolean {
  if (!horarios) return false;

  const schedule = horarios[DAY_NAMES[new Date().getDay()]];
  if (!schedule) return false;

  const [openStr, closeStr] = schedule.split('-');
  const [oH, oM = 0] = openStr.split(':').map(Number);
  const [cH, cM = 0] = closeStr.split(':').map(Number);

  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();

  return mins >= oH * 60 + oM && mins < cH * 60 + cM;
}

/**
 * Calcula la próxima vez que abre una tienda
 * @param horarios - Objeto con keys de días
 * @returns string ej: "Abre mañana a las 09:00" o null si no abre
 */
export function getNextOpen(
  horarios?: Record<string, string> | null
): string | null {
  if (!horarios) return null;

  const today = new Date().getDay();

  for (let i = 1; i <= 7; i++) {
    const idx = (today + i) % 7;
    const key = DAY_NAMES[idx];
    const schedule = horarios[key];

    if (schedule) {
      const label = i === 1 ? 'mañana' : DAY_LABELS[key].toLowerCase();
      const openTime = schedule.split('-')[0];
      return `Abre el ${label} a las ${openTime}`;
    }
  }

  return null;
}

/**
 * Calcula tiempo relativo en español
 * @param iso - Fecha ISO string
 * @returns "Hace un momento", "Hace 5 min", "Hace 2h", etc.
 */
export function tiempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);

  if (m < 1) return 'Hace un momento';
  if (m < 60) return `Hace ${m} min`;

  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;

  const d = Math.floor(h / 24);
  return `Hace ${d}d`;
}

/**
 * Obtiene el nombre del día en español
 */
export function getDayName(date: Date): string {
  return DAY_LABELS[DAY_NAMES[date.getDay()]] || '';
}

/**
 * Formatea una fecha a DD/MM/YYYY
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formatea una hora a HH:MM
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// UBICACIÓN Y DISTANCIA
// ─────────────────────────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Calcula distancia entre dos puntos (Haversine)
 * @returns distancia en km
 */
export function calculateDistance(
  point1: LatLng,
  point2: LatLng
): number {
  const R = 6371; // Radio Tierra en km
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formatea distancia para display
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

/**
 * Validar coordenadas
 */
export function isValidLatLng(lat: any, lng: any): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE (localStorage wrapper)
// ─────────────────────────────────────────────────────────────────────────────

export const Storage = {
  /**
   * Get value from localStorage
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  },

  /**
   * Set value in localStorage
   */
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`Failed to set ${key}:`, err);
    }
  },

  /**
   * Remove from localStorage
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * Clear all LOKAL keys
   */
  clearLokalData(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('lokal-'));
    keys.forEach(k => localStorage.removeItem(k));
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// STRINGS Y TEXTO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Trunca string a N caracteres
 */
export function truncate(str: string, length: number = 50): string {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '...' : str;
}

/**
 * Capitaliza primera letra
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Extrae menciones de usuarios (@user)
 */
export function extractMentions(text: string): string[] {
  const matches = text.match(/@\w+/g) || [];
  return matches.map(m => m.slice(1)); // Remover @
}

/**
 * Extrae hashtags
 */
export function extractHashtags(text: string): string[] {
  const matches = text.match(/#\w+/g) || [];
  return matches.map(m => m.slice(1)); // Remover #
}

// ─────────────────────────────────────────────────────────────────────────────
// NÚMEROS Y MONEDA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formatea precio a moneda local
 */
export function formatCurrency(
  amount: number,
  currency: string = 'ARS'
): string {
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
  });
  return formatter.format(amount);
}

/**
 * Formatea número con separadores
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDACIONES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida teléfono argentino básico
 */
export function isValidPhoneAR(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 13;
}

/**
 * Valida URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ARRAYS Y OBJETOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Agrupa array por propiedad
 */
export function groupBy<T>(
  array: T[],
  key: keyof T
): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const group = String(item[key]);
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Deduplica array por propiedad
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter(item => {
    const id = item[key];
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const output = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        output[key] = deepMerge(targetValue, sourceValue) as any;
      } else {
        output[key] = sourceValue as any;
      }
    }
  }

  return output;
}

// ─────────────────────────────────────────────────────────────────────────────
// ASYNC UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retry con exponential backoff
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
}

/**
 * Timeout para promesas
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    ),
  ]);
}
