import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://hogicar-backend.onrender.com';

// ---------- Types ----------
export interface LocationSuggestion {
  iataCode: string;
  name: string;
  municipality: string;
  countryCode: string;
}

export interface Booking {
  id: number;
  bookingRef: string;
  supplierId: number;
  supplierName: string;
  pickupCode: string;
  dropoffCode: string;
  pickupDate: string;
  dropoffDate: string;
  startTime: string;
  endTime: string;
  currency: string;
  netPrice: number;
  commissionPercent: number;
  commissionAmount: number;
  finalPrice: number;
  payNow: number;
  payAtDesk: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  flightNumber?: string;
  status: string;
  supplierConfirmationNumber?: string;
  createdAt: string;
  updatedAt: string;
  // ... other fields if needed
}

// ---------- Public / Customer API ----------
export const api = {
  // Search locations
  fetchLocations: async (query: string): Promise<LocationSuggestion[]> => {
    if (!query || query.length < 2) return [];
    try {
      const response = await axios.get(`${API_BASE_URL}/api/public/locations/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  },

  // Get all public locations (for dropdown)
  getPublicLocations: async (): Promise<LocationSuggestion[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/public/locations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all locations:', error);
      return [];
    }
  },

  // Lookup a booking by email and booking reference
  lookupBooking: async (email: string, bookingRef: string): Promise<Booking> => {
    const response = await axios.get(`${API_BASE_URL}/api/bookings/lookup?email=${encodeURIComponent(email)}&ref=${encodeURIComponent(bookingRef)}`);
    return response.data;
  },

  // Get a booking by ID (if authenticated via token)
  getBooking: async (id: number): Promise<Booking> => {
    const response = await axios.get(`${API_BASE_URL}/api/bookings/${id}`);
    return response.data;
  },

  // Cancel a booking
  cancelBooking: async (id: number): Promise<Booking> => {
    const response = await axios.post(`${API_BASE_URL}/api/bookings/${id}/cancel`);
    return response.data;
  },

  // Request a modification
  requestModification: async (id: number, data: any): Promise<any> => {
    const response = await axios.post(`${API_BASE_URL}/api/bookings/${id}/modification/request`, data);
    return response.data;
  },

  // Confirm a modification (after paying extra if needed)
  confirmModification: async (id: number): Promise<Booking> => {
    const response = await axios.post(`${API_BASE_URL}/api/bookings/${id}/modification/confirm`);
    return response.data;
  },

  // Submit a review
  submitReview: async (id: number, reviewData: any): Promise<any> => {
    const response = await axios.post(`${API_BASE_URL}/api/bookings/${id}/review`, reviewData);
    return response.data;
  },

  // Create a booking (used on checkout)
  createBooking: async (bookingData: any): Promise<Booking & { clientSecret?: string }> => {
    const response = await axios.post(`${API_BASE_URL}/api/bookings`, bookingData);
    return response.data;
  },
};

// ---------- Supplier API (existing) ----------
export const supplierApi = {
  getBookingByToken: (token: string) => 
    axios.get(`${API_BASE_URL}/api/supplier/confirmation/booking?token=${token}`),

  confirmBooking: (token: string, confirmationNumber: string) =>
    axios.post(`${API_BASE_URL}/api/supplier/confirmation/confirm?token=${token}&confirmationNumber=${confirmationNumber}`),

  rejectBooking: (token: string, reason: string) =>
    axios.post(`${API_BASE_URL}/api/supplier/confirmation/reject?token=${token}&reason=${encodeURIComponent(reason)}`),

  getCars: () => axios.get(`${API_BASE_URL}/api/supplier/cars`),
  getMe: () => axios.get(`${API_BASE_URL}/api/supplier/me`),
  getLocations: () => axios.get(`${API_BASE_URL}/api/supplier/locations`),
  getTemplateConfig: () => axios.get(`${API_BASE_URL}/api/supplier/rates/template-config`),
  saveTemplateConfig: (config: any) => axios.post(`${API_BASE_URL}/api/supplier/rates/template-config`, config),
  downloadTemplate: () => axios.get(`${API_BASE_URL}/api/supplier/rates/template`, { responseType: 'blob' }),
  importRates: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API_BASE_URL}/api/supplier/rates/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// ---------- Admin API ----------
export const adminApi = {
  createSupplier: (payload: any) => axios.post(`${API_BASE_URL}/api/admin/suppliers`, payload),
  getLocations: () => axios.get(`${API_BASE_URL}/api/admin/locations`),
  // ... other admin methods
};
