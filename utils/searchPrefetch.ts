import { ApiSearchResult } from '../types';
import { loadCars, PaginatedCars } from './loadCars';
import { compactPrefetchedResults, PREFETCHED_RESULTS_KEY, safeSessionStorageSetItem } from './storage';

export const PREFETCHED_RESULTS_META_KEY = 'hogicar_prefetched_results_meta';

export interface CarSearchPrefetchParams {
  pickupCode: string;
  dropoffCode?: string;
  pickupDate: string;
  dropoffDate: string;
  startTime?: string;
  endTime?: string;
}

/**
 * Standardizes search parameters from URL search params for consistent prefetching across pages.
 */
export const getPrefetchParamsFromUrl = (searchParams: URLSearchParams): CarSearchPrefetchParams => {
  const pickup = searchParams.get('pickup') || '';
  const dropoff = searchParams.get('dropoff') || pickup;
  
  // Default dates: today and today + 3 days
  const today = new Date();
  const nextThreeDays = new Date(today);
  nextThreeDays.setDate(today.getDate() + 3);
  
  const defaultStart = today.toISOString().split('T')[0];
  const defaultEnd = nextThreeDays.toISOString().split('T')[0];

  return {
    pickupCode: pickup,
    dropoffCode: dropoff,
    pickupDate: searchParams.get('pickupDate') || defaultStart,
    dropoffDate: searchParams.get('dropoffDate') || defaultEnd,
    startTime: searchParams.get('startTime') || '10:00',
    endTime: searchParams.get('endTime') || '10:00',
  };
};

interface SearchPrefetchMeta {
  signature: string;
  status: 'pending' | 'fulfilled' | 'failed';
  startedAt: number;
  completedAt?: number;
}

let activePrefetch: {
  signature: string;
  promise: Promise<PaginatedCars>;
} | null = null;

const canUseSessionStorage = () => (
  typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
);

export const buildSearchPrefetchSignature = (params: CarSearchPrefetchParams) => {
  const pickup = (params.pickupCode || '').trim().toUpperCase();
  const dropoff = (params.dropoffCode || params.pickupCode || '').trim().toUpperCase();
  const start = (params.startTime || '10:00').trim();
  const end = (params.endTime || '10:00').trim();
  const pickupDate = (params.pickupDate || '').trim();
  const dropoffDate = (params.dropoffDate || '').trim();

  return [
    pickup, 
    dropoff, 
    pickupDate, 
    dropoffDate,
    start,
    end
  ].join('|');
};

const readPrefetchMeta = (): SearchPrefetchMeta | null => {
  if (!canUseSessionStorage()) return null;

  try {
    const rawMeta = sessionStorage.getItem(PREFETCHED_RESULTS_META_KEY);
    return rawMeta ? JSON.parse(rawMeta) : null;
  } catch (error) {
    console.warn('Search prefetch: failed to read metadata', error);
    return null;
  }
};

const writePrefetchMeta = (meta: SearchPrefetchMeta) => {
  if (!canUseSessionStorage()) return;
  safeSessionStorageSetItem(PREFETCHED_RESULTS_META_KEY, JSON.stringify(meta));
};

export const clearMatchingPrefetchedResults = (params: CarSearchPrefetchParams) => {
  if (!canUseSessionStorage()) return;

  const signature = buildSearchPrefetchSignature(params);
  const meta = readPrefetchMeta();
  if (meta?.signature !== signature) return;

  sessionStorage.removeItem(PREFETCHED_RESULTS_KEY);
  sessionStorage.removeItem(PREFETCHED_RESULTS_META_KEY);
  if (activePrefetch?.signature === signature) {
    activePrefetch = null;
  }
};

