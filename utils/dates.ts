/** Dates for search forms, in the visitor's own calendar (not UTC, which can be a day off around midnight). */
export function localIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return localIsoDate(d);
}

/** Today, the earliest pick-up date the calendar allows. */
export const todayIsoDate = () => inDays(0);
/** Default pick-up: tomorrow. */
export const defaultPickupDate = () => inDays(1);
/** Default drop-off: three days after the default pick-up. */
export const defaultDropoffDate = () => inDays(4);
