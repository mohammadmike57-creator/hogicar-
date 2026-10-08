import { adminAxios, API_BASE_URL } from '../api';

/**
 * Typed client for the multi-network affiliate admin API
 * (`/api/admin/affiliate-networks`, see hogicar-backend/docs/affiliate-admin-api.md).
 * Uses the shared admin axios instance, which attaches the `adminToken` bearer header.
 */

const BASE = `${API_BASE_URL}/api/admin/affiliate-networks`;

// ---------------------------------------------------------------- enums

export const NETWORK_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE'] as const;
export type NetworkStatus = (typeof NETWORK_STATUSES)[number];

export const TRACKING_METHODS = ['CLIENT_SIDE', 'SERVER_TO_SERVER', 'PIXEL', 'POSTBACK', 'WEBHOOK', 'API', 'HYBRID'] as const;
export type TrackingMethod = (typeof TRACKING_METHODS)[number];

export const HEALTH_VALUES = ['CONNECTED', 'CONFIGURED', 'WARNING', 'ERROR', 'NOT_CONFIGURED', 'DISABLED', 'CONNECTOR_NOT_INSTALLED'] as const;
export type Health = (typeof HEALTH_VALUES)[number];

export const COMMISSIONABLE_BASES = ['CUSTOMER_TOTAL', 'RENTAL_ONLY', 'PREPAID_ONLY', 'HOGICAR_MARGIN'] as const;
export type CommissionableBasis = (typeof COMMISSIONABLE_BASES)[number];

export const CONSENT_POLICIES = ['SIGNAL_ONLY', 'REQUIRE_MARKETING_CONSENT'] as const;
export type ConsentPolicy = (typeof CONSENT_POLICIES)[number];

export const CONVERSION_STATUSES = ['WAITING', 'PENDING', 'PROCESSING', 'SENT', 'CONFIRMED', 'FAILED', 'RETRYING', 'CANCELLED', 'REFUNDED', 'REVERSED', 'SKIPPED'] as const;
export type ConversionStatus = (typeof CONVERSION_STATUSES)[number];

export const PUBLISHER_STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED', 'BLOCKED'] as const;
export type PublisherStatus = (typeof PUBLISHER_STATUSES)[number];

export const COMMISSION_MODELS = ['PERCENTAGE', 'FIXED_PER_BOOKING', 'PER_DAY', 'TIERED'] as const;
export type CommissionModel = (typeof COMMISSION_MODELS)[number];

export const ATTRIBUTION_MODELS = ['LAST_CLICK', 'FIRST_CLICK', 'LAST_NON_DIRECT', 'NETWORK_DEFINED'] as const;
export type AttributionModel = (typeof ATTRIBUTION_MODELS)[number];

export const CAMPAIGN_TYPES = ['GENERAL', 'SEO', 'PAID', 'EMAIL', 'CONTENT', 'SOCIAL', 'COMPARISON', 'CORPORATE', 'PROMOTION'] as const;
export type CampaignType = (typeof CAMPAIGN_TYPES)[number];

export const MATCH_STATUSES = ['MATCHED', 'PARTIALLY_MATCHED', 'MISSING_NETWORK', 'MISSING_BOOKING', 'VALUE_MISMATCH', 'STATUS_MISMATCH'] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

/** Booking statuses a network can report conversions on. */
export const REPORT_ON_STATUSES = ['CONFIRMED', 'COMPLETED', 'PENDING', 'MODIFIED'] as const;

export const LOG_TYPES = [
  'ATTRIBUTION_CAPTURED', 'ATTRIBUTION_REJECTED', 'CLICK_RECORDED', 'BOOKING_ATTRIBUTED', 'ATTRIBUTION_MISSING',
  'CONVERSION_CREATED', 'CONVERSION_SENT', 'CONVERSION_FAILED', 'CONVERSION_RETRY', 'CONVERSION_DUPLICATE_BLOCKED',
  'CONVERSION_SKIPPED', 'CLIENT_TAG_SERVED', 'CANCELLATION_SENT', 'CANCELLATION_REQUIRED', 'REFUND_RECORDED',
  'ADJUSTMENT_REQUIRED', 'NETWORK_CONNECTION_TEST', 'CONFIGURATION_UPDATED',
] as const;
export type LogType = (typeof LOG_TYPES)[number];
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export type TestResult = 'CONNECTED' | 'FAILED' | 'INVALID_CREDENTIALS' | 'NOT_SUPPORTED' | 'TIMEOUT' | 'CONFIGURED';

