import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import Plug from 'lucide-react/dist/esm/icons/plug';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import FileSignature from 'lucide-react/dist/esm/icons/file-signature';
import Search from 'lucide-react/dist/esm/icons/search';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Route from 'lucide-react/dist/esm/icons/route';
import Users from 'lucide-react/dist/esm/icons/users';
import { copyText } from '../commercialUi';
import {
  Badge, Callout, Card, EmptyState, Modal, SkeletonRows, TableCard, btnDanger, btnPrimary, btnSecondary, iconBtn, inputCls, td, th, useConfirm,
} from '../affiliateNetworks/ui';
import { distributionApi, errorText, type ApiSupplier } from './api';
import { fmtDateTime, fmtMoney, humanize, useDist } from './shared';
import type { ChannelBundle } from './ChannelDetail';

const Field: React.FC<{ label: string; children: React.ReactNode; help?: string; wide?: boolean }> = ({ label, children, help, wide }) => (
  <label className={`block min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
    <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
    {children}
    {help && <span className="mt-1 block text-[11px] text-slate-500">{help}</span>}
  </label>
);

// ------------------------------------------------------------------ API suppliers & contracts (global)

export const ApiInventoryCard: React.FC = () => {
  const { can } = useDist();
  const [rows, setRows] = React.useState<ApiSupplier[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<ApiSupplier | null>(null);
  const load = React.useCallback(() => {
    setError(null);
    distributionApi.apiInventory().then(setRows).catch(e => setError(errorText(e)));
  }, []);
  React.useEffect(load, [load]);
  const ready = (rows || []).filter(r => r.distributable).length;

  return (
    <Card title="Third-party API inventory" icon={Plug} bodyClassName="p-0"
      subtitle={rows ? `${ready} of ${rows.length} API suppliers can be resold to channels` : 'Cars HogiCar receives from the car-hire API'}>
      <div className="p-4 pb-0 sm:px-5">
        <Callout tone="info" icon={FileSignature}>
          Cars from API suppliers are offered to a channel only when the supplier has a signed redistribution contract here, the API provider's terms are confirmed, and the channel has API inventory switched on. Prices always come live from the API, the same call hogicar.com makes.
        </Callout>
      </div>
      {error && <p className="m-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {!rows ? <div className="p-4"><SkeletonRows rows={3} /></div> : rows.length === 0 ? (
        <div className="p-4"><EmptyState icon={Plug} title="No API suppliers yet" text="API suppliers appear after the first live search returns their cars." compact /></div>
      ) : (
        <TableCard className="mt-4 rounded-none shadow-none ring-0">
          <thead className="bg-slate-50/70"><tr><th className={th}>API supplier</th><th className={th}>Locations seen</th><th className={th}>Contract</th><th className={th}>Can be distributed</th><th className={th} /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(r => (
              <tr key={r.vendorCode} className="align-top">
                <td className={td}>
                  <div className="flex items-center gap-2">
                    {r.logoUrl ? <img src={r.logoUrl} alt="" className="h-6 w-10 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} /> : null}
                    <div><p className="font-medium text-slate-900">{r.name}</p><p className="text-xs text-slate-500">Code {r.vendorCode}{!r.active ? ' · inactive' : ''}</p></div>
                  </div>
                </td>
                <td className={td}>
                  <div className="flex max-w-[260px] flex-wrap gap-1">
                    {r.locations.length === 0 ? <span className="text-xs text-slate-400">Not recorded yet</span>
                      : r.locations.slice(0, 8).map(l => <Badge key={l.code} tone={l.active ? 'blue' : 'grey'}>{l.code}{l.carCount ? ` · ${l.carCount}` : ''}</Badge>)}
                    {r.locations.length > 8 && <span className="text-xs text-slate-500">+{r.locations.length - 8}</span>}
                  </div>
                </td>
                <td className={`${td} text-xs`}>
                  {r.contract ? <>
                    <p className="font-semibold text-slate-800">{r.contract.contractReference}</p>
                    <p className="text-slate-500">{r.contract.validFrom || r.contract.signedOn || '…'} → {r.contract.validTo || 'open-ended'}</p>
                    <p className="text-slate-500">{r.contract.allowedChannels ? `Channels: ${r.contract.allowedChannels}` : 'All channels'}{r.contract.allowedMarkets ? ` · Markets: ${r.contract.allowedMarkets}` : ''}</p>
                    {r.contract.documentUrl && <a className="text-[#007ac2] hover:underline" href={r.contract.documentUrl} target="_blank" rel="noreferrer">Signed document</a>}
                  </> : <span className="text-slate-400">None</span>}
                </td>
                <td className={td}>{r.distributable ? <Badge tone="green">Yes</Badge> : <><Badge tone="amber">No</Badge><p className="mt-1 max-w-[220px] text-xs text-slate-500">{r.blockReason}</p></>}</td>
                <td className={td}>{can('EDIT_INVENTORY') && <button className={iconBtn} onClick={() => setEditing(r)} aria-label={`Contract for ${r.name}`}><Pencil className="h-4 w-4" /></button>}</td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
      <AnimatePresence>{editing && <ContractModal supplier={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}</AnimatePresence>
    </Card>
  );
};

const ContractModal: React.FC<{ supplier: ApiSupplier; onClose: () => void; onSaved: () => void }> = ({ supplier, onClose, onSaved }) => {
  const { toast } = useDist();
  const c = supplier.contract;
  const [form, setForm] = React.useState({
    contractReference: c?.contractReference || '', signedOn: c?.signedOn || '', documentUrl: c?.documentUrl || '',
    validFrom: c?.validFrom || '', validTo: c?.validTo || '', allowedChannels: c?.allowedChannels || '', allowedMarkets: c?.allowedMarkets || '',
    notes: c?.notes || '', redistributionAllowed: !!c?.redistributionAllowed, sourceTermsConfirmed: !!c?.sourceTermsConfirmed, active: c ? c.active !== false : true,
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirm, confirmEl] = useConfirm();
  const set = (k: keyof typeof form, upper = false) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: upper ? e.target.value.toUpperCase() : e.target.value }));
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await distributionApi.saveApiContract(supplier.vendorCode, form);
      toast('Contract saved');
      onSaved();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!(await confirm({ title: 'Remove this contract?', message: `${supplier.name}'s cars will stop being offered to channels immediately.`, confirmLabel: 'Remove', danger: true }))) return;
    try {
      await distributionApi.deleteApiContract(supplier.vendorCode);
      toast('Contract removed');
      onSaved();
    } catch (e) {
      setError(errorText(e));
    }
  };
  return (
    <Modal title={`Redistribution contract · ${supplier.name}`} eyebrow={`API supplier ${supplier.vendorCode}`} onClose={onClose} busy={busy} width="max-w-2xl"
      footer={<>
        {c && <button className={`${btnDanger} mr-auto`} onClick={remove} disabled={busy}>Remove contract</button>}
        <button className={btnSecondary} onClick={onClose} disabled={busy}>Cancel</button>
        <button className={btnPrimary} onClick={save} disabled={busy || !form.contractReference}>Save contract</button>
      </>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Contract reference"><input className={inputCls} value={form.contractReference} onChange={set('contractReference')} placeholder="e.g. HC-ZT-2026-01" /></Field>
        <Field label="Signed on"><input type="date" className={inputCls} value={form.signedOn} onChange={set('signedOn')} /></Field>
        <Field label="Signed document (link)" wide><input className={inputCls} value={form.documentUrl} onChange={set('documentUrl')} placeholder="https://… (your secure storage)" /></Field>
        <Field label="Valid from"><input type="date" className={inputCls} value={form.validFrom} onChange={set('validFrom')} /></Field>
        <Field label="Valid to"><input type="date" className={inputCls} value={form.validTo} onChange={set('validTo')} /></Field>
        <Field label="Allowed channels (codes)" help="Empty = every channel"><input className={inputCls} value={form.allowedChannels} onChange={set('allowedChannels', true)} placeholder="SKYSCANNER, KAYAK" /></Field>
        <Field label="Allowed markets (ISO)" help="Empty = every market"><input className={inputCls} value={form.allowedMarkets} onChange={set('allowedMarkets', true)} placeholder="GB, JO" /></Field>
        <Field label="Notes" wide><input className={inputCls} value={form.notes} onChange={set('notes')} /></Field>
      </div>
      <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
        <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" className="mt-1" checked={form.redistributionAllowed} onChange={e => setForm(f => ({ ...f, redistributionAllowed: e.target.checked }))} />
          <span><b>{supplier.name} allows HogiCar to resell its cars</b> through third-party channels (as stated in the contract).</span></label>
        <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" className="mt-1" checked={form.sourceTermsConfirmed} onChange={e => setForm(f => ({ ...f, sourceTermsConfirmed: e.target.checked }))} />
          <span><b>The API data provider's terms allow this resale.</b> Tick only after checking the API agreement.</span></label>
        <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" className="mt-1" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
          <span>Contract active</span></label>
      </div>
      {c?.updatedAt && <p className="mt-2 text-xs text-slate-400">Last changed {fmtDateTime(c.updatedAt)} by {c.updatedBy}</p>}
      {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {confirmEl}
    </Modal>
  );
};

/** Per-channel switch for third-party API inventory. */
export const ApiInventoryToggle: React.FC<{ bundle: ChannelBundle; reload: () => Promise<unknown> }> = ({ bundle, reload }) => {
  const { can, toast } = useDist();
  const c = bundle.channel;
  const [rows, setRows] = React.useState<ApiSupplier[] | null>(null);
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { distributionApi.apiInventory().then(setRows).catch(() => setRows([])); }, []);
  const allowed = (rows || []).filter(r => r.distributable && (!r.contract?.allowedChannels || r.contract.allowedChannels.split(',').map(x => x.trim()).includes(c.code)));
  const on = !!c.includeApiInventory;
  const toggle = async () => {
    setBusy(true);
    try {
      await distributionApi.updateChannel(c.id, { includeApiInventory: !on });
      toast(!on ? 'API inventory switched on' : 'API inventory switched off');
      await reload();
    } catch (e) {
      toast(errorText(e), 'err');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card title="Third-party API inventory" icon={Plug}
      subtitle={on ? `On · ${allowed.length} contracted API supplier(s) can be sent to ${c.name}` : 'Off · only HogiCar\'s own supplier cars are sent'}
      actions={can('EDIT_CHANNEL') ? <button className={on ? btnSecondary : btnPrimary} disabled={busy} onClick={toggle}>{on ? 'Switch off' : 'Switch on'}</button> : undefined}>
      {rows === null ? <SkeletonRows rows={1} height="h-8" /> : allowed.length === 0 ? (
        <p className="text-sm text-slate-600">No API supplier has a valid contract covering this channel yet. Add contracts under Distribution network → Inventory.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">{allowed.map(r => <Badge key={r.vendorCode} tone="green">{r.name} · {r.contract?.contractReference}</Badge>)}</div>
      )}
    </Card>
  );
};

// ------------------------------------------------------------------ connection flow + simulator

const plusDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const STEPS: { title: string; text: string; who: string }[] = [
  { who: 'Partner', title: 'Customer searches on the partner site', text: 'Pickup location, pickup and return date and time, driver age, and the point-of-sale market.' },
  { who: 'Partner → HogiCar', title: 'Partner asks HogiCar for prices', text: 'The location (HogiCar code or the partner\'s mapped id), dates, times, market and currency are sent to the HogiCar Distribution API or, once built, the provider\'s own protocol.' },
  { who: 'HogiCar', title: 'HogiCar finds eligible cars and prices them', text: 'Own supplier cars and contracted API cars, checked against rates, stop sales, capacity and channel rules, priced like hogicar.com. Each result gets a deeplink with a random offer reference.' },
  { who: 'Partner', title: 'Partner shows the results', text: 'Car, supplier, total price and conditions. When the customer clicks "Select", the partner sends them to the deeplink.' },
  { who: 'HogiCar', title: 'hogicar.com restores the search', text: 'The offer is re-checked live. The customer lands on the HogiCar results page with the same location and dates and the chosen car opened; any price change is shown before they continue.' },
  { who: 'HogiCar', title: 'Customer completes the booking on HogiCar', text: 'Normal HogiCar checkout and confirmation. The booking is linked to the partner\'s click for reporting and commission.' },
];

export const ConnectionFlowTab: React.FC<{ bundle: ChannelBundle }> = ({ bundle }) => {
  const { can, toast } = useDist();
  const c = bundle.channel;
  const markets = (c.markets || '').split(',').map(x => x.trim()).filter(Boolean);
  const [form, setForm] = React.useState({ pickup: 'AMM', pickupDate: plusDays(14), pickupTime: '10:00', dropoffDate: plusDays(17), dropoffTime: '10:00', market: markets[0] || '', driverAge: '30' });
  const [result, setResult] = React.useState<any | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: keyof typeof form, upper = false) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: upper ? e.target.value.toUpperCase() : e.target.value }));
  const local = (url: string) => url.replace(/^https?:\/\/[^/]+/, window.location.origin);

  const run = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await distributionApi.testOffers(c.id, form));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const base = `${window.location.origin}/api/distribution/v1`;
  const example = `curl -H "X-Api-Key: <partner key>" \\\n  "${base}/offers?pickup=${form.pickup}&pickupDate=${form.pickupDate}&pickupTime=${form.pickupTime}&dropoffDate=${form.dropoffDate}&dropoffTime=${form.dropoffTime}&market=${form.market || 'GB'}&driverAge=${form.driverAge}"`;

  return (
    <div className="space-y-4">
      <Card title="How a search on the partner becomes a booking on HogiCar" icon={Route}>
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#007ac2] text-sm font-bold text-white">{i + 1}</span>
                <Badge tone={s.who.startsWith('Partner') ? 'violet' : 'blue'}>{s.who}</Badge>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
        {!bundle.adapter.officialSpecImplemented && (
          <Callout className="mt-4" tone="warn">For {c.name}, steps 2 and 4 follow the provider's own protocol, which is waiting for their official specification. Steps 3, 5 and 6 already work and can be tried below.</Callout>
        )}
      </Card>

      <Card title={`Try it: search as ${c.name} would`} subtitle="Runs the real engine with this channel's rules. Select a car to follow the deeplink to hogicar.com in a new tab." icon={Search}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <Field label="Pickup location"><input className={inputCls} value={form.pickup} onChange={set('pickup', true)} placeholder="AMM" /></Field>
          <Field label="Pickup date"><input type="date" className={inputCls} value={form.pickupDate} onChange={set('pickupDate')} /></Field>
          <Field label="Pickup time"><input type="time" className={inputCls} value={form.pickupTime} onChange={set('pickupTime')} /></Field>
          <Field label="Return date"><input type="date" className={inputCls} value={form.dropoffDate} onChange={set('dropoffDate')} /></Field>
          <Field label="Return time"><input type="time" className={inputCls} value={form.dropoffTime} onChange={set('dropoffTime')} /></Field>
          <Field label="Market">
            {markets.length ? <select className={inputCls} value={form.market} onChange={set('market')}>{markets.map(m => <option key={m} value={m}>{m}</option>)}</select>
              : <input className={inputCls} value={form.market} maxLength={2} onChange={set('market', true)} />}
          </Field>
          <Field label="Driver age"><input className={inputCls} inputMode="numeric" value={form.driverAge} onChange={set('driverAge')} /></Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button className={btnSecondary} onClick={() => { copyText(example); toast('Request copied'); }}>Copy API request</button>
          <button className={btnPrimary} disabled={busy || !can('EDIT_CHANNEL') || !form.pickup || !form.market} onClick={run}><Search className="h-4 w-4" />{busy ? 'Searching…' : 'Search'}</button>
        </div>
        {!markets.length && <p className="mt-2 text-xs text-amber-700">Enable at least one market for this channel under Markets & currencies.</p>}
        {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      </Card>

      {result && (
        <div className="rounded-3xl bg-slate-100 p-3 ring-1 ring-slate-200 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">What {c.name} would show</p>
            <p className="text-xs text-slate-500">{result.offers.length} cars · {result.excluded.length} not offered · {result.latencyMs} ms</p>
          </div>
          {result.offers.length === 0 ? <EmptyState icon={Search} title="No cars to show" text="See why below." compact /> : (
            <div className="space-y-3">
              {result.offers.map((o: any) => (
                <div key={o.offerRef} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 sm:w-36">
                    {o.vehicle.imageUrl ? <img src={o.vehicle.imageUrl} alt="" className="max-h-20 object-contain" /> : <span className="text-xs text-slate-400">No image</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-semibold text-slate-900">{o.vehicle.description}</p>
                      {o.vehicle.sippCode && <Badge tone="grey">{o.vehicle.sippCode}</Badge>}
                      <Badge tone={o.inventorySource === 'API_SUPPLIER' ? 'violet' : 'blue'}>{o.inventorySource === 'API_SUPPLIER' ? 'API supplier · contract' : 'HogiCar supplier'}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {o.supplier.name} · {o.location.name} · {o.rental.days} days{o.vehicle.passengers ? ` · ${o.vehicle.passengers} seats` : ''}{o.vehicle.transmission ? ` · ${humanize(o.vehicle.transmission)}` : ''}
                    </p>
                    {o.conditions?.fuelPolicy && <p className="text-xs text-slate-500">Fuel: {humanize(o.conditions.fuelPolicy)}{o.conditions.deposit ? ` · Deposit ${fmtMoney(o.conditions.deposit, o.conditions.depositCurrency)}` : ''}</p>}
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <div className="text-right"><p className="text-xl font-bold tabular-nums text-slate-900">{fmtMoney(o.price.total, o.price.currency)}</p>
                      <p className="text-xs text-slate-500">{fmtMoney(o.price.perDay, o.price.currency)} / day</p></div>
                    <a href={local(o.deeplink)} target="_blank" rel="noreferrer" className={btnPrimary}>Select<ArrowRight className="h-4 w-4" /></a>
                  </div>
                </div>
              ))}
            </div>
          )}
          {result.excluded.length > 0 && (
            <details className="mt-3 rounded-2xl bg-white p-3 text-sm ring-1 ring-slate-200">
              <summary className="cursor-pointer font-medium text-slate-700">Cars not offered and why ({result.excluded.length})</summary>
              <ul className="mt-2 space-y-1">{result.excluded.map((x: any, i: number) => (
                <li key={i} className="text-xs text-slate-600">{x.carId ? `#${x.carId} ` : ''}{x.supplierName}{x.sippCode ? ` ${x.sippCode}` : ''}: <b>{humanize(x.code)}</b> — {x.message}</li>
              ))}</ul>
            </details>
          )}
          {result.offers[0] && (
            <p className="mt-3 flex flex-wrap items-center gap-1 text-xs text-slate-500">
              <ExternalLink className="h-3.5 w-3.5" />Deeplink example: <code className="break-all">{result.offers[0].deeplink}</code>
            </p>
          )}
        </div>
      )}

      <Card title="Example request" subtitle="What the partner calls (HogiCar Distribution API v1)" icon={Users}>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-slate-900 p-3 text-xs text-emerald-300">{example}</pre>
        <p className="mt-2 text-xs text-slate-500">The response lists each car with its price, conditions and <code>deeplink</code>. The partner sends the customer to that deeplink unchanged; prices are never taken from the link.</p>
      </Card>
    </div>
  );
};
