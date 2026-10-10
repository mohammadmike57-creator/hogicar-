import { adminAxios, API_BASE_URL } from '../../../api';

const BASE = `${API_BASE_URL}/api/admin/distribution`;
const data = <T,>(p: Promise<{ data: T }>) => p.then(r => r.data);
const qs = (params: Record<string, unknown>) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, String(v)); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export type ChannelStatus = 'REGISTERED' | 'ONBOARDING' | 'AWAITING_DOCUMENTATION' | 'AWAITING_CREDENTIALS' | 'IN_DEVELOPMENT' | 'TESTING'
  | 'READY_FOR_REVIEW' | 'APPROVED_FOR_PRODUCTION' | 'ACTIVE' | 'SUSPENDED' | 'FAILED';
export type CapabilityState = 'OPERATIONAL' | 'AWAITING_DOCUMENTATION' | 'NOT_SUPPORTED';
export type Permission = 'VIEW' | 'EDIT_CHANNEL' | 'EDIT_INVENTORY' | 'EDIT_PRICING' | 'MANAGE_CREDENTIALS' | 'ACTIVATE_PRODUCTION' | 'EXPORT_REPORTS' | 'MANAGE_ROLES';

export interface Adapter {
  key: string; name: string; description: string; officialSpecImplemented: boolean; specificationNote: string;
  capabilities: Record<string, CapabilityState>; credentialFields: { key: string; label: string; required: boolean; help: string }[];
  requiresLocationMapping: boolean; requiresCategoryMapping: boolean;
}

export interface Channel {
  id: number; code: string; name: string; programmeName?: string; category: string; adapterKey: string; integrationType: string;
  website?: string; documentationUrl?: string; businessOwner?: string; status: ChannelStatus;
  commercialStatus: string; implementationStatus: string; validationStatus: string; productionApproval: string;
  markets?: string; currencies?: string; mandatoryFeesConfirmed: boolean; offerTtlMinutes: number; attributionWindowDays: number;
  commercialContactName?: string; commercialContactEmail?: string; commercialContactPhone?: string;
  technicalContactName?: string; technicalContactEmail?: string; technicalContactPhone?: string;
  applicationDate?: string; contractStatus?: string; documentationReceivedAt?: string; apiAccessRequestedAt?: string;
  credentialsReceivedAt?: string; sandboxAccessAt?: string; implementationStartedAt?: string; integrationTestingCompletedAt?: string;
  providerValidationAt?: string; productionApprovalAt?: string; firstProductionRequestAt?: string; firstAttributedBookingAt?: string;
  lastSuccessAt?: string; lastErrorAt?: string; lastError?: string; activatedAt?: string; activatedBy?: string;
  operationalNotes?: string; createdAt: string; updatedAt: string;
}

export interface ChecklistItem {
  id: number; itemKey: string; label: string; section: string; mandatory: boolean; external: boolean;
  state: 'PENDING' | 'DONE' | 'BLOCKED' | 'NOT_APPLICABLE'; evidence?: string; verificationSource?: string; verifiedBy?: string; verifiedAt?: string;
}

export interface Meta {
  role: string | null; permissions: Permission[]; adapters: Adapter[]; statuses: ChannelStatus[]; categories: string[];
  integrationTypes: string[]; commercialStatuses: string[]; implementationStatuses: string[]; validationStatuses: string[];
  approvalStatuses: string[]; commissionModels: string[]; roundings: string[]; ruleEffects: string[]; errorTypes: string[];
  severities: string[]; roles: string[]; encryptionConfigured: boolean;
}