export const getMatchingPrefetchedResults = (params: CarSearchPrefetchParams): PaginatedCars | null => {
  if (!canUseSessionStorage()) return null;

  const signature = buildSearchPrefetchSignature(params);
  const meta = readPrefetchMeta();
  if (meta?.signature !== signature || meta.status !== 'fulfilled') {
    return null;
  }

  try {
    const rawResults = sessionStorage.getItem(PREFETCHED_RESULTS_KEY);
    if (!rawResults) return null;

    const parsed = JSON.parse(rawResults);
    // Even if it was stored as an array before, we now expect PaginatedCars
    if (parsed && Array.isArray(parsed.cars)) {
      return parsed as PaginatedCars;
    }
    // Fallback for older format if any
    if (Array.isArray(parsed)) {
      return {
        cars: parsed,
        page: 0,
        size: 20,
        hasNext: true
      };
    }
    return null;
  } catch (error) {
    console.warn('Search prefetch: failed to read cached results', error);
    sessionStorage.removeItem(PREFETCHED_RESULTS_KEY);
    sessionStorage.removeItem(PREFETCHED_RESULTS_META_KEY);
    return null;
  }
};

export const getPrefetchStatus = (params: CarSearchPrefetchParams): 'pending' | 'fulfilled' | 'failed' | 'none' => {
  const signature = buildSearchPrefetchSignature(params);
  const meta = readPrefetchMeta();
  if (meta?.signature !== signature) return 'none';
  return meta.status;
};

export const waitForMatchingSearchPrefetch = (params: CarSearchPrefetchParams) => {
  const signature = buildSearchPrefetchSignature(params);
  return activePrefetch?.signature === signature ? activePrefetch.promise : null;
};

export const startCarSearchPrefetch = (params: CarSearchPrefetchParams) => {
  const signature = buildSearchPrefetchSignature(params);

  if (activePrefetch?.signature === signature) {
    return activePrefetch.promise;
  }

  const existingResults = getMatchingPrefetchedResults(params);
  if (existingResults) {
    return Promise.resolve(existingResults);
  }

  if (canUseSessionStorage()) {
    const existingMeta = readPrefetchMeta();
    if (existingMeta?.signature !== signature) {
      sessionStorage.removeItem(PREFETCHED_RESULTS_KEY);
    }
  }

  writePrefetchMeta({
    signature,
    status: 'pending',
    startedAt: Date.now(),
  });

  console.log("CAR SEARCH API REQUEST STARTING", { signature });
  const promise = loadCars({
    pickupCode: params.pickupCode,
    dropoffCode: params.dropoffCode || params.pickupCode,
    pickupDate: params.pickupDate,
    dropoffDate: params.dropoffDate,
    startTime: params.startTime,
    endTime: params.endTime,
    page: 0,
    size: 20
  }).then((data) => {
    console.log("CAR SEARCH API COMPLETED", { 
        signature, 
        carsCount: data.cars?.length,
        hasNext: data.hasNext
    });
    const currentMeta = readPrefetchMeta();
    if (currentMeta?.signature !== signature) {
      return data;
    }

    // We only compact the cars list for storage
    const storageData = {
        ...data,
        cars: compactPrefetchedResults(data.cars)
    };

    const stored = safeSessionStorageSetItem(
      PREFETCHED_RESULTS_KEY,
      JSON.stringify(storageData)
    );

    writePrefetchMeta({
      signature,
      status: stored ? 'fulfilled' : 'failed',
      startedAt: currentMeta.startedAt || Date.now(),
      completedAt: Date.now(),
    });

    return data;
  });

  promise.catch((error) => {
    const currentMeta = readPrefetchMeta();
    console.error("CAR SEARCH API FAILED", { signature, error });
    if (currentMeta?.signature !== signature) {
      return;
    }

    console.warn('Search prefetch failed:', error);
    writePrefetchMeta({
      signature,
      status: 'failed',
      startedAt: currentMeta.startedAt || Date.now(),
      completedAt: Date.now(),
    });
  });

  activePrefetch = { signature, promise };
  return promise;
};
