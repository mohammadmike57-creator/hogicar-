import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Info from 'lucide-react/dist/esm/icons/info';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import {
  affiliateNetworksApi as api, apiError, type TrackingLink, type TrackingLinkInput, type Program, type Publisher, CAMPAIGN_TYPES, type CampaignType,
} from '../../affiliateNetworksApi';
import { Drawer, Field, ErrorBanner, CopyButton } from '../commercialUi';
import { useAffiliateNetworks } from './context';
import {
  Badge, Callout, EmptyState, FilterField, Panel, SaveFooter, Select, SkeletonRows, TableCard, btnPrimary, iconBtn, inputCls, humanize,
  th, thRight, td, tdRight, useConfirm, pickInto,
} from './ui';

const empty = (networkId: number): TrackingLinkInput => ({
  networkId, programId: null, publisherId: null, name: '', campaign: '', campaignType: 'GENERAL', creative: '', subId: '', subId2: '', subId3: '',
  customReference: '', destinationUrl: 'https://www.hogicar.com/', status: 'ACTIVE', startDate: null, endDate: null,
});

export const UrlBox: React.FC<{ label: string; url: string | null | undefined; note?: string | null; onCopied?: () => void; tone?: 'primary' | 'plain' }> = ({ label, url, note, onCopied, tone = 'plain' }) => (
  <div>
    <p className="mb-1 text-xs font-semibold text-slate-500">{label}</p>
    {url ? (
      <div className={`flex items-start gap-2 rounded-xl p-2 pl-3 ring-1 ${tone === 'primary' ? 'bg-[#007ac2]/[0.05] ring-[#007ac2]/30' : 'bg-slate-50 ring-slate-200'}`}>
        <code className="min-w-0 flex-1 break-all py-1 font-mono text-xs leading-relaxed text-slate-800">{url}</code>
        <CopyButton text={url} label="Copy" className="h-8 shrink-0 bg-white px-2.5 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100" onCopied={onCopied} />
      </div>
    ) : <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{note || 'Not available for this network.'}</p>}
  </div>
);

