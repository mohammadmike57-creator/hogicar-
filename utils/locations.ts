import { fetchLocations, LocationSuggestion } from '../api';

const CUSTOM_LOCATIONS_KEY = 'hogicar_custom_locations';

export const getAllLocations = async (searchTerm?: string): Promise<LocationSuggestion[]> => {
  // 1. Fetch from API (public endpoint, no auth required)
  let apiLocations: LocationSuggestion[] = [];
  try {
    const term = searchTerm && searchTerm.length >= 2 ? searchTerm : 'a';
    apiLocations = await fetchLocations(term);
  } catch (error) {
    console.error('Failed to fetch API locations:', error);
  }

  // 2. Load custom locations from localStorage
  let customLocations: LocationSuggestion[] = [];
  try {
    const stored = localStorage.getItem(CUSTOM_LOCATIONS_KEY);
    if (stored) {
      customLocations = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load custom locations:', error);
  }

  // 3. Merge – custom locations first, then API locations (no duplicates by value)
  const all = [...customLocations];
  for (const loc of apiLocations) {
    if (!all.some(existing => existing.value === loc.value)) {
      all.push(loc);
    }
  }
  return all;
};

export const saveCustomLocation = (location: LocationSuggestion): void => {
  try {
    const stored = localStorage.getItem(CUSTOM_LOCATIONS_KEY);
    const existing: LocationSuggestion[] = stored ? JSON.parse(stored) : [];
    if (!existing.some(l => l.value === location.value)) {
      existing.push(location);
      localStorage.setItem(CUSTOM_LOCATIONS_KEY, JSON.stringify(existing));
    }
  } catch (error) {
    console.error('Failed to save custom location:', error);
  }
};

export const deleteCustomLocation = (value: string): void => {
  try {
    const stored = localStorage.getItem(CUSTOM_LOCATIONS_KEY);
    if (stored) {
      let locations: LocationSuggestion[] = JSON.parse(stored);
      locations = locations.filter(l => l.value !== value);
      localStorage.setItem(CUSTOM_LOCATIONS_KEY, JSON.stringify(locations));
    }
  } catch (error) {
    console.error('Failed to delete custom location:', error);
  }
};
