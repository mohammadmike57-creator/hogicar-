import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Users from 'lucide-react/dist/esm/icons/users';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Search from 'lucide-react/dist/esm/icons/search';
import Globe from 'lucide-react/dist/esm/icons/globe';
import {
  affiliateNetworksApi as api, apiError, type Publisher, type PublisherInput, type Program, PUBLISHER_STATUSES, type PublisherStatus,
} from '../../affiliateNetworksApi';
import { Drawer, Field, ErrorBanner } from '../commercialUi';
import { useAffiliateNetworks } from './context';
import {
  Badge, EmptyState, FilterBar, FilterField, Panel, PUBLISHER_STATUS_TONE, SaveFooter, Select, SkeletonRows, TableCard, btnPrimary, filterCls,
  humanize, iconBtn, inputCls, money, pct, th, thRight, td, tdRight, useConfirm, pickInto,
} from './ui';

const empty = (networkId: number): PublisherInput => ({ networkId, programId: null, name: '', externalPublisherId: '', email: '', website: '', country: '', status: 'ACTIVE', notes: '' });

const PublisherDrawer: React.FC<{ publisher: Publisher | null; defaultNetworkId: number; onClose: () => void; onSaved: (p: Publisher) => void }> = ({ publisher, defaultNetworkId, onClose, onSaved }) => {
  const { networks } = useAffiliateNetworks();
  const [d, setD] = React.useState<PublisherInput>(() => (publisher ? pickInto(empty(publisher.networkId), publisher) : empty(defaultNetworkId)));
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (p: Partial<PublisherInput>) => { setD(x => ({ ...x, ...p })); setError(null); };
  React.useEffect(() => { if (d.networkId) api.getPrograms(d.networkId).then(setPrograms).catch(() => setPrograms([])); }, [d.networkId]);
  const save = async () => {
    if (!d.networkId) return setError('Choose a network.');
    if (!d.name.trim()) return setError('Enter the publisher name.');
    if (!d.externalPublisherId.trim()) return setError('Enter the publisher ID used by the network.');
    if (d.email && !/^\S+@\S+\.\S+$/.test(d.email)) return setError('Enter a valid email address.');
    setSaving(true);
    try { onSaved(publisher ? await api.updatePublisher(publisher.id, d) : await api.createPublisher(d)); }
    catch (e) { setError(apiError(e, 'Could not save the publisher.')); }
    finally { setSaving(false); }
  };
  const s = publisher?.stats;
  return (
    <Drawer eyebrow={publisher ? 'Publisher' : 'New publisher'} title={publisher?.name || 'Add a publisher'} onClose={onClose} busy={saving}
      footer={<SaveFooter error={error} saving={saving} onCancel={onClose} onSave={save} label={publisher ? 'Save publisher' : 'Add publisher'} />}>
      <div className="space-y-4">
        {s && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {[['Clicks', new Intl.NumberFormat('en-GB').format(s.clicks)], ['Bookings', new Intl.NumberFormat('en-GB').format(s.bookings)], ['Conv. rate', pct(s.conversionRate)], ['Revenue', money(s.revenue)], ['Commission', money(s.commission)]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><p className="text-xs text-slate-500">{k}</p><p className="mt-0.5 font-semibold tabular-nums text-slate-900">{v}</p></div>
            ))}
          </div>
        )}
        <Panel title="Publisher">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Network">
              <Select value={d.networkId || ''} onChange={e => set({ networkId: Number(e.target.value), programId: null })}>
                <option value="">Choose…</option>
                {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </Select>
            </Field>
            <Field label="Program">
              <Select value={d.programId ?? ''} onChange={e => set({ programId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">Any program</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label="Name"><input className={inputCls} value={d.name} onChange={e => set({ name: e.target.value })} placeholder="Travel Blog" /></Field>
            <Field label="Network publisher ID" hint="The ID the network sends in the publisher parameter."><input className={`${inputCls} font-mono`} value={d.externalPublisherId} onChange={e => set({ externalPublisherId: e.target.value.trim() })} placeholder="12345" /></Field>
            <Field label="Email"><input type="email" className={inputCls} value={d.email} onChange={e => set({ email: e.target.value })} placeholder="Optional" /></Field>
            <Field label="Website"><input className={inputCls} value={d.website} onChange={e => set({ website: e.target.value })} placeholder="https://" /></Field>
            <Field label="Country"><input className={`${inputCls} uppercase placeholder:normal-case`} maxLength={2} value={d.country} onChange={e => set({ country: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })} placeholder="JO" /></Field>
            <Field label="Status">
              <Select value={d.status} onChange={e => set({ status: e.target.value as PublisherStatus })}>
                {PUBLISHER_STATUSES.map(st => <option key={st} value={st}>{humanize(st)}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Notes" hint="Internal only."><textarea className={`${inputCls} h-20 py-2.5`} value={d.notes} onChange={e => set({ notes: e.target.value })} /></Field>
        </Panel>
      </div>
    </Drawer>
  );
};

const PublishersTab: React.FC = () => {
  const { networks, notify, params } = useAffiliateNetworks();
  const [networkId, setNetworkId] = React.useState(params.networkId ? String(params.networkId) : '');
  const [status, setStatus] = React.useState('');
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState<Publisher[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<Publisher | null | 'new'>(null);
  const [confirm, confirmEl] = useConfirm();

  const load = React.useCallback(async () => {
    setItems(null); setError(null);
    try { setItems(await api.getPublishers(networkId || undefined)); }
    catch (e) { setError(apiError(e, 'Could not load publishers.')); setItems([]); }
  }, [networkId]);
  React.useEffect(() => { load(); }, [load]);

  const del = async (p: Publisher) => {
    if (!(await confirm({ title: `Delete ${p.name}?`, message: 'Their past conversions are kept. New conversions with this publisher ID will show the raw ID only.', confirmLabel: 'Delete', danger: true }))) return;
    try { await api.deletePublisher(p.id); setItems(l => (l || []).filter(x => x.id !== p.id)); notify('Publisher deleted'); }
    catch (e) { notify(apiError(e, 'Could not delete the publisher.'), 'err'); }
  };

  const term = q.trim().toLowerCase();
  const visible = (items || []).filter(p => (!status || p.status === status) && (!term || [p.name, p.externalPublisherId, p.email, p.website].some(v => (v || '').toLowerCase().includes(term))));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Publishers</h3>
          <p className="text-sm text-slate-500">Sites and partners that send traffic through a network. Matched by the network’s publisher ID.</p>
        </div>
        <button className={`${btnPrimary} h-11 shrink-0`} onClick={() => setEditing('new')} disabled={!networks.length}><Plus className="h-4 w-4" /> Add publisher</button>
      </div>
      <FilterBar>
        <FilterField label="Search" className="col-span-2">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${filterCls} pl-9`} value={q} onChange={e => setQ(e.target.value)} placeholder="Name, ID, email or website" /></div>
        </FilterField>
        <FilterField label="Network">
          <Select compact value={networkId} onChange={e => setNetworkId(e.target.value)}>
            <option value="">All networks</option>
            {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Status">
          <Select compact value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Any status</option>
            {PUBLISHER_STATUSES.map(s => <option key={s} value={s}>{humanize(s)}</option>)}
          </Select>
        </FilterField>
      </FilterBar>
      {error && <ErrorBanner text={error} onRetry={load} />}
      {items === null ? <SkeletonRows rows={4} /> : !visible.length ? (
        <EmptyState icon={Users} title={items.length ? 'No publishers match' : 'No publishers yet'} text={items.length ? 'Try another filter.' : 'Publishers are added automatically when their first click arrives, or you can add them here.'} />
      ) : (
        <TableCard>
          <thead className="border-b border-slate-100"><tr>
            <th className={th}>Publisher</th><th className={th}>Network</th><th className={th}>Status</th><th className={thRight}>Clicks</th><th className={thRight}>Bookings</th><th className={thRight}>Conv. rate</th><th className={thRight}>Revenue</th><th className={thRight}>Commission</th><th className={`${th} text-right`}>Actions</th>
          </tr></thead>
          <tbody>
            {visible.map(p => (
              <tr key={p.id} className="cursor-pointer border-t border-slate-100 first:border-0 hover:bg-sky-50/40" onClick={() => setEditing(p)}>
                <td className={td}>
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-400"><span className="font-mono">ID {p.externalPublisherId}</span>{p.website && <><Globe className="h-3 w-3" /><span className="max-w-[160px] truncate">{p.website.replace(/^https?:\/\/(www\.)?/, '')}</span></>}</p>
                </td>
                <td className={td}>{p.networkName || networks.find(n => n.id === p.networkId)?.name || '—'}</td>
                <td className={td}><Badge tone={PUBLISHER_STATUS_TONE[p.status] || 'grey'} dot>{humanize(p.status)}</Badge></td>
                <td className={tdRight}>{new Intl.NumberFormat('en-GB').format(p.stats?.clicks || 0)}</td>
                <td className={tdRight}>{new Intl.NumberFormat('en-GB').format(p.stats?.bookings || 0)}</td>
                <td className={tdRight}>
                  <span className="inline-flex items-center gap-2">
                    <span className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-slate-100 lg:inline-block"><span className="block h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, p.stats?.conversionRate || 0)}%` }} /></span>
                    {pct(p.stats?.conversionRate)}
                  </span>
                </td>
                <td className={`${tdRight} font-semibold text-slate-900`}>{money(p.stats?.revenue)}</td>
                <td className={tdRight}>{money(p.stats?.commission)}</td>
                <td className={td} onClick={e => e.stopPropagation()}>
                  <div className="flex justify-end gap-0.5">
                    <button className={iconBtn} onClick={() => setEditing(p)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button className={`${iconBtn} hover:bg-rose-50 hover:text-rose-600`} onClick={() => del(p)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
      <AnimatePresence>
        {editing && <PublisherDrawer key="pub" publisher={editing === 'new' ? null : editing} defaultNetworkId={Number(networkId) || networks[0]?.id || 0} onClose={() => setEditing(null)}
          onSaved={p => { setItems(l => (l || []).some(x => x.id === p.id) ? (l || []).map(x => (x.id === p.id ? { ...x, ...p } : x)) : [p, ...(l || [])]); setEditing(null); notify('Publisher saved'); }} />}
      </AnimatePresence>
      {confirmEl}
    </div>
  );
};

export default PublishersTab;
