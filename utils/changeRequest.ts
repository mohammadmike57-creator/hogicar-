// Customer date/time change requests stored on a booking (modificationStatus + modificationRequestJson).
export interface ChangeRequest {
  pickupDate: string;
  startTime: string;
  dropoffDate: string;
  endTime: string;
  previousPickupDate?: string;
  previousStartTime?: string;
  previousDropoffDate?: string;
  previousEndTime?: string;
  note?: string;
  requestedAt?: string;
  decision?: string;
  decisionMessage?: string;
  decidedAt?: string;
}

export const changeStatusOf = (b: any): 'REQUESTED' | 'APPROVED' | 'DECLINED' | 'WITHDRAWN' | null => {
  const s = String(b?.modificationStatus || '').toUpperCase();
  return s === 'REQUESTED' || s === 'APPROVED' || s === 'DECLINED' || s === 'WITHDRAWN' ? s : null;
};

export const changeRequestOf = (b: any): ChangeRequest | null => {
  if (!b?.modificationRequestJson) return null;
  try {
    const r = JSON.parse(b.modificationRequestJson);
    return r && r.pickupDate && r.dropoffDate ? r : null;
  } catch {
    return null;
  }
};

export const fmtDay = (d?: string, t?: string) => {
  if (!d) return '—';
  const x = new Date(`${d}T00:00:00`);
  const day = isNaN(x.getTime()) ? d : x.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  return t ? `${day} · ${String(t).slice(0, 5)}` : day;
};
