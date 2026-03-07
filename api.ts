import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://hogicar-backend.onrender.com';

export const supplierApi = {
  getBookingByToken: (token: string) => 
    axios.get(`${API_BASE_URL}/api/supplier/confirmation/booking?token=${token}`),

  confirmBooking: (token: string, confirmationNumber: string) =>
    axios.post(`${API_BASE_URL}/api/supplier/confirmation/confirm?token=${token}&confirmationNumber=${confirmationNumber}`),

  rejectBooking: (token: string, reason: string) =>
    axios.post(`${API_BASE_URL}/api/supplier/confirmation/reject?token=${token}&reason=${encodeURIComponent(reason)}`),

  // ... other methods you already have (getCars, getProfile, etc.)
};

export const adminApi = {
  // ... admin methods
};

export const getPublicLocations = () => 
  axios.get(`${API_BASE_URL}/api/public/locations`);
