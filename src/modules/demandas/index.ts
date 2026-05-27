/**
 * LOKAL Módulo Demandas: Index
 * Exporta todo lo del módulo
 */

export type { Demanda, CreateDemandaInput, DemandaResponse } from './types';
export { demandasAPI } from './api';
export {
  useDemandas,
  useDemanda,
  useCreateDemanda,
  useUpdateDemanda,
  useDeleteDemanda,
} from './hooks';
