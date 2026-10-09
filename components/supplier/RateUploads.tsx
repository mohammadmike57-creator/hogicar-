import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FileSpreadsheet from 'lucide-react/dist/esm/icons/file-spreadsheet';
import Download from 'lucide-react/dist/esm/icons/download';
import X from 'lucide-react/dist/esm/icons/x';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import { supplierApi } from '../../api';

type Period = { name: string; startDate: string; endDate: string; currency?: string };
type UploadRow = {
  id: number; fileName: string; fileSize?: number; uploadedAt: string; ok: boolean; message?: string;
  sheetsProcessed?: number; rowsProcessed?: number; periods: Period[];
};
type Length = { key: string; minDays: number; maxDays: number | null; label: string };
type CarRow = { carId: number; sipp?: string; vehicle: string; location?: string; prices: Record<string, number> };
type Season = {
  name: string; startDate: string; endDate: string; currency: string; lengths: Length[]; rows: CarRow[];
  minRate: number | null; maxRate: number | null; carsPriced: number; carsTotal: number;
};
type Detail = { id: number; fileName: string; uploadedAt: string; ok: boolean; message?: string; hasFile: boolean; seasons: Season[] };

const fmtDate = (d: string) => {
  const x = new Date(`${d}T00:00:00`);
  return isNaN(x.getTime()) ? d : x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtWhen = (d: string) => {
  const x = new Date(d);
  return isNaN(x.getTime()) ? d : x.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const money = (v: number | null | undefined) => (v == null ? '—' : Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

const saveBlob = (blob: Blob, name: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

/** "Uploaded sheets": every rate sheet the supplier uploaded. Click one to see and change its live prices. */
export const RateUploadsSection = ({ refreshKey, autoOpenId }: { refreshKey?: number; autoOpenId?: number | null }) => {
  const [rows, setRows] = useState<UploadRow[] | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  // Right after an upload, show its live prices.
  useEffect(() => { if (autoOpenId) setOpenId(autoOpenId); }, [autoOpenId]);

  const load = useCallback(() => {
    supplierApi.getRateUploads().then(r => setRows(r.data || [])).catch(() => setRows([]));
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Uploaded sheets</h3>
          <p className="text-xs text-slate-500">Click a sheet to see the prices live on HogiCar now and change them.</p>
        </div>
      </div>
      {rows === null ? (
        <div className="flex items-center gap-2 px-5 py-8 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">No sheets uploaded yet. Upload a completed template above and it will appear here.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map(u => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => setOpenId(u.id)}
                className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${u.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <FileSpreadsheet className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">{u.fileName}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span>{fmtWhen(u.uploadedAt)}</span>
                    {u.ok ? (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700"><CheckCircle className="h-3.5 w-3.5" /> Imported</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-rose-700"><XCircle className="h-3.5 w-3.5" /> Not imported</span>
                    )}
                    {u.ok && u.periods?.length > 0 && <span>{u.periods.length} season{u.periods.length === 1 ? '' : 's'} · {u.rowsProcessed ?? 0} car prices</span>}
                  </span>
                  {u.ok && u.periods?.length > 0 && (
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      {u.periods.slice(0, 4).map(p => (
                        <span key={`${p.name}-${p.startDate}`} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{p.name}</span>
                      ))}
                      {u.periods.length > 4 && <span className="text-[11px] text-slate-500">+{u.periods.length - 4}</span>}
                    </span>
                  )}
                </span>
                <span className="hidden items-center gap-1 text-xs font-semibold text-accent sm:inline-flex">View prices</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <RateUploadModal uploadId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
};

/** The live prices for the seasons an uploaded sheet set, editable by hand. */
export const RateUploadModal = ({ uploadId, onClose }: { uploadId: number | null; onClose: () => void }) => {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (uploadId == null) return;
    setDetail(null); setError(''); setActive(0); setEdits({}); setNotice('');
    supplierApi.getRateUpload(uploadId)
      .then(r => setDetail(r.data))
      .catch(() => setError('This sheet could not be loaded. Please try again.'));
  }, [uploadId]);

  useEffect(() => {
    if (uploadId == null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [uploadId, onClose]);

  const season = detail?.seasons?.[active];
  const cellKey = (carId: number, len: string) => `${active}|${carId}|${len}`;
  const changes = useMemo(() => {
    if (!season) return [];
    return (Object.entries(edits) as [string, string][]).filter(([k]) => k.startsWith(`${active}|`)).flatMap(([k, v]) => {
      const [, carId, len] = k.split('|');
      const row = season.rows.find(r => String(r.carId) === carId);
      const before = row?.prices?.[len];
      const value = v.trim() === '' ? null : Number(v.replace(',', '.'));
      if (value !== null && (isNaN(value) || value <= 0)) return [];
      if ((before ?? null) === value || (before != null && value != null && Number(before) === value)) return [];
      const l = season.lengths.find(x => x.key === len);
      return [{ carId: Number(carId), minDays: l?.minDays, maxDays: l?.maxDays, dailyRate: value }];
    });
  }, [edits, season, active]);
  const invalid = useMemo(() => (Object.entries(edits) as [string, string][]).some(([k, v]) => k.startsWith(`${active}|`) && v.trim() !== '' && (isNaN(Number(v.replace(',', '.'))) || Number(v.replace(',', '.')) <= 0)), [edits, active]);

  const save = async () => {
    if (!season || changes.length === 0 || invalid) return;
    setSaving(true); setNotice('');
    try {
      const r = await supplierApi.saveLiveRates({ name: season.name, startDate: season.startDate, endDate: season.endDate, currency: season.currency, cells: changes });
      const updated: Season = r.data;
      setDetail(d => d ? { ...d, seasons: d.seasons.map((s, i) => (i === active ? { ...updated, name: s.name } : s)) } : d);
      setEdits(e => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith(`${active}|`))));
      setNotice(`Saved. ${changes.length} price${changes.length === 1 ? '' : 's'} updated and live on HogiCar now.`);
    } catch (e: any) {
      setNotice(e?.response?.data?.message || 'Could not save. Please check the prices and try again.');
    } finally {
      setSaving(false);
    }
  };

  const download = async () => {
    if (!detail) return;
    try {
      const r = await supplierApi.downloadRateUpload(detail.id);
      saveBlob(new Blob([r.data]), detail.fileName || 'rates.xlsx');
    } catch { setNotice('The original file is not available.'); }
  };

  return (
    <AnimatePresence>
      {uploadId != null && (
        <motion.div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog" aria-modal="true" aria-label="Live prices for this sheet"
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><FileSpreadsheet className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold text-slate-900">{detail?.fileName || 'Uploaded sheet'}</h2>
                <p className="text-xs text-slate-500">{detail ? `Uploaded ${fmtWhen(detail.uploadedAt)}` : 'Loading…'}</p>
              </div>
              {detail?.hasFile && (
                <button type="button" onClick={download} className="hidden h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex">
                  <Download className="h-4 w-4" /> Original file
                </button>
              )}
              <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {error && <p className="px-5 py-10 text-center text-sm text-rose-600">{error}</p>}
              {!detail && !error && <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" /> Loading live prices…</div>}
              {detail && !detail.ok && (
                <div className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                  <p className="font-semibold">This sheet was not imported</p>
                  <p className="mt-1">{detail.message || 'The file could not be read.'}</p>
                  <p className="mt-2 text-rose-700">Download a fresh template, fill it in and upload it again.</p>
                </div>
              )}
              {detail && detail.ok && detail.seasons.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-slate-500">This sheet didn't set any seasons.</p>
              )}
              {detail && detail.ok && season && (
                <div className="px-5 py-4">
                  {detail.seasons.length > 1 && (
                    <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
                      {detail.seasons.map((s, i) => (
                        <button key={`${s.name}-${s.startDate}`} type="button" onClick={() => { setActive(i); setNotice(''); }}
                          className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${i === active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Season summary */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 p-3.5">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400"><Calendar className="h-3.5 w-3.5" /> Season</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{season.name}</p>
                      <p className="text-xs text-slate-500">{fmtDate(season.startDate)} – {fmtDate(season.endDate)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Price range per day</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
                        {season.minRate == null ? 'No prices' : `${season.currency} ${money(season.minRate)} – ${money(season.maxRate)}`}
                      </p>
                      <p className="text-xs text-slate-500">Lowest and highest daily price live now</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Cars with prices</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{season.carsPriced} of {season.carsTotal}</p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${season.carsTotal ? Math.round((season.carsPriced / season.carsTotal) * 100) : 0}%` }} />
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <Pencil className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    These are the prices live on HogiCar now (daily price, {season.currency}). Change any price and press Save; clear a price to stop offering that length. The uploaded file itself isn't changed.
                  </p>

                  {season.lengths.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-500">No prices are live for this season any more. A newer upload or a manual change may have replaced them.</p>
                  ) : (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
                            <th className="sticky left-0 z-10 min-w-[11rem] bg-slate-50 px-3 py-2.5">Car</th>
                            {season.lengths.map(l => <th key={l.key} className="whitespace-nowrap px-2 py-2.5 text-center">{l.label}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {season.rows.map(row => (
                            <tr key={row.carId} className="hover:bg-slate-50/60">
                              <td className="sticky left-0 z-10 bg-white px-3 py-2">
                                <span className="block text-sm font-medium text-slate-900">{row.vehicle}</span>
                                <span className="text-xs text-slate-500">{row.sipp || `Car #${row.carId}`}{row.location ? ` · ${row.location}` : ''}</span>
                              </td>
                              {season.lengths.map(l => {
                                const k = cellKey(row.carId, l.key);
                                const live = row.prices?.[l.key];
                                const value = edits[k] ?? (live != null ? String(Number(live).toFixed(2)) : '');
                                const changed = edits[k] !== undefined && (edits[k].trim() === '' ? live != null : Number(edits[k].replace(',', '.')) !== Number(live));
                                const bad = edits[k] !== undefined && edits[k].trim() !== '' && (isNaN(Number(edits[k].replace(',', '.'))) || Number(edits[k].replace(',', '.')) <= 0);
                                return (
                                  <td key={l.key} className="px-1.5 py-1.5 text-center">
                                    <input
                                      inputMode="decimal"
                                      aria-label={`${row.vehicle}, ${l.label}, price per day`}
                                      value={value}
                                      placeholder="—"
                                      onChange={e => setEdits(x => ({ ...x, [k]: e.target.value }))}
                                      className={`h-9 w-24 rounded-lg border px-2 text-center text-sm tabular-nums outline-none transition-colors focus:ring-2 focus:ring-accent/30 ${bad ? 'border-rose-400 bg-rose-50 text-rose-700' : changed ? 'border-amber-400 bg-amber-50 font-semibold text-amber-900' : live != null ? 'border-slate-200 bg-white text-slate-900' : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'}`}
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {detail && detail.ok && season && season.lengths.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-slate-100 bg-white px-5 py-3 sm:flex-row sm:items-center">
                <p className={`flex-1 text-sm ${notice.startsWith('Saved') ? 'text-emerald-700' : notice ? 'text-rose-600' : 'text-slate-500'}`} role="status">
                  {notice || (invalid ? 'Prices must be numbers above 0.' : changes.length ? `${changes.length} unsaved change${changes.length === 1 ? '' : 's'}` : 'No changes yet')}
                </p>
                <div className="flex gap-2">
                  {detail.hasFile && (
                    <button type="button" onClick={download} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:hidden">
                      <Download className="h-4 w-4" /> File
                    </button>
                  )}
                  <button type="button" disabled={!changes.length || saving} onClick={() => { setEdits(e => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith(`${active}|`)))); setNotice(''); }}
                    className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:flex-none">Discard</button>
                  <button type="button" disabled={!changes.length || invalid || saving} onClick={save}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none">
                    {saving && <RefreshCw className="h-4 w-4 animate-spin" />} Save changes
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RateUploadsSection;