// ---------------------------------------------------------------- connectors

export type ConnectorType = 'AWIN' | 'MANUAL' | 'HOGICAR_DIRECT' | 'CJ' | 'IMPACT' | 'PARTNERIZE' | 'RAKUTEN' | 'TRAVELPAYOUTS' | (string & {});

export interface ConnectorCapabilities {
  clientSide: boolean;
  pixel: boolean;
  serverToServer: boolean;
  cancellation: boolean;
  refund: boolean;
  adjustment: boolean;
  trackingLinks: boolean;
  productLevel: boolean;
  connectionTest: boolean;
}

export interface CredentialField {
  key: string;
  label: string;
  secret: boolean;
  required: boolean;
  help?: string;
}

export interface ConnectorDefaults {
  clickParam: string;
  publisherParam: string;
  subIdParam: string;
  clickRefParam: string;
  campaignParam: string;
  creativeParam: string;
  voucherParam: string;
  trackingMethods: TrackingMethod[];
  attributionWindowDays: number;
  defaultCommissionGroup: string;
}

export interface Connector {
  type: ConnectorType;
  name: string;
  installed: boolean;
  description: string;
  capabilities: ConnectorCapabilities;
  credentialFields: CredentialField[];
  defaults: ConnectorDefaults;
  requiresAdvertiserId: boolean;
  docsUrl?: string | null;
}

// ---------------------------------------------------------------- networks

export interface CredentialStatus {
  key: string;
  label: string;
  set: boolean;
  masked: string | null;
  updatedAt: string | null;
}

export interface NetworkStats {
  clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
}

/** Editable network fields (POST/PUT body). */
export interface NetworkInput {
  name: string;
  code: string;
  description: string;
  connectorType: ConnectorType;
  status: NetworkStatus;
  trackingMethods: TrackingMethod[];
  advertiserId: string;
  externalProgramId: string;
  merchantId: string;
  websiteId: string;
  clickParam: string;
  publisherParam: string;
  subIdParam: string;
  clickRefParam: string;
  campaignParam: string;
  creativeParam: string;
  voucherParam: string;
  attributionWindowDays: number;
  currencyMode: string;
  fixedCurrency: string | null;
  supportedCurrencies: string[];
  countries: string[];
  locationCodes: string[];
  defaultCommissionGroup: string;
  commissionableBasis: CommissionableBasis;
  includeExtras: boolean;
  reportOnStatuses: string[];
  consentPolicy: ConsentPolicy;
  testMode: boolean;
  productLevelTracking: boolean;
  maxRetries: number;
  feedEnabled: boolean;
}

