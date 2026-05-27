/**
 * LOKAL Módulo: Demandas
 * Usuarios publican necesidades/productos buscados
 * 
 * Estructura:
 * - types.ts: tipos específicos del módulo
 * - context.tsx: estado del módulo
 * - hooks.ts: custom hooks del módulo
 * - api.ts: llamadas al API
 * - components/: componentes del módulo
 */

export interface Demanda {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  tags?: string[];
  location: {
    lat: number;
    lng: number;
    city: string;
    radius?: number;
  };
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'resolved' | 'expired';
  responses?: string[];
}

export interface CreateDemandaInput {
  title: string;
  description: string;
  category: string;
  tags?: string[];
  location: {
    lat: number;
    lng: number;
    city: string;
    radius?: number;
  };
  expiresIn?: number; // días
}

export interface DemandaResponse {
  id: string;
  demandaId: string;
  userId: string;
  message: string;
  contactInfo: string;
  createdAt: string;
}
