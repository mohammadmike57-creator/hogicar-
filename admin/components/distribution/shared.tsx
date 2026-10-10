import * as React from 'react';
import { Badge, type Tone, humanize } from '../affiliateNetworks/ui';
import type { ChannelStatus, Meta, Permission, CapabilityState } from './api';

export { humanize };

export type ToastFn = (text: string, tone?: 'ok' | 'err') => void;

export const DistContext = React.createContext<{ meta: Meta | null; can: (p: Permission) => boolean; toast: ToastFn }>({
  meta: null,
  can: () => false,
  toast: () => undefined,
});

export const useDist = () => React.useContext(DistContext);

export const STATUS_TONE: Record<ChannelStatus, Tone> = {
  REGISTERED: 'grey', ONBOARDING: 'sky', AWAITING_DOCUMENTATION: 'amber', AWAITING_CREDENTIALS: 'amber',
  IN_DEVELOPMENT: 'violet', TESTING: 'blue', READY_FOR_REVIEW: 'blue', APPROVED_FOR_PRODUCTION: 'green',
  ACTIVE: 'green', SUSPENDED: 'grey', FAILED: 'red',
};

export const StatusBadge: React.FC<{ status: ChannelStatus }> = ({ status }) => (
  <Badge tone={STATUS_TONE[status] || 'grey'} dot>{status === 'ACTIVE' ? 'Live' : humanize(status)}</Badge>
);

const TRACK_TONE: Record<string, Tone> = {
  NOT_STARTED: 'grey', APPLIED: 'sky', IN_NEGOTIATION: 'amber', CONTRACT_SIGNED: 'green', REJECTED: 'red', TERMINATED: 'red',
  AWAITING_DOCUMENTATION: 'amber', IN_PROGRESS: 'blue', COMPLETE: 'green', BLOCKED: 'red',
  NOT_TESTED: 'grey', MOCK_TESTED: 'sky', SANDBOX_VALIDATED: 'blue', PROVIDER_VALIDATED: 'green', FAILED: 'red',
  NOT_REQUESTED: 'grey', REQUESTED: 'amber', APPROVED: 'green',
};

export const TrackBadge: React.FC<{ value?: string | null }> = ({ value }) =>
  value ? <Badge tone={TRACK_TONE[value] || 'grey'}>{humanize(value)}</Badge> : <span className="text-slate-400">—</span>;

export const CAP_UI: Record<CapabilityState, { tone: Tone; label: string }> = {
  OPERATIONAL: { tone: 'green', label: 'Operational' },
  AWAITING_DOCUMENTATION: { tone: 'amber', label: 'Awaiting provider documentation' },
  NOT_SUPPORTED: { tone: 'grey', label: 'Not supported' },
};

export const SEVERITY_TONE: Record<string, Tone> = { INFO: 'sky', WARNING: 'amber', ERROR: 'red', CRITICAL: 'red' };

export const fmtDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const fmtMoney = (v: number | string | null | undefined, currency?: string | null) => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return `${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${currency ? ` ${currency}` : ''}`;
};

/** Renders {"USD": 120, "EUR": 40} as "120.00 USD · 40.00 EUR". */
export const fmtMoneyMap = (m?: Record<string, number> | null) => {
  const entries = Object.entries(m || {});
  if (!entries.length) return '—';
  return entries.map(([c, v]) => fmtMoney(v, c)).join(' · ');
};

export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return isoDay(d); };

/** Read-only notice shown where the admin's role lacks a permission. */
export const ReadOnlyNote: React.FC<{ what: string }> = ({ what }) => (
  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-inset ring-slate-200">Your distribution role can view {what} but not change it.</p>
);
