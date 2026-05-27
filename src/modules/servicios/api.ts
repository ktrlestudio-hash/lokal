/**
 * API functions para el módulo de Servicios
 */

import type {
  Service,
  CreateServiceInput,
  ServiceRequest,
  RequestServiceInput,
  ServiceFilters,
} from './types';

const API_BASE = '/.netlify/functions/servicios';

/**
 * API object con métodos para gestionar servicios
 */
export const serviciosAPI = {
  /**
   * Obtener lista de servicios con filtros
   */
  async getAll(filters?: ServiceFilters): Promise<Service[]> {
    const params = new URLSearchParams();
    if (filters?.city) params.append('city', filters.city);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.keyword) params.append('keyword', filters.keyword);
    if (filters?.priceMin) params.append('priceMin', filters.priceMin.toString());
    if (filters?.priceMax) params.append('priceMax', filters.priceMax.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await fetch(`${API_BASE}?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching services: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtener detalle de un servicio
   */
  async getById(serviceId: string): Promise<Service> {
    const response = await fetch(`${API_BASE}/${serviceId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching service: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Crear un nuevo servicio
   */
  async create(data: CreateServiceInput): Promise<Service> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error creating service: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Actualizar un servicio
   */
  async update(serviceId: string, data: Partial<CreateServiceInput>): Promise<Service> {
    const response = await fetch(`${API_BASE}/${serviceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error updating service: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Eliminar un servicio
   */
  async delete(serviceId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${serviceId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error deleting service: ${response.statusText}`);
    }
  },

  /**
   * Obtener mis servicios
   */
  async getMine(): Promise<Service[]> {
    const response = await fetch(`${API_BASE}?mine=true`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching my services: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Solicitar un servicio
   */
  async requestService(serviceId: string, data: RequestServiceInput): Promise<ServiceRequest> {
    const response = await fetch(`${API_BASE}/${serviceId}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error requesting service: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtener solicitudes recibidas
   */
  async getMyRequests(): Promise<ServiceRequest[]> {
    const response = await fetch(`${API_BASE}/requests/my`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching my requests: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtener solicitudes para mis servicios
   */
  async getReceivedRequests(): Promise<ServiceRequest[]> {
    const response = await fetch(`${API_BASE}/requests/received`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching received requests: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Aceptar una solicitud de servicio
   */
  async acceptRequest(requestId: string): Promise<ServiceRequest> {
    const response = await fetch(`${API_BASE}/requests/${requestId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error accepting request: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Rechazar una solicitud de servicio
   */
  async rejectRequest(requestId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/requests/${requestId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error rejecting request: ${response.statusText}`);
    }
  },

  /**
   * Completar una solicitud y dejar reseña
   */
  async completeRequest(requestId: string, rating: number, review: string): Promise<ServiceRequest> {
    const response = await fetch(`${API_BASE}/requests/${requestId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, review }),
    });

    if (!response.ok) {
      throw new Error(`Error completing request: ${response.statusText}`);
    }

    return response.json();
  },
};