const LinkDrawer: React.FC<{ link: TrackingLink | null; defaultNetworkId: number; onClose: () => void; onSaved: (l: TrackingLink) => void }> = ({ link: initial, defaultNetworkId, onClose, onSaved }) => {
  const { networks, notify } = useAffiliateNetworks();
  const [link, setLink] = React.useState<TrackingLink | null>(initial);
  const [d, setD] = React.useState<TrackingLinkInput>(() => (initial ? pickInto(empty(initial.networkId), initial) : empty(defaultNetworkId)));
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [publishers, setPublishers] = React.useState<Publisher[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (p: Partial<TrackingLinkInput>) => { setD(x => ({ ...x, ...p })); setError(null); };
  React.useEffect(() => {
    if (!d.networkId) return;
    api.getPrograms(d.networkId).then(setPrograms).catch(() => setPrograms([]));
    api.getPublishers(d.networkId).then(setPublishers).catch(() => setPublishers([]));
  }, [d.networkId]);

  const save = async () => {
    if (!d.networkId) return setError('Choose a network.');
    if (!d.name.trim()) return setError('Give the link a name.');
    try {
      const u = new URL(d.destinationUrl);
      if (!/^https?:$/.test(u.protocol)) throw new Error();
    } catch { return setError('Destination must be a full URL, e.g. https://www.hogicar.com/search?pickup=AMM'); }
    setSaving(true);
    try {
      const saved = link ? await api.updateLink(link.id, d) : await api.createLink(d);
      setLink(saved);
      onSaved(saved);
      notify(link ? 'Tracking link updated' : 'Tracking link created');
    } catch (e) { setError(apiError(e, 'Could not save the tracking link.')); }
    finally { setSaving(false); }
  };

  return (
    <Drawer eyebrow={link ? 'Tracking link' : 'New tracking link'} title={link?.name || d.name || 'Create a tracking link'} onClose={onClose} busy={saving} width="max-w-[720px]"
      footer={<SaveFooter error={error} saving={saving} onCancel={onClose} onSave={save} label={link ? 'Save & regenerate' : 'Generate link'} />}>
      <div className="space-y-4">
        {link && (
          <Panel title="Generated links">
            <UrlBox label="Tracking URL – give this to the publisher" url={link.trackingUrl} note={link.trackingUrlNote} tone="primary" onCopied={() => notify('Tracking URL copied')} />
            <UrlBox label="Landing URL – where visitors arrive on HogiCar" url={link.landingUrl} onCopied={() => notify('Landing URL copied')} />
            <p className="text-xs text-slate-500">{new Intl.NumberFormat('en-GB').format(link.clicks)} clicks · {new Intl.NumberFormat('en-GB').format(link.bookings)} bookings</p>
          </Panel>
        )}
        <Panel title="Who & where">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Network">
              <Select value={d.networkId || ''} onChange={e => set({ networkId: Number(e.target.value), programId: null, publisherId: null })}>
                <option value="">Choose…</option>
                {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </Select>
            </Field>
            <Field label="Program">
              <Select value={d.programId ?? ''} onChange={e => set({ programId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">Default</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label="Publisher">
              <Select value={d.publisherId ?? ''} onChange={e => set({ publisherId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">Any publisher</option>
                {publishers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Destination on HogiCar" hint="Search deep links work best – see Feeds & live search for the format.">
            <input className={`${inputCls} font-mono text-sm`} value={d.destinationUrl} onChange={e => set({ destinationUrl: e.target.value.trim() })} placeholder="https://www.hogicar.com/search?pickup=AMM&dropoff=AMM" />
          </Field>
        </Panel>
        <Panel title="Campaign">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Link name"><input className={inputCls} value={d.name} onChange={e => set({ name: e.target.value })} placeholder="Amman airport summer" /></Field>
            <Field label="Campaign type">
              <Select value={d.campaignType} onChange={e => set({ campaignType: e.target.value as CampaignType })}>
                {CAMPAIGN_TYPES.map(c => <option key={c} value={c}>{humanize(c)}</option>)}
              </Select>
            </Field>
            <Field label="Campaign"><input className={`${inputCls} font-mono`} value={d.campaign} onChange={e => set({ campaign: e.target.value.replace(/\s/g, '_') })} placeholder="summer26" /></Field>
            <Field label="Creative"><input className={`${inputCls} font-mono`} value={d.creative} onChange={e => set({ creative: e.target.value })} placeholder="banner-728" /></Field>
            <Field label="Sub ID"><input className={`${inputCls} font-mono`} value={d.subId} onChange={e => set({ subId: e.target.value })} /></Field>
            <Field label="Sub ID 2"><input className={`${inputCls} font-mono`} value={d.subId2} onChange={e => set({ subId2: e.target.value })} /></Field>
            <Field label="Sub ID 3"><input className={`${inputCls} font-mono`} value={d.subId3} onChange={e => set({ subId3: e.target.value })} /></Field>
            <Field label="Custom reference"><input className={`${inputCls} font-mono`} value={d.customReference} onChange={e => set({ customReference: e.target.value })} /></Field>
            <Field label="Start date"><input type="date" className={inputCls} value={d.startDate || ''} onChange={e => set({ startDate: e.target.value || null })} /></Field>
            <Field label="End date"><input type="date" className={inputCls} value={d.endDate || ''} onChange={e => set({ endDate: e.target.value || null })} /></Field>
            <Field label="Status">
              <Select value={d.status} onChange={e => set({ status: e.target.value })}>{['ACTIVE', 'PAUSED', 'ARCHIVED'].map(s => <option key={s} value={s}>{humanize(s)}</option>)}</Select>
            </Field>
          </div>
        </Panel>
        {!link && <Callout tone="info" icon={Sparkles}>The tracking URL is generated by the network’s connector when you save.</Callout>}
      </div>
    </Drawer>
  );
};

const TrackingLinksTab: React.FC = () => {
  const { networks, notify, params } = useAffiliateNetworks();
  const [networkId, setNetworkId] = React.useState(params.networkId ? String(params.networkId) : '');
  const [items, setItems] = React.useState<TrackingLink[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<TrackingLink | null | 'new'>(null);
  const [confirm, confirmEl] = useConfirm();

  const load = React.useCallback(async () => {
    setItems(null); setError(null);
    try { setItems(await api.getLinks(networkId || undefined)); }
    catch (e) { setError(apiError(e, 'Could not load tracking links.')); setItems([]); }
  }, [networkId]);
  React.useEffect(() => { load(); }, [load]);

  const del = async (l: TrackingLink) => {
    if (!(await confirm({ title: `Delete “${l.name}”?`, message: 'Clicks on this link still reach HogiCar but are no longer grouped under this campaign.', confirmLabel: 'Delete', danger: true }))) return;
    try { await api.deleteLink(l.id); setItems(x => (x || []).filter(i => i.id !== l.id)); notify('Tracking link deleted'); }
    catch (e) { notify(apiError(e, 'Could not delete the link.'), 'err'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Tracking links & campaigns</h3>
          <p className="text-sm text-slate-500">Network tracking URLs for publishers, with campaign, creative and sub-ID tagging.</p>
        </div>
        <div className="flex items-end gap-2">
          <FilterField label="Network" className="w-44">
            <Select compact value={networkId} onChange={e => setNetworkId(e.target.value)}>
              <option value="">All networks</option>
              {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </Select>
          </FilterField>
          <button className={`${btnPrimary} shrink-0`} onClick={() => setEditing('new')} disabled={!networks.length}><Plus className="h-4 w-4" /> New link</button>
        </div>
      </div>
      {error && <ErrorBanner text={error} onRetry={load} />}
      {items === null ? <SkeletonRows rows={4} /> : !items.length ? (
        <EmptyState icon={Link2} title="No tracking links yet" text="Create a link for a publisher or campaign – the connector builds the network tracking URL for you."
          action={networks.length ? <button className={btnPrimary} onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> New link</button> : undefined} />
      ) : (
        <TableCard>
          <thead className="border-b border-slate-100"><tr>
            <th className={th}>Link</th><th className={th}>Network</th><th className={th}>Publisher</th><th className={th}>Type</th><th className={thRight}>Clicks</th><th className={thRight}>Bookings</th><th className={th}>Status</th><th className={th}>Tracking URL</th><th className={`${th} text-right`}>Actions</th>
          </tr></thead>
          <tbody>
            {items.map(l => (
              <tr key={l.id} className="cursor-pointer border-t border-slate-100 first:border-0 hover:bg-sky-50/40" onClick={() => setEditing(l)}>
                <td className={td}><p className="font-semibold text-slate-900">{l.name}</p><p className="font-mono text-[11px] text-slate-400">{l.campaign || '—'}{l.creative && ` · ${l.creative}`}</p></td>
                <td className={td}>{l.networkName || networks.find(n => n.id === l.networkId)?.name || '—'}</td>
                <td className={td}>{l.publisherName || <span className="text-slate-400">Any</span>}</td>
                <td className={td}><Badge tone="sky">{humanize(l.campaignType)}</Badge></td>
                <td className={tdRight}>{new Intl.NumberFormat('en-GB').format(l.clicks || 0)}</td>
                <td className={tdRight}>{new Intl.NumberFormat('en-GB').format(l.bookings || 0)}</td>
                <td className={td}><Badge tone={l.status === 'ACTIVE' ? 'green' : 'grey'} dot>{humanize(l.status)}</Badge></td>
                <td className={td} onClick={e => e.stopPropagation()}>
                  {l.trackingUrl
                    ? <CopyButton text={l.trackingUrl} label="Copy" className="h-8 bg-white px-2.5 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50" onCopied={() => notify('Tracking URL copied')} />
                    : <span className="text-xs text-amber-700" title={l.trackingUrlNote || undefined}>Not generated</span>}
                </td>
                <td className={td} onClick={e => e.stopPropagation()}>
                  <div className="flex justify-end gap-0.5">
                    <button className={iconBtn} onClick={() => setEditing(l)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button className={`${iconBtn} hover:bg-rose-50 hover:text-rose-600`} onClick={() => del(l)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
      <AnimatePresence>
        {editing && <LinkDrawer key="ld" link={editing === 'new' ? null : editing} defaultNetworkId={Number(networkId) || networks[0]?.id || 0} onClose={() => setEditing(null)}
          onSaved={l => setItems(x => ((x || []).some(i => i.id === l.id) ? (x || []).map(i => (i.id === l.id ? l : i)) : [l, ...(x || [])]))} />}
      </AnimatePresence>
      {confirmEl}
    </div>
  );
};

export default TrackingLinksTab;
