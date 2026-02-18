// This file contains API helpers for public and supplier-authenticated endpoints.
// All requests use JWT via Authorization header (for supplier routes) and explicitly omit cookies.
import { ApiSearchResult, CarCategory, Booking, RateImportSummary } from './types';
import { API_BASE_URL } from './lib/config';
import { getSupplierToken, clearSupplierToken } from './lib/auth';
import { parseFilenameFromContentDisposition } from './lib/httpFilename';

const API_URL = API_BASE_URL;

// Interface for the UI component
export interface LocationSuggestion {
  value: string;
  label: string;
  type: string; // 'AIRPORT', 'CITY', etc.
}

// Interface for the raw API response for locations
interface ApiLocation {
    name: string;
    country: string;
    code: string;
    label?: string;
    value?: string;
    type?: string;
}

export async function fetchLocations(query?: string): Promise<LocationSuggestion[]> {
  const url = query ? `${API_URL}/api/locations?query=${encodeURIComponent(query)}` : `${API_URL}/api/locations`;
  try {
    const response = await fetch(url, { credentials: 'omit' });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Could not read error body');
      throw new Error(`Failed to fetch locations: ${response.status} ${response.statusText}. Body: ${errorBody}`);
    }

    const locationsArray: ApiLocation[] = await response.json();
    
    if (!Array.isArray(locationsArray)) {
       throw new Error("Locations API did not return an array.");
    }
    
    return locationsArray.map(l => ({
        label: l.label ?? `${l.name}, ${l.country} (${l.code})`,
        value: l.value ?? l.code,
        type: l.type ?? 'AIRPORT'
    }));

  } catch (error) {
    console.error("Error fetching locations:", error);
    throw error;
  }
}

export async function fetchCars(pickup: string, dropoff: string, pickupDate: string, dropoffDate: string): Promise<ApiSearchResult[]> {
  const carsUrl = `${API_URL}/api/cars?pickup=${pickup}&dropoff=${dropoff}&pickupDate=${pickupDate}&dropoffDate=${dropoffDate}`;

  const response = await fetch(carsUrl, { credentials: 'omit' });

  if (!response.ok) {
    const body = await response.text();
    console.error("Failed to fetch cars. Status:", response.status, "Body:", body);
    throw new Error(`Failed to fetch cars. The server responded with status: ${response.status}`);
  }

  const rawCars: ApiSearchResult[] = await response.json();

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

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = response.statusText;
        try {
            const json = JSON.parse(errorBody);
            errorMessage = json.message || errorMessage;
        } catch {
            // ignore JSON parse error
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

export const api = {
    /**
     * Create a new booking
     */
    createBooking: async (payload: CreateBookingPayload): Promise<Booking> => {
        const response = await fetch(`${API_URL}/api/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'omit',
        });
        return handleResponse(response);
    },

    /**
     * Get booking details by Reference Number (e.g. H123456)
     */
    getBookingByRef: async (ref: string): Promise<Booking> => {
        const response = await fetch(`${API_URL}/api/bookings/ref/${ref}`, { credentials: 'omit' });
        return handleResponse(response);
    },

    /**
     * Lookup a booking via Email and Reference (for My Bookings login)
     */
    lookupBooking: async (email: string, ref: string): Promise<Booking> => {
        const params = new URLSearchParams({ email, ref });
        const response = await fetch(`${API_URL}/api/bookings/lookup?${params.toString()}`, { credentials: 'omit' });
        return handleResponse(response);
    },

    /**
     * Cancel a booking
     */
    cancelBooking: async (id: string | number): Promise<Booking> => {
        const response = await fetch(`${API_URL}/api/bookings/${id}/cancel`, {
            method: 'POST',
            credentials: 'omit',
        });
        return handleResponse(response);
    },

    /**
     * Supplier confirms the booking
     */
    supplierConfirm: async (id: string | number, supplierConfirmationNumber: string): Promise<Booking> => {
        const response = await fetch(`${API_URL}/api/bookings/${id}/supplier-confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ supplierConfirmationNumber }),
            credentials: 'omit',
        });
        return handleResponse(response);
    },

    /**
     * Submit a customer review
     */
    submitReview: async (id: string | number, review: ReviewPayload): Promise<Booking> => {
        const response = await fetch(`${API_URL}/api/bookings/${id}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(review),
            credentials: 'omit',
        });
        return handleResponse(response);
    }
};

// --- SUPPLIER API ---
export const supplierApi = {
  downloadSupplierRatesTemplate: async (): Promise<void> => {
    const token = getSupplierToken();
    if (!token) throw new Error("Authentication failed. Please log in again.");
    
    const response = await fetch(`${API_URL}/api/supplier/rates/template`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'omit',
    });
    
    if (response.status === 401 || response.status === 403) {
        clearSupplierToken();
        window.location.href = '/#/supplier-login?reason=session_expired';
        throw new Error("Session expired.");
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error body');
        throw new Error(`Failed to download template: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const disposition = response.headers.get('Content-Disposition');
    const filename = parseFilenameFromContentDisposition(disposition) || 'rates_template.xlsx';
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
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
    const token = getSupplierToken();
    if (!token) throw new Error("Authentication failed. Please log in again.");

    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/api/supplier/rates/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
        credentials: 'omit',
    });

    if (response.status === 401 || response.status === 403) {
        clearSupplierToken();
        window.location.href = '/#/supplier-login?reason=session_expired';
        throw new Error("Session expired.");
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || `Upload failed with status: ${response.status}`);
    }
    
    return data;
  }
};