

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

// Kept this function as it is used by the SearchWidget, per instructions.
export async function fetchLocations(query: string): Promise<LocationSuggestion[]> {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
      `${API_URL}/api/locations?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("LOCATIONS API RESPONSE:", data);
    return data;
  } catch (error) {
    console.error("Error fetching locations:", error);
    throw error; // Re-throw for the component to handle
  }
}

// Updated fetchCars to match user instructions: a simple GET to /api/cars.
export async function fetchCars(): Promise<ApiSearchResult[]> {
  const response = await fetch(`${API_URL}/api/cars`);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Failed to fetch cars. Status:", response.status, "Body:", errorBody);
    throw new Error("Failed to fetch cars");
  }

  const data = await response.json();
  return data;
}