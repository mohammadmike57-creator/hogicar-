

import { ApiSearchResult, CarCategory } from './types';

const API_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_API_URL) ||
  "https://hogicar-backend.onrender.com";

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
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.statusText}`);
    }

    // A) Fix locations response parsing
    const responseData = await response.text();
    let locationsArray: ApiLocation[];

    try {
        // Handle responses that are JSON strings (double-encoded)
        locationsArray = typeof responseData === "string" ? JSON.parse(responseData) : responseData;
    } catch (e) {
        console.error("Failed to parse locations JSON:", responseData);
        throw new Error("Invalid format for locations response.");
    }
    
    if (!Array.isArray(locationsArray)) {
       throw new Error("Locations API did not return an array.");
    }
    
    console.log("LOCATIONS API RESPONSE (ARRAY):", locationsArray);
    
    // B) Build dropdown options
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
  // F) Build correct Cars URL
  const carsUrl = `${API_URL}/api/cars?pickup=${pickup}&dropoff=${dropoff}&pickupDate=${pickupDate}&dropoffDate=${dropoffDate}`;
  console.log("CARS URL:", carsUrl);

  const response = await fetch(carsUrl);

  if (!response.ok) {
    const body = await response.text();
    console.error("Failed to fetch cars. Status:", response.status, "Body:", body);
    throw new Error(`Failed to fetch cars. The server responded with status: ${response.status}`);
  }

  const rawCars: ApiSearchResult[] = await response.json();

  // G) Prevent crash when supplier is missing
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
    // Add safe defaults for other fields to prevent crashes
    normalizedCar.name = normalizedCar.name ?? "";
    normalizedCar.brand = normalizedCar.brand ?? "";
    normalizedCar.model = normalizedCar.model ?? "";
    normalizedCar.netPrice = normalizedCar.netPrice ?? 0;
    normalizedCar.currency = normalizedCar.currency ?? "USD";
    normalizedCar.image = normalizedCar.image ?? "";
    normalizedCar.category = normalizedCar.category ?? CarCategory.ECONOMY;
    
    return normalizedCar;
  });
  
  console.log("CARS API RESPONSE (NORMALIZED):", normalizedCars);

  return normalizedCars;
}