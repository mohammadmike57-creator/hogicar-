import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Undo2 from 'lucide-react/dist/esm/icons/undo-2';
import FlaskConical from 'lucide-react/dist/esm/icons/flask-conical';
import {
  affiliateNetworksApi as api, apiError, type ConversionDetail, type Conversion, type ConversionStatus, CONVERSION_STATUSES,
} from '../../affiliateNetworksApi';
import { Drawer, Field, Spinner, ErrorBanner, CopyButton } from '../commercialUi';
import { useAffiliateNetworks } from './context';
import {
  Badge, Callout, ConversionStatusBadge, DL, JsonView, LevelBadge, MatchBadge, Modal, NumberInput, Panel, Select, btnPrimary, btnSecondary,
  dateTime, humanize, inputCls, money, useConfirm,
} from './ui';

const RETRYABLE: ConversionStatus[] = ['FAILED', 'RETRYING', 'PENDING', 'WAITING', 'SKIPPED'];

const str = (v: unknown) => (v === null || v === undefined || v === '' ? null : typeof v === 'object' ? JSON.stringify(v) : String(v));

/** Renders an arbitrary object (booking / attribution sub-records) as label → value pairs. */
const ObjectDL: React.FC<{ obj?: Record<string, unknown> | null; empty: string }> = ({ obj, empty }) => {
  const entries = obj ? Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== '') : [];
  if (!entries.length) return <p className="text-sm text-slate-400">{empty}</p>;
  return <DL items={entries.map(([k, v]) => [humanize(k.replace(/([a-z])([A-Z])/g, '$1_$2')), /At$|Date$|Time$/.test(k) && typeof v === 'string' && v.includes('T') ? dateTime(v) : <span className="break-all">{str(v)}</span>])} />;
};

const ConversionDetailDrawer: React.FC<{ id: number; onClose: () => void; onChanged: (c: Conversion) => void }> = ({ id, onClose, onChanged }) => {
  const { notify } = useAffiliateNetworks();
  const [c, setC] = React.useState<ConversionDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [dialog, setDialog] = React.useState<'status' | 'refund' | null>(null);
  const [newStatus, setNewStatus] = React.useState<ConversionStatus>('CONFIRMED');
  const [note, setNote] = React.useState('');
  const [amount, setAmount] = React.useState<number | null>(null);
  const [confirm, confirmEl] = useConfirm();

  const load = React.useCallback(async () => {
    setError(null);
    try { setC(await api.getConversion(id)); }
    catch (e) { setError(apiError(e, 'Could not load the conversion.')); }
  }, [id]);
  React.useEffect(() => { load(); }, [load]);

  const apply = (updated: Conversion, msg: string) => {
    setC(prev => (prev ? { ...prev, ...updated } : (updated as ConversionDetail)));
    onChanged(updated);
    notify(msg);
    load();
  };

  const retry = async () => {
    if (!c) return;
    if (!(await confirm({ title: 'Send this conversion again now?', message: 'The connector deduplicates by booking reference, so the network will not count it twice.', confirmLabel: 'Retry now' }))) return;
    setBusy('retry');
    try { apply(await api.retryConversion(c.id), 'Retry sent'); }
    catch (e) { notify(apiError(e, 'Retry failed.'), 'err'); }
    finally { setBusy(null); }
  };

  const submitStatus = async () => {
    if (!c) return;
    setBusy('status');
    try { apply(await api.setConversionStatus(c.id, newStatus, note), `Status set to ${humanize(newStatus)}`); setDialog(null); setNote(''); }
    catch (e) { notify(apiError(e, 'Could not change the status.'), 'err'); }
    finally { setBusy(null); }
  };

  const submitRefund = async () => {
    if (!c || !amount || amount <= 0) { notify('Enter a refund amount above zero.', 'err'); return; }
    if (amount > c.bookingValue) { notify('Refund can’t be more than the booking value.', 'err'); return; }
    setBusy('refund');
    try { apply(await api.refundConversion(c.id, amount, note), 'Refund recorded'); setDialog(null); setNote(''); setAmount(null); }
    catch (e) { notify(apiError(e, 'Could not record the refund.'), 'err'); }
    finally { setBusy(null); }
  };

  const events = [...(c?.events || [])].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <Drawer eyebrow="Conversion" title={c ? <span className="font-mono">{c.bookingRef}</span> : 'Loading…'} onClose={onClose} width="max-w-[760px]" busy={!!busy}
      headerExtra={c && (
        <div className="flex flex-wrap items-center gap-2 pb-3">
          <ConversionStatusBadge status={c.status} />
          <Badge tone="grey">{c.networkName}</Badge>
          {c.testMode && <Badge tone="violet"><FlaskConical className="h-3 w-3" /> Test</Badge>}
          {c.reconciled && <Badge tone="green">Reconciled</Badge>}
          <span className="ml-auto text-sm font-semibold tabular-nums text-slate-900">{money(c.bookingValue, c.currency)}</span>
        </div>
      )}
      footer={c && (
        <div className="flex flex-wrap gap-2">
          <button className={`${btnPrimary} flex-1`} onClick={retry} disabled={!!busy || !RETRYABLE.includes(c.status)} title={!RETRYABLE.includes(c.status) ? `Can’t retry a ${humanize(c.status).toLowerCase()} conversion` : undefined}>
            {busy === 'retry' ? <Spinner light /> : <RefreshCw className="h-4 w-4" />} Retry now
          </button>
          <button className={`${btnSecondary} flex-1`} onClick={() => { setNewStatus(c.status === 'CONFIRMED' ? 'CANCELLED' : 'CONFIRMED'); setDialog('status'); }} disabled={!!busy}><Tag className="h-4 w-4" /> Set status</button>
          <button className={`${btnSecondary} flex-1`} onClick={() => { setAmount(null); setDialog('refund'); }} disabled={!!busy}><Undo2 className="h-4 w-4" /> Record refund</button>
        </div>
      )}>
      {error && <ErrorBanner text={error} onRetry={load} />}
      {!c && !error && <div className="space-y-3">{[0, 1, 2, 3].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />)}</div>}
      {c && (
        <div className="space-y-4">
          {c.lastError && <Callout tone="error" title="Last error">{c.lastError}</Callout>}

          <Panel title="Booking">
            <DL items={[
              ['Booking ref', <span key="r" className="inline-flex items-center gap-1 font-mono">{c.bookingRef}<CopyButton text={c.bookingRef} className="h-6 w-6 text-slate-400 hover:text-slate-700" /></span>],
              ['Booking status', humanize(c.bookingStatus)], ['Booked', dateTime(c.bookingDate)],
              ['Pick-up', `${c.pickupCode || '—'} · ${c.pickupDate || '—'}`], ['Drop-off', c.dropoffDate], ['Country', c.country],
            ]} />
            {c.booking && Object.keys(c.booking).length > 0 && (() => {
              // Only what the summary above doesn't already show.
              const b = c.booking as Record<string, any>;
              const money = (v: unknown) => (v === null || v === undefined || v === '' ? null : `${b.currency || c.currency || ''} ${Number(v).toFixed(2)}`.trim());
              const extra: Record<string, unknown> = {
                'Pick-up location': b.pickupLocation && b.pickupLocation !== b.pickupCode ? b.pickupLocation : null,
                'Drop-off location': b.dropoffLocation && b.dropoffLocation !== b.dropoffCode ? b.dropoffLocation : null,
                Vehicle: [b.vehicle, b.vehicleCategory && `(${String(b.vehicleCategory).toLowerCase()})`].filter(Boolean).join(' ') || null,
                'Customer total': money(b.finalPrice),
                'Paid online': money(b.payNow),
                'Pay at desk': money(b.payAtDesk),
                'Security deposit (never commissionable)': money(b.deposit),
                'Promo code': b.promoCode,
                'Customer country': b.customerCountry,
              };
              return <div className="border-t border-slate-100 pt-3"><ObjectDL obj={extra} empty="" /></div>;
            })()}
          </Panel>

          <Panel title="Affiliate">
            <DL items={[
              ['Network', `${c.networkName} (${c.networkCode})`], ['Program', c.programName], ['Publisher', c.publisherName ? `${c.publisherName} · ${c.publisherId}` : c.publisherId],
              ['Click ID', <span key="k" className="break-all font-mono text-xs">{c.clickId}</span>], ['Campaign', c.campaign], ['Sub ID', c.subId], ['Voucher', c.voucher],
            ]} />
            {c.attribution && Object.keys(c.attribution).length > 0 && (
              <div className="border-t border-slate-100 pt-3"><p className="mb-2 text-xs font-semibold text-slate-500">Click record</p><ObjectDL obj={c.attribution} empty="No click record" /></div>
            )}
          </Panel>

          <Panel title="Financial">
            <DL cols={3} items={[
              ['Booking value', money(c.bookingValue, c.currency)], ['Commissionable', money(c.commissionableValue, c.currency)], ['Rate', `${c.commissionRate}%`],
              ['Commission', <b key="c">{money(c.commissionAmount, c.currency)}</b>], ['Group', c.commissionGroup], ['Network fee', money(c.networkFee, c.currency)],
              ['Net revenue', money(c.netRevenue, c.currency)], ['Refunded', money(c.refundAmount, c.currency)], ['Adjustment', money(c.adjustmentAmount, c.currency)],
              ['Reconciliation', <MatchBadge key="m" status={c.reconciliationStatus} />],
            ]} />
            {!!c.items?.length && (
              <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
                <table className="w-full min-w-[460px] text-sm">
                  <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400"><tr><th className="px-3 py-2">Product</th><th className="px-3 py-2">SKU</th><th className="px-3 py-2">Group</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Price</th></tr></thead>
                  <tbody>{c.items.map((it, i) => (
                    <tr key={i} className="border-t border-slate-100"><td className="px-3 py-2">{it.productName}<span className="block text-[11px] text-slate-400">{it.category}</span></td><td className="px-3 py-2 font-mono text-xs">{it.sku}</td><td className="px-3 py-2 font-mono text-xs">{it.commissionGroup}</td><td className="px-3 py-2 text-right tabular-nums">{it.quantity}</td><td className="px-3 py-2 text-right tabular-nums">{money(it.price, c.currency)}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Tracking">
            <DL cols={3} items={[
              ['Server status', <ConversionStatusBadge key="s" status={c.status} />], ['Client tag', c.clientStatus ? <Badge key="c" tone={c.clientStatus === 'SERVED' ? 'green' : 'grey'}>{humanize(c.clientStatus)}</Badge> : null],
              ['Client served', dateTime(c.clientServedAt)], ['Network reference', <span key="r" className="break-all font-mono text-xs">{c.networkReference}</span>],
              ['Attempts', c.attempts], ['Last response', c.lastResponseCode != null ? <Badge key="h" tone={c.lastResponseCode < 300 ? 'green' : 'red'}>HTTP {c.lastResponseCode}</Badge> : null],
              ['Sent', dateTime(c.sentAt)], ['Last attempt', dateTime(c.lastAttemptAt)], ['Next retry', c.nextAttemptAt ? dateTime(c.nextAttemptAt) : null],
            ]} />
            {c.lastResponse && <div><p className="mb-1.5 text-xs font-semibold text-slate-500">Last network response</p><JsonView value={c.lastResponse} maxHeight="max-h-48" /></div>}
          </Panel>

          <Panel title="Payload preview" actions={c.payloadPreview ? <CopyButton text={JSON.stringify(c.payloadPreview, null, 2)} label="Copy" className="h-8 bg-white px-2.5 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50" onCopied={() => notify('Payload copied')} /> : undefined}>
            <p className="text-xs text-slate-500">What HogiCar sends (or would send) to {c.networkName}. Secrets are never included.</p>
            <JsonView value={c.payloadPreview} />
          </Panel>

          <Panel title="Timeline">
            {!events.length ? <p className="text-sm text-slate-400">No events recorded.</p> : (
              <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                {events.map(ev => (
                  <li key={ev.id} className="relative">
                    <span className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${ev.level === 'ERROR' ? 'bg-rose-500' : ev.level === 'WARN' ? 'bg-amber-500' : 'bg-[#007ac2]'}`} />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-slate-700">{ev.type}</span>
                      <LevelBadge level={ev.level} />
                      <span className="text-[11px] text-slate-400">{dateTime(ev.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-700">{ev.message}</p>
                    {ev.detail != null && <details className="mt-1"><summary className="cursor-pointer text-xs font-semibold text-[#007ac2]">Detail</summary><div className="mt-1.5"><JsonView value={ev.detail} maxHeight="max-h-56" /></div></details>}
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          {c.snapshot && Object.keys(c.snapshot).length > 0 && (
            <Panel title="Calculation snapshot"><JsonView value={c.snapshot} maxHeight="max-h-64" /></Panel>
          )}
        </div>
      )}

      <AnimatePresence>
        {dialog === 'status' && c && (
          <Modal key="st" title="Set conversion status" eyebrow={c.bookingRef} onClose={() => setDialog(null)} busy={busy === 'status'}
            footer={<><button className={btnSecondary} onClick={() => setDialog(null)}>Cancel</button><button className={btnPrimary} onClick={submitStatus} disabled={busy === 'status'}>{busy === 'status' ? <Spinner light /> : null} Save status</button></>}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Use this to correct a conversion manually (for example after the network confirmed or declined it). Current: <ConversionStatusBadge status={c.status} /></p>
              <Field label="New status"><Select value={newStatus} onChange={e => setNewStatus(e.target.value as ConversionStatus)}>{CONVERSION_STATUSES.map(s => <option key={s} value={s}>{humanize(s)}</option>)}</Select></Field>
              <Field label="Note" hint="Saved in the audit log."><textarea className={`${inputCls} h-20 py-2.5`} value={note} onChange={e => setNote(e.target.value)} /></Field>
            </div>
          </Modal>
        )}
        {dialog === 'refund' && c && (
          <Modal key="rf" title="Record a refund" eyebrow={c.bookingRef} onClose={() => setDialog(null)} busy={busy === 'refund'}
            footer={<><button className={btnSecondary} onClick={() => setDialog(null)}>Cancel</button><button className={btnPrimary} onClick={submitRefund} disabled={busy === 'refund'}>{busy === 'refund' ? <Spinner light /> : null} Record refund</button></>}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Booking value {money(c.bookingValue, c.currency)}{c.refundAmount ? `, already refunded ${money(c.refundAmount, c.currency)}` : ''}. Networks that support adjustments are notified; others are flagged for manual adjustment.</p>
              <Field label={`Amount (${c.currency})`}><NumberInput value={amount} onChange={setAmount} suffix={c.currency} /></Field>
              <Field label="Note"><textarea className={`${inputCls} h-20 py-2.5`} value={note} onChange={e => setNote(e.target.value)} /></Field>
            </div>
          </Modal>
        )}
      </AnimatePresence>
      {confirmEl}
    </Drawer>
  );
};

export default ConversionDetailDrawer;
