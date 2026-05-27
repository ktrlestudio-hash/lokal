/**
 * Tipos para el módulo de Viajes
 * Ofertas y búsquedas de viajes compartidos (carpool)
 */

/**
 * Tipo de viaje
 */
export type TripType = 'offer' | 'request'; // Ofreces viaje o buscas viaje

/**
 * Comodidades del viaje
 */
export type TripAmenity =
  | 'air_conditioning'
  | 'wifi'
  | 'usb_charge'
  | 'music'
  | 'conversation'
  | 'quiet'
  | 'pets_allowed';

/**
 * Estado del viaje
 */
export type TripStatus = 'open' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Ofertas de viaje (driver ofrece viaje)
 */
export interface TripOffer {
  id: string;
  userId: string; // Conductor
  fromCity: string;
  toCity: string;
  fromLocation: {
    lat: number;
    lng: number;
    address?: string;
  };
  toLocation: {
    lat: number;
    lng: number;
    address?: string;
  };
  departureTime: string; // ISO 8601
  estimatedDuration: number; // Minutos
  pricePerPassenger: number;
  currency: 'ARS' | 'USD';
  availableSeats: number;
  bookedSeats: number;
  passengers: Array<{
    userId: string;
    status: 'confirmed' | 'cancelled';
  }>;
  vehicleInfo: {
    model: string; // "Toyota Corolla 2020"
    color: string;
    plate: string;
    features: string[]; // ["Aire", "Buena música"]
  };
  amenities: TripAmenity[];
  notes: string; // Notas adicionales
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  stops?: Array<{
    lat: number;
    lng: number;
    address: string;
    time: string; // ISO 8601
  }>;
}

/**
 * Input para ofrecer un viaje
 */
export interface CreateTripOfferInput {
  fromCity: string;
  toCity: string;
  fromLocation: {
    lat: number;
    lng: number;
    address?: string;
  };
  toLocation: {
    lat: number;
    lng: number;
    address?: string;
  };
  departureTime: string;
  estimatedDuration: number;
  pricePerPassenger: number;
  currency?: 'ARS' | 'USD';
  availableSeats: number;
  vehicleInfo: {
    model: string;
    color: string;
    plate: string;
    features?: string[];
  };
  amenities?: TripAmenity[];
  notes?: string;
  stops?: Array<{
    lat: number;
    lng: number;
    address: string;
    time: string;
  }>;
}

/**
 * Búsqueda de viaje (pasajero busca viaje)
 */
export interface TripRequest {
  id: string;
  userId: string; // Pasajero
  fromCity: string;
  toCity: string;
  fromLocation: {
    lat: number;
    lng: number;
    address?: string;
  };
  toLocation: {
    lat: number;
    lng: number;
    address?: string;
  };
  departureTime: string;
  flexibility: number; // Minutos de flexibilidad
  passengers: number; // Cuántos van
  budget: number; // Presupuesto máximo
  currency: 'ARS' | 'USD';
  amenitiesRequired: TripAmenity[];
  notes?: string;
  status: TripStatus;
  matchedTrips?: string[]; // IDs de viajes coincidentes
  createdAt: string;
  updatedAt: string;
}

/**
 * Input para buscar un viaje
 */
export interface CreateTripRequestInput {
  fromCity: string;
  toCity: string;
  fromLocation: {
    lat: number;
    lng: number;
    address?: string;
  };
  toLocation: {
    lat: number;
    lng: number;
    address?: string;
  };
  departureTime: string;
  flexibility?: number;
  passengers: number;
  budget: number;
  currency?: 'ARS' | 'USD';
  amenitiesRequired?: TripAmenity[];
  notes?: string;
}

/**
 * Reserva de pasajero en un viaje
 */
export interface TripBooking {
  id: string;
  tripId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  seats: number;
  totalPrice: number;
  pickedUpAt?: string;
  droppedOffAt?: string;
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Filtros para listar viajes
 */
export interface TripFilters {
  fromCity: string;
  toCity: string;
  fromDate: string; // ISO 8601
  toDate?: string;
  maxPassengers?: number;
  maxPrice?: number;
  amenities?: TripAmenity[];
  type?: TripType;
  status?: TripStatus;
  limit?: number;
  offset?: number;
}
