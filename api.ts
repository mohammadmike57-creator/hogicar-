import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://hogicar-backend.onrender.com';

// ---------- Types ----------
export interface LocationSuggestion {
  value: string;      // IATA code
  label: string;      // Display text (e.g., "Queen Alia International Airport (AMM), Amman, Jordan")
  iataCode: string;
  name: string;
  municipality: string;
  countryCode: string;
  type: 'airport' | 'city';  // For icon selection
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

// Create axios instances with interceptors for auth
const publicAxios = axios.create();
const adminAxios = axios.create();
const supplierAxios = axios.create();

// Add request interceptor to adminAxios to attach token
adminAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add request interceptor to supplierAxios to attach token
supplierAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('supplierToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- Standalone customer API functions (named exports) ----------
export const fetchLocations = async (query: string): Promise<LocationSuggestion[]> => {
  if (!query || query.length < 2) return [];
  try {
    const response = await publicAxios.get(`${API_BASE_URL}/api/public/locations/search?q=${encodeURIComponent(query)}`);
    // Map the backend response to { value, label, type } format
    const results = response.data.map((loc: any) => {
      // Determine type based on backend type or airport name
      const backendType = loc.type || loc.airportType;
      const isAirport = (backendType && backendType.toLowerCase().includes('airport')) || 
                        (loc.name || '').toLowerCase().includes('airport');
      
      let label = loc.name;
      if (loc.municipality) {
        label += `, ${loc.municipality}`;
      }
      if (loc.iataCode) {
        label += ` (${loc.iataCode})`;
      }
      if (loc.isoCountry) {
        label += `, ${loc.isoCountry}`;
      }
      return {
        value: loc.iataCode || `LOC:${loc.id}`,
        label: label,
        iataCode: loc.iataCode,
        name: loc.name,
        municipality: loc.municipality || '',
        countryCode: loc.isoCountry || '',
        type: isAirport ? 'airport' : 'city',
      };
    });

    // Deduplicate by label to prevent identical suggestions
    return Array.from(new Map(results.map((item: any) => [item.label, item])).values());
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
};

export const getPublicLocations = async (): Promise<LocationSuggestion[]> => {
  try {
    const response = await publicAxios.get(`${API_BASE_URL}/api/public/locations`);
    const results = response.data.map((loc: any) => {
      const nameLower = (loc.name || '').toLowerCase();
      const isAirport = nameLower.includes('airport') || nameLower.includes('heliport') || nameLower.includes('airstrip');
      
      let label = loc.name;
      if (loc.municipality) {
        label += `, ${loc.municipality}`;
      }
      label += ` (${loc.iataCode})`;
      if (loc.isoCountry) {
        label += `, ${loc.isoCountry}`;
      }
      return {
        value: loc.iataCode,
        label: label,
        iataCode: loc.iataCode,
        name: loc.name,
        municipality: loc.municipality || '',
        countryCode: loc.isoCountry || '',
        type: isAirport ? 'airport' : 'city',
      };
    });

    // Deduplicate by label
    return Array.from(new Map(results.map((item: any) => [item.label, item])).values());
  } catch (error) {
    console.error('Error fetching all locations:', error);
    return [];
  }
};

export const lookupBooking = async (email: string, bookingRef: string): Promise<Booking> => {
  const response = await publicAxios.get(`${API_BASE_URL}/api/bookings/lookup?email=${encodeURIComponent(email)}&ref=${encodeURIComponent(bookingRef)}`);
  return response.data;
};

export const getBooking = async (id: number): Promise<Booking> => {
  const response = await publicAxios.get(`${API_BASE_URL}/api/bookings/${id}`);
  return response.data;
};

export const cancelBooking = async (id: number): Promise<Booking> => {
  const response = await publicAxios.post(`${API_BASE_URL}/api/bookings/${id}/cancel`);
  return response.data;
};

export const requestModification = async (id: number, data: any): Promise<any> => {
  const response = await publicAxios.post(`${API_BASE_URL}/api/bookings/${id}/modification/request`, data);
  return response.data;
};

export const confirmModification = async (id: number): Promise<Booking> => {
  const response = await publicAxios.post(`${API_BASE_URL}/api/bookings/${id}/modification/confirm`);
  return response.data;
};

export const submitReview = async (id: number, reviewData: any): Promise<any> => {
  const response = await publicAxios.post(`${API_BASE_URL}/api/bookings/${id}/review`, reviewData);
  return response.data;
};

export const createBooking = async (bookingData: any): Promise<Booking & { clientSecret?: string }> => {
  const response = await publicAxios.post(`${API_BASE_URL}/api/bookings`, bookingData);
  return response.data;
};

export const fetchPublicSuppliers = async (locationCode?: string): Promise<any[]> => {
  try {
    const url = locationCode 
      ? `${API_BASE_URL}/api/public/suppliers?locationCode=${encodeURIComponent(locationCode)}`
      : `${API_BASE_URL}/api/public/suppliers`;
    const response = await publicAxios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching public suppliers:', error);
    return [];
  }
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
  fetchPublicSuppliers,
};

// ---------- Supplier API ----------
export const supplierApi = {
  getBookingByToken: (token: string) => 
    supplierAxios.get(`${API_BASE_URL}/api/supplier/confirmation/booking?token=${token}`),

  confirmBooking: (token: string, confirmationNumber: string) =>
    supplierAxios.post(`${API_BASE_URL}/api/supplier/confirmation/confirm?token=${token}&confirmationNumber=${confirmationNumber}`),

  rejectBooking: (token: string, reason: string) =>
    supplierAxios.post(`${API_BASE_URL}/api/supplier/confirmation/reject?token=${token}&reason=${encodeURIComponent(reason)}`),

  getCars: () => supplierAxios.get(`${API_BASE_URL}/api/supplier/cars`),
  createCar: (payload: any) => supplierAxios.post(`${API_BASE_URL}/api/supplier/cars`, payload),
  updateCar: (id: number, payload: any) => supplierAxios.put(`${API_BASE_URL}/api/supplier/cars/${id}`, payload),
  deleteCar: (id: number) => supplierAxios.delete(`${API_BASE_URL}/api/supplier/cars/${id}`),
  getCarModels: () => supplierAxios.get(`${API_BASE_URL}/api/supplier/car-models`),
  
  getMe: () => supplierAxios.get(`${API_BASE_URL}/api/supplier/me`),
  getMyLocations: () => supplierAxios.get(`${API_BASE_URL}/api/supplier/locations`),
  requestLocation: (payload: any) => supplierAxios.post(`${API_BASE_URL}/api/supplier/locations/request`, payload),
  getBookings: () => supplierAxios.get(`${API_BASE_URL}/api/bookings`),
  confirmBookingBySupplier: (id: number, confirmationNumber: string) => 
    supplierAxios.post(`${API_BASE_URL}/api/bookings/${id}/supplier-confirm`, { supplierConfirmationNumber: confirmationNumber }),
  
  getTemplateConfig: (locationCode?: string) => 
    supplierAxios.get(`${API_BASE_URL}/api/supplier/rates/template-config${locationCode ? `?locationCode=${locationCode}` : ''}`),
  saveTemplateConfig: (config: any) => supplierAxios.put(`${API_BASE_URL}/api/supplier/rates/template-config`, config),
  downloadTemplate: (locationCode?: string) => 
    supplierAxios.get(`${API_BASE_URL}/api/supplier/rates/template${locationCode ? `?locationCode=${locationCode}` : ''}`, { responseType: 'blob' }),
  downloadBookingReport: () => supplierAxios.get(`${API_BASE_URL}/api/supplier/rates/report`, { responseType: 'blob' }),
  importRates: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return supplierAxios.post(`${API_BASE_URL}/api/supplier/rates/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  post: (url: string, payload: any) => supplierAxios.post(`${API_BASE_URL}/api/supplier${url}`, payload),
};

// ---------- Admin API (with authentication interceptor) ----------
export const adminApi = {
  getSuppliers: () => adminAxios.get(`${API_BASE_URL}/api/admin/suppliers`),
  createSupplier: (payload: any) => adminAxios.post(`${API_BASE_URL}/api/admin/suppliers`, payload),
  updateSupplier: (id: number, payload: any) => adminAxios.put(`${API_BASE_URL}/api/admin/suppliers/${id}`, payload),
  deleteSupplier: (id: number) => adminAxios.delete(`${API_BASE_URL}/api/admin/suppliers/${id}`),
  getLocations: () => adminAxios.get(`${API_BASE_URL}/api/admin/locations`),
  getCars: (supplierId?: number) => adminAxios.get(`${API_BASE_URL}/api/admin/fleet/cars${supplierId ? `?supplierId=${supplierId}` : ''}`),
  getCarModels: () => adminAxios.get(`${API_BASE_URL}/api/admin/car-models`),
  createCarModel: (payload: any) => adminAxios.post(`${API_BASE_URL}/api/admin/car-models`, payload),
  updateCarModel: (id: number, payload: any) => adminAxios.put(`${API_BASE_URL}/api/admin/car-models/${id}`, payload),
  deleteCarModel: (id: number) => adminAxios.delete(`${API_BASE_URL}/api/admin/car-models/${id}`),
};