export interface Network extends NetworkInput {
  id: number;
  connectorInstalled: boolean;
  advertiserIdMasked: string | null;
  feedUrl: string | null;
  health: Health;
  healthMessage: string | null;
  lastTestAt: string | null;
  lastTestResult: TestResult | null;
  lastTestError: string | null;
  lastTestHttpStatus: number | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  credentials: CredentialStatus[];
  stats: NetworkStats;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionTestResult {
  result: TestResult;
  message: string;
  httpStatus: number | null;
  testedAt: string;
}

const NETWORK_INPUT_KEYS: (keyof NetworkInput)[] = [
  'name', 'code', 'description', 'connectorType', 'status', 'trackingMethods', 'advertiserId', 'externalProgramId', 'merchantId', 'websiteId',
  'clickParam', 'publisherParam', 'subIdParam', 'clickRefParam', 'campaignParam', 'creativeParam', 'voucherParam', 'attributionWindowDays',
  'currencyMode', 'fixedCurrency', 'supportedCurrencies', 'countries', 'locationCodes', 'defaultCommissionGroup', 'commissionableBasis',
  'includeExtras', 'reportOnStatuses', 'consentPolicy', 'testMode', 'productLevelTracking', 'maxRetries', 'feedEnabled',
];

/** Strips read-only fields (id, health, stats, credentials…) from a network before PUT. */
export const toNetworkInput = (n: Partial<Network> & Partial<NetworkInput>): Partial<NetworkInput> => {
  const out: Record<string, unknown> = {};
  NETWORK_INPUT_KEYS.forEach(k => { if (n[k] !== undefined) out[k] = n[k]; });
  return out as Partial<NetworkInput>;
};

// ---------------------------------------------------------------- programs / publishers / links

export interface Program {
  id: number;
  networkId: number;
  networkName?: string;
  name: string;
  externalProgramId: string;
  status: string;
  description: string;
  commissionModel: CommissionModel;
  commissionValue: number | null;
  currency: string | null;
  countries: string[];
  attributionWindowDays: number | null;
  cookieDays: number | null;
  startDate: string | null;
  endDate: string | null;
  minBookingValue: number | null;
  maxBookingValue: number | null;
}
export type ProgramInput = Omit<Program, 'id' | 'networkName'>;

export interface PublisherStats {
  clicks: number;
  bookings: number;
  revenue: number;
  commission: number;
  conversionRate: number;
}

export interface Publisher {
  id: number;
  networkId: number;
  networkName?: string;
  programId: number | null;
  name: string;
  externalPublisherId: string;
  email: string;
  website: string;
  country: string;
  status: PublisherStatus;
  notes: string;
  stats?: PublisherStats;
}
export type PublisherInput = Omit<Publisher, 'id' | 'networkName' | 'stats'>;

export interface TrackingLink {
  id: number;
  networkId: number;
  networkName?: string;
  programId: number | null;
  publisherId: number | null;
  publisherName?: string | null;
  name: string;
  campaign: string;
  campaignType: CampaignType;
  creative: string;
  subId: string;
  subId2: string;
  subId3: string;
  customReference: string;
  destinationUrl: string;
  landingUrl: string | null;
  trackingUrl: string | null;
  trackingUrlNote: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  clicks: number;
  bookings: number;
  createdAt: string;
}
export type TrackingLinkInput = Omit<TrackingLink, 'id' | 'networkName' | 'publisherName' | 'landingUrl' | 'trackingUrl' | 'trackingUrlNote' | 'clicks' | 'bookings' | 'createdAt'>;

// ---------------------------------------------------------------- commission rules

export interface CommissionTier {
  fromBookings: number;
  value: number;
}

export interface CommissionRule {
  id: number;
  name: string;
  networkId: number | null;
  networkName?: string | null;
  programId: number | null;
  publisherId: number | null;
  countryCode: string | null;
  locationCode: string | null;
  campaign: string | null;
  model: CommissionModel;
  value: number;
  tiers: CommissionTier[];
  commissionGroup: string | null;
  currency: string | null;
  active: boolean;
  specificity: number;
}
export type CommissionRuleInput = Omit<CommissionRule, 'id' | 'networkName' | 'specificity'>;

export type RulePreviewRequest =
  | { networkId: number; bookingRef: string }
  | { networkId: number; amount: number; currency?: string; days?: number; countryCode?: string; locationCode?: string; publisherId?: string };

export interface BreakdownLine {
  component: string;
  amount: number;
  included: boolean;
  note?: string;
}

export interface CommissionPreview {
  bookingValue: number;
  commissionableValue: number;
  commissionRate: number;
  commissionAmount: number;
  commissionGroup: string;
  currency: string;
  ruleId: number | null;
  ruleName: string | null;
  breakdown: BreakdownLine[];
}

// ---------------------------------------------------------------- conversions

export interface Conversion {
  id: number;
  bookingId: number;
  bookingRef: string;
  networkId: number;
  networkName: string;
  networkCode: string;
  programId: number | null;
  programName: string | null;
  publisherId: string | null;
  publisherName: string | null;
  clickId: string | null;
  subId: string | null;
  campaign: string | null;
  bookingDate: string | null;
  pickupDate: string | null;
  dropoffDate: string | null;
  pickupCode: string | null;
  country: string | null;
  currency: string;
  bookingValue: number;
  commissionableValue: number;
  commissionRate: number;
  commissionAmount: number;
  commissionGroup: string | null;
  voucher: string | null;
  networkFee: number;
  netRevenue: number;
  status: ConversionStatus;
  bookingStatus: string | null;
  clientStatus: string | null;
  clientServedAt: string | null;
  networkReference: string | null;
  attempts: number;
  sentAt: string | null;
  lastAttemptAt: string | null;
  nextAttemptAt: string | null;
  lastResponseCode: number | null;
  lastError: string | null;
  refundAmount: number;
  adjustmentAmount: number;
  reconciliationStatus: MatchStatus | null;
  reconciled: boolean;
  testMode: boolean;
  createdAt: string;
}

export interface ConversionItem {
  productId: string | number | null;
  productName: string | null;
  sku: string | null;
  category: string | null;
  price: number;
  quantity: number;
  commissionGroup: string | null;
}

export interface ConversionDetail extends Conversion {
  booking?: Record<string, unknown> | null;
  attribution?: Record<string, unknown> | null;
  snapshot?: Record<string, unknown> | null;
  items?: ConversionItem[];
  payloadPreview?: unknown;
  lastResponse?: string | null;
  events?: LogEntry[];
}

export interface ConversionFilters {
  from?: string;
  to?: string;
  networkId?: number | string;
  status?: string;
  publisherId?: string;
  currency?: string;
  bookingRef?: string;
  country?: string;
  location?: string;
  page?: number;
  size?: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page?: number;
  size?: number;
}

// ---------------------------------------------------------------- dashboard

export interface OverviewKpis {
  clicks: number;
  uniqueVisitors: number;
  bookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  conversionRate: number;
  revenue: number;
  commissionableRevenue: number;
  commission: number;
  networkFees: number;
  netRevenue: number;
  averageBookingValue: number;
  pending: number;
  sent: number;
  confirmed: number;
  failed: number;
  cancelled: number;
  refunded: number;
}

export interface OverviewPoint { date: string; clicks: number; bookings: number; revenue: number; commission: number }
export interface OverviewByNetwork { networkId: number; name: string; clicks: number; bookings: number; revenue: number; commission: number }
export interface OverviewPublisher { publisherId: string; name: string; networkName: string; clicks: number; bookings: number; revenue: number }
export interface OverviewLandingPage { path: string; clicks: number; bookings: number }
export interface OverviewLocation { code: string; bookings: number; revenue: number }
export interface OverviewHealth { networkId: number; name: string; connectorType: ConnectorType; status: NetworkStatus; health: Health; message: string | null }

export interface Overview {
  kpis: OverviewKpis;
  currency: string;
  series: OverviewPoint[];
  byNetwork: OverviewByNetwork[];
  topPublishers: OverviewPublisher[];
  topLandingPages: OverviewLandingPage[];
  topLocations: OverviewLocation[];
  health: OverviewHealth[];
}

export interface OverviewFilters {
  from?: string;
  to?: string;
  networkId?: number | string;
  publisherId?: string;
  currency?: string;
  country?: string;
  location?: string;
  bookingStatus?: string;
}

// ---------------------------------------------------------------- reconciliation

export interface ReconciliationRow {
  conversionId: number | null;
  settlementId: number | null;
  bookingRef: string | null;
  networkName: string | null;
  bookingStatus: string | null;
  conversionStatus: ConversionStatus | null;
  bookingValue: number | null;
  reportedAmount: number | null;
  networkAmount: number | null;
  commission: number | null;
  networkCommission: number | null;
  refundAmount: number | null;
  netAmount: number | null;
  currency: string | null;
  transactionId: string | null;
  settlementDate: string | null;
  matchStatus: MatchStatus;
  reconciled: boolean;
  note: string | null;
}

export interface SettlementInput {
  networkId: number;
  transactionId: string;
  bookingRef: string;
  amount: number;
  commission: number;
  adjustment: number;
  refund: number;
  netAmount: number;
  currency: string;
  status: string;
  settlementDate: string;
}

export interface Settlement extends SettlementInput { id: number }

export interface ImportResult { imported: number; skipped: number; errors: string[] }

// ---------------------------------------------------------------- logs, audit, settings

export interface LogEntry {
  id: number;
  type: LogType | string;
  level: LogLevel;
  networkId: number | null;
  networkName: string | null;
  bookingRef: string | null;
  conversionId: number | null;
  message: string;
  detail: unknown;
  createdAt: string;
}

export interface AuditChange { field: string; old: unknown; new: unknown }
export interface AuditEntry {
  id: number;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: AuditChange[];
  createdAt: string;
}

export interface AffiliateSettings {
  enabled: boolean;
  attributionModel: AttributionModel;
  encryptionConfigured: boolean;
  consentIntegration: string;
  publicBaseUrl: string;
  partnerApiDocsPath: string;
}

// ---------------------------------------------------------------- testing

export interface AttributionTestResult {
  matched: boolean;
  networkId: number | null;
  networkName: string | null;
  captured: Record<string, unknown> | null;
  problems: string[];
}
export interface ConversionTestResult {
  eligible: boolean;
  reasons: string[];
  calculation: CommissionPreview | Record<string, unknown> | null;
  clientTag: unknown;
  serverPayload: unknown;
}
export interface S2sTestResult { success: boolean; httpStatus: number | null; response: string | null; payload: unknown }
export interface DedupeTestResult { conversions: number; duplicatesBlocked: boolean; message: string }

// ---------------------------------------------------------------- client

/** Drops empty values so `?networkId=&status=` are not sent. */
const query = (params?: object) => {
  const out: Record<string, string | number> = {};
  if (params) Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') out[k] = v as string | number;
  });
  return { params: out };
};

