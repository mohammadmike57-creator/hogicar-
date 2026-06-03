import { Car } from '../types';

const SELECTED_CAR_KEY = 'hogicar_selectedCar';
const SELECTED_CAR_ID_KEY = 'hogicar_selectedCarId';
const CARS_KEY = 'hogicar_cars';
const MAX_EMBEDDED_IMAGE_LENGTH = 120_000;
const MAX_STORED_CARS = 30;

const isQuotaError = (error: unknown) => (
  error instanceof DOMException &&
  (
    error.code === 22 ||
    error.code === 1014 ||
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
  )
);

const stripLargeDataUrls = (
  value: any,
  seen = new WeakSet<object>(),
  options: { preservePrimaryImage?: boolean; depth?: number } = {}
): any => {
  const depth = options.depth ?? 0;

  if (typeof value === 'string') {
    if (value.startsWith('data:image/') && value.length > MAX_EMBEDDED_IMAGE_LENGTH) {
      return '';
    }
    return value;
  }

  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return undefined;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map(item => stripLargeDataUrls(item, seen, { ...options, depth: depth + 1 }));
  }

  return Object.entries(value).reduce((acc, [key, item]) => {
    if (typeof item !== 'function') {
      if (options.preservePrimaryImage && depth === 0 && (key === 'image' || key === 'imageUrl')) {
        acc[key] = item;
      } else {
        acc[key] = stripLargeDataUrls(item, seen, { ...options, depth: depth + 1 });
      }
    }
    return acc;
  }, {} as Record<string, any>);
};

export const compactCarForStorage = (car: Car, options: { preservePrimaryImage?: boolean } = {}): Car => (
  stripLargeDataUrls(car, new WeakSet<object>(), options) as Car
);

export const safeSessionStorageSetItem = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (!isQuotaError(error)) {
      console.error(`Error setting ${key} in sessionStorage:`, error);
      return false;
    }

    console.warn(`sessionStorage quota exceeded for key: ${key}. Recovering with compact booking storage.`);
    sessionStorage.removeItem(CARS_KEY);

    if (key === CARS_KEY) return false;

    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (retryError) {
      console.error(`Storage recovery failed for ${key}`, retryError);
      return false;
    }
  }
};

export const persistSelectedCar = (car: Car, cars?: Car[]) => {
  const compactCar = compactCarForStorage(car, { preservePrimaryImage: true });
  safeSessionStorageSetItem(SELECTED_CAR_ID_KEY, String(car.id));
  const storedSelectedCar = safeSessionStorageSetItem(SELECTED_CAR_KEY, JSON.stringify(compactCar));

  if (!storedSelectedCar) {
    safeSessionStorageSetItem(SELECTED_CAR_KEY, JSON.stringify(compactCarForStorage(car)));
  }

  if (!Array.isArray(cars) || cars.length === 0) return;

  const compactCars = [
    compactCar,
    ...cars
      .filter(item => String(item.id) !== String(car.id))
      .slice(0, MAX_STORED_CARS - 1)
      .map(item => compactCarForStorage(item)),
  ];

  safeSessionStorageSetItem(CARS_KEY, JSON.stringify(compactCars));
};
