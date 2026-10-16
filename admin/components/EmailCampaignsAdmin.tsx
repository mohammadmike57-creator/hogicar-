import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import Mails from 'lucide-react/dist/esm/icons/mails';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Send from 'lucide-react/dist/esm/icons/send';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Users from 'lucide-react/dist/esm/icons/users';
import UserRound from 'lucide-react/dist/esm/icons/user-round';
import UserCheck from 'lucide-react/dist/esm/icons/user-check';
import UserX from 'lucide-react/dist/esm/icons/user-x';
import Ticket from 'lucide-react/dist/esm/icons/ticket';
import Search from 'lucide-react/dist/esm/icons/search';
import Monitor from 'lucide-react/dist/esm/icons/monitor';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Zap from 'lucide-react/dist/esm/icons/zap';
import CalendarClock from 'lucide-react/dist/esm/icons/calendar-clock';
import MailCheck from 'lucide-react/dist/esm/icons/mail-check';
import Info from 'lucide-react/dist/esm/icons/info';
import { adminAxios, API_BASE_URL } from '../../api';
import { Hero, heroPrimary, Drawer, ErrorBanner, Spinner, Toast, useToast, errorOf, num, ago, fmtDate, inputCls, Field, Toggle, Segmented } from './commercialUi';

const BASE = `${API_BASE_URL}/api/admin/marketing-emails`;

type Audience = 'ALL' | 'BOOKED' | 'NOT_BOOKED' | 'PAYMENT' | 'MEMBERS' | 'SELECTED';

type TemplateKey = 'EDITORIAL' | 'FLASH' | 'LETTER' | 'DESTINATION' | 'REWARDS' | 'EID_FITR' | 'EID_ADHA' | 'CHRISTMAS' | 'NEW_YEAR' | 'EASTER' | 'BLACK_FRIDAY';

/** Ready-made emails: a design plus suggested wording. Every text can still be changed. */
const TEMPLATES: { key: TemplateKey; name: string; description: string; swatch: string; holiday?: boolean; preset: Partial<Campaign> }[] = [
  { key: 'EDITORIAL', name: 'Classic offer', description: 'Photo header, navy headline and a ticket-style coupon.', swatch: 'from-[#0b2545] to-[#123c69]',
    preset: { subject: '', eyebrow: '', headline: '', intro: '', ctaLabel: '', showSteps: true, showRewards: true } },
  { key: 'FLASH', name: 'Flash sale', description: 'Bold orange header with the discount in huge type and the end date.', swatch: 'from-[#F57C00] to-[#ff9a3c]',
    preset: { subject: '⚡ {firstName}, flash sale: save with code {code}', eyebrow: 'Flash sale', headline: '',
      intro: 'For a short time only, save on your car hire with code {code}. Book now while the offer lasts.', ctaLabel: 'Grab the deal', showSteps: false, showRewards: false } },
  { key: 'LETTER', name: 'Personal letter', description: 'A warm, simple note from the HogiCar team. No photo.', swatch: 'from-[#f8fafc] to-[#e2e8f0]',
    preset: { subject: '{firstName}, a little thank-you from HogiCar', eyebrow: '', headline: '',
      intro: 'Thank you for choosing HogiCar. As a small thank-you, here is a code that takes money off your next car hire.', ctaLabel: 'Find my next car', showSteps: false, showRewards: false } },
  { key: 'DESTINATION', name: 'Destination', description: 'Big photo with the headline on top. Great with your own destination photo.', swatch: 'from-[#0f766e] to-[#0b2545]',
    preset: { subject: '{firstName}, your next road trip starts here', eyebrow: 'Your next road trip', headline: '',
      intro: 'Pick up your car at {place} and explore at your own pace. Use code {code} to pay less.', ctaLabel: 'Plan my trip', showSteps: true, showRewards: true } },
  { key: 'REWARDS', name: 'Rewards', description: 'Navy and gold, puts HogiCar Rewards and welcome points first.', swatch: 'from-[#0b2545] to-[#E8B04B]',
    preset: { subject: '{firstName}, earn points on every rental with HogiCar Rewards', eyebrow: 'HogiCar Rewards', headline: '',
      intro: 'Create a free account and earn points every time you rent. Use code {code} on your next booking too.', ctaLabel: 'Join and book', showSteps: false, showRewards: true } },
  { key: 'EID_FITR', holiday: true, name: 'Eid al-Fitr', description: 'Emerald and gold with a crescent and “Eid Mubarak” in English and Arabic.', swatch: 'from-[#064E3B] to-[#0F766E]',
    preset: { subject: 'Eid Mubarak, {firstName}! Save on your Eid car hire with code {code}', eyebrow: 'Eid al-Fitr offer', headline: '',
      intro: 'Wishing you and your family a blessed Eid. Visit loved ones and enjoy the holiday with a car of your own, and save with code {code}.', ctaLabel: 'Book my Eid car', showSteps: false, showRewards: true } },
  { key: 'EID_ADHA', holiday: true, name: 'Eid al-Adha', description: 'Deep indigo and gold with a crescent and Arabic greeting.', swatch: 'from-[#1E1B4B] to-[#3730A3]',
    preset: { subject: 'Eid al-Adha Mubarak, {firstName}! A gift for your holiday travel', eyebrow: 'Eid al-Adha offer', headline: '',
      intro: 'Eid al-Adha Mubarak from all of us at HogiCar. Travel to your family in comfort this Eid and save with code {code}.', ctaLabel: 'Book my Eid car', showSteps: false, showRewards: true } },
  { key: 'CHRISTMAS', holiday: true, name: 'Christmas', description: 'Festive red with snowflakes, a green band and “Merry Christmas”.', swatch: 'from-[#7F1D1D] to-[#B91C1C]',
    preset: { subject: 'Merry Christmas, {firstName}! Your festive car hire offer is here', eyebrow: 'Christmas offer', headline: '',
      intro: 'Going home for the holidays or exploring somewhere new? Use code {code} and save on your Christmas car hire.', ctaLabel: 'Book my Christmas car', showSteps: false, showRewards: true } },
  { key: 'NEW_YEAR', holiday: true, name: 'New Year', description: 'Midnight blue with gold sparkles and “Happy New Year”.', swatch: 'from-[#0B1020] to-[#1E293B]',
    preset: { subject: 'Happy New Year, {firstName}! Start the year with code {code}', eyebrow: 'New Year offer', headline: '',
      intro: 'Thank you for travelling with us this year. Start the new one on the road and save with code {code}.', ctaLabel: 'Plan my first trip', showSteps: false, showRewards: true } },
  { key: 'EASTER', holiday: true, name: 'Easter', description: 'Soft spring pastels with flowers and “Happy Easter”.', swatch: 'from-[#F5F3FF] to-[#ECFDF5]',
    preset: { subject: 'Happy Easter, {firstName}! A spring offer on your car hire', eyebrow: 'Easter offer', headline: '',
      intro: 'Spring is here. Enjoy an Easter getaway with a car of your own and save with code {code}.', ctaLabel: 'Book my spring trip', showSteps: false, showRewards: true } },
  { key: 'BLACK_FRIDAY', holiday: true, name: 'Black Friday', description: 'Black and yellow, big and bold, with the end date.', swatch: 'from-[#000000] to-[#3f3f46]',
    preset: { subject: 'Black Friday: {firstName}, save on your car hire with code {code}', eyebrow: 'Black Friday offer', headline: '',
      intro: 'Our Black Friday deal is here. Use code {code} and save on your next car hire. Book before the offer ends.', ctaLabel: 'Get the deal', showSteps: false, showRewards: false } },
];
const templateName = (k?: string | null) => TEMPLATES.find(t => t.key === k)?.name || 'Classic offer';

type Campaign = {
  id?: number; name: string; template?: TemplateKey; subject?: string | null; eyebrow?: string | null; headline?: string | null; intro?: string | null;
  ctaLabel?: string | null; ctaUrl?: string | null; heroImageUrl?: string | null; promoCodeIds?: string | null; bannerIds?: string | null;
  showSteps?: boolean; showRewards?: boolean; audience: Audience; locationCodes?: string | null; selectedEmails?: string | null;
  /** Greet by name: only possible when the email goes to one person. */
  showName?: boolean | null; recipientName?: string | null;
  status?: 'DRAFT' | 'SENDING' | 'SENT'; timesSent?: number; totalSent?: number; totalFailed?: number; lastRecipients?: number | null;
  lastSentAt?: string | null; createdAt?: string;
};

type Contact = {
  id: number; email: string; firstName?: string | null; source?: string | null; booked?: boolean; member?: boolean;
  pickupCode?: string | null; pickupName?: string | null; lastActivityAt?: string | null; lastSentAt?: string | null;
  sentCount?: number | null; unsubscribedAt?: string | null;
};

type CodeOption = { id: number; code: string; discountType: string; discount?: number; amount?: number; description?: string | null; endDate?: string | null; minDays?: number | null; locationCodes?: string | null; state: string };
type BannerOption = { id: number; name: string; title: string; eyebrow?: string | null; live: boolean };

type Summary = {
  settings: { autoEnabled: boolean; firstDelayHours: number; repeatDays: number; autoCampaignId?: number | null };
  contacts: number; subscribed: number; unsubscribed: number; booked: number; notBooked: number; payment: number; members: number; emailed: number;
  liveOffers: string[];
};

const AUDIENCES: { key: Audience; label: string; hint: string; count: (s: Summary | null) => number | null }[] = [
  { key: 'ALL', label: 'Everyone', hint: 'Every subscribed address.', count: s => s?.subscribed ?? null },
  { key: 'BOOKED', label: 'Customers who booked', hint: 'Booked at least one car.', count: s => s?.booked ?? null },
  { key: 'NOT_BOOKED', label: 'Haven’t booked yet', hint: 'Gave their email but never booked.', count: s => s?.notBooked ?? null },
  { key: 'PAYMENT', label: 'Reached payment, didn’t pay', hint: 'Got to the payment page and left.', count: s => s?.payment ?? null },
  { key: 'MEMBERS', label: 'Rewards members', hint: 'Have a HogiCar account.', count: s => s?.members ?? null },
  { key: 'SELECTED', label: 'Chosen addresses', hint: 'Only the emails you list.', count: () => null },
];
const audienceLabel = (a: string) => AUDIENCES.find(x => x.key === a)?.label || a;

const SOURCE: Record<string, { label: string; cls: string }> = {
  BOOKED: { label: 'Booked', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  PAYMENT: { label: 'Reached payment', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  CHECKOUT: { label: 'Started booking', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  ACCOUNT: { label: 'Account', cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  ADDED: { label: 'Added by you', cls: 'bg-slate-100 text-slate-700 ring-slate-200' },
};

const CODE_STATE: Record<string, { label: string; cls: string }> = {
  LIVE: { label: 'Live', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  SCHEDULED: { label: 'Scheduled', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  PAUSED: { label: 'Paused', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  EXPIRED: { label: 'Expired', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  USED_UP: { label: 'Used up', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
};

const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  SENDING: { label: 'Sending…', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  SENT: { label: 'Sent', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
};

const Pill: React.FC<{ cls: string; children: React.ReactNode }> = ({ cls, children }) => (
  <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${cls}`}>{children}</span>
);

const codeLabel = (c: CodeOption) => c.discountType === 'FIXED' ? `USD ${Number(c.amount || 0)} off` : `${Math.round(Number(c.discount || 0) * 1000) / 10}% off`;
const idsOf = (csv?: string | null) => (csv || '').split(',').map(s => Number(s.trim())).filter(n => n > 0);

const EMPTY: Campaign = {
  name: '', template: 'EDITORIAL', subject: '', eyebrow: '', headline: '', intro: '', ctaLabel: '', ctaUrl: '', heroImageUrl: '',
  promoCodeIds: '', bannerIds: '', showSteps: true, showRewards: true, audience: 'ALL', locationCodes: '', selectedEmails: '',
};

const EmailCampaignsAdmin: React.FC = () => {
  const [tab, setTab] = React.useState<'campaigns' | 'contacts' | 'auto'>('campaigns');
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [items, setItems] = React.useState<Campaign[]>([]);
  const [options, setOptions] = React.useState<{ codes: CodeOption[]; banners: BannerOption[] }>({ codes: [], banners: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [editing, setEditing] = React.useState<Campaign | null>(null);
  const [confirm, setConfirm] = React.useState<Campaign | null>(null);
  const { toast, notify } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, c, o] = await Promise.all([adminAxios.get(BASE), adminAxios.get(`${BASE}/campaigns`), adminAxios.get(`${BASE}/options`)]);
      setSummary(s.data); setItems(c.data); setOptions(o.data);
    } catch (e) { setError(errorOf(e, 'Couldn’t load email campaigns.')); }
    finally { setLoading(false); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  // While a campaign is sending, refresh until it's done.
  const sending = items.some(c => c.status === 'SENDING');
  React.useEffect(() => {
    if (!sending) return;
    const t = window.setInterval(async () => {
      try { setItems((await adminAxios.get(`${BASE}/campaigns`)).data); } catch { /* next tick */ }
    }, 4000);
    return () => window.clearInterval(t);
  }, [sending]);

  const remove = async (c: Campaign) => {
    if (!window.confirm(`Delete “${c.name}”? This can’t be undone.`)) return;
    try { await adminAxios.delete(`${BASE}/campaigns/${c.id}`); notify('Campaign deleted'); load(); }
    catch (e) { notify(errorOf(e, 'Couldn’t delete the campaign.'), 'err'); }
  };

  const duplicate = (c: Campaign) => {
    const { id, status, timesSent, totalSent, totalFailed, lastRecipients, lastSentAt, createdAt, ...rest } = c;
    setEditing({ ...EMPTY, ...rest, name: `${c.name} (copy)` });
  };

  const newFor = (emails: string[]) => {
    setTab('campaigns');
    setEditing({ ...EMPTY, name: `Offer for ${emails.length} ${emails.length === 1 ? 'person' : 'people'}`, audience: 'SELECTED', selectedEmails: emails.join('\n') });
  };

  return (
    <div className="space-y-5">
      <Hero eyebrow="Marketing" eyebrowIcon={Mails} title="Email campaigns"
        subtitle="Send your discounts and promotions to the people who gave their email on HogiCar. Choose the codes, the message and who gets it, then send as often as you like."
        loading={loading && !summary}
        actions={<button className={heroPrimary} onClick={() => setEditing({ ...EMPTY })}><Plus className="h-4 w-4" /> New campaign</button>}
        kpis={[
          { label: 'Subscribed', value: num(summary?.subscribed), Icon: Users, note: `${num(summary?.unsubscribed)} unsubscribed` },
          { label: 'Booked', value: num(summary?.booked), Icon: UserCheck },
          { label: 'Haven’t booked', value: num(summary?.notBooked), Icon: UserX, note: `${num(summary?.payment)} reached payment` },
          { label: 'Live promo codes', value: num(summary?.liveOffers?.length), Icon: Ticket, note: summary?.liveOffers?.join(', ') || 'None live' },
        ]} />

      {error && <ErrorBanner text={error} onRetry={load} />}

      <Segmented layoutId="mkt-tab" value={tab} onChange={setTab} items={[
        { key: 'campaigns', label: 'Campaigns', count: items.length },
        { key: 'contacts', label: 'Contacts', count: summary?.contacts },
        { key: 'auto', label: 'Automatic email', dot: !summary?.settings?.autoEnabled },
      ]} />

      {tab === 'campaigns' && (
        loading && !items.length ? <div className="flex justify-center p-12"><Spinner /></div> : items.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-slate-200">
            <Mails className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-900">No campaigns yet</p>
            <p className="mt-1 text-sm text-slate-500">Create one, pick your discount codes and who should get it.</p>
            <button onClick={() => setEditing({ ...EMPTY })} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Create a campaign</button>
          </div>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {items.map(c => {
              const st = STATUS[c.status || 'DRAFT'];
              const codes = idsOf(c.promoCodeIds).map(id => options.codes.find(o => o.id === id)).filter(Boolean) as CodeOption[];
              return (
                <li key={c.id} className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                  <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b2545] text-white"><Mail className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{c.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{templateName(c.template)} · {c.subject || 'Standard subject line'}</p>
                    </div>
                    <Pill cls={st.cls}>{st.label}</Pill>
                  </div>
                  <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-sm">
                    <div><dt className="text-xs text-slate-500">Goes to</dt><dd className="font-medium text-slate-900">{audienceLabel(c.audience)}{c.locationCodes ? ` · ${c.locationCodes}` : ''}</dd></div>
                    <div><dt className="text-xs text-slate-500">Codes</dt><dd className="flex flex-wrap gap-1">{codes.length ? codes.map(o => <span key={o.id} className="rounded-md bg-orange-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-orange-800 ring-1 ring-orange-200">{o.code}</span>) : <span className="text-slate-400">No code</span>}</dd></div>
                    <div><dt className="text-xs text-slate-500">Sent</dt><dd className="font-medium text-slate-900">{c.timesSent ? `${num(c.timesSent)}× · ${num(c.totalSent)} emails` : 'Not yet'}{c.totalFailed ? <span className="text-rose-600"> · {num(c.totalFailed)} failed</span> : null}</dd></div>
                    <div><dt className="text-xs text-slate-500">Last sent</dt><dd className="font-medium text-slate-900">{c.lastSentAt ? ago(c.lastSentAt) : '—'}</dd></div>
                  </dl>
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-3">
                    <button disabled={c.status === 'SENDING'} onClick={() => setConfirm(c)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#F57C00] px-3 text-sm font-semibold text-white hover:bg-[#e06f00] disabled:opacity-50"><Send className="h-4 w-4" /> {c.timesSent ? 'Send again' : 'Send now'}</button>
                    <button onClick={() => setEditing({ ...EMPTY, ...c })} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800"><Pencil className="h-4 w-4" /> Edit</button>
                    <button onClick={() => duplicate(c)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"><Copy className="h-4 w-4" /> Duplicate</button>
                    <button disabled={c.status === 'SENDING'} onClick={() => remove(c)} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /><span className="sr-only sm:not-sr-only">Delete</span></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      )}

      {tab === 'contacts' && <ContactsTab onEmail={newFor} notify={notify} onChanged={load} />}
      {tab === 'auto' && summary && <AutoTab summary={summary} campaigns={items} notify={notify} onSaved={load} />}

      <p className="flex items-start gap-2 text-xs text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Every email has an unsubscribe link, and people who unsubscribed are always left out. Only advertise discounts that are live. Emails go out one by one in the background, so a large campaign can take a few minutes.</p>

      <AnimatePresence>
        {editing && <CampaignEditor initial={editing} summary={summary} options={options}
          onClose={() => setEditing(null)}
          onSaved={(msg, saved, sendNow) => { setEditing(null); notify(msg); load(); if (sendNow && saved) setConfirm(saved); }} notify={notify} />}
      </AnimatePresence>
      <AnimatePresence>
        {confirm && <SendConfirm campaign={confirm} onClose={() => setConfirm(null)} onSent={n => { setConfirm(null); notify(`Sending to ${num(n)} ${n === 1 ? 'person' : 'people'}…`); load(); }} />}
      </AnimatePresence>
      <Toast toast={toast} />
    </div>
  );
};

// ==================== Send confirmation ====================

const SendConfirm = ({ campaign, onClose, onSent }: { campaign: Campaign; onClose: () => void; onSent: (n: number) => void }) => {
  const [count, setCount] = React.useState<number | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    adminAxios.post(`${BASE}/render`, campaign).then(r => setCount(r.data.recipients)).catch(e => setError(errorOf(e, 'Couldn’t count the recipients.')));
  }, [campaign]);
  const send = async () => {
    setBusy(true); setError('');
    try { const r = await adminAxios.post(`${BASE}/campaigns/${campaign.id}/send`); onSent(r.data.recipients); }
    catch (e) { setError(errorOf(e, 'Couldn’t send the campaign.')); }
    finally { setBusy(false); }
  };
  return (
    <Drawer eyebrow="Send campaign" title={campaign.name} onClose={onClose} busy={busy} width="max-w-[480px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} disabled={busy} className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300">Cancel</button>
          <button onClick={send} disabled={busy || !count} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#F57C00] px-5 text-sm font-semibold text-white hover:bg-[#e06f00] disabled:opacity-50">{busy ? <Spinner light /> : <Send className="h-4 w-4" />} Send to {count == null ? '…' : num(count)}</button>
        </div>
      }>
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">This email will go to</p>
          <p className="mt-1 text-5xl font-semibold tabular-nums text-slate-900">{count == null ? <span className="inline-block h-12 w-20 animate-pulse rounded-lg bg-slate-100" /> : num(count)}</p>
          <p className="mt-1 text-sm text-slate-500">{count === 1 ? 'person' : 'people'} · {audienceLabel(campaign.audience)}{campaign.locationCodes ? ` · ${campaign.locationCodes}` : ''}</p>
        </div>
        {campaign.timesSent ? <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">You've sent this campaign {campaign.timesSent} {campaign.timesSent === 1 ? 'time' : 'times'} before. Everyone in the audience gets it again.</p> : null}
        {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">{error}</p>}
        <p className="text-xs text-slate-500">Unsubscribed addresses are left out. Sending can't be undone.</p>
      </div>
    </Drawer>
  );
};

// ==================== Editor ====================

const CampaignEditor = ({ initial, summary, options, onClose, onSaved, notify }: {
  initial: Campaign; summary: Summary | null; options: { codes: CodeOption[]; banners: BannerOption[] };
  onClose: () => void; onSaved: (msg: string, saved: Campaign | null, sendNow: boolean) => void; notify: (t: string, tone?: 'ok' | 'err') => void;
}) => {
  const [c, setC] = React.useState<Campaign>({ ...EMPTY, ...initial });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [preview, setPreview] = React.useState<{ subject: string; html: string; recipients: number; personal?: boolean; knownName?: string | null } | null>(null);
  const [previewError, setPreviewError] = React.useState('');
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop');
  const [testEmail, setTestEmail] = React.useState('');
  const [testing, setTesting] = React.useState(false);
  const set = <K extends keyof Campaign>(k: K, v: Campaign[K]) => setC(prev => ({ ...prev, [k]: v }));

  const codeIds = idsOf(c.promoCodeIds);
  const bannerIds = idsOf(c.bannerIds);
  const toggleId = (key: 'promoCodeIds' | 'bannerIds', id: number, max: number) => {
    const cur = idsOf(c[key]);
    const next = cur.includes(id) ? cur.filter(x => x !== id) : cur.length >= max ? cur : [...cur, id];
    set(key, next.join(','));
  };

  // Live preview, a moment after typing stops.
  React.useEffect(() => {
    const t = window.setTimeout(async () => {
      try { setPreview((await adminAxios.post(`${BASE}/render`, c)).data); setPreviewError(''); }
      catch (e) { setPreviewError(errorOf(e, 'Couldn’t build the preview.')); }
    }, 450);
    return () => window.clearTimeout(t);
  }, [c]);

  // Emailing one person: greet them by name by default, starting from the name we have for them.
  React.useEffect(() => {
    if (!preview?.personal) return;
    setC(prev => prev.showName == null ? { ...prev, showName: true, recipientName: prev.recipientName || preview.knownName || '' } : prev);
  }, [preview?.personal, preview?.knownName]);
  const personal = !!preview?.personal;

  const save = async (sendNow: boolean) => {
    if (!c.name.trim()) { setError('Give the campaign a name.'); return; }
    setBusy(true); setError('');
    try {
      const r = c.id ? await adminAxios.put(`${BASE}/campaigns/${c.id}`, c) : await adminAxios.post(`${BASE}/campaigns`, c);
      onSaved(c.id ? 'Campaign saved' : 'Campaign created', r.data, sendNow);
    } catch (e) { setError(errorOf(e, 'Couldn’t save the campaign.')); }
    finally { setBusy(false); }
  };

  const sendTest = async () => {
    setTesting(true);
    try { await adminAxios.post(`${BASE}/test`, { ...c, testEmail }); notify(`Test sent to ${testEmail}`); }
    catch (e) { notify(errorOf(e, 'Couldn’t send the test.'), 'err'); }
    finally { setTesting(false); }
  };

  const tokens = '{firstName} = the name (only for an email to one person with the name switched on; left out otherwise) · {place} = where they searched · {code} = your first code';

  return (
    <Drawer eyebrow={c.id ? 'Edit campaign' : 'New campaign'} title={c.name || 'Untitled campaign'} onClose={onClose} busy={busy} width="max-w-[1240px]"
      footer={
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <input className={`${inputCls} h-10 lg:w-64`} type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="Send a test to…" aria-label="Test email address" />
            <button onClick={sendTest} disabled={testing || !testEmail.includes('@')} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-50">{testing ? <Spinner /> : <MailCheck className="h-4 w-4" />} Send test</button>
          </div>
          <div className="flex items-center justify-end gap-2">
            {error && <p className="mr-2 text-sm text-rose-700">{error}</p>}
            <button onClick={onClose} disabled={busy} className="h-10 rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300">Cancel</button>
            <button onClick={() => save(false)} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{busy && <Spinner light />} Save</button>
            <button onClick={() => save(true)} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F57C00] px-4 text-sm font-semibold text-white hover:bg-[#e06f00] disabled:opacity-60"><Send className="h-4 w-4" /> Save & send…</button>
          </div>
        </div>
      }>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="space-y-6">
          <TemplatePicker value={(c.template || 'EDITORIAL') as TemplateKey} draft={c} onPick={t => {
            const typed = ['subject', 'eyebrow', 'headline', 'intro', 'ctaLabel'].some(k => (c as any)[k]);
            const changed = typed && !window.confirm('Use this template’s suggested wording? Your texts will be replaced. Press Cancel to keep your texts and only change the design.');
            setC(prev => ({ ...prev, template: t.key, ...(changed ? {} : t.preset) }));
          }} />

          <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <Field label="Campaign name" hint="Only you see this."><input className={inputCls} value={c.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Summer sale – Jordan" maxLength={120} /></Field>
          </section>

          <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <div><p className="text-sm font-semibold text-slate-900">Message</p><p className="text-xs text-slate-500">Leave a box empty to use the standard wording. {tokens}</p></div>
            <Field label="Email subject"><input className={inputCls} value={c.subject || ''} onChange={e => set('subject', e.target.value)} maxLength={200} placeholder="{firstName}, 15% off your summer car hire" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Small label"><input className={inputCls} value={c.eyebrow || ''} onChange={e => set('eyebrow', e.target.value)} maxLength={80} placeholder="Offers reserved for you" /></Field>
              <Field label="Headline"><input className={inputCls} value={c.headline || ''} onChange={e => set('headline', e.target.value)} maxLength={160} placeholder="{firstName}, your next drive costs less." /></Field>
            </div>
            <Field label="Text"><textarea className={`${inputCls} h-24 py-2.5`} value={c.intro || ''} onChange={e => set('intro', e.target.value)} maxLength={600} placeholder="One or two sentences about the offer." /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Button text"><input className={inputCls} value={c.ctaLabel || ''} onChange={e => set('ctaLabel', e.target.value)} maxLength={40} placeholder="Find my car" /></Field>
              <Field label="Button link" hint="A page like /car-rental-amman. Your first code is added to it."><input className={inputCls} value={c.ctaUrl || ''} onChange={e => set('ctaUrl', e.target.value)} maxLength={500} placeholder="/" /></Field>
            </div>
            <Field label="Header photo link" hint="A wide JPG or PNG, at least 1200 px. Empty = the coastal road photo."><input className={inputCls} value={c.heroImageUrl || ''} onChange={e => set('heroImageUrl', e.target.value)} maxLength={500} placeholder="https://…" /></Field>
          </section>

          <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-slate-900">Discount codes</p>
            <p className="mb-3 text-xs text-slate-500">Pick up to 6. The first one you pick is the big featured code. Create codes in Promo codes.</p>
            {options.codes.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No promo codes yet.</p> : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {options.codes.map(o => {
                  const pos = codeIds.indexOf(o.id);
                  const st = CODE_STATE[o.state] || CODE_STATE.PAUSED;
                  return (
                    <li key={o.id}>
                      <button type="button" onClick={() => toggleId('promoCodeIds', o.id, 6)} aria-pressed={pos >= 0}
                        className={`flex w-full items-start gap-3 rounded-xl p-3 text-left ring-2 transition ${pos >= 0 ? 'bg-orange-50/60 ring-[#F57C00]' : 'bg-white ring-slate-200 hover:ring-slate-300'}`}>
                        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${pos >= 0 ? 'bg-[#F57C00] text-white' : 'bg-slate-100 text-slate-400'}`}>{pos >= 0 ? pos + 1 : ''}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2"><span className="font-mono text-sm font-bold text-slate-900">{o.code}</span><Pill cls={st.cls}>{st.label}</Pill></span>
                          <span className="block text-xs text-slate-600">{codeLabel(o)}{o.minDays ? ` · ${o.minDays}+ days` : ''}{o.endDate ? ` · until ${fmtDate(o.endDate)}` : ''}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-slate-900">Promotions</p>
            <p className="mb-3 text-xs text-slate-500">Up to 4 of your Search banners, shown under the codes.</p>
            {options.banners.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No banners yet. Create them in Search banners.</p> : (
              <ul className="space-y-2">
                {options.banners.map(b => (
                  <li key={b.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl p-3 ring-1 ring-slate-200 hover:bg-slate-50">
                      <input type="checkbox" className="h-4 w-4 accent-[#F57C00]" checked={bannerIds.includes(b.id)} onChange={() => toggleId('bannerIds', b.id, 4)} />
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{b.title}</span><span className="block truncate text-xs text-slate-500">{b.name}</span></span>
                      <Pill cls={b.live ? CODE_STATE.LIVE.cls : CODE_STATE.PAUSED.cls}>{b.live ? 'Live' : 'Off'}</Pill>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Toggle checked={c.showSteps !== false} onChange={v => set('showSteps', v)} label="“How it works” steps" hint="Shown when there's a code." />
              <Toggle checked={c.showRewards !== false} onChange={v => set('showRewards', v)} label="Rewards panel" hint="Invite to join HogiCar Rewards." />
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-slate-900">Who gets it</p>
            <p className="mb-3 text-xs text-slate-500">Unsubscribed addresses are always left out.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {AUDIENCES.map(a => {
                const n = a.count(summary);
                return (
                  <button key={a.key} type="button" onClick={() => set('audience', a.key)} aria-pressed={c.audience === a.key}
                    className={`rounded-xl p-3 text-left ring-2 transition ${c.audience === a.key ? 'bg-sky-50/60 ring-[#007ac2]' : 'bg-white ring-slate-200 hover:ring-slate-300'}`}>
                    <span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-slate-900">{a.label}</span>{n != null && <span className="text-xs font-semibold tabular-nums text-slate-500">{num(n)}</span>}</span>
                    <span className="block text-xs text-slate-500">{a.hint}</span>
                  </button>
                );
              })}
            </div>
            {c.audience === 'SELECTED' ? (
              <Field label="Email addresses" hint="One per line, or separated by commas. New addresses are added to your contacts." className="mt-4">
                <textarea className={`${inputCls} h-32 py-2.5 font-mono text-xs`} value={c.selectedEmails || ''} onChange={e => set('selectedEmails', e.target.value)} placeholder={'name@example.com\nother@example.com'} />
              </Field>
            ) : (
              <Field label="Only people who searched these pick-up places" hint="Location codes like AMM, AQJ. Empty = everywhere." className="mt-4">
                <input className={inputCls} value={c.locationCodes || ''} onChange={e => set('locationCodes', e.target.value.toUpperCase())} placeholder="All places" />
              </Field>
            )}
            <div className="mt-4 rounded-xl p-4 ring-1 ring-slate-200">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><UserRound className="h-4 w-4 text-slate-400" /> Name in the email</p>
              {personal ? (
                <>
                  <label className="mt-3 flex cursor-pointer items-center justify-between gap-3">
                    <span className="text-sm text-slate-700">Greet this person by name</span>
                    <span className="relative inline-flex">
                      <input type="checkbox" className="peer sr-only" checked={!!c.showName} onChange={e => set('showName', e.target.checked)} />
                      <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-[#007ac2]" />
                      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                    </span>
                  </label>
                  {c.showName && (
                    <Field label="Name" hint={preview?.knownName ? `From your contacts: ${preview.knownName}. Change it if you like, e.g. “Dr. Lina” or “Mr. Haddad”.` : 'We don’t have a name for this address. Type how you’d like to greet them.'} className="mt-3">
                      <input className={inputCls} value={c.recipientName || ''} maxLength={80} onChange={e => set('recipientName', e.target.value)} placeholder={preview?.knownName || 'e.g. Lina'} />
                    </Field>
                  )}
                  {!c.showName && <p className="mt-2 text-xs text-slate-500">The email is sent without a name, e.g. “Hello,” instead of “Dear Lina,”.</p>}
                </>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">This email goes to several people, so <strong className="font-semibold text-slate-700">no name is shown</strong>. Wording with {'{firstName}'} reads naturally without it. To greet someone by name, choose “Chosen addresses” and enter one address.</p>
              )}
            </div>
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white"><Users className="h-4 w-4" /> Goes to <strong className="tabular-nums">{preview ? num(preview.recipients) : '…'}</strong> {preview?.recipients === 1 ? 'person' : 'people'} right now</p>
          </section>
        </div>

        <div className="lg:sticky lg:top-0 lg:self-start">
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live preview</p>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                {(['desktop', 'mobile'] as const).map(d => (
                  <button key={d} type="button" onClick={() => setDevice(d)} aria-pressed={device === d} aria-label={d}
                    className={`flex h-8 w-9 items-center justify-center rounded-md ${device === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                    {d === 'desktop' ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-[11px] text-slate-500">Subject</p>
              <p className="truncate text-sm font-semibold text-slate-900">{preview?.subject || '…'}</p>
            </div>
            {previewError && <p className="m-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">{previewError}</p>}
            <div className="flex justify-center bg-slate-100 p-3">
              {preview ? (
                <iframe title="Email preview" srcDoc={preview.html} sandbox=""
                  className="h-[70vh] rounded-lg bg-white shadow-sm transition-[width]" style={{ width: device === 'mobile' ? 380 : '100%' }} />
              ) : <div className="flex h-[70vh] w-full items-center justify-center"><Spinner /></div>}
            </div>
            <p className="px-4 py-3 text-xs text-slate-500">{personal ? (c.showName && (c.recipientName || preview?.knownName) ? `Exactly as ${c.recipientName || preview?.knownName} will get it.` : 'Exactly as this person will get it, without a name.') : 'Exactly as everyone will get it: no name. The pick-up place is each person’s own.'}</p>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

// ==================== Template picker ====================

const TemplatePicker = ({ value, draft, onPick }: { value: TemplateKey; draft: Campaign; onPick: (t: typeof TEMPLATES[number]) => void }) => {
  const [thumbs, setThumbs] = React.useState<Record<string, string>>({});
  // Thumbnails show each design with the codes chosen so far.
  const codes = draft.promoCodeIds || '';
  React.useEffect(() => {
    let alive = true;
    TEMPLATES.forEach(t => {
      adminAxios.post(`${BASE}/render`, { ...draft, ...t.preset, template: t.key, audience: 'SELECTED', selectedEmails: '' })
        .then(r => { if (alive) setThumbs(prev => ({ ...prev, [t.key]: r.data.html })); })
        .catch(() => { /* thumbnail is optional */ });
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codes]);
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-slate-900">Template</p>
      <p className="mb-3 text-xs text-slate-500">Pick a design. It fills in suggested wording that you can change below.</p>
      {[{ title: 'Everyday', items: TEMPLATES.filter(t => !t.holiday) }, { title: 'Holidays', items: TEMPLATES.filter(t => t.holiday) }].map(g => (
      <div key={g.title} className="mb-2">
      <p className="mb-2 mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{g.title}</p>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {g.items.map(t => (
          <button key={t.key} type="button" onClick={() => onPick(t)} aria-pressed={value === t.key}
            className={`w-44 shrink-0 snap-start overflow-hidden rounded-xl bg-white text-left ring-2 transition ${value === t.key ? 'ring-[#F57C00]' : 'ring-slate-200 hover:ring-slate-300'}`}>
            <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${t.swatch}`}>
              {thumbs[t.key] && (
                <iframe title={`${t.name} preview`} srcDoc={thumbs[t.key]} sandbox="" tabIndex={-1} aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 origin-top-left bg-white" style={{ width: 640, height: 1400, transform: 'scale(0.275)' }} />
              )}
              {value === t.key && <span className="absolute right-2 top-2 rounded-full bg-[#F57C00] px-2 py-0.5 text-[10px] font-bold text-white shadow">Selected</span>}
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-slate-900">{t.name}</p>
              <p className="mt-0.5 text-xs leading-snug text-slate-500">{t.description}</p>
            </div>
          </button>
        ))}
      </div>
      </div>
      ))}
    </section>
  );
};

// ==================== Contacts ====================

const SEGMENTS = [
  { key: 'ALL', label: 'All' }, { key: 'BOOKED', label: 'Booked' }, { key: 'NOT_BOOKED', label: 'Haven’t booked' },
  { key: 'PAYMENT', label: 'Reached payment' }, { key: 'MEMBERS', label: 'Members' }, { key: 'UNSUBSCRIBED', label: 'Unsubscribed' },
] as const;

const ContactsTab = ({ onEmail, notify, onChanged }: { onEmail: (emails: string[]) => void; notify: (t: string, tone?: 'ok' | 'err') => void; onChanged: () => void }) => {
  const [segment, setSegment] = React.useState<string>('ALL');
  const [q, setQ] = React.useState('');
  const [rows, setRows] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [picked, setPicked] = React.useState<Set<string>>(new Set());

  const load = React.useCallback(async () => {
    setLoading(true); setError('');
    try { setRows((await adminAxios.get(`${BASE}/contacts`, { params: { segment, q: q || undefined } })).data); }
    catch (e) { setError(errorOf(e, 'Couldn’t load contacts.')); }
    finally { setLoading(false); }
  }, [segment, q]);
  React.useEffect(() => { const t = window.setTimeout(load, 250); return () => window.clearTimeout(t); }, [load]);

  const selectable = rows.filter(r => !r.unsubscribedAt);
  const allPicked = selectable.length > 0 && selectable.every(r => picked.has(r.email));
  const togglePick = (e: string) => setPicked(prev => { const n = new Set(prev); n.has(e) ? n.delete(e) : n.add(e); return n; });

  const resubscribe = async (r: Contact) => {
    if (!window.confirm(`Subscribe ${r.email} to offers again? Only do this if they asked you to.`)) return;
    try { await adminAxios.post(`${BASE}/contacts/${r.id}/resubscribe`); notify('Subscribed again'); load(); onChanged(); }
    catch (e) { notify(errorOf(e, 'Couldn’t update the contact.'), 'err'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1">
          {SEGMENTS.map(s => (
            <button key={s.key} onClick={() => { setSegment(s.key); setPicked(new Set()); }} aria-pressed={segment === s.key}
              className={`h-9 shrink-0 rounded-full px-3.5 text-sm font-semibold ring-1 ${segment === s.key ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:text-slate-900'}`}>{s.label}</button>
          ))}
        </div>
        <label className="relative block lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-9`} value={q} onChange={e => setQ(e.target.value)} placeholder="Search email, name or place" aria-label="Search contacts" />
        </label>
      </div>

      {picked.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#0b2545] px-4 py-3 text-white">
          <p className="text-sm"><strong>{num(picked.size)}</strong> selected</p>
          <div className="flex gap-2">
            <button onClick={() => setPicked(new Set())} className="h-9 rounded-lg px-3 text-sm font-semibold ring-1 ring-white/30">Clear</button>
            <button onClick={() => onEmail(Array.from(picked))} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#F57C00] px-3 text-sm font-semibold"><Send className="h-4 w-4" /> Email these people</button>
          </div>
        </div>
      )}

      {error && <ErrorBanner text={error} onRetry={load} />}

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        {loading && !rows.length ? <div className="flex justify-center p-12"><Spinner /></div> : rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">No contacts here yet. Addresses appear as soon as people book, reach payment or create an account.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-3"><input type="checkbox" className="h-4 w-4 accent-[#F57C00]" checked={allPicked} aria-label="Select all"
                    onChange={() => setPicked(allPicked ? new Set() : new Set(selectable.map(r => r.email)))} /></th>
                  <th className="px-3 py-3 font-semibold">Contact</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Place</th>
                  <th className="px-3 py-3 font-semibold">Last seen</th>
                  <th className="px-3 py-3 font-semibold">Offers sent</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(r => {
                  const src = SOURCE[r.source || ''] || SOURCE.ADDED;
                  return (
                    <tr key={r.id} className={r.unsubscribedAt ? 'bg-slate-50/60 text-slate-400' : 'hover:bg-slate-50/60'}>
                      <td className="px-4 py-3">{!r.unsubscribedAt && <input type="checkbox" className="h-4 w-4 accent-[#F57C00]" checked={picked.has(r.email)} onChange={() => togglePick(r.email)} aria-label={`Select ${r.email}`} />}</td>
                      <td className="px-3 py-3"><p className="font-semibold text-slate-900">{r.firstName || '—'}</p><p className="text-xs text-slate-500">{r.email}</p></td>
                      <td className="px-3 py-3"><div className="flex flex-wrap gap-1">
                        {r.unsubscribedAt ? <Pill cls="bg-rose-50 text-rose-700 ring-rose-200">Unsubscribed</Pill> : <Pill cls={src.cls}>{src.label}</Pill>}
                        {r.member && <Pill cls="bg-violet-50 text-violet-700 ring-violet-200">Member</Pill>}
                      </div></td>
                      <td className="max-w-[220px] truncate px-3 py-3 text-slate-600">{r.pickupName || r.pickupCode || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-600">{r.lastActivityAt ? ago(r.lastActivityAt) : '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-600">{r.sentCount ? `${num(r.sentCount)} · ${ago(r.lastSentAt)}` : 'None'}</td>
                      <td className="px-3 py-3 text-right">
                        {r.unsubscribedAt
                          ? <button onClick={() => resubscribe(r)} className="text-xs font-semibold text-[#007ac2] hover:underline">Subscribe again</button>
                          : <button onClick={() => onEmail([r.email])} className="inline-flex items-center gap-1 text-xs font-semibold text-[#007ac2] hover:underline"><Mail className="h-3.5 w-3.5" /> Email</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500">{num(rows.length)} shown{rows.length >= 2000 ? ' (first 2,000 — search to narrow down)' : ''}.</p>
    </div>
  );
};

// ==================== Automatic email ====================

const AutoTab = ({ summary, campaigns, notify, onSaved }: { summary: Summary; campaigns: Campaign[]; notify: (t: string, tone?: 'ok' | 'err') => void; onSaved: () => void }) => {
  const [s, setS] = React.useState(summary.settings);
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => setS(summary.settings), [summary.settings]);
  const save = async () => {
    setBusy(true);
    try { await adminAxios.put(`${BASE}/settings`, { ...s, autoCampaignId: s.autoCampaignId ?? '' }); notify('Automatic email saved'); onSaved(); }
    catch (e) { notify(errorOf(e, 'Couldn’t save.'), 'err'); }
    finally { setBusy(false); }
  };
  const chosen = campaigns.find(c => c.id === s.autoCampaignId);
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <Toggle checked={!!s.autoEnabled} onChange={v => setS({ ...s, autoEnabled: v })} label="Send the automatic offers email"
          hint="Every new address gets an offers email by itself, then again after the pause you choose." />
        <section className="grid gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:grid-cols-2">
          <Field label="First email after" hint="Hours after their last booking or search, so it never lands next to a booking email.">
            <div className="flex items-center gap-2"><input type="number" min={1} max={720} className={inputCls} value={s.firstDelayHours} onChange={e => setS({ ...s, firstDelayHours: Number(e.target.value) })} /><span className="text-sm text-slate-500">hours</span></div>
          </Field>
          <Field label="Then at most every" hint="Days between automatic emails to the same person.">
            <div className="flex items-center gap-2"><input type="number" min={1} max={365} className={inputCls} value={s.repeatDays} onChange={e => setS({ ...s, repeatDays: Number(e.target.value) })} /><span className="text-sm text-slate-500">days</span></div>
          </Field>
          <Field label="Email to send" className="sm:col-span-2" hint="Use one of your campaigns (its texts, codes and promotions), or the standard email with every live code.">
            <select className={inputCls} value={s.autoCampaignId ?? ''} onChange={e => setS({ ...s, autoCampaignId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Standard email – all live promo codes</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </section>
        <div className="flex justify-end">
          <button onClick={save} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#007ac2] px-5 text-sm font-semibold text-white hover:bg-[#00649f] disabled:opacity-60">{busy && <Spinner light />} Save</button>
        </div>
      </div>
      <aside className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Zap className="h-4 w-4 text-[#F57C00]" /> How it works</p>
        <ul className="space-y-2.5 text-sm text-slate-600">
          <li className="flex gap-2"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> Checks every hour for people who are due.</li>
          <li className="flex gap-2"><Ticket className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> Only sends while {chosen ? `a code in “${chosen.name}”` : 'a public promo code'} is live.</li>
          <li className="flex gap-2"><UserX className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> Never to anyone who unsubscribed.</li>
        </ul>
        <p className="text-xs font-semibold text-slate-500">Status: <span className={s.autoEnabled ? 'text-emerald-700' : 'text-slate-700'}>{s.autoEnabled ? 'On' : 'Off'}</span> · {num(summary.emailed)} people emailed so far</p>
      </aside>
    </div>
  );
};

export default EmailCampaignsAdmin;