export interface Reason { code: string; message: string; blocking: boolean }
export interface InventoryItem {
  carId: number; supplierId: number; supplierName: string; supplierActive: boolean; supplierVisible: boolean; bookingMode?: string;
  name?: string; make?: string; model?: string; modelGuaranteed: boolean; sippCode?: string; category?: string; transmission?: string;
  fuelPolicy?: string; airConditioning?: boolean; passengers?: number; bags?: number; doors?: number; imageUrl?: string; deposit?: number;
  unlimitedMileage?: boolean; available: boolean; fleetQuantity?: number | null; inventorySource: string;
  location?: { code: string; name: string; city?: string; countryCode?: string; airportCode?: string; pickupMethod?: string } | null;
  rates: { tiers: number; currentTiers: number; validUntil?: string | null; currencies: string[]; ratePlans: string[]; invalidBand: boolean; fromDailyRate?: number | null };
}
export interface Eligibility { item: InventoryItem; eligible: boolean; reasons: Reason[]; externalLocationId?: string; externalCategory?: string }

export interface ApiLog {
  id: number; channelId?: number; direction: string; environment?: string; operation: string; correlationId: string; httpStatus?: number;
  latencyMs?: number; success: boolean; errorType: string; severity: string; message?: string; createdAt: string;
}

