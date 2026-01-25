import { ApiSearchResult } from './types';

// FIX: Cast import.meta to any to access env property. This is a workaround because
// the Vite client types seem to be missing from the project's TypeScript configuration,
// causing errors with `import.meta.env`.
const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://hogicar-backend.onrender.com';

export interface LocationSuggestion {
  iataCode: string;
  name: string;
  city: string;
  country: string;
}

export async function fetchLocations(keyword: string): Promise<LocationSuggestion[]> {
  if (!keyword || keyword.length < 2) return [];
  try {
    const response = await fetch(
      `${API_URL}/api/locations?keyword=${encodeURIComponent(keyword)}`
    );
    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    return [];
  }
}

export async function fetchCars(params: { pickup: string, dropoff: string, pickupDate: string, dropoffDate: string }): Promise<ApiSearchResult[]> {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/api/search?${query}`);
  if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
  }
  return response.json();
}
