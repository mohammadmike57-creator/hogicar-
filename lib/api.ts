import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://hogicar-backend.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('supplierToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const supplierApi = {
  // Auth
  login: (email: string, password: string) => api.post('/api/supplier/login', { email, password }),
  getMe: () => api.get('/api/supplier/me'),

  // Cars
  getCars: () => api.get('/api/supplier/dashboard/cars').then(res => res.data),
  createCar: (data: any) => api.post('/api/supplier/dashboard/cars', data).then(res => res.data),
  updateCar: (id: number, data: any) => api.put(`/api/supplier/dashboard/cars/${id}`, data).then(res => res.data),
  deleteCar: (id: number) => api.delete(`/api/supplier/dashboard/cars/${id}`),

  // Rate Templates
  getRateTemplates: () => api.get('/api/supplier/dashboard/templates').then(res => res.data),
  createRateTemplate: (data: any) => api.post('/api/supplier/dashboard/templates', data).then(res => res.data),
  updateRateTemplate: (id: number, data: any) => api.put(`/api/supplier/dashboard/templates/${id}`, data).then(res => res.data),
  deleteRateTemplate: (id: number) => api.delete(`/api/supplier/dashboard/templates/${id}`),

  // Seasons
  createSeason: (data: any) => api.post('/api/supplier/dashboard/seasons', data).then(res => res.data),
  updateSeason: (id: number, data: any) => api.put(`/api/supplier/dashboard/seasons/${id}`, data).then(res => res.data),
  deleteSeason: (id: number) => api.delete(`/api/supplier/dashboard/seasons/${id}`),

  // Rate Tiers
  createRateTier: (data: any) => api.post('/api/supplier/dashboard/rates', data).then(res => res.data),
  updateRateTier: (id: number, data: any) => api.put(`/api/supplier/dashboard/rates/${id}`, data).then(res => res.data),
  deleteRateTier: (id: number) => api.delete(`/api/supplier/dashboard/rates/${id}`),

  // Bookings
  getBookings: () => api.get('/api/supplier/bookings').then(res => res.data),
  confirmBookingBySupplier: (bookingId: number, confirmationNumber: string) =>
    api.post(`/api/supplier/bookings/${bookingId}/confirm`, { confirmationNumber }),

  // Rates & Templates
  getTemplateConfig: (locationCode?: string) =>
    api.get('/api/supplier/template-config', { params: { locationCode } }).then(res => res.data),
  saveTemplateConfig: (config: any) => api.post('/api/supplier/template-config', config).then(res => res.data),
  downloadTemplate: (locationCode?: string) =>
    api.get('/api/supplier/download-template', { params: { locationCode }, responseType: 'blob' }),
  importRates: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/supplier/import-rates', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getRateHistory: () => api.get('/api/supplier/rate-history').then(res => res.data),
  bulkUpdateRates: (payload: any) => api.post('/api/supplier/bulk-update-rates', payload).then(res => res.data),

  // Car models (for dropdown)
  getCarModels: () => api.get('/api/public/car-models').then(res => res.data),
};

export const getPublicLocations = () => api.get('/api/public/locations').then(res => res.data);

// Export the base URL as a constant (no duplicate)
export { API_BASE_URL };
