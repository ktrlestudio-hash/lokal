/**
 * Custom hooks para el módulo de Servicios
 */

import { useState, useCallback } from 'react';
import { useAsync } from '../../../hooks';
import { serviciosAPI } from './api';
import type { Service, CreateServiceInput, ServiceRequest, RequestServiceInput, ServiceFilters } from './types';

/**
 * Hook para obtener lista de servicios
 */
export function useServices(filters?: ServiceFilters) {
  const { data: services, ...state } = useAsync<Service[]>(
    () => serviciosAPI.getAll(filters),
    [filters]
  );

  const refetch = useCallback(() => {
    return serviciosAPI.getAll(filters);
  }, [filters]);

  return {
    services: services || [],
    ...state,
    refetch,
  };
}

/**
 * Hook para obtener detalle de un servicio
 */
export function useService(serviceId: string | undefined) {
  const { data: service, ...state } = useAsync<Service>(
    () => (serviceId ? serviciosAPI.getById(serviceId) : Promise.reject('No service ID')),
    [serviceId]
  );

  return {
    service,
    ...state,
  };
}

/**
 * Hook para crear un servicio
 */
export function useCreateService() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: CreateServiceInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const service = await serviciosAPI.create(data);
      return service;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating service';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

/**
 * Hook para actualizar un servicio
 */
export function useUpdateService() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (serviceId: string, data: Partial<CreateServiceInput>) => {
    setIsLoading(true);
    setError(null);
    try {
      const service = await serviciosAPI.update(serviceId, data);
      return service;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating service';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { update, isLoading, error };
}

/**
 * Hook para obtener mis servicios
 */
export function useMyServices() {
  const { data: myServices, ...state } = useAsync<Service[]>(
    () => serviciosAPI.getMine(),
    []
  );

  return {
    myServices: myServices || [],
    ...state,
  };
}

/**
 * Hook para solicitar un servicio
 */
export function useRequestService() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (serviceId: string, data: RequestServiceInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const serviceRequest = await serviciosAPI.requestService(serviceId, data);
      return serviceRequest;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error requesting service';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { request, isLoading, error };
}

/**
 * Hook para obtener mis solicitudes
 */
export function useMyServiceRequests() {
  const { data: myRequests, ...state } = useAsync<ServiceRequest[]>(
    () => serviciosAPI.getMyRequests(),
    []
  );

  return {
    myRequests: myRequests || [],
    ...state,
  };
}

/**
 * Hook para obtener solicitudes recibidas
 */
export function useReceivedServiceRequests() {
  const { data: receivedRequests, ...state } = useAsync<ServiceRequest[]>(
    () => serviciosAPI.getReceivedRequests(),
    []
  );

  return {
    receivedRequests: receivedRequests || [],
    ...state,
  };
}

/**
 * Hook para aceptar una solicitud
 */
export function useAcceptServiceRequest() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = useCallback(async (requestId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const request = await serviciosAPI.acceptRequest(requestId);
      return request;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error accepting request';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { accept, isLoading, error };
}

/**
 * Hook para completar una solicitud
 */
export function useCompleteServiceRequest() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = useCallback(async (requestId: string, rating: number, review: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const request = await serviciosAPI.completeRequest(requestId, rating, review);
      return request;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error completing request';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { complete, isLoading, error };
}
