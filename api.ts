
// This file contains API helpers for public and supplier-authenticated endpoints.
// All requests use JWT via Authorization header (for supplier routes) and explicitly omit cookies.
import axios from 'axios';
import { ApiSearchResult, CarCategory, Booking, RateImportSummary, TemplateConfig, CarRateTier } from './types';
import { API_BASE_URL } from './lib/config';
import { getSupplierToken, clearSupplierToken } from './lib/auth';
import { parseFilenameFromContentDisposition } from './lib/httpFilename';

const API_URL = API_BASE_URL;

const apiClient = axios.create({
    baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
    const token = getSupplierToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            clearSupplierToken();
            window.location.hash = '/supplier-login?reason=session_expired';
        }
        return Promise.reject(error);
    }
);

// Interface for the UI component
export interface LocationSuggestion {
  value: string;
  label: string;
  type: string; // 'AIRPORT', 'CITY', etc.
}

// Interface for the raw API response for locations
interface ApiLocation {
    name?: string;
    country?: string;
    code?: string;
    iataCode?: string;
    municipality?: string;
    label?: string;
    value?: string;
    type?: string;
}

export async function fetchLocations(query?: string): Promise<LocationSuggestion[]> {
  const url = query ? `/api/locations?keyword=${encodeURIComponent(query)}` : `/api/locations`;
  try {
    const response = await apiClient.get(url);
    const locationsArray: ApiLocation[] = response.data;
    
    if (!Array.isArray(locationsArray)) {
       throw new Error("Locations API did not return an array.");
    }
    
    return locationsArray.map(l => {
        const code = l.iataCode || l.code || '';
        const name = l.name || l.municipality || '';
        const country = l.country || '';
        const label = l.label || `${name}${country ? `, ${country}` : ''} (${code})`;
        return {
            label,
            value: l.value || code,
            type: l.type || 'AIRPORT'
        };
    });

  } catch (error) {
    console.error("Error fetching locations:", error);
    throw error;
  }
}

export async function fetchCars(pickup: string, dropoff: string, pickupDate: string, dropoffDate: string): Promise<ApiSearchResult[]> {
  const carsUrl = `/api/cars?pickup=${pickup}&dropoff=${dropoff}&pickupDate=${pickupDate}&dropoffDate=${dropoffDate}`;

  const response = await apiClient.get(carsUrl);

  const rawCars: ApiSearchResult[] = response.data;

  const normalizedCars = rawCars.map(car => {
    const normalizedCar = { ...car };
    if (!normalizedCar.supplier) {
        normalizedCar.supplier = {
            id: normalizedCar.supplierId ?? null,
            name: normalizedCar.supplierName ?? "",
            logoUrl: normalizedCar.supplierLogoUrl ?? "",
            terms: normalizedCar.supplierTerms ?? "",
            gracePeriodDays: normalizedCar.supplierGracePeriodDays ?? 0
        };
    }
    normalizedCar.name = normalizedCar.name ?? "";
    normalizedCar.brand = normalizedCar.brand ?? "";
    normalizedCar.model = normalizedCar.model ?? "";
    normalizedCar.netPrice = normalizedCar.netPrice ?? 0;
    normalizedCar.currency = normalizedCar.currency ?? "USD";
    normalizedCar.image = normalizedCar.image ?? "";
    normalizedCar.category = normalizedCar.category ?? CarCategory.ECONOMY;
    
    return normalizedCar;
  });
  
  return normalizedCars;
}


// --- BOOKING API FUNCTIONS ---
// Functions moved from `src/services/api.ts` to solve import errors.

interface CreateBookingPayload {
    supplierId: string | number | null | undefined;
    supplierName: string;
    pickupCode: string;
    dropoffCode: string;
    pickupDate: string;
    dropoffDate: string;
    currency: string | undefined;
    netPrice: number | undefined;
    commissionPercent: number | undefined;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    finalPrice: number;
    payNow: number;
    payAtDesk: number;
    flightNumber?: string;
    selectedExtras?: any[];
}

interface ReviewPayload {
    cleanliness: number;
    condition: number;
    valueForMoney: number;
    pickupSpeed: number;
}

