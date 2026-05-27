/**
 * LOKAL Módulo Demandas: API Functions
 */

import { API_BASE } from '../../config/flags';
import type { Demanda, CreateDemandaInput, DemandaResponse } from './types';

export const demandasAPI = {
  /**
   * Obtener todas las demandas (con filtros)
   */
  async getAll(filters?: {
    city?: string;
    category?: string;
    radius?: number;
  }): Promise<Demanda[]> {
    const params = new URLSearchParams();
    if (filters?.city) params.append('city', filters.city);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.radius) params.append('radius', String(filters.radius));

    const response = await fetch(`${API_BASE}/demandas?${params}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  /**
   * Obtener una demanda por ID
   */
  async getById(id: string): Promise<Demanda> {
    const response = await fetch(`${API_BASE}/demandas/${id}`);
    if (!response.ok) throw new Error(`Demanda no encontrada`);
    return response.json();
  },

  /**
   * Crear nueva demanda
   */
  async create(data: CreateDemandaInput): Promise<Demanda> {
    const response = await fetch(`${API_BASE}/demandas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error al crear demanda`);
    return response.json();
  },

  /**
   * Actualizar demanda
   */
  async update(id: string, data: Partial<Demanda>): Promise<Demanda> {
    const response = await fetch(`${API_BASE}/demandas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error al actualizar demanda`);
    return response.json();
  },

  /**
   * Eliminar demanda
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/demandas/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Error al eliminar demanda`);
  },

  /**
   * Obtener respuestas a una demanda
   */
  async getResponses(demandaId: string): Promise<DemandaResponse[]> {
    const response = await fetch(`${API_BASE}/demandas/${demandaId}/responses`);
    if (!response.ok) throw new Error(`Error al obtener respuestas`);
    return response.json();
  },

  /**
   * Agregar respuesta a una demanda
   */
  async addResponse(demandaId: string, data: Omit<DemandaResponse, 'id' | 'createdAt'>): Promise<DemandaResponse> {
    const response = await fetch(`${API_BASE}/demandas/${demandaId}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error al agregar respuesta`);
    return response.json();
  },
};
