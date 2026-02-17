
import { Car, Booking } from './types';

interface SearchState {
    pickupCode?: string;
    dropoffCode?: string;
    pickupDate?: string;
    dropoffDate?: string;
}

// The API booking response might have a different structure
// than our internal Booking type. We can use `any` for flexibility.
interface AppState {
    search: SearchState;
    booking: any | null; 
    bookingId: string | null;
}

// Simple in-memory state store
export const appState: AppState = {
    search: {},
    booking: null,
    bookingId: null
};
