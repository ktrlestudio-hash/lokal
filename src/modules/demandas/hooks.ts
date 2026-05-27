/**
 * LOKAL Módulo Demandas: Custom Hooks
 */

import { useState, useCallback } from 'react';
import { useAsync } from '../../hooks/index';
import { demandasAPI } from './api';
import type { Demanda, CreateDemandaInput } from './types';

/**
 * Hook para cargar lista de demandas
 */
export function useDemandas(filters?: { city?: string; category?: string; radius?: number }) {
  const { data, status, error, execute } = useAsync(
    () => demandasAPI.getAll(filters),
    true
  );

  return {
    demandas: (data as Demanda[]) || [],
    loading: status === 'pending',
    error: error?.message || null,
    refetch: execute,
  };
}

/**
 * Hook para cargar una demanda específica
 */
export function useDemanda(id: string) {
  const { data, status, error, execute } = useAsync(
    () => demandasAPI.getById(id),
    !!id
  );

  return {
    demanda: (data as Demanda) || null,
    loading: status === 'pending',
    error: error?.message || null,
    refetch: execute,
  };
}

/**
 * Hook para crear una demanda
 */
export function useCreateDemanda() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: CreateDemandaInput): Promise<Demanda | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await demandasAPI.create(data);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

/**
 * Hook para actualizar una demanda
 */
export function useUpdateDemanda(id: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (data: Partial<Demanda>): Promise<Demanda | null> => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await demandasAPI.update(id, data);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [id]
  );

  return { update, isLoading, error };
}

/**
 * Hook para eliminar una demanda
 */
export function useDeleteDemanda(id: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delete_ = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await demandasAPI.delete(id);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  return { delete: delete_, isLoading, error };
}
