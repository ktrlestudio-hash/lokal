/**
 * API functions para el módulo de Viajes (Carpool)
 */

import type {
  TripOffer,
  CreateTripOfferInput,
  TripRequest,
  CreateTripRequestInput,
  TripBooking,
  TripFilters,
} from './types';

const API_BASE = '/.netlify/functions/viajes';

/**
 * API object con métodos para gestionar viajes
 */
export const viagesAPI = {
  /**
   * Obtener viajes disponibles
   */
  async getAll(filters?: TripFilters): Promise<TripOffer[]> {
    const params = new URLSearchParams();
    if (filters?.fromCity) params.append('fromCity', filters.fromCity);
    if (filters?.toCity) params.append('toCity', filters.toCity);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await fetch(`${API_BASE}?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching trips: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtener detalle de un viaje
   */
  async getById(tripId: string): Promise<TripOffer> {
    const response = await fetch(`${API_BASE}/${tripId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching trip: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Crear una nueva oferta de viaje
   */
  async createOffer(data: CreateTripOfferInput): Promise<TripOffer> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error creating trip: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Actualizar una oferta de viaje
   */
  async updateOffer(tripId: string, data: Partial<CreateTripOfferInput>): Promise<TripOffer> {
    const response = await fetch(`${API_BASE}/${tripId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error updating trip: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Cancelar un viaje
   */
  async cancelTrip(tripId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${tripId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error cancelling trip: ${response.statusText}`);
    }
  },

  /**
   * Obtener mis viajes ofrecidos
   */
  async getMyOffers(): Promise<TripOffer[]> {
    const response = await fetch(`${API_BASE}?mine=true`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching my trips: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Reservar asientos en un viaje
   */
  async bookTrip(tripId: string, seats: number): Promise<TripBooking> {
    const response = await fetch(`${API_BASE}/${tripId}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seats }),
    });

    if (!response.ok) {
      throw new Error(`Error booking trip: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Cancelar una reserva
   */
  async cancelBooking(bookingId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error cancelling booking: ${response.statusText}`);
    }
  },

  /**
   * Obtener mis reservas
   */
  async getMyBookings(): Promise<TripBooking[]> {
    const response = await fetch(`${API_BASE}/bookings/my`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching my bookings: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtener reservas para mis viajes
   */
  async getReceivedBookings(): Promise<TripBooking[]> {
    const response = await fetch(`${API_BASE}/bookings/received`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching received bookings: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Confirmar una reserva
   */
  async confirmBooking(bookingId: string): Promise<TripBooking> {
    const response = await fetch(`${API_BASE}/bookings/${bookingId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error confirming booking: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Calificar un viaje
   */
  async rateTrip(tripId: string, rating: number, review: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${tripId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, review }),
    });

    if (!response.ok) {
      throw new Error(`Error rating trip: ${response.statusText}`);
    }
  },
};
