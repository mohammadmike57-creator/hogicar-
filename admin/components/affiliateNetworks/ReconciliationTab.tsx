import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import Upload from 'lucide-react/dist/esm/icons/upload';
import Download from 'lucide-react/dist/esm/icons/download';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Scale from 'lucide-react/dist/esm/icons/scale';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle-2';
import Circle from 'lucide-react/dist/esm/icons/circle';
import FileUp from 'lucide-react/dist/esm/icons/file-up';
import {
  affiliateNetworksApi as api, apiError, type ReconciliationRow, type ImportResult, type SettlementInput, MATCH_STATUSES,
} from '../../affiliateNetworksApi';
import { Field, ErrorBanner, Spinner } from '../commercialUi';
import { useAffiliateNetworks } from './context';
import {
  Badge, Callout, EmptyState, FilterBar, FilterField, MatchBadge, Modal, NumberInput, Select, SkeletonRows, TableCard, btnPrimary, btnSecondary,
  ConversionStatusBadge, downloadCsv, fmtDay, humanize, inputCls, isoDay, money, th, thRight, td, tdRight, MATCH_TONE,
} from './ui';

const TEMPLATE = 'transactionId,bookingRef,amount,commission,adjustment,refund,netAmount,currency,status,settlementDate\nAW-123456,H12345,180.00,9.00,0,0,9.00,JOD,approved,2026-10-01';

