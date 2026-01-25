import { ApiSearchResult } from './types';

// Per user instruction for env variable support
const API_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_API_URL) ||
  "https://hogicar-backend.onrender.com";

// Interface needed by SearchWidget.tsx
export interface LocationSuggestion {
  iataCode: string;
  name: string;
  city: string;
  country: string;
}

// Per user instruction for fetchLocations
export async function fetchLocations(keyword: string): Promise<LocationSuggestion[]> {
  if (!keyword || keyword.length < 2) return [];

  const response = await fetch(
    `${API_URL}/api/locations?keyword=${encodeURIComponent(keyword)}`
  );

  if (!response.ok) {
    return [];
  }

  return response.json();
}

// Per user instruction for fetchCars
export async function fetchCars(params: {
  pickup: string;
  dropoff: string;
  pickupDate: string;
  dropoffDate: string;
}): Promise<ApiSearchResult[]> {
  const query = new URLSearchParams(params as any).toString();

  const response = await fetch(`${API_URL}/api/search?${query}`);

  if (!response.ok) {
    throw new Error("Failed to fetch cars");
  }

  return response.json();
}
