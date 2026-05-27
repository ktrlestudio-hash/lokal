/**
 * Custom hooks para el módulo de Viajes (Carpool)
 */

import { useState, useCallback } from 'react';
import { useAsync } from '../../../hooks';
import { viagesAPI } from './api';
import type {
  TripOffer,
  CreateTripOfferInput,
  TripBooking,
  TripFilters,
} from './types';

/**
 * Hook para obtener viajes disponibles
 */
export function useTrips(filters?: TripFilters) {
  const { data: trips, ...state } = useAsync<TripOffer[]>(
    () => viagesAPI.getAll(filters),
    [filters?.fromCity, filters?.toCity, filters?.fromDate]
  );

  const refetch = useCallback(() => {
    return viagesAPI.getAll(filters);
  }, [filters]);

  return {
    trips: trips || [],
    ...state,
    refetch,
  };
}

/**
 * Hook para obtener detalle de un viaje
 */
export function useTrip(tripId: string | undefined) {
  const { data: trip, ...state } = useAsync<TripOffer>(
    () => (tripId ? viagesAPI.getById(tripId) : Promise.reject('No trip ID')),
    [tripId]
  );

  return {
    trip,
    ...state,
  };
}

/**
 * Hook para crear una oferta de viaje
 */
export function useCreateTripOffer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: CreateTripOfferInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const trip = await viagesAPI.createOffer(data);
      return trip;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating trip';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

/**
 * Hook para actualizar una oferta de viaje
 */
export function useUpdateTrip() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (tripId: string, data: Partial<CreateTripOfferInput>) => {
    setIsLoading(true);
    setError(null);
    try {
      const trip = await viagesAPI.updateOffer(tripId, data);
      return trip;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating trip';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { update, isLoading, error };
}

/**
 * Hook para obtener mis viajes ofrecidos
 */
export function useMyTrips() {
  const { data: myTrips, ...state } = useAsync<TripOffer[]>(
    () => viagesAPI.getMyOffers(),
    []
  );

  return {
    myTrips: myTrips || [],
    ...state,
  };
}

/**
 * Hook para reservar asientos en un viaje
 */
export function useBookTrip() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const book = useCallback(async (tripId: string, seats: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const booking = await viagesAPI.bookTrip(tripId, seats);
      return booking;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error booking trip';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { book, isLoading, error };
}

/**
 * Hook para obtener mis reservas
 */
export function useMyBookings() {
  const { data: myBookings, ...state } = useAsync<TripBooking[]>(
    () => viagesAPI.getMyBookings(),
    []
  );

  return {
    myBookings: myBookings || [],
    ...state,
  };
}

/**
 * Hook para obtener reservas recibidas (para mis viajes)
 */
export function useReceivedBookings() {
  const { data: receivedBookings, ...state } = useAsync<TripBooking[]>(
    () => viagesAPI.getReceivedBookings(),
    []
  );

  return {
    receivedBookings: receivedBookings || [],
    ...state,
  };
}

/**
 * Hook para confirmar una reserva
 */
export function useConfirmBooking() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = useCallback(async (bookingId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const booking = await viagesAPI.confirmBooking(bookingId);
      return booking;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error confirming booking';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { confirm, isLoading, error };
}

/**
 * Hook para calificar un viaje
 */
export function useRateTrip() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rate = useCallback(async (tripId: string, rating: number, review: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await viagesAPI.rateTrip(tripId, rating, review);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error rating trip';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { rate, isLoading, error };
}