const ImportDialog: React.FC<{ onClose: () => void; onDone: () => void; defaultNetworkId?: number }> = ({ onClose, onDone, defaultNetworkId }) => {
  const { networks, notify } = useAffiliateNetworks();
  const [networkId, setNetworkId] = React.useState<number>(defaultNetworkId || networks[0]?.id || 0);
  const [csv, setCsv] = React.useState('');
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const lines = csv.trim() ? csv.trim().split(/\r?\n/).length - 1 : 0;

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('That file is larger than 5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setCsv(String(reader.result || '').replace(/^﻿/, '')); setFileName(f.name); setResult(null); setError(null); };
    reader.onerror = () => setError('Could not read the file.');
    reader.readAsText(f);
  };

  const submit = async () => {
    if (!networkId) return setError('Choose the network this settlement file comes from.');
    if (!csv.trim()) return setError('Paste CSV or pick a file.');
    if (!/transactionId/i.test(csv.split(/\r?\n/)[0] || '')) return setError('The first line must be the header row (transactionId,bookingRef,…).');
    setBusy(true); setError(null);
    try {
      const r = await api.importSettlements(networkId, csv);
      setResult(r);
      notify(`Imported ${r.imported} settlement${r.imported === 1 ? '' : 's'}`);
      onDone();
    } catch (e) { setError(apiError(e, 'Import failed.')); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Import settlement CSV" eyebrow="Reconciliation" onClose={onClose} busy={busy} width="max-w-2xl"
      footer={<><button className={btnSecondary} onClick={onClose}>{result ? 'Close' : 'Cancel'}</button><button className={btnPrimary} onClick={submit} disabled={busy}>{busy ? <Spinner light /> : <Upload className="h-4 w-4" />} Import {lines > 0 ? `${lines} row${lines === 1 ? '' : 's'}` : ''}</button></>}>
      <div className="space-y-4">
        <Field label="Network">
          <Select value={networkId || ''} onChange={e => setNetworkId(Number(e.target.value))}>
            {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </Select>
        </Field>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-[#007ac2] hover:bg-sky-50/50">
          <FileUp className="h-6 w-6 shrink-0 text-[#007ac2]" />
          <span className="min-w-0 text-sm"><span className="font-semibold text-slate-900">{fileName || 'Choose a .csv file'}</span><span className="block text-xs text-slate-500">Read in your browser – or paste the contents below.</span></span>
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={e => pick(e.target.files?.[0])} />
        </label>
        <Field label="CSV" hint="Columns: transactionId, bookingRef, amount, commission, adjustment, refund, netAmount, currency, status, settlementDate">
          <textarea className={`${inputCls} h-40 py-2.5 font-mono text-xs`} value={csv} onChange={e => { setCsv(e.target.value); setFileName(null); setResult(null); }} placeholder={TEMPLATE} spellCheck={false} />
        </Field>
        <button type="button" className="text-xs font-semibold text-[#007ac2] hover:underline" onClick={() => setCsv(TEMPLATE)}>Insert example</button>
        {error && <Callout tone="error">{error}</Callout>}
        {result && (
          <Callout tone={result.errors?.length ? 'warn' : 'ok'} title={`${result.imported} imported · ${result.skipped} skipped`}>
            {!!result.errors?.length && <ul className="mt-1 max-h-32 list-disc space-y-0.5 overflow-auto pl-4 text-xs">{result.errors.map((er, i) => <li key={i}>{er}</li>)}</ul>}
          </Callout>
        )}
      </div>
    </Modal>
  );
};

const SettlementDialog: React.FC<{ onClose: () => void; onDone: () => void; defaultNetworkId?: number }> = ({ onClose, onDone, defaultNetworkId }) => {
  const { networks, notify } = useAffiliateNetworks();
  const [d, setD] = React.useState<SettlementInput>({
    networkId: defaultNetworkId || networks[0]?.id || 0, transactionId: '', bookingRef: '', amount: 0, commission: 0, adjustment: 0, refund: 0, netAmount: 0,
    currency: 'JOD', status: 'APPROVED', settlementDate: isoDay(new Date()),
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (p: Partial<SettlementInput>) => { setD(x => ({ ...x, ...p })); setError(null); };
  const suggestedNet = +(d.commission + d.adjustment - d.refund).toFixed(2);
  const submit = async () => {
    if (!d.networkId) return setError('Choose a network.');
    if (!d.transactionId.trim() && !d.bookingRef.trim()) return setError('Enter a transaction ID or booking reference.');
    if (!/^[A-Z]{3}$/.test(d.currency)) return setError('Currency must be 3 letters.');
    setBusy(true);
    try { await api.createSettlement(d); notify('Settlement saved'); onDone(); onClose(); }
    catch (e) { setError(apiError(e, 'Could not save the settlement.')); }
    finally { setBusy(false); }
  };
  return (
    <Modal title="Add settlement manually" eyebrow="Reconciliation" onClose={onClose} busy={busy} width="max-w-2xl"
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={submit} disabled={busy}>{busy ? <Spinner light /> : <Plus className="h-4 w-4" />} Save settlement</button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Network"><Select value={d.networkId || ''} onChange={e => set({ networkId: Number(e.target.value) })}>{networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}</Select></Field>
        <Field label="Settlement date"><input type="date" className={inputCls} value={d.settlementDate} onChange={e => set({ settlementDate: e.target.value })} /></Field>
        <Field label="Network transaction ID"><input className={`${inputCls} font-mono`} value={d.transactionId} onChange={e => set({ transactionId: e.target.value.trim() })} /></Field>
        <Field label="Booking ref"><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} value={d.bookingRef} onChange={e => set({ bookingRef: e.target.value.toUpperCase().trim() })} placeholder="H12345" /></Field>
        <Field label="Sale amount"><NumberInput value={d.amount} onChange={v => set({ amount: v ?? 0 })} /></Field>
        <Field label="Commission"><NumberInput value={d.commission} onChange={v => set({ commission: v ?? 0 })} /></Field>
        <Field label="Adjustment"><NumberInput value={d.adjustment} onChange={v => set({ adjustment: v ?? 0 })} /></Field>
        <Field label="Refund"><NumberInput value={d.refund} onChange={v => set({ refund: v ?? 0 })} /></Field>
        <Field label="Net amount" hint={d.netAmount !== suggestedNet ? `Commission + adjustment − refund = ${suggestedNet}` : undefined}>
          <div className="flex gap-2"><NumberInput value={d.netAmount} onChange={v => set({ netAmount: v ?? 0 })} />{d.netAmount !== suggestedNet && <button type="button" className={`${btnSecondary} h-11 shrink-0`} onClick={() => set({ netAmount: suggestedNet })}>Use</button>}</div>
        </Field>
        <Field label="Currency"><input className={`${inputCls} font-mono uppercase placeholder:normal-case`} maxLength={3} value={d.currency} onChange={e => set({ currency: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })} /></Field>
        <Field label="Network status"><Select value={d.status} onChange={e => set({ status: e.target.value })}>{['APPROVED', 'PENDING', 'DECLINED', 'PAID'].map(s => <option key={s} value={s}>{humanize(s)}</option>)}</Select></Field>
      </div>
      {error && <Callout tone="error" className="mt-4">{error}</Callout>}
    </Modal>
  );
};

const MarkDialog: React.FC<{ row: ReconciliationRow; onClose: () => void; onDone: () => void; fallbackNetworkId?: number }> = ({ row, onClose, onDone, fallbackNetworkId }) => {
  const { networks, notify } = useAffiliateNetworks();
  const [note, setNote] = React.useState(row.note || '');
  const [busy, setBusy] = React.useState(false);
  const networkId = networks.find(n => n.name === row.networkName)?.id ?? fallbackNetworkId;
  const to = !row.reconciled;
  const submit = async () => {
    if (!row.bookingRef || !networkId) { notify('This row has no booking reference or network to mark.', 'err'); return; }
    setBusy(true);
    try { await api.markReconciled({ bookingRef: row.bookingRef, networkId, reconciled: to, note }); notify(to ? 'Marked as reconciled' : 'Reconciliation removed'); onDone(); onClose(); }
    catch (e) { notify(apiError(e, 'Could not update the row.'), 'err'); }
    finally { setBusy(false); }
  };
  return (
    <Modal title={to ? 'Mark as reconciled' : 'Undo reconciliation'} eyebrow={row.bookingRef || row.transactionId || ''} onClose={onClose} busy={busy}
      footer={<><button className={btnSecondary} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={submit} disabled={busy}>{busy ? <Spinner light /> : <CheckCircle className="h-4 w-4" />}{to ? 'Mark reconciled' : 'Undo'}</button></>}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600"><MatchBadge status={row.matchStatus} /> HogiCar {money(row.commission, row.currency)} vs network {money(row.networkCommission, row.currency)}</div>
        <Field label="Note" hint="Explain any difference – it’s kept with the row."><textarea className={`${inputCls} h-24 py-2.5`} value={note} onChange={e => setNote(e.target.value)} autoFocus /></Field>
      </div>
    </Modal>
  );
};

const ReconciliationTab: React.FC = () => {
  const { networks, params } = useAffiliateNetworks();
  const [networkId, setNetworkId] = React.useState(params.networkId ? String(params.networkId) : '');
  const [status, setStatus] = React.useState('');
  const [onlyOpen, setOnlyOpen] = React.useState(false);
  const [rows, setRows] = React.useState<ReconciliationRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dialog, setDialog] = React.useState<'import' | 'manual' | ReconciliationRow | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    try { setRows(await api.getReconciliation({ networkId: networkId || undefined, status: status || undefined })); }
    catch (e) { setError(apiError(e, 'Could not load reconciliation.')); setRows([]); }
  }, [networkId, status]);
  React.useEffect(() => { setRows(null); load(); }, [load]);

  const visible = (rows || []).filter(r => !onlyOpen || !r.reconciled);
  const counts = MATCH_STATUSES.map(s => ({ s, n: (rows || []).filter(r => r.matchStatus === s).length }));

  const exportCsv = () => downloadCsv(`affiliate-reconciliation-${isoDay(new Date())}.csv`,
    ['Booking ref', 'Network', 'Transaction ID', 'Booking status', 'Conversion status', 'Booking value', 'Reported amount', 'Network amount', 'Commission', 'Network commission', 'Refund', 'Net amount', 'Currency', 'Settlement date', 'Match', 'Reconciled', 'Note'],
    visible.map(r => [r.bookingRef, r.networkName, r.transactionId, r.bookingStatus, r.conversionStatus, r.bookingValue, r.reportedAmount, r.networkAmount, r.commission, r.networkCommission, r.refundAmount, r.netAmount, r.currency, r.settlementDate, r.matchStatus, r.reconciled ? 'yes' : 'no', r.note]));

  const defNet = Number(networkId) || undefined;
  const diff = (a?: number | null, b?: number | null) => a != null && b != null && Math.abs(a - b) > 0.009;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Reconciliation</h3>
          <p className="text-sm text-slate-500">Match HogiCar conversions with what each network actually approved and paid.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={btnSecondary} onClick={exportCsv} disabled={!visible.length}><Download className="h-4 w-4" /> Export CSV</button>
          <button className={btnSecondary} onClick={() => setDialog('manual')} disabled={!networks.length}><Plus className="h-4 w-4" /> Add settlement</button>
          <button className={btnPrimary} onClick={() => setDialog('import')} disabled={!networks.length}><Upload className="h-4 w-4" /> Import CSV</button>
        </div>
      </div>

      {rows && rows.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {counts.filter(c => c.n).map(c => (
            <button key={c.s} onClick={() => setStatus(status === c.s ? '' : c.s)} className={`rounded-full transition ${status === c.s ? 'ring-2 ring-[#007ac2] ring-offset-1' : ''}`}>
              <Badge tone={MATCH_TONE[c.s]} dot>{humanize(c.s)} · {c.n}</Badge>
            </button>
          ))}
        </div>
      )}

      <FilterBar>
        <FilterField label="Network">
          <Select compact value={networkId} onChange={e => setNetworkId(e.target.value)}>
            <option value="">All networks</option>
            {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Match status">
          <Select compact value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Any</option>
            {MATCH_STATUSES.map(s => <option key={s} value={s}>{humanize(s)}</option>)}
          </Select>
        </FilterField>
        <label className="col-span-2 flex items-end gap-2 pb-2.5 text-sm text-slate-700 sm:col-span-1">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-[#007ac2]" checked={onlyOpen} onChange={e => setOnlyOpen(e.target.checked)} /> Only unreconciled
        </label>
      </FilterBar>

      {error && <ErrorBanner text={error} onRetry={load} />}
      {rows === null ? <SkeletonRows rows={5} height="h-12" /> : !visible.length ? (
        <EmptyState icon={Scale} title="Nothing to reconcile" text="Import a settlement / transaction report from the network to compare it with HogiCar’s conversions." />
      ) : (
        <TableCard>
          <thead className="border-b border-slate-100"><tr>
            <th className={th}>Booking</th><th className={th}>Match</th><th className={th}>Statuses</th><th className={thRight}>HogiCar sale · comm.</th><th className={thRight}>Network sale · comm.</th>
            <th className={thRight}>Refund</th><th className={thRight}>Net</th><th className={th}>Settled</th><th className={th}>Reconciled</th>
          </tr></thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={`${r.conversionId}-${r.settlementId}-${i}`} className="border-t border-slate-100 first:border-0">
                <td className={td}><p className="font-mono font-semibold text-slate-900">{r.bookingRef || '—'}</p><p className="whitespace-nowrap text-[11px] text-slate-400">{r.networkName}</p>{r.transactionId && <p className="whitespace-nowrap font-mono text-[11px] text-slate-400">{r.transactionId}</p>}</td>
                <td className={td}><MatchBadge status={r.matchStatus} /></td>
                <td className={td}><div className="flex flex-col items-start gap-1"><span className="text-xs text-slate-500">{humanize(r.bookingStatus)}</span><ConversionStatusBadge status={r.conversionStatus} /></div></td>
                <td className={`${tdRight} whitespace-nowrap`}>
                  <p className="text-slate-900">{r.reportedAmount != null ? money(r.reportedAmount, r.currency) : '—'}</p>
                  <p className="text-[11px] text-slate-500">{r.commission != null ? money(r.commission, r.currency) : '—'} comm.</p>
                  {r.bookingValue != null && <p className="text-[11px] text-slate-400">of {money(r.bookingValue, r.currency)} booking</p>}
                </td>
                <td className={`${tdRight} whitespace-nowrap`}>
                  <p className={diff(r.reportedAmount, r.networkAmount) ? 'font-semibold text-amber-700' : 'text-slate-900'}>{r.networkAmount != null ? money(r.networkAmount, r.currency) : '—'}</p>
                  <p className={`text-[11px] ${diff(r.commission, r.networkCommission) ? 'font-semibold text-amber-700' : 'text-slate-500'}`}>{r.networkCommission != null ? money(r.networkCommission, r.currency) : '—'} comm.</p>
                </td>
                <td className={tdRight}>{r.refundAmount ? money(r.refundAmount, r.currency) : '—'}</td>
                <td className={`${tdRight} font-semibold text-slate-900`}>{r.netAmount != null ? money(r.netAmount, r.currency) : '—'}</td>
                <td className={`${td} whitespace-nowrap text-xs`}>{r.settlementDate ? fmtDay(r.settlementDate) : '—'}</td>
                <td className={td}>
                  <button onClick={() => setDialog(r)} disabled={!r.bookingRef} className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold transition ${r.reconciled ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`} title={r.note || undefined}>
                    {r.reconciled ? <CheckCircle className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}{r.reconciled ? 'Reconciled' : 'Mark'}
                  </button>
                  {r.note && <p className="mt-0.5 max-w-[160px] truncate text-[11px] text-slate-400" title={r.note}>{r.note}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}

      <AnimatePresence>
        {dialog === 'import' && <ImportDialog key="imp" onClose={() => setDialog(null)} onDone={load} defaultNetworkId={defNet} />}
        {dialog === 'manual' && <SettlementDialog key="man" onClose={() => setDialog(null)} onDone={load} defaultNetworkId={defNet} />}
        {dialog && typeof dialog === 'object' && <MarkDialog key="mark" row={dialog} fallbackNetworkId={defNet} onClose={() => setDialog(null)} onDone={load} />}
      </AnimatePresence>
    </div>
  );
};

export default ReconciliationTab;
