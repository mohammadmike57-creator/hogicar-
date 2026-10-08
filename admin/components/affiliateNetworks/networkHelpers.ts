import type {
  Connector, Network, NetworkInput, TrackingMethod, CommissionableBasis,
} from '../../affiliateNetworksApi';
import { TRACKING_METHODS } from '../../affiliateNetworksApi';

/**
 * Tracking methods a connector can do. Derived from its capability flags plus whatever it lists in
 * `defaults.trackingMethods` (so a connector can opt into POSTBACK/WEBHOOK/API explicitly).
 */
export const allowedMethods = (c?: Connector | null): TrackingMethod[] => {
  if (!c) return [...TRACKING_METHODS];
  const set = new Set<TrackingMethod>(c.defaults?.trackingMethods || []);
  const caps = c.capabilities || ({} as Connector['capabilities']);
  if (caps.clientSide) set.add('CLIENT_SIDE');
  if (caps.pixel) set.add('PIXEL');
  if (caps.serverToServer) set.add('SERVER_TO_SERVER');
  if (caps.clientSide && caps.serverToServer) set.add('HYBRID');
  return TRACKING_METHODS.filter(m => set.has(m));
};

export const emptyNetwork = (): NetworkInput => ({
  name: '', code: '', description: '', connectorType: '', status: 'DRAFT', trackingMethods: [],
  advertiserId: '', externalProgramId: '', merchantId: '', websiteId: '',
  clickParam: '', publisherParam: '', subIdParam: '', clickRefParam: '', campaignParam: '', creativeParam: '', voucherParam: '',
  attributionWindowDays: 30, currencyMode: 'BOOKING', fixedCurrency: null, supportedCurrencies: [], countries: [], locationCodes: [],
  defaultCommissionGroup: 'DEFAULT', commissionableBasis: 'CUSTOMER_TOTAL', includeExtras: true, reportOnStatuses: ['CONFIRMED', 'COMPLETED'],
  consentPolicy: 'SIGNAL_ONLY', testMode: true, productLevelTracking: false, maxRetries: 5, feedEnabled: false,
});

/** Prefills tracking parameters and defaults from the chosen connector. */
export const applyConnectorDefaults = (d: NetworkInput, c: Connector): NetworkInput => {
  const def = c.defaults || ({} as Connector['defaults']);
  const allowed = allowedMethods(c);
  return {
    ...d,
    connectorType: c.type,
    name: d.name || c.name,
    code: d.code || String(c.type).toUpperCase(),
    clickParam: def.clickParam ?? '',
    publisherParam: def.publisherParam ?? '',
    subIdParam: def.subIdParam ?? '',
    clickRefParam: def.clickRefParam ?? '',
    campaignParam: def.campaignParam ?? '',
    creativeParam: def.creativeParam ?? '',
    voucherParam: def.voucherParam ?? '',
    trackingMethods: (def.trackingMethods || []).filter(m => allowed.includes(m)),
    attributionWindowDays: def.attributionWindowDays || 30,
    defaultCommissionGroup: def.defaultCommissionGroup || 'DEFAULT',
    productLevelTracking: !!c.capabilities?.productLevel && d.productLevelTracking,
  };
};

export const draftFromNetwork = (n: Network): NetworkInput => ({
  ...emptyNetwork(),
  ...Object.fromEntries(Object.keys(emptyNetwork()).map(k => [k, (n as unknown as Record<string, unknown>)[k] ?? (emptyNetwork() as unknown as Record<string, unknown>)[k]])),
} as NetworkInput);

export type InclusionState = 'included' | 'excluded' | 'deducted' | 'conditional';
export type BasisRow = { component: string; state: InclusionState; note: string };

/** Explanatory, itemised view of what each commissionable basis counts. The server does the real maths. */
export const basisRows = (basis: CommissionableBasis, includeExtras: boolean): BasisRow[] => {
  const margin = basis === 'HOGICAR_MARGIN';
  const prepaid = basis === 'PREPAID_ONLY';
  const extrasState: InclusionState = margin || basis === 'RENTAL_ONLY' ? 'excluded' : includeExtras ? 'included' : 'excluded';
  return [
    { component: 'Base rental', state: margin ? 'excluded' : 'included', note: margin ? 'Replaced by HogiCar margin' : prepaid ? 'Only the part paid online' : 'Daily rate × rental days' },
    { component: 'Extras', state: extrasState, note: margin ? 'Not part of the margin basis' : basis === 'RENTAL_ONLY' ? 'Rental only – extras never count' : includeExtras ? (prepaid ? 'Only extras paid online' : 'Child seats, GPS, extra driver…') : '“Include extras” is off' },
    { component: 'Insurance / protection', state: extrasState, note: extrasState === 'included' ? 'Treated as an extra' : 'Follows the extras setting' },
    { component: 'Taxes', state: margin ? 'excluded' : 'included', note: margin ? 'Not part of the margin' : 'Rates are tax-inclusive – not itemised' },
    { component: 'Airport & delivery fees', state: margin ? 'excluded' : 'included', note: 'Included in rental price – not itemised' },
    { component: 'Pay-at-desk amount', state: prepaid || margin ? 'excluded' : 'included', note: prepaid ? 'Paid at the counter – excluded' : margin ? '—' : 'Part of the customer total' },
    { component: 'Promo discount', state: 'deducted', note: 'Already deducted from the price' },
    { component: 'Security deposit', state: 'excluded', note: 'Always excluded' },
    { component: 'Supplier cost', state: 'excluded', note: 'Never sent to networks' },
    { component: 'HogiCar margin', state: margin ? 'included' : 'excluded', note: margin ? 'The only commissionable amount' : 'Only with the HogiCar margin basis' },
  ];
};

export const BASIS_INFO: Record<CommissionableBasis, { label: string; text: string }> = {
  CUSTOMER_TOTAL: { label: 'Customer total', text: 'What the customer pays for the rental (online + at the desk), after promo discounts.' },
  RENTAL_ONLY: { label: 'Rental only', text: 'The car rental itself – extras and insurance never count.' },
  PREPAID_ONLY: { label: 'Prepaid only', text: 'Only the amount the customer pays online at booking time.' },
  HOGICAR_MARGIN: { label: 'HogiCar margin', text: 'HogiCar’s own margin on the booking. Supplier cost is never shared.' },
};

export const CONSENT_INFO: Record<string, { label: string; text: string }> = {
  SIGNAL_ONLY: { label: 'Send consent signal', text: 'Always record attribution and pass the visitor’s consent state to the network.' },
  REQUIRE_MARKETING_CONSENT: { label: 'Require marketing consent', text: 'Only record the click and fire client-side tags when marketing cookies were accepted.' },
};

export const CONNECTOR_ACCENT: Record<string, string> = {
  AWIN: 'from-orange-500 to-rose-600',
  MANUAL: 'from-slate-500 to-slate-700',
  HOGICAR_DIRECT: 'from-[#007ac2] to-[#0b2545]',
  CJ: 'from-emerald-500 to-teal-700',
  IMPACT: 'from-violet-500 to-indigo-700',
  PARTNERIZE: 'from-sky-500 to-blue-700',
  RAKUTEN: 'from-rose-500 to-red-700',
  TRAVELPAYOUTS: 'from-cyan-500 to-sky-700',
};

export const ConnectorLogoText = (name: string) => (name || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();
