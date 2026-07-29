import { ApiSearchResult } from '../types';
import { loadCars } from './loadCars';
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

interface SearchPrefetchMeta {
  signature: string;
  status: 'pending' | 'fulfilled' | 'failed';
  startedAt: number;
  completedAt?: number;
}

let activePrefetch: {
  signature: string;
  promise: Promise<ApiSearchResult[]>;
} | null = null;

const canUseSessionStorage = () => (
  typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
);

export const buildSearchPrefetchSignature = (params: CarSearchPrefetchParams) => {
  const pickup = (params.pickupCode || '').trim().toUpperCase();
  const dropoff = (params.dropoffCode || params.pickupCode || '').trim().toUpperCase();
  return [
    pickup, 
    dropoff, 
    params.pickupDate || '', 
    params.dropoffDate || '',
    params.startTime || '10:00',
    params.endTime || '10:00'
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

export const getMatchingPrefetchedResults = (params: CarSearchPrefetchParams): ApiSearchResult[] | null => {
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
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn('Search prefetch: failed to read cached results', error);
    sessionStorage.removeItem(PREFETCHED_RESULTS_KEY);
    sessionStorage.removeItem(PREFETCHED_RESULTS_META_KEY);
    return null;
  }
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

  const promise = loadCars({
    pickupCode: params.pickupCode,
    dropoffCode: params.dropoffCode || params.pickupCode,
    pickupDate: params.pickupDate,
    dropoffDate: params.dropoffDate,
    startTime: params.startTime,
    endTime: params.endTime,
  }).then((data) => {
    const currentMeta = readPrefetchMeta();
    if (currentMeta?.signature !== signature) {
      return data;
    }

    const stored = safeSessionStorageSetItem(
      PREFETCHED_RESULTS_KEY,
      JSON.stringify(compactPrefetchedResults(data))
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