export const distributionApi = {
  meta: () => data<Meta>(adminAxios.get(`${BASE}/meta`)),
  overview: (p: Record<string, unknown>) => data<any>(adminAxios.get(`${BASE}/overview${qs(p)}`)),

  channels: () => data<{ channel: Channel; adapter: Adapter | null }[]>(adminAxios.get(`${BASE}/channels`)),
  channel: (id: number) => data<{ channel: Channel; adapter: Adapter; activationBlockers: string[]; deeplinkPattern: string }>(adminAxios.get(`${BASE}/channels/${id}`)),
  createChannel: (b: Record<string, unknown>) => data<Channel>(adminAxios.post(`${BASE}/channels`, b)),
  updateChannel: (id: number, b: Record<string, unknown>) => data<Channel>(adminAxios.put(`${BASE}/channels/${id}`, b)),
  deleteChannel: (id: number) => data<unknown>(adminAxios.delete(`${BASE}/channels/${id}`)),
  setStatus: (id: number, status: string, note?: string) => data<Channel>(adminAxios.post(`${BASE}/channels/${id}/status`, { status, note })),
  activate: (id: number, confirm: string) => data<Channel>(adminAxios.post(`${BASE}/channels/${id}/activate`, { confirm })),

  checklist: (id: number) => data<ChecklistItem[]>(adminAxios.get(`${BASE}/channels/${id}/checklist`)),
  setChecklist: (id: number, key: string, state: string, evidence: string) => data<ChecklistItem>(adminAxios.put(`${BASE}/channels/${id}/checklist/${key}`, { state, evidence })),
  documents: (id: number) => data<any[]>(adminAxios.get(`${BASE}/channels/${id}/documents`)),
  addDocument: (id: number, b: Record<string, unknown>) => data<any>(adminAxios.post(`${BASE}/channels/${id}/documents`, b)),
  deleteDocument: (id: number, docId: number) => data<unknown>(adminAxios.delete(`${BASE}/channels/${id}/documents/${docId}`)),

  credentials: (id: number) => data<{ credentials: any[]; encryptionConfigured: boolean }>(adminAxios.get(`${BASE}/channels/${id}/credentials`)),
  storeSecret: (id: number, b: { environment: string; keyName: string; value: string }) => data<any>(adminAxios.put(`${BASE}/channels/${id}/credentials`, b)),
  issueKey: (id: number, environment: string) => data<{ environment: string; keyName: string; key: string; notice: string }>(adminAxios.post(`${BASE}/channels/${id}/credentials/issue`, { environment })),
  deleteCredential: (id: number, credId: number) => data<unknown>(adminAxios.delete(`${BASE}/channels/${id}/credentials/${credId}`)),
  testConnection: (id: number, environment: string) => data<{ result: { verified: boolean; mock: boolean; summary: string; details: string[] }; correlationId: string }>(adminAxios.post(`${BASE}/channels/${id}/test`, { environment })),

  inventory: () => data<InventoryItem[]>(adminAxios.get(`${BASE}/inventory`)),
  saveProfile: (carId: number, b: Record<string, unknown>) => data<any>(adminAxios.put(`${BASE}/inventory/${carId}/profile`, b)),
  channelInventory: (id: number) => data<Eligibility[]>(adminAxios.get(`${BASE}/channels/${id}/inventory`)),
  validation: (id: number) => data<any>(adminAxios.get(`${BASE}/channels/${id}/validation`)),

  eligibilityRules: (id?: number) => data<any[]>(adminAxios.get(id ? `${BASE}/channels/${id}/eligibility-rules` : `${BASE}/eligibility-rules`)),
  saveEligibility: (id: number | undefined, ruleId: number | undefined, b: Record<string, unknown>) => {
    const root = id ? `${BASE}/channels/${id}/eligibility-rules` : `${BASE}/eligibility-rules`;
    return data<any>(ruleId ? adminAxios.put(`${root}/${ruleId}`, b) : adminAxios.post(root, b));
  },
  deleteEligibility: (id: number | undefined, ruleId: number) => data<unknown>(adminAxios.delete(id ? `${BASE}/channels/${id}/eligibility-rules/${ruleId}` : `${BASE}/eligibility-rules/${ruleId}`)),

  mappings: (id: number, kind: 'locations' | 'categories') => data<any[]>(adminAxios.get(`${BASE}/channels/${id}/${kind}`)),
  saveMapping: (id: number, kind: 'locations' | 'categories', mid: number | undefined, b: Record<string, unknown>) =>
    data<any>(mid ? adminAxios.put(`${BASE}/channels/${id}/${kind}/${mid}`, b) : adminAxios.post(`${BASE}/channels/${id}/${kind}`, b)),
  deleteMapping: (id: number, kind: 'locations' | 'categories', mid: number) => data<unknown>(adminAxios.delete(`${BASE}/channels/${id}/${kind}/${mid}`)),

  pricingRules: (id: number) => data<any[]>(adminAxios.get(`${BASE}/channels/${id}/pricing-rules`)),
  savePricing: (id: number, ruleId: number | undefined, b: Record<string, unknown>) =>
    data<any>(ruleId ? adminAxios.put(`${BASE}/channels/${id}/pricing-rules/${ruleId}`, b) : adminAxios.post(`${BASE}/channels/${id}/pricing-rules`, b)),
  deletePricing: (id: number, ruleId: number) => data<unknown>(adminAxios.delete(`${BASE}/channels/${id}/pricing-rules/${ruleId}`)),
  pricingPreview: (id: number, b: Record<string, unknown>) => data<any>(adminAxios.post(`${BASE}/channels/${id}/pricing-preview`, b)),

  testOffers: (id: number, b: Record<string, unknown>) => data<any>(adminAxios.post(`${BASE}/channels/${id}/offers/test`, b)),
  deeplinks: (id: number) => data<any[]>(adminAxios.get(`${BASE}/channels/${id}/deeplinks`)),
  bookings: (id: number) => data<any[]>(adminAxios.get(`${BASE}/channels/${id}/bookings`)),

  logs: (p: Record<string, unknown>) => data<{ items: { log: ApiLog; advice: string | null }[]; total: number; page: number; pages: number }>(adminAxios.get(`${BASE}/logs${qs(p)}`)),
  reports: (p: Record<string, unknown>) => data<{ rows: any[]; note: string }>(adminAxios.get(`${BASE}/reports${qs(p)}`)),
  reportsCsv: (p: Record<string, unknown>) => adminAxios.get(`${BASE}/reports.csv${qs(p)}`, { responseType: 'blob' }).then(r => r.data as Blob),
  channelAudit: (id: number) => data<any[]>(adminAxios.get(`${BASE}/channels/${id}/audit`)),
  audit: () => data<any[]>(adminAxios.get(`${BASE}/audit`)),
  roles: () => data<any[]>(adminAxios.get(`${BASE}/roles`)),
  setRole: (adminId: number, role: string) => data<any[]>(adminAxios.put(`${BASE}/roles/${adminId}`, { role })),
};

export const errorText = (e: any, fallback = 'Something went wrong') =>
  e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
