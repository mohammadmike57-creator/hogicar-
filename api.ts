
import { ApiSearchResult } from './types';

// Per user instruction for env variable support
const API_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_API_URL) ||
  "https://hogicar-backend.onrender.com";

// Updated interface to match the new backend response for location suggestions
export interface LocationSuggestion {
  value: string;
  label: string;
  type: string;
}

// Updated to use 'query' parameter as per new backend endpoint
export async function fetchLocations(query: string): Promise<LocationSuggestion[]> {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
      `${API_URL}/api/locations?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      console.error("Failed to fetch locations:", response.statusText);
      return [];
    }

    const data = await response.json();
    console.log("LOCATIONS API RESPONSE:", data);
    return data;
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
}

// Per user instruction for fetchCars
export async function fetchCars(params: {
  pickup: string;
  dropoff: string;
  pickupDate: string;
  dropoffDate: string;
}): Promise<ApiSearchResult[]> {
  const apiParams = {
    pickupLocation: params.pickup,
    pickupDate: params.pickupDate,
    dropoffDate: params.dropoffDate,
  };
  const query = new URLSearchParams(apiParams).toString();

  const response = await fetch(`${API_URL}/api/cars?${query}`);

  if (!response.ok) {
    throw new Error("Failed to fetch cars");
  }

  const data = await response.json();
  return data;
}
