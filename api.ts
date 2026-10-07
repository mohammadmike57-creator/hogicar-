import axios from 'axios';
import { API_BASE_URL as CONFIG_BASE_URL } from './lib/config';

export const API_BASE_URL = CONFIG_BASE_URL || "";

// ---------- Types ----------
export interface LocationSuggestion {
  value: string;      // IATA code
  label: string;      // Display text (e.g., "Queen Alia International Airport (AMM), Amman, Jordan")
  iataCode: string;
  name: string;
  municipality: string;
  countryCode: string;
  type: 'airport' | 'city';  // For icon selection
}

export interface Booking {
  id: number;
  bookingRef: string;
  supplierId: number;
  supplierName: string;
  pickupCode: string;
  dropoffCode: string;
  pickupLocationName?: string;
  dropoffLocationName?: string;
  pickupDate: string;
  dropoffDate: string;
  startTime: string;
  endTime: string;
  currency: string;
  netPrice: number;
  commissionPercent: number;
  commissionAmount: number;
  finalPrice: number;
  payNow: number;
  payAtDesk: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  flightNumber?: string;
  status: string;
  supplierConfirmationNumber?: string;
  createdAt: string;
  updatedAt: string;
  clientSecret?: string;
  publishableKey?: string;
  carImage?: string;
  supplierLogoUrl?: string;
  carMake?: string;
  carModel?: string;
  carCategory?: string;
  carTransmission?: string;
  carFuelPolicy?: string;
  carPassengers?: number;
  carBags?: number;
  carDoors?: number;
  carAirConditioning?: boolean;
}

// Create axios instances with interceptors for auth
const publicAxios = axios.create();
const adminAxios = axios.create();
const supplierAxios = axios.create();

