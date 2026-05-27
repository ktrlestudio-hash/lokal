/**
 * API functions para el módulo de Oportunidades
 */

import type {
  JobOpportunity,
  CreateJobInput,
  JobApplication,
  ApplyToJobInput,
  JobApplicationResponse,
  JobFilters,
} from './types';

const API_BASE = '/.netlify/functions/oportunidades';

/**
 * API object con métodos para gestionar oportunidades laborales
 */
export const oportunidadesAPI = {
  /**
   * Obtener lista de oportunidades con filtros
   */
  async getAll(filters?: JobFilters): Promise<JobOpportunity[]> {
    const params = new URLSearchParams();
    if (filters?.city) params.append('city', filters.city);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.jobType) params.append('jobType', filters.jobType);
    if (filters?.keyword) params.append('keyword', filters.keyword);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await fetch(`${API_BASE}?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching jobs: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtener detalle de una oportunidad
   */
  async getById(jobId: string): Promise<JobOpportunity> {
    const response = await fetch(`${API_BASE}/${jobId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching job: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Crear una nueva oportunidad laboral
   */
  async create(data: CreateJobInput): Promise<JobOpportunity> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error creating job: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Actualizar una oportunidad
   */
  async update(jobId: string, data: Partial<CreateJobInput>): Promise<JobOpportunity> {
    const response = await fetch(`${API_BASE}/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error updating job: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Eliminar una oportunidad
   */
  async delete(jobId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${jobId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error deleting job: ${response.statusText}`);
    }
  },

  /**
   * Obtener mis oportunidades publicadas
   */
  async getMine(): Promise<JobOpportunity[]> {
    const response = await fetch(`${API_BASE}?mine=true`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching my jobs: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Aplicar a un trabajo
   */
  async applyToJob(jobId: string, data: ApplyToJobInput): Promise<JobApplication> {
    const response = await fetch(`${API_BASE}/${jobId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error applying to job: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtener mis aplicaciones
   */
  async getMyApplications(): Promise<JobApplication[]> {
    const response = await fetch(`${API_BASE}/applications/my`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching my applications: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtener aplicaciones para mis trabajos
   */
  async getApplicationsForMyJobs(): Promise<JobApplication[]> {
    const response = await fetch(`${API_BASE}/applications/received`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching applications: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Responder a una aplicación
   */
  async respondToApplication(
    applicationId: string,
    response: JobApplicationResponse
  ): Promise<JobApplication> {
    const fetchResponse = await fetch(`${API_BASE}/applications/${applicationId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    });

    if (!fetchResponse.ok) {
      throw new Error(`Error responding to application: ${fetchResponse.statusText}`);
    }

    return fetchResponse.json();
  },

  /**
   * Obtener aplicaciones para un trabajo específico
   */
  async getApplicationsForJob(jobId: string): Promise<JobApplication[]> {
    const response = await fetch(`${API_BASE}/${jobId}/applications`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching job applications: ${response.statusText}`);
    }

    return response.json();
  },
};