export const api = {
    /**
     * Create a new booking
     */
    createBooking: async (payload: CreateBookingPayload): Promise<Booking> => {
        const response = await apiClient.post('/api/bookings', payload);
        return response.data;
    },

    /**
     * Get booking details by Reference Number (e.g. H123456)
     */
    getBookingByRef: async (ref: string): Promise<Booking> => {
        const response = await apiClient.get(`/api/bookings/ref/${ref}`);
        return response.data;
    },

    /**
     * Lookup a booking via Email and Reference (for My Bookings login)
     */
    lookupBooking: async (email: string, ref: string): Promise<Booking> => {
        const params = new URLSearchParams({ email, ref });
        const response = await apiClient.get(`/api/bookings/lookup?${params.toString()}`);
        return response.data;
    },

    /**
     * Cancel a booking
     */
    cancelBooking: async (id: string | number): Promise<Booking> => {
        const response = await apiClient.post(`/api/bookings/${id}/cancel`);
        return response.data;
    },

    /**
     * Supplier confirms the booking
     */
    supplierConfirm: async (id: string | number, supplierConfirmationNumber: string): Promise<Booking> => {
        const response = await apiClient.post(`/api/bookings/${id}/supplier-confirm`, { supplierConfirmationNumber });
        return response.data;
    },

    /**
     * Submit a customer review
     */
    submitReview: async (id: string | number, review: ReviewPayload): Promise<Booking> => {
        const response = await apiClient.post(`/api/bookings/${id}/review`, review);
        return response.data;
    }
};

// --- SUPPLIER API ---
export const supplierApi = {
  // Auth
  login: async (credentials: any): Promise<{ token: string }> => {
    const response = await apiClient.post('/api/supplier/auth/login', credentials);
    return response.data;
  },

  // Profile
  getMe: async (): Promise<any> => {
    const response = await apiClient.get('/api/supplier/me');
    return response.data;
  },

  // Cars
  getCars: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/supplier/dashboard/cars');
    return response.data;
  },
  addCar: async (carData: any): Promise<any> => {
    const response = await apiClient.post('/api/supplier/dashboard/cars', carData);
    return response.data;
  },
  updateCar: async (carId: string, carData: any): Promise<any> => {
    const response = await apiClient.put(`/api/supplier/dashboard/cars/${carId}`, carData);
    return response.data;
  },
  deleteCar: async (carId: string): Promise<void> => {
    await apiClient.delete(`/api/supplier/dashboard/cars/${carId}`);
  },

  // Car Models
  getCarModels: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/supplier/car-models');
    return response.data;
  },

  // Rates
  getTemplateConfig: async (): Promise<TemplateConfig> => {
    const response = await apiClient.get('/api/supplier/rates/template-config');
    return response.data;
  },
  
  updateTemplateConfig: async (config: TemplateConfig): Promise<TemplateConfig> => {
    const response = await apiClient.put('/api/supplier/rates/template-config', config);
    return response.data;
  },

  downloadSupplierRatesTemplate: async (): Promise<void> => {
    const response = await apiClient.get('/api/supplier/rates/template', { responseType: 'blob' });
    
    const disposition = response.headers['content-disposition'];
    const filename = parseFilenameFromContentDisposition(disposition) || 'rates_template.xlsx';
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },
  
  importSupplierRatesExcel: async (file: File): Promise<RateImportSummary> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/api/supplier/rates/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getRatesForCar: async (carId: string): Promise<CarRateTier[]> => {
    const response = await apiClient.get(`/api/supplier/rates/cars/${carId}`);
    return response.data;
  },

  createRateTier: async (carId: string, tierData: Omit<CarRateTier, 'id' | 'currency'>): Promise<CarRateTier> => {
    const response = await apiClient.post(`/api/supplier/rates/cars/${carId}`, tierData);
    return response.data;
  },

  updateRateTier: async (tierId: number, tierData: Omit<CarRateTier, 'id' | 'currency'>): Promise<CarRateTier> => {
     const response = await apiClient.put(`/api/supplier/rates/tiers/${tierId}`, tierData);
     return response.data;
  },
  
  deleteRateTier: async (tierId: number): Promise<void> => {
     await apiClient.delete(`/api/supplier/rates/tiers/${tierId}`);
  },

  // Stop Sales
  bulkAddStopSales: async (data: any): Promise<void> => {
    await apiClient.post('/api/supplier/dashboard/stopsales/bulk', data);
  },

  // Locations
  getLocations: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/supplier/locations');
    return response.data;
  },
  requestLocation: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/supplier/locations', data);
    return response.data;
  },
};