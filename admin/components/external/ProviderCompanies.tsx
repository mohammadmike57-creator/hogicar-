import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Search from 'lucide-react/dist/esm/icons/search';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Percent from 'lucide-react/dist/esm/icons/percent';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import SearchX from 'lucide-react/dist/esm/icons/search-x';
import Info from 'lucide-react/dist/esm/icons/info';
import { adminFetch } from '../../../lib/adminApi';
import { Drawer, Field, Toggle, Segmented, Spinner, ErrorBanner, inputCls, num } from '../commercialUi';
import { EmptyState, SupplierSkeletons } from './media';

export interface FeedCompany {
  id: number;
  vendorCode: string;
  name: string;
  providers: string[];
  logoUrl?: string;
  markupPercent?: number | null;
  contactEmail?: string;
  active: boolean;
  excludedCarModels?: string;
  locationCount: number;
  locationEmails: { locationCode: string; contactEmail: string }[];
}

type ProviderKey = 'ALL' | 'RENTALCARS' | 'CHEAPTICKETS';

export const PROVIDER_LABEL: Record<string, string> = { RENTALCARS: 'Rentalcars', CHEAPTICKETS: 'CheapTickets' };
const PROVIDER_STYLE: Record<string, string> = {
  RENTALCARS: 'bg-sky-50 text-[#007ac2] ring-sky-200',
  CHEAPTICKETS: 'bg-amber-50 text-amber-800 ring-amber-200',
};
const DEFAULT_INBOX = 'booking@hogicar.com';

export const ProviderBadge: React.FC<{ provider: string }> = ({ provider }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${PROVIDER_STYLE[provider] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
    {PROVIDER_LABEL[provider] || provider}
  </span>
);

const Logo: React.FC<{ src?: string; name: string }> = ({ src, name }) => {
  const [broken, setBroken] = useState(false);
  return (
    <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 ring-1 ring-slate-200">
      {src && !broken
        ? <img src={src} alt={name} className="max-h-full max-w-full object-contain" onError={() => setBroken(true)} />
        : <span className="text-sm font-bold text-slate-500">{name.slice(0, 2).toUpperCase()}</span>}
    </span>
  );
};

/** The rental companies from the car feeds, grouped by feed, with the details the admin can change. */
export const ProviderCompanies: React.FC<{ notify: (text: string, tone?: 'ok' | 'err') => void }> = ({ notify }) => {
  const [companies, setCompanies] = useState<FeedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ProviderKey>('RENTALCARS');
  const [term, setTerm] = useState('');
  const [editing, setEditing] = useState<FeedCompany | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch('/api/admin/external-suppliers/companies');
      setCompanies(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Could not load the companies. ' + (e instanceof Error ? e.message : ''));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    ALL: companies.length,
    RENTALCARS: companies.filter(c => c.providers.includes('RENTALCARS')).length,
    CHEAPTICKETS: companies.filter(c => c.providers.includes('CHEAPTICKETS')).length,
  }), [companies]);

  const shown = useMemo(() => {
    const t = term.trim().toLowerCase();
    return companies
      .filter(c => provider === 'ALL' || c.providers.includes(provider))
      .filter(c => !t || c.name.toLowerCase().includes(t) || (c.contactEmail || '').toLowerCase().includes(t) || c.vendorCode.toLowerCase().includes(t));
  }, [companies, provider, term]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved: FeedCompany = await adminFetch(`/api/admin/external-suppliers/companies/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editing.name,
          contactEmail: editing.contactEmail || '',
          markupPercent: editing.markupPercent ?? 0,
          active: editing.active,
          logoUrl: editing.logoUrl || '',
          excludedCarModels: editing.excludedCarModels || '',
        }),
      });
      setCompanies(prev => prev.map(c => c.id === saved.id ? saved : c));
      notify(`${saved.name} saved`);
      setEditing(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const set = (patch: Partial<FeedCompany>) => setEditing(prev => prev ? { ...prev, ...patch } : prev);

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">Companies by API provider</h3>
          <p className="mt-0.5 text-sm text-slate-500">The rental companies each car feed brings. Change a company's name, markup, reservations email or whether it is shown.</p>
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" placeholder="Find a company or email…" aria-label="Find a company" className={`${inputCls} pl-10`} value={term} onChange={e => setTerm(e.target.value)} />
        </div>
      </section>

      <Segmented<ProviderKey>
        value={provider}
        onChange={setProvider}
        layoutId="feed-provider"
        items={[
          { key: 'RENTALCARS', label: 'Rentalcars', count: counts.RENTALCARS },
          { key: 'CHEAPTICKETS', label: 'CheapTickets (off)', count: counts.CHEAPTICKETS },
          { key: 'ALL', label: 'All companies', count: counts.ALL },
        ]}
      />

      {error && !loading && <ErrorBanner text={error} onRetry={load} />}

      {loading ? <SupplierSkeletons /> : shown.length === 0 ? (
        term
          ? <EmptyState icon={SearchX} title="No matching companies" text={`Nothing matches “${term}”.`} action={{ label: 'Clear search', onClick: () => setTerm(''), icon: SearchX }} />
          : <EmptyState icon={Building2} title="No companies yet" text="Companies appear here the first time customers see their cars in a search." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {shown.map(c => {
            const inbox = c.contactEmail || DEFAULT_INBOX;
            const isDefault = inbox.toLowerCase() === DEFAULT_INBOX;
            return (
              <article key={c.id} className={`flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 ${c.active ? '' : 'opacity-70'}`}>
                <div className="flex items-start gap-3.5">
                  <Logo src={c.logoUrl} name={c.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-slate-900">{c.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {c.providers.map(p => <ProviderBadge key={p} provider={p} />)}
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${c.active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}`}>
                        {c.active ? 'Shown' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                </div>
                <dl className="mt-4 space-y-2.5 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <dt className="text-xs text-slate-500">Reservations are sent to</dt>
                      <dd className="truncate font-medium text-slate-900">{inbox}{isDefault && <span className="ml-1.5 text-xs font-normal text-slate-500">(Hogicar's inbox)</span>}</dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Percent className="h-4 w-4 shrink-0 text-slate-400" />
                    <dt className="text-slate-500">Markup</dt>
                    <dd className="ml-auto font-semibold tabular-nums text-slate-900">{Number(c.markupPercent ?? 0)}%</dd>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    <dt className="text-slate-500">Locations</dt>
                    <dd className="ml-auto tabular-nums text-slate-900">{num(c.locationCount)}{c.locationEmails.length > 0 && <span className="text-xs text-slate-500"> · {c.locationEmails.length} with own email</span>}</dd>
                  </div>
                </dl>
                <button onClick={() => { setSaveError(null); setEditing(c); }} className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
                  <Pencil className="h-4 w-4" /> Edit details
                </button>
              </article>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <Drawer
            key={`company-${editing.id}`}
            eyebrow={editing.providers.map(p => PROVIDER_LABEL[p] || p).join(' · ')}
            title={editing.name || 'Company'}
            onClose={() => setEditing(null)}
            busy={saving}
            footer={
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setEditing(null)} disabled={saving} className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" form="company-form" disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#007ac2] px-5 text-sm font-semibold text-white hover:bg-[#00679f] disabled:opacity-60">
                  {saving && <Spinner light />} Save changes
                </button>
              </div>
            }
          >
            <form id="company-form" onSubmit={save} className="space-y-4">
              {saveError && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">{saveError}</p>}
              <section className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <Field label="Company name" hint="Shown to customers on every car from this company.">
                  <input className={inputCls} value={editing.name} onChange={e => set({ name: e.target.value })} required maxLength={120} />
                </Field>
                <Field label="Reservations email" hint={`New bookings and booking changes for this company are emailed here. Leave empty to use ${DEFAULT_INBOX}.`}>
                  <input type="email" className={inputCls} value={editing.contactEmail || ''} placeholder={DEFAULT_INBOX} onChange={e => set({ contactEmail: e.target.value })} />
                </Field>
                <Field label="Markup (%)" hint="Added to the company's price. Customers pay the markup online and the rest at the desk.">
                  <input type="number" min={0} max={100} step="0.01" className={inputCls} value={editing.markupPercent ?? 0} onChange={e => set({ markupPercent: e.target.value === '' ? 0 : Number(e.target.value) })} />
                </Field>
                <Field label="Logo address" hint="An https:// link to the company's logo.">
                  <input className={inputCls} value={editing.logoUrl || ''} onChange={e => set({ logoUrl: e.target.value })} placeholder="https://" />
                </Field>
              </section>

              <Toggle checked={editing.active} onChange={v => set({ active: v })} label="Show this company's cars" hint="When off, its cars are left out of every search." />

              <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <Field label="Hidden car models" hint="One per line (for example Toyota Camry). These models from this company are not shown.">
                  <textarea rows={3} className={`${inputCls} h-auto py-2.5`} value={editing.excludedCarModels || ''} onChange={e => set({ excludedCarModels: e.target.value })} />
                </Field>
              </section>

              <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">Locations with their own email</p>
                {editing.locationEmails.length === 0 ? (
                  <p className="mt-1 text-sm text-slate-500">None: every location uses the reservations email above.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-slate-100">
                    {editing.locationEmails.map(l => (
                      <li key={l.locationCode} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">{l.locationCode}</span>
                        <span className="truncate text-slate-900">{l.contactEmail}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> A location's own email (set under "By location") is used first; otherwise the reservations email above.
                </p>
              </section>
              <p className="text-xs text-slate-400">Code: <span className="font-mono">{editing.vendorCode}</span></p>
            </form>
          </Drawer>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProviderCompanies;