const data = <T,>(p: Promise<{ data: T }>) => p.then(r => r.data);

export const affiliateNetworksApi = {
  // connectors
  getConnectors: () => data<Connector[]>(adminAxios.get(`${BASE}/connectors`)),

  // networks
  getNetworks: () => data<Network[]>(adminAxios.get(`${BASE}/networks`)),
  getNetwork: (id: number) => data<Network>(adminAxios.get(`${BASE}/networks/${id}`)),
  createNetwork: (body: Partial<NetworkInput>) => data<Network>(adminAxios.post(`${BASE}/networks`, body)),
  updateNetwork: (id: number, body: Partial<NetworkInput>) => data<Network>(adminAxios.put(`${BASE}/networks/${id}`, body)),
  setNetworkStatus: (id: number, status: NetworkStatus) => data<Network>(adminAxios.post(`${BASE}/networks/${id}/status`, { status })),
  deleteNetwork: (id: number) => data<{ deleted: boolean }>(adminAxios.delete(`${BASE}/networks/${id}`)),
  testNetwork: (id: number) => data<ConnectionTestResult>(adminAxios.post(`${BASE}/networks/${id}/test`)),
  saveCredentials: (id: number, values: Record<string, string>) => data<Network>(adminAxios.put(`${BASE}/networks/${id}/credentials`, { values })),
  deleteCredential: (id: number, key: string) => data<Network>(adminAxios.delete(`${BASE}/networks/${id}/credentials/${encodeURIComponent(key)}`)),
  regenerateFeedToken: (id: number) => data<Network>(adminAxios.post(`${BASE}/networks/${id}/feed-token`)),

  // programs
  getPrograms: (networkId?: number | string) => data<Program[]>(adminAxios.get(`${BASE}/programs`, query({ networkId }))),
  createProgram: (body: Partial<ProgramInput>) => data<Program>(adminAxios.post(`${BASE}/programs`, body)),
  updateProgram: (id: number, body: Partial<ProgramInput>) => data<Program>(adminAxios.put(`${BASE}/programs/${id}`, body)),
  deleteProgram: (id: number) => data<unknown>(adminAxios.delete(`${BASE}/programs/${id}`)),

  // publishers
  getPublishers: (networkId?: number | string) => data<Publisher[]>(adminAxios.get(`${BASE}/publishers`, query({ networkId }))),
  createPublisher: (body: Partial<PublisherInput>) => data<Publisher>(adminAxios.post(`${BASE}/publishers`, body)),
  updatePublisher: (id: number, body: Partial<PublisherInput>) => data<Publisher>(adminAxios.put(`${BASE}/publishers/${id}`, body)),
  deletePublisher: (id: number) => data<unknown>(adminAxios.delete(`${BASE}/publishers/${id}`)),

  // tracking links
  getLinks: (networkId?: number | string) => data<TrackingLink[]>(adminAxios.get(`${BASE}/links`, query({ networkId }))),
  createLink: (body: Partial<TrackingLinkInput>) => data<TrackingLink>(adminAxios.post(`${BASE}/links`, body)),
  updateLink: (id: number, body: Partial<TrackingLinkInput>) => data<TrackingLink>(adminAxios.put(`${BASE}/links/${id}`, body)),
  deleteLink: (id: number) => data<unknown>(adminAxios.delete(`${BASE}/links/${id}`)),

  // commission rules
  getRules: (networkId?: number | string) => data<CommissionRule[]>(adminAxios.get(`${BASE}/rules`, query({ networkId }))),
  createRule: (body: Partial<CommissionRuleInput>) => data<CommissionRule>(adminAxios.post(`${BASE}/rules`, body)),
  updateRule: (id: number, body: Partial<CommissionRuleInput>) => data<CommissionRule>(adminAxios.put(`${BASE}/rules/${id}`, body)),
  deleteRule: (id: number) => data<unknown>(adminAxios.delete(`${BASE}/rules/${id}`)),
  previewRule: (body: RulePreviewRequest) => data<CommissionPreview>(adminAxios.post(`${BASE}/rules/preview`, body)),

  // conversions
  getConversions: (f: ConversionFilters = {}) => data<Page<Conversion>>(adminAxios.get(`${BASE}/conversions`, query({ page: 0, size: 50, ...f }))),
  getConversion: (id: number) => data<ConversionDetail>(adminAxios.get(`${BASE}/conversions/${id}`)),
  retryConversion: (id: number) => data<Conversion>(adminAxios.post(`${BASE}/conversions/${id}/retry`)),
  setConversionStatus: (id: number, status: ConversionStatus, note = '') => data<Conversion>(adminAxios.post(`${BASE}/conversions/${id}/status`, { status, note })),
  refundConversion: (id: number, amount: number, note = '') => data<Conversion>(adminAxios.post(`${BASE}/conversions/${id}/refund`, { amount, note })),

  // dashboard
  getOverview: (f: OverviewFilters = {}) => data<Overview>(adminAxios.get(`${BASE}/overview`, query(f))),

  // reconciliation
  getReconciliation: (f: { networkId?: number | string; status?: string } = {}) => data<ReconciliationRow[]>(adminAxios.get(`${BASE}/reconciliation`, query(f))),
  importSettlements: (networkId: number, csv: string) => data<ImportResult>(adminAxios.post(`${BASE}/settlements/import`, { networkId, csv })),
  createSettlement: (body: SettlementInput) => data<Settlement>(adminAxios.post(`${BASE}/settlements`, body)),
  markReconciled: (body: { bookingRef: string; networkId: number; reconciled: boolean; note?: string }) =>
    data<{ ok: boolean }>(adminAxios.post(`${BASE}/reconciliation/mark`, body)),

  // logs & audit
  getLogs: (f: { type?: string; networkId?: number | string; bookingRef?: string; page?: number; size?: number } = {}) =>
    data<Page<LogEntry>>(adminAxios.get(`${BASE}/logs`, query({ page: 0, size: 100, ...f }))),
  getAudit: (f: { page?: number; size?: number } = {}) => data<Page<AuditEntry>>(adminAxios.get(`${BASE}/audit`, query({ page: 0, size: 100, ...f }))),

  // settings
  getSettings: () => data<AffiliateSettings>(adminAxios.get(`${BASE}/settings`)),
  updateSettings: (body: { enabled: boolean; attributionModel: AttributionModel }) => data<AffiliateSettings>(adminAxios.put(`${BASE}/settings`, body)),

  // testing
  testAttribution: (url: string) => data<AttributionTestResult>(adminAxios.post(`${BASE}/testing/attribution`, { url })),
  testConversion: (bookingRef: string, networkId: number) => data<ConversionTestResult>(adminAxios.post(`${BASE}/testing/conversion`, { bookingRef, networkId })),
  testS2s: (networkId: number) => data<S2sTestResult>(adminAxios.post(`${BASE}/testing/s2s`, { networkId })),
  testDedupe: (bookingRef: string) => data<DedupeTestResult>(adminAxios.post(`${BASE}/testing/dedupe`, { bookingRef })),
};

/** Error text from a failed request (`{ "error": "message" }` per the contract). */
export const apiError = (e: unknown, fallback: string): string => {
  const d = (e as { response?: { data?: unknown } })?.response?.data as { error?: unknown; message?: unknown } | string | undefined;
  if (typeof d === 'string' && d.trim() && d.length < 300 && !d.trim().startsWith('<')) return d;
  if (d && typeof d === 'object') {
    if (typeof d.error === 'string' && d.error) return d.error;
    if (d.error && typeof d.error === 'object' && typeof (d.error as { message?: unknown }).message === 'string') return (d.error as { message: string }).message;
    if (typeof d.message === 'string' && d.message) return d.message;
  }
  return fallback;
};
