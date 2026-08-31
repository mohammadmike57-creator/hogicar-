
// This file contains the fetch wrapper for all admin-authenticated API calls.
// It enforces JWT via Authorization header only; no cookies are used.
import { API_BASE_URL } from './config';

const ADMIN_TOKEN_KEY = "adminToken";

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

    if (!token) {
        if (!suppressRedirect) {
            clearAdminToken();
            window.location.href = '/admin-login?reason=session_expired';
        }
        throw new Error('Admin session expired. Please log in again.');
    }

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

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
            window.location.href = '/admin-login?reason=session_expired';
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

// Helper methods for Supplier Fleet and Rates
export async function getSupplierCars(supplierId: number) {
    return adminFetch(`/api/admin/suppliers/${supplierId}/cars`);
}

export async function getSupplierRates(supplierId: number, carId: number) {
    return adminFetch(`/api/admin/suppliers/${supplierId}/cars/${carId}/rates`);
}

export async function getAllSupplierRates(supplierId: number) {
    return adminFetch(`/api/admin/suppliers/${supplierId}/cars/rates`);
}

export async function updateHogicarChoice(supplierId: number, carId: number, data: { hogicarChoice?: boolean, hogicarPromotion?: number }) {
    return adminFetch(`/api/admin/suppliers/${supplierId}/cars/${carId}/hogicar-choice`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

export async function performSeoAudit(lite: boolean = false, deep: boolean = false, country?: string, lang?: string, force: boolean = false) {
    let url = `/api/admin/seo/audit?lite=${lite}&deep=${deep}&force=${force}`;
    if (country) url += `&country=${country}`;
    if (lang) url += `&lang=${lang}`;
    return adminFetch(url);
}

export async function runSeoAuditJob(lite: boolean = false, deep: boolean = true, country?: string, lang?: string) {
    let url = `/api/admin/seo/audit/run?lite=${lite}&deep=${deep}`;
    if (country) url += `&country=${country}`;
    if (lang) url += `&lang=${lang}`;
    return adminFetch(url, { method: 'POST' });
}

export async function getSeoAuditJob(id: number) {
    return adminFetch(`/api/admin/seo/audit/jobs/${id}`);
}

export async function getSeoAuditResults(jobId: number, page: number = 0, size: number = 50) {
    return adminFetch(`/api/admin/seo/audit/results/${jobId}?page=${page}&size=${size}`);
}

export async function fixOneSeoIssue(issue: any) {
    return adminFetch('/api/admin/seo/fix-one', { method: 'POST', body: JSON.stringify(issue) });
}

export async function fixAllSeoIssues(issues: any[]) {
    return adminFetch('/api/admin/seo/fix-all', { method: 'POST', body: JSON.stringify(issues) });
}

export async function fixCountrySeo(country: string, lang?: string) {
    let url = `/api/admin/seo/fix-country?country=${country}`;
    if (lang) url += `&lang=${lang}`;
    return adminFetch(url, { method: 'POST' });
}

export async function fixSiteSeo() {
    return adminFetch('/api/admin/seo/fix-site', { method: 'POST' });
}

export async function setRouteLifecycleStatus(id: number, status: string) {
    return adminFetch(`/api/admin/seo/routes/${id}/status?status=${status}`, { method: 'POST' });
}

export async function mergeSeoRoutes(primaryId: number, secondaryId: number) {
    return adminFetch(`/api/admin/seo/routes/${primaryId}/merge/${secondaryId}`, { method: 'POST' });
}

export async function deleteSeoRoute(id: number) {
    return adminFetch(`/api/admin/seo/routes/${id}`, { method: 'DELETE' });
}

export async function getSeoFixJob(id: number) {
    return adminFetch(`/api/admin/seo/fix-job/${id}`);
}

export async function fixPageSeo(id: number, issues: any[]) {
    return adminFetch(`/api/admin/seo/fix-page/${id}`, { method: 'POST', body: JSON.stringify(issues) });
}

export async function dismissSeoIssue(configId: number, issueType: string, reason: string) {
    return adminFetch(`/api/admin/seo/dismiss-issue?configId=${configId}&issueType=${encodeURIComponent(issueType)}&reason=${encodeURIComponent(reason)}`, { method: 'POST' });
}

export async function rollbackSeoFixJob(jobId: number) {
    return adminFetch(`/api/admin/seo/rollback/${jobId}`, { method: 'POST' });
}

export async function generateJordanSeoRoutes() {
    return adminFetch('/api/admin/seo/generate-jordan', { method: 'POST' });
}
