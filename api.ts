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
}

// ---------- Standalone customer API functions (named exports) ----------
export const fetchLocations = async (query: string): Promise<LocationSuggestion[]> => {
  if (!query || query.length < 2) return [];
  try {
    const response = await axios.get(`${API_BASE_URL}/api/public/locations/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
};

export const getPublicLocations = async (): Promise<LocationSuggestion[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/public/locations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all locations:', error);
    return [];
  }
};

export const lookupBooking = async (email: string, bookingRef: string): Promise<Booking> => {
  const response = await axios.get(`${API_BASE_URL}/api/bookings/lookup?email=${encodeURIComponent(email)}&ref=${encodeURIComponent(bookingRef)}`);
  return response.data;
};

export const getBooking = async (id: number): Promise<Booking> => {
  const response = await axios.get(`${API_BASE_URL}/api/bookings/${id}`);
  return response.data;
};

export const cancelBooking = async (id: number): Promise<Booking> => {
  const response = await axios.post(`${API_BASE_URL}/api/bookings/${id}/cancel`);
  return response.data;
};

export const requestModification = async (id: number, data: any): Promise<any> => {
  const response = await axios.post(`${API_BASE_URL}/api/bookings/${id}/modification/request`, data);
  return response.data;
};

export const confirmModification = async (id: number): Promise<Booking> => {
  const response = await axios.post(`${API_BASE_URL}/api/bookings/${id}/modification/confirm`);
  return response.data;
};

export const submitReview = async (id: number, reviewData: any): Promise<any> => {
  const response = await axios.post(`${API_BASE_URL}/api/bookings/${id}/review`, reviewData);
  return response.data;
};

export const createBooking = async (bookingData: any): Promise<Booking & { clientSecret?: string }> => {
  const response = await axios.post(`${API_BASE_URL}/api/bookings`, bookingData);
  return response.data;
};

// ---------- Backward‑compatible api object ----------
export const api = {
  fetchLocations,
  getPublicLocations,
  lookupBooking,
  getBooking,
  cancelBooking,
  requestModification,
  confirmModification,
  submitReview,
  createBooking,
};

// ---------- Supplier API ----------
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
};