// Add request interceptor to adminAxios to attach token
adminAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add request interceptor to supplierAxios to attach token
supplierAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('supplierToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- Standalone customer API functions (named exports) ----------
export const fetchLocations = async (query: string, hint?: string): Promise<LocationSuggestion[]> => {
  if (!query || query.length < 2) return [];
  try {
    let url = `${API_BASE_URL}/api/public/locations/search?q=${encodeURIComponent(query)}`;
    if (hint) {
      url += `&hint=${encodeURIComponent(hint)}`;
    }
    console.log('[DEBUG_LOG] Fetching locations from:', url);
    const response = await publicAxios.get(url);
    // Map the backend response to { value, label, type } format
    const results = response.data.map((loc: any) => {
      // Determine type based on backend type or airport name
      const backendType = loc.type || loc.airportType;
      const isAirport = (backendType && backendType.toLowerCase().includes('airport')) || 
                        (loc.name || '').toLowerCase().includes('airport');
      
      let label = loc.name;
      if (loc.municipality) {
        label += `, ${loc.municipality}`;
      }
      if (loc.iataCode) {
        label += ` (${loc.iataCode})`;
      }
      if (loc.isoCountry) {
        label += `, ${loc.isoCountry}`;
      }
      return {
        value: loc.iataCode || `LOC:${loc.id}`,
        label: label,
        iataCode: loc.iataCode,
        name: loc.name,
        municipality: loc.municipality || '',
        countryCode: loc.isoCountry || '',
        type: isAirport ? 'airport' : 'city',
      };
    });

    // Deduplicate by label to prevent identical suggestions
    return Array.from(new Map(results.map((item: any) => [item.label, item])).values());
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
};

export const getPublicLocations = async (): Promise<LocationSuggestion[]> => {
  try {
    const response = await publicAxios.get(`${API_BASE_URL}/api/public/locations`);
    const results = response.data.map((loc: any) => {
      const nameLower = (loc.name || '').toLowerCase();
      const isAirport = nameLower.includes('airport') || nameLower.includes('heliport') || nameLower.includes('airstrip');
      
      let label = loc.name;
      if (loc.municipality) {
        label += `, ${loc.municipality}`;
      }
      label += ` (${loc.iataCode})`;
      if (loc.isoCountry) {
        label += `, ${loc.isoCountry}`;
      }
      return {
        value: loc.iataCode,
        label: label,
        iataCode: loc.iataCode,
        name: loc.name,
        municipality: loc.municipality || '',
        countryCode: loc.isoCountry || '',
        type: isAirport ? 'airport' : 'city',
      };
    });

    // Deduplicate by label
    return Array.from(new Map(results.map((item: any) => [item.label, item])).values());
  } catch (error) {
    console.error('Error fetching all locations:', error);
    return [];
  }
};

export const lookupBooking = async (email: string, bookingRef: string): Promise<Booking> => {
  const response = await publicAxios.get(`${API_BASE_URL}/api/bookings/lookup?email=${encodeURIComponent(email)}&ref=${encodeURIComponent(bookingRef)}`);
  return response.data;
};

export const getBooking = async (id: number): Promise<Booking> => {
  const response = await publicAxios.get(`${API_BASE_URL}/api/bookings/${id}`);
  return response.data;
};

export const getBookingByRef = async (bookingRef: string): Promise<Booking> => {
  const response = await publicAxios.get(`${API_BASE_URL}/api/bookings/ref/${encodeURIComponent(bookingRef)}`);
  return response.data;
};

export const cancelBooking = async (id: number): Promise<Booking> => {
  const response = await publicAxios.post(`${API_BASE_URL}/api/bookings/${id}/cancel`);
  return response.data;
};

/** Manage-booking actions, verified with the booking's email and reference. */
export const manageBooking = {
  cancel: (email: string, ref: string, reason?: string) =>
    publicAxios.post(`${API_BASE_URL}/api/bookings/manage/cancel`, { email, ref, reason }).then(r => r.data),
  updateContact: (email: string, ref: string, phone: string, flightNumber: string) =>
    publicAxios.post(`${API_BASE_URL}/api/bookings/manage/contact`, { email, ref, phone, flightNumber }).then(r => r.data),
  requestChange: (email: string, ref: string, change: { pickupDate: string; startTime: string; dropoffDate: string; endTime: string; note?: string }) =>
    publicAxios.post(`${API_BASE_URL}/api/bookings/manage/change-request`, { email, ref, ...change }).then(r => r.data),
  withdrawChange: (email: string, ref: string) =>
    publicAxios.post(`${API_BASE_URL}/api/bookings/manage/change-request/withdraw`, { email, ref }).then(r => r.data),
};

export const requestModification = async (id: number, data: any): Promise<any> => {
  const response = await publicAxios.post(`${API_BASE_URL}/api/bookings/${id}/modification/request`, data);
  return response.data;
};

export const confirmModification = async (id: number): Promise<Booking> => {
  const response = await publicAxios.post(`${API_BASE_URL}/api/bookings/${id}/modification/confirm`);
  return response.data;
};

export const submitReview = async (id: number, reviewData: any): Promise<any> => {
  const response = await publicAxios.post(`${API_BASE_URL}/api/bookings/${id}/review`, reviewData);
  return response.data;
};

export const createBooking = async (bookingData: any): Promise<Booking & { clientSecret?: string }> => {
  const response = await publicAxios.post(`${API_BASE_URL}/api/bookings`, bookingData);
  return response.data;
};

export const markBookingPaymentComplete = async (id: number, paymentIntentId: string): Promise<Booking> => {
  const response = await publicAxios.post(`${API_BASE_URL}/api/bookings/${id}/payment-complete`, { paymentIntentId });
  return response.data;
};

export const refreshBookingPaymentIntent = async (id: number): Promise<Booking & { clientSecret?: string }> => {
  const response = await publicAxios.post(`${API_BASE_URL}/api/bookings/${id}/payment-intent/refresh`);
  return response.data;
};

export const fetchStripeConfig = async (): Promise<{ publishableKey: string }> => {
  const response = await publicAxios.get(`${API_BASE_URL}/api/public/stripe/config?t=${Date.now()}`);
  return response.data || { publishableKey: '' };
};

export const getGoogleWalletUrl = async (bookingRef: string): Promise<string> => {
  const response = await publicAxios.get(`${API_BASE_URL}/api/vouchers/${encodeURIComponent(bookingRef)}/google-wallet-url`);
  const data = response.data;
  return typeof data === 'string' ? data : data?.url;
};

/** Signed Apple Wallet pass (.pkpass) for a booking. */
export const appleWalletPassUrl = (bookingRef: string) =>
  `${API_BASE_URL}/api/vouchers/${encodeURIComponent(bookingRef)}/apple-wallet`;

export type WalletStatus = { appleWallet: boolean; googleWallet: boolean };
let walletStatusPromise: Promise<WalletStatus> | null = null;
/** Which wallets the server can issue passes for (cached for the page's lifetime). */
export const getWalletStatus = (): Promise<WalletStatus> => {
  if (!walletStatusPromise) {
    walletStatusPromise = publicAxios.get(`${API_BASE_URL}/api/vouchers/config-status`)
      .then(r => ({ appleWallet: !!r.data?.appleWallet, googleWallet: !!r.data?.googleWallet }))
      .catch(() => { walletStatusPromise = null; return { appleWallet: false, googleWallet: false }; });
  }
  return walletStatusPromise;
};

export const fetchPublicSuppliers = async (locationCode?: string): Promise<any[]> => {
  try {
    const url = locationCode 
      ? `${API_BASE_URL}/api/public/suppliers?locationCode=${encodeURIComponent(locationCode)}`
      : `${API_BASE_URL}/api/public/suppliers`;
    const response = await publicAxios.get(url);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching public suppliers:', error);
    return [];
  }
};

export const fetchHomepageLogos = async (): Promise<any[]> => {
  try {
    const response = await publicAxios.get(`${API_BASE_URL}/api/public/homepage-logos`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching homepage logos:', error);
    return [];
  }
};

export const fetchSiteSettings = async (): Promise<any> => {
  try {
    const response = await publicAxios.get(`${API_BASE_URL}/api/public/settings`);
    return response.data;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return { searchingScreenDuration: 5000, heroImageUrl: "" };
  }
};

export const fetchHomepageContent = async (): Promise<any> => {
  try {
    const response = await publicAxios.get(`${API_BASE_URL}/api/homepage/content`);
    return response.data && typeof response.data === 'object' ? response.data : {};
  } catch (error) {
    console.error('Error fetching homepage content:', error);
    return {};
  }
};

export const fetchSearchingLogos = async (locationCode?: string): Promise<any[]> => {
  try {
    const url = locationCode 
      ? `${API_BASE_URL}/api/public/searching-logos?locationCode=${encodeURIComponent(locationCode)}`
      : `${API_BASE_URL}/api/public/searching-logos`;
    const response = await publicAxios.get(url);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching searching logos:', error);
    return [];
  }
};

export const fetchHomepageFeaturedBlogs = async (): Promise<BlogArticle[]> => {
  try {
    const response = await publicAxios.get(`${API_BASE_URL}/api/public/blog/featured-home`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching featured blogs:', error);
    return [];
  }
};

export const fetchRelatedBlogs = async (route?: string, country?: string, airport?: string, limit: number = 6, lang?: string): Promise<BlogArticle[]> => {
  try {
    const params = new URLSearchParams();
    if (route) params.append('route', route);
    if (country) params.append('country', country);
    if (airport) params.append('airport', airport);
    if (lang) params.append('lang', lang);
    params.append('limit', limit.toString());
    
    const response = await publicAxios.get(`${API_BASE_URL}/api/public/blog/related?${params.toString()}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching related blogs:', error);
    return [];
  }
};

export const fetchRecentBlogs = async (): Promise<any[]> => {
  try {
    const response = await publicAxios.get(`${API_BASE_URL}/api/public/blog/recent`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching recent blogs:', error);
    return [];
  }
};

export const submitPartnerApplication = async (data: any): Promise<any> => {
  const response = await publicAxios.post(`${API_BASE_URL}/api/partner-applications/submit`, data, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

export const getBookingByToken = async (token: string): Promise<any> => {
  const response = await publicAxios.get(`${API_BASE_URL}/api/supplier/confirmation/booking?token=${token}`);
  return response.data;
};

export const confirmBookingByToken = async (token: string, confirmationNumber: string): Promise<any> => {
  const response = await publicAxios.post(`${API_BASE_URL}/api/supplier/confirmation/confirm?token=${token}&confirmationNumber=${confirmationNumber}`);
  return response.data;
};

export const rejectBookingByToken = async (token: string, reason: string): Promise<any> => {
  const response = await publicAxios.post(`${API_BASE_URL}/api/supplier/confirmation/reject?token=${token}&reason=${encodeURIComponent(reason)}`);
  return response.data;
};

// ---------- Backward‑compatible api object ----------
export const api = {
  fetchLocations,
  getPublicLocations,
  lookupBooking,
  getBooking,
  getBookingByRef,
  getBookingByToken,
  confirmBookingByToken,
  rejectBookingByToken,
  cancelBooking,
  requestModification,
  confirmModification,
  submitReview,
  createBooking,
  markBookingPaymentComplete,
  refreshBookingPaymentIntent,
  fetchStripeConfig,
  fetchPublicSuppliers,
  fetchHomepageLogos,
  fetchHomepageContent,
  fetchSearchingLogos,
  submitPartnerApplication,
  fetchSeoConfig: (route: string) => publicAxios.get(`${API_BASE_URL}/api/seo/config?route=${encodeURIComponent(route)}`),
  baseUrl: API_BASE_URL,
};

// ---------- Supplier API ----------
export const supplierApi = {
  getBookingByToken: (token: string) => 
    supplierAxios.get(`${API_BASE_URL}/api/supplier/confirmation/booking?token=${token}`),

  confirmBooking: (token: string, confirmationNumber: string) =>
    supplierAxios.post(`${API_BASE_URL}/api/supplier/confirmation/confirm?token=${token}&confirmationNumber=${confirmationNumber}`),

  rejectBooking: (token: string, reason: string) =>
    supplierAxios.post(`${API_BASE_URL}/api/supplier/confirmation/reject?token=${token}&reason=${encodeURIComponent(reason)}`),

  getCars: () => supplierAxios.get(`${API_BASE_URL}/api/supplier/dashboard/cars`),
  createCar: (payload: any) => supplierAxios.post(`${API_BASE_URL}/api/supplier/dashboard/cars`, payload),
  updateCar: (id: number, payload: any) => supplierAxios.put(`${API_BASE_URL}/api/supplier/dashboard/cars/${id}`, payload),
  deleteCar: (id: number) => supplierAxios.delete(`${API_BASE_URL}/api/supplier/dashboard/cars/${id}`),
  getCarModels: () => supplierAxios.get(`${API_BASE_URL}/api/supplier/car-models`),
  
  getMe: () => supplierAxios.get(`${API_BASE_URL}/api/supplier/me`),
  updateMe: (payload: any) => supplierAxios.put(`${API_BASE_URL}/api/supplier/me`, payload),
  getMyLocations: () => supplierAxios.get(`${API_BASE_URL}/api/supplier/locations`),
  requestLocation: (payload: any) => supplierAxios.post(`${API_BASE_URL}/api/supplier/locations/request`, payload),
  getBookings: () => supplierAxios.get(`${API_BASE_URL}/api/supplier/dashboard/bookings`),
  getPromotions: () => supplierAxios.get(`${API_BASE_URL}/api/supplier/dashboard/promotions`),
  createPromotion: (payload: any) => supplierAxios.post(`${API_BASE_URL}/api/supplier/dashboard/promotions`, payload),
  updatePromotion: (id: number, payload: any) => supplierAxios.put(`${API_BASE_URL}/api/supplier/dashboard/promotions/${id}`, payload),
  setPromotionActive: (id: number, active: boolean) => supplierAxios.post(`${API_BASE_URL}/api/supplier/dashboard/promotions/${id}/active`, { active }),
  deletePromotion: (id: number) => supplierAxios.delete(`${API_BASE_URL}/api/supplier/dashboard/promotions/${id}`),
  decideChangeRequest: (id: number, approve: boolean, message?: string) =>
    supplierAxios.post(`${API_BASE_URL}/api/supplier/dashboard/bookings/${id}/change-request`, { approve, message }),
  confirmBookingBySupplier: (id: number, confirmationNumber: string) => 
    supplierAxios.post(`${API_BASE_URL}/api/supplier/dashboard/bookings/${id}/confirm`, { supplierConfirmationNumber: confirmationNumber }),
  
  getTemplateConfig: (locationCode?: string) => 
    supplierAxios.get(`${API_BASE_URL}/api/supplier/rates/template-config${locationCode ? `?locationCode=${locationCode}` : ''}`),
  saveTemplateConfig: (config: any) => supplierAxios.put(`${API_BASE_URL}/api/supplier/rates/template-config`, config),
  getExcelHistory: () => 
    supplierAxios.get(`${API_BASE_URL}/api/supplier/rates/history`),
  restoreFromHistory: (historyId: number) =>
    supplierAxios.post(`${API_BASE_URL}/api/supplier/rates/history/${historyId}/restore`),
  deleteExcelHistory: (historyId: number) =>
    supplierAxios.delete(`${API_BASE_URL}/api/supplier/rates/history/${historyId}`),
  downloadTemplate: (locationCode?: string) => 
    supplierAxios.get(`${API_BASE_URL}/api/supplier/rates/template${locationCode ? `?locationCode=${locationCode}` : ''}`, { responseType: 'blob' }),
  downloadBookingReport: () => supplierAxios.get(`${API_BASE_URL}/api/supplier/rates/report`, { responseType: 'blob' }),
  importRates: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return supplierAxios.post(`${API_BASE_URL}/api/supplier/rates/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  bulkUpdateRates: (payload: any) => supplierAxios.post(`${API_BASE_URL}/api/supplier/dashboard/rates/bulk`, payload),
  getStopSales: () => supplierAxios.get(`${API_BASE_URL}/api/supplier/dashboard/stopsales`),
  getAllRates: () => supplierAxios.get(`${API_BASE_URL}/api/supplier/rates/all`),
  deleteRate: (id: number) => supplierAxios.delete(`${API_BASE_URL}/api/supplier/rates/tiers/${id}`),
  bulkAddStopSale: (payload: any) => supplierAxios.post(`${API_BASE_URL}/api/supplier/dashboard/stopsales/bulk`, payload),
  deleteStopSale: (id: number) => supplierAxios.delete(`${API_BASE_URL}/api/supplier/dashboard/stopsales/${id}`),
  post: (url: string, payload: any) => supplierAxios.post(`${API_BASE_URL}/api/supplier${url}`, payload),
};

// ---------- Admin API (with authentication interceptor) ----------
export const adminApi = {
  getPromoCodes: () => adminAxios.get(`${API_BASE_URL}/api/admin/promos`),
  createPromoCode: (payload: any) => adminAxios.post(`${API_BASE_URL}/api/admin/promos`, payload),
  updatePromoCode: (id: number, payload: any) => adminAxios.put(`${API_BASE_URL}/api/admin/promos/${id}`, payload),
  setPromoCodeStatus: (id: number, status: 'active' | 'inactive') => adminAxios.patch(`${API_BASE_URL}/api/admin/promos/${id}/status?status=${status}`),
  deletePromoCode: (id: number) => adminAxios.delete(`${API_BASE_URL}/api/admin/promos/${id}`),
  getSupplierPromotions: () => adminAxios.get(`${API_BASE_URL}/api/admin/supplier-promotions`),
  // Affiliates
  getAffiliates: () => adminAxios.get(`${API_BASE_URL}/api/admin/affiliates`),
  getAffiliateOverview: (days = 30) => adminAxios.get(`${API_BASE_URL}/api/admin/affiliates/overview?days=${days}`),
  createAffiliate: (payload: any) => adminAxios.post(`${API_BASE_URL}/api/admin/affiliates`, payload),
  updateAffiliate: (id: number, payload: any) => adminAxios.put(`${API_BASE_URL}/api/admin/affiliates/${id}`, payload),
  setAffiliateStatus: (id: number, status: string) => adminAxios.patch(`${API_BASE_URL}/api/admin/affiliates/${id}/status?status=${encodeURIComponent(status)}`),
  deleteAffiliate: (id: number) => adminAxios.delete(`${API_BASE_URL}/api/admin/affiliates/${id}`),
  getAffiliateBookings: (id: number) => adminAxios.get(`${API_BASE_URL}/api/admin/affiliates/${id}/bookings`),
  getAffiliatePayouts: (id: number) => adminAxios.get(`${API_BASE_URL}/api/admin/affiliates/${id}/payouts`),
  addAffiliatePayout: (id: number, payload: any) => adminAxios.post(`${API_BASE_URL}/api/admin/affiliates/${id}/payouts`, payload),
  deleteAffiliatePayout: (id: number, payoutId: number) => adminAxios.delete(`${API_BASE_URL}/api/admin/affiliates/${id}/payouts/${payoutId}`),
  // Integrations (API partners)
  getApiPartners: () => adminAxios.get(`${API_BASE_URL}/api/admin/api-partners`),
  createApiPartner: (payload: any) => adminAxios.post(`${API_BASE_URL}/api/admin/api-partners`, payload),
  updateApiPartner: (id: number, payload: any) => adminAxios.put(`${API_BASE_URL}/api/admin/api-partners/${id}`, payload),
  setApiPartnerStatus: (id: number, status: 'active' | 'inactive') => adminAxios.patch(`${API_BASE_URL}/api/admin/api-partners/${id}/status?status=${status}`),
  rotateApiPartnerKey: (id: number) => adminAxios.post(`${API_BASE_URL}/api/admin/api-partners/${id}/regenerate-key`),
  deleteApiPartner: (id: number) => adminAxios.delete(`${API_BASE_URL}/api/admin/api-partners/${id}`),
  getApiLogs: (partnerId?: number) => adminAxios.get(`${API_BASE_URL}/api/admin/api-partners/${partnerId ? `${partnerId}/logs` : 'logs'}`),
  getApiUsage: (partnerId?: number) => adminAxios.get(`${API_BASE_URL}/api/admin/api-partners/usage${partnerId ? `?partnerId=${partnerId}` : ''}`),
  getIntegrationServices: () => adminAxios.get(`${API_BASE_URL}/api/admin/api-partners/services`),
  setSupplierPromotionActive: (id: number, active: boolean) => adminAxios.patch(`${API_BASE_URL}/api/admin/supplier-promotions/${id}/active?active=${active}`),
  getSuppliers: () => adminAxios.get(`${API_BASE_URL}/api/admin/suppliers`),
  createSupplier: (payload: any) => adminAxios.post(`${API_BASE_URL}/api/admin/suppliers`, payload),
  updateSupplier: (id: number, payload: any) => adminAxios.put(`${API_BASE_URL}/api/admin/suppliers/${id}`, payload),
  deleteSupplier: (id: number) => adminAxios.delete(`${API_BASE_URL}/api/admin/suppliers/${id}`),
  getLocations: () => adminAxios.get(`${API_BASE_URL}/api/admin/locations`),
  getCars: (supplierId?: number) => adminAxios.get(`${API_BASE_URL}/api/admin/fleet/cars${supplierId ? `?supplierId=${supplierId}` : ''}`),
  getCarModels: () => adminAxios.get(`${API_BASE_URL}/api/admin/car-models`),
  createCarModel: (payload: any) => adminAxios.post(`${API_BASE_URL}/api/admin/car-models`, payload),
  updateCarModel: (id: number, payload: any) => adminAxios.put(`${API_BASE_URL}/api/admin/car-models/${id}`, payload),
  deleteCarModel: (id: number) => adminAxios.delete(`${API_BASE_URL}/api/admin/car-models/${id}`),
  
  getHomepageLogos: () => adminAxios.get(`${API_BASE_URL}/api/admin/homepage-logos`),
  createHomepageLogo: (payload: any) => adminAxios.post(`${API_BASE_URL}/api/admin/homepage-logos`, payload),
  updateHomepageLogo: (id: number, payload: any) => adminAxios.put(`${API_BASE_URL}/api/admin/homepage-logos/${id}`, payload),
  deleteHomepageLogo: (id: number) => adminAxios.delete(`${API_BASE_URL}/api/admin/homepage-logos/${id}`),

  getSearchingLogos: () => adminAxios.get(`${API_BASE_URL}/api/admin/searching-logos`),
  createSearchingLogo: (payload: any) => adminAxios.post(`${API_BASE_URL}/api/admin/searching-logos`, payload),
  updateSearchingLogo: (id: number, payload: any) => adminAxios.put(`${API_BASE_URL}/api/admin/searching-logos/${id}`, payload),
  deleteSearchingLogo: (id: number) => adminAxios.delete(`${API_BASE_URL}/api/admin/searching-logos/${id}`),
  fixData: () => adminAxios.post(`${API_BASE_URL}/api/admin/suppliers/fix-data`),
  
  getPartnerApplications: () => adminAxios.get(`${API_BASE_URL}/api/partner-applications/admin/all`),
  deletePartnerApplication: (id: number | string) => adminAxios.delete(`${API_BASE_URL}/api/partner-applications/admin/${id}`),
  
  getBookings: () => adminAxios.get(`${API_BASE_URL}/api/admin/bookings`),
  getDashboardSummary: () => adminAxios.get(`${API_BASE_URL}/api/admin/dashboard/summary`),
  getSeoConfigs: () => adminAxios.get(`${API_BASE_URL}/api/admin/seo`),
  saveSeoConfig: (payload: any) => adminAxios.post(`${API_BASE_URL}/api/admin/seo`, payload),
  deleteSeoConfig: (route: string) => adminAxios.delete(`${API_BASE_URL}/api/admin/seo?route=${encodeURIComponent(route)}`),
};
