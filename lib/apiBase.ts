
import { API_BASE_URL } from './config';

export function getApiBaseUrl(): string {
  // Always return the production URL from the single source of truth.
  return API_BASE_URL;
}
