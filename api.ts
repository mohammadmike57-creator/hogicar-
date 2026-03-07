import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://hogicar-backend.onrender.com';

export interface LocationSuggestion {
  iataCode: string;
  name: string;
  municipality: string;
  countryCode: string;
}

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

export const supplierApi = {
  getBookingByToken: (token: string) => 
    axios.get(`${API_BASE_URL}/api/supplier/confirmation/booking?token=${token}`),

  confirmBooking: (token: string, confirmationNumber: string) =>
    axios.post(`${API_BASE_URL}/api/supplier/confirmation/confirm?token=${token}&confirmationNumber=${confirmationNumber}`),

  rejectBooking: (token: string, reason: string) =>
    axios.post(`${API_BASE_URL}/api/supplier/confirmation/reject?token=${token}&reason=${encodeURIComponent(reason)}`),

  // Add other existing methods here (getCars, getMe, etc.)
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
  // ... add any other methods you have
};

export const adminApi = {
  // Add admin methods as needed
  createSupplier: (payload: any) => axios.post(`${API_BASE_URL}/api/admin/suppliers`, payload),
  getLocations: () => axios.get(`${API_BASE_URL}/api/admin/locations`),
};
