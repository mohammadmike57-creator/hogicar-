
// This file contains the fetch wrapper for all admin-authenticated API calls.
// It enforces JWT via Authorization header only; no cookies are used.
import { API_BASE_URL } from './config';

const ADMIN_TOKEN_KEY = "admin_token";

export function getAdminToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function adminFetch(path: string, options: RequestInit = {}, suppressRedirect = false): Promise<any> {
    const token = getAdminToken();
    const url = `${API_BASE_URL}${path}`;

    const headers = new Headers(options.headers || {});
    
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    let response: Response;
    try {
        response = await fetch(url, {
            ...options,
            headers,
            credentials: 'omit',
        });
    } catch(e: any) {
        // Network error, CORS, etc.
        console.error(`Request to ${url} failed`, e);
        throw new Error(`Cannot reach backend: ${API_BASE_URL}`);
    }


    if (response.status === 401 || response.status === 403) {
        if (!suppressRedirect) {
            clearAdminToken();
            window.location.href = '/#/admin-login?reason=session_expired';
        }
        throw new Error('Unauthorized or Forbidden (token missing/invalid)');
    }

    if (!response.ok) {
        let errorText;
        try {
            const errorData = await response.json();
            errorText = errorData.message || JSON.stringify(errorData);
        } catch (e) {
             errorText = await response.text().catch(() => response.statusText);
        }
        throw new Error(`Request failed with status ${response.status}: ${errorText}`);
    }

    const text = await response.text();
    try {
        // Return JSON if parsable, otherwise return the raw text.
        return JSON.parse(text);
    } catch (e) {
        return text;
    }
}