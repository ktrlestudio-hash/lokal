/**
 * Custom hooks para el módulo de Oportunidades
 */

import { useState, useCallback } from 'react';
import { useAsync } from '../../../hooks';
import { oportunidadesAPI } from './api';
import type { JobOpportunity, CreateJobInput, JobFilters, JobApplication } from './types';

/**
 * Hook para obtener lista de oportunidades
 */
export function useJobs(filters?: JobFilters) {
  const { data: jobs, ...state } = useAsync<JobOpportunity[]>(
    () => oportunidadesAPI.getAll(filters),
    [filters]
  );

  const refetch = useCallback(() => {
    return oportunidadesAPI.getAll(filters);
  }, [filters]);

  return {
    jobs: jobs || [],
    ...state,
    refetch,
  };
}

/**
 * Hook para obtener detalle de una oportunidad
 */
export function useJob(jobId: string | undefined) {
  const { data: job, ...state } = useAsync<JobOpportunity>(
    () => (jobId ? oportunidadesAPI.getById(jobId) : Promise.reject('No job ID')),
    [jobId]
  );

  return {
    job,
    ...state,
  };
}

/**
 * Hook para crear una oportunidad
 */
export function useCreateJob() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: CreateJobInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const job = await oportunidadesAPI.create(data);
      return job;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating job';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

/**
 * Hook para actualizar una oportunidad
 */
export function useUpdateJob() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (jobId: string, data: Partial<CreateJobInput>) => {
    setIsLoading(true);
    setError(null);
    try {
      const job = await oportunidadesAPI.update(jobId, data);
      return job;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating job';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { update, isLoading, error };
}

/**
 * Hook para eliminar una oportunidad
 */
export function useDeleteJob() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delete_ = useCallback(async (jobId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await oportunidadesAPI.delete(jobId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error deleting job';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { delete: delete_, isLoading, error };
}

/**
 * Hook para obtener mis oportunidades publicadas
 */
export function useMyJobs() {
  const { data: myJobs, ...state } = useAsync<JobOpportunity[]>(
    () => oportunidadesAPI.getMine(),
    []
  );

  return {
    myJobs: myJobs || [],
    ...state,
  };
}

/**
 * Hook para aplicar a una oportunidad
 */
export function useApplyToJob() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback(
    async (jobId: string, data: { resume?: string; coverLetter?: string; contactInfo: any }) => {
      setIsLoading(true);
      setError(null);
      try {
        const application = await oportunidadesAPI.applyToJob(jobId, data);
        return application;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error applying to job';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { apply, isLoading, error };
}

/**
 * Hook para obtener mis aplicaciones
 */
export function useMyApplications() {
  const { data: applications, ...state } = useAsync<JobApplication[]>(
    () => oportunidadesAPI.getMyApplications(),
    []
  );

  return {
    applications: applications || [],
    ...state,
  };
}

/**
 * Hook para obtener aplicaciones recibidas
 */
export function useReceivedApplications() {
  const { data: receivedApplications, ...state } = useAsync<JobApplication[]>(
    () => oportunidadesAPI.getApplicationsForMyJobs(),
    []
  );

  return {
    receivedApplications: receivedApplications || [],
    ...state,
  };
}

/**
 * Hook para responder a una aplicación
 */
export function useRespondToApplication() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const respond = useCallback(async (applicationId: string, message: string, status: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const application = await oportunidadesAPI.respondToApplication(applicationId, {
        status,
        message,
      });
      return application;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error responding to application';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { respond, isLoading, error };
}
