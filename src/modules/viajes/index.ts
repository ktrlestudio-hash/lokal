/**
 * Barrel exports para el módulo de Viajes
 */

export * from './types';
export { viagesAPI } from './api';
export {
  useTrips,
  useTrip,
  useCreateTripOffer,
  useUpdateTrip,
  useMyTrips,
  useBookTrip,
  useMyBookings,
  useReceivedBookings,
  useConfirmBooking,
  useRateTrip,
} from './hooks';
