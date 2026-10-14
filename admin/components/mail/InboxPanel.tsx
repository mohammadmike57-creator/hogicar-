import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Search from 'lucide-react/dist/esm/icons/search';
import Paperclip from 'lucide-react/dist/esm/icons/paperclip';
import Reply from 'lucide-react/dist/esm/icons/reply';
import Archive from 'lucide-react/dist/esm/icons/archive';
import ArchiveRestore from 'lucide-react/dist/esm/icons/archive-restore';
import MailOpen from 'lucide-react/dist/esm/icons/mail-open';
import Download from 'lucide-react/dist/esm/icons/download';
import MessageSquareText from 'lucide-react/dist/esm/icons/message-square-text';
import CheckCircle from 'lucide-react/dist/esm/icons/circle-check';
import AlertTriangle from 'lucide-react/dist/esm/icons/triangle-alert';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Ticket from 'lucide-react/dist/esm/icons/ticket';
import { adminAxios, API_BASE_URL } from '../../../api';
import { Drawer, Spinner, errorOf, ago } from '../commercialUi';
import { boxLabel, folderLabel, type Folder } from './MailNav';

const BASE = `${API_BASE_URL}/api/admin/mail`;

export type InboxRow = {
  id: number; source: 'EMAIL' | 'CONTACT'; mailbox?: string; fromName?: string; fromAddress?: string; subject?: string; snippet?: string;
  receivedAt: string; read: boolean; replied: boolean; attachmentCount: number; contactRef?: string; contactTopic?: string;
};
export type InboxMessage = InboxRow & {
  to?: string; cc?: string; bodyText?: string; bodyHtml?: string; contactPhone?: string; bookingRef?: string; archived?: boolean;
};
type Attachment = { id: number; name: string; contentType?: string; size?: number };
export type MailboxStatus = { address: string; connected: boolean; lastSyncAt?: string; error?: string; unread: number; receiving?: boolean };
export type InboxStatus = { connected: boolean; configured: boolean; mailbox: string; mailboxes?: MailboxStatus[]; contactMailbox?: string; lastSyncAt?: string; error?: string; syncing?: boolean; unread: number; openContact: number };

const initials = (name?: string, email?: string) => {
  const src = (name || email || '?').replace(/[^A-Za-z؀-ۿ ]/g, ' ').trim();
  const parts = src.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};
const avatarTone = (seed = '') => {
  const tones = ['bg-[#0f2b4d]', 'bg-[#007ac2]', 'bg-[#0f766e]', 'bg-[#7c3aed]', 'bg-[#b45309]', 'bg-[#be185d]'];
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return tones[h % tones.length];
};
const when = (iso: string) => {
  const d = new Date(iso); const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (now.getTime() - d.getTime() < 6 * 864e5) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
};
const size = (b = 0) => b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

/** Received emails are shown in a sealed frame: no scripts, no access to the admin. */
const SafeFrame: React.FC<{ html: string }> = ({ html }) => {
  const ref = React.useRef<HTMLIFrameElement>(null);
  const [h, setH] = React.useState(240);
  const doc = `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>body{margin:0;padding:4px 2px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;word-wrap:break-word}img{max-width:100%;height:auto}table{max-width:100%}</style></head><body>${html}</body></html>`;
  return (
    <iframe ref={ref} title="Message" srcDoc={doc} sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      onLoad={() => { try { const d = ref.current?.contentDocument; if (d) setH(Math.min(4000, Math.max(160, d.documentElement.scrollHeight + 8))); } catch { /* ignore */ } }}
      className="w-full border-0 bg-white" style={{ height: h }} />
  );
};

const Reader: React.FC<{ id: number; onClose: () => void; onReply: (m: InboxMessage) => void; onChanged: () => void }> = ({ id, onClose, onReply, onChanged }) => {
  const [data, setData] = React.useState<{ mail: InboxMessage; attachments: Attachment[] } | null>(null);
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => {
    adminAxios.get(`${BASE}/inbox/${id}`).then(r => { setData(r.data); onChanged(); }).catch(e => setErr(errorOf(e, 'This message could not be opened.')));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = async (body: Record<string, boolean>, close = false) => {
    setBusy(true);
    try { const r = await adminAxios.patch(`${BASE}/inbox/${id}`, body); setData(d => d ? { ...d, mail: { ...d.mail, ...r.data } } : d); onChanged(); if (close) onClose(); }
    finally { setBusy(false); }
  };
  const download = async (a: Attachment) => {
    try {
      const r = await adminAxios.get(`${BASE}/inbox/${id}/attachments/${a.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data); const link = document.createElement('a');
      link.href = url; link.download = a.name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) { setErr(errorOf(e, 'The file could not be downloaded.')); }
  };

  const m = data?.mail;
  const contact = m?.source === 'CONTACT';
  return (
    <Drawer eyebrow={contact ? `Contact request · ${m?.contactRef || ''}` : 'Email'} title={m?.subject || '…'} onClose={onClose} width="max-w-[760px]"
      footer={m && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <button onClick={() => patch({ read: false }, true)} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100" title="Mark as unread"><MailOpen className="h-4 w-4" /><span className="hidden sm:inline">Unread</span></button>
            {m.archived
              ? <button onClick={() => patch({ archived: false }, true)} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"><ArchiveRestore className="h-4 w-4" /><span className="hidden sm:inline">Move to inbox</span></button>
              : <button onClick={() => patch({ archived: true }, true)} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"><Archive className="h-4 w-4" /><span className="hidden sm:inline">Archive</span></button>}
            {!m.replied && <button onClick={() => patch({ replied: true })} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"><CheckCircle className="h-4 w-4" /><span className="hidden sm:inline">Mark answered</span></button>}
          </div>
          <button onClick={() => onReply(m)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#007ac2] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#0068a5]"><Reply className="h-4 w-4" /> Reply</button>
        </div>
      )}>
      {err && <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-200">{err}</div>}
      {!m ? <div className="space-y-3"><div className="h-20 animate-pulse rounded-2xl bg-white" /><div className="h-64 animate-pulse rounded-2xl bg-white" /></div> : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarTone(m.fromAddress)}`}>{initials(m.fromName, m.fromAddress)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="truncate font-semibold text-slate-900">{m.fromName || m.fromAddress}</p>
                <p className="shrink-0 text-xs text-slate-500">{new Date(m.receivedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
              <p className="truncate text-sm text-slate-500">{m.fromAddress}{m.to ? <> · to {m.to}</> : null}</p>
              {m.cc && <p className="truncate text-sm text-slate-500">cc {m.cc}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.mailbox && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200"><Inbox className="h-3 w-3" /> {boxLabel(m.mailbox)} inbox</span>}
                {contact && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200"><MessageSquareText className="h-3 w-3" /> Contact form · {m.contactTopic}</span>}
                {m.replied && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200"><CheckCircle className="h-3 w-3" /> Answered</span>}
              </div>
            </div>
          </div>
          {contact && (m.contactPhone || m.bookingRef) && (
            <div className="flex flex-wrap gap-2">
              {m.contactPhone && <a href={`tel:${m.contactPhone}`} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200"><Phone className="h-4 w-4 text-slate-400" />{m.contactPhone}</a>}
              {m.bookingRef && <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200"><Ticket className="h-4 w-4 text-slate-400" />Booking {m.bookingRef}</span>}
            </div>
          )}
          {data!.attachments.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {data!.attachments.map(a => (
                <button key={a.id} onClick={() => download(a)} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left ring-1 ring-slate-200 hover:ring-[#007ac2]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#007ac2]"><Paperclip className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-900">{a.name}</span><span className="block text-xs text-slate-500">{size(a.size)}</span></span>
                  <Download className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              ))}
            </div>
          )}
          <div className="overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            {m.bodyHtml ? <SafeFrame html={m.bodyHtml} /> : <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800">{m.bodyText || ''}</p>}
          </div>
        </div>
      )}
    </Drawer>
  );
};

export const InboxPanel: React.FC<{ box: string; folder: Folder; onReply: (m: InboxMessage) => void; onStatus: (s: InboxStatus) => void; refreshKey: number }> = ({ box, folder: filter, onReply, onStatus, refreshKey }) => {
  const [q, setQ] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [rows, setRows] = React.useState<InboxRow[]>([]);
  const [status, setStatus] = React.useState<InboxStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [syncMsg, setSyncMsg] = React.useState('');
  const [openId, setOpenId] = React.useState<number | null>(null);

  const load = React.useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const r = await adminAxios.get(`${BASE}/inbox`, { params: { filter, mailbox: box === 'all' ? undefined : box, q: query || undefined, size: 50 } });
      setRows(r.data.items || []); setStatus(r.data.status); onStatus(r.data.status);
    } catch { /* keep what we have */ }
    finally { setLoading(false); }
  }, [filter, box, query, onStatus]);
  React.useEffect(() => { load(); }, [load, refreshKey]);
  React.useEffect(() => { const t = window.setInterval(() => load(true), 60000); return () => window.clearInterval(t); }, [load]);
  React.useEffect(() => { const t = window.setTimeout(() => setQuery(q.trim()), 300); return () => window.clearTimeout(t); }, [q]);

  const sync = async () => {
    setSyncing(true); setSyncMsg('');
    try { const r = await adminAxios.post(`${BASE}/inbox/sync`); setSyncMsg(r.data.added ? `${r.data.added} new` : 'Up to date'); await load(true); }
    catch (e) { setSyncMsg(errorOf(e, 'Could not check for new email.')); await load(true); }
    finally { setSyncing(false); window.setTimeout(() => setSyncMsg(''), 4000); }
  };

  const boxes = status?.mailboxes || [];
  const current = boxes.find(b => b.address === box);
  const broken = (current ? [current] : boxes).find(b => b.error);
  const receivingOff = current ? current.receiving === false : !status?.configured;
  const banner = status && (receivingOff
    ? { tone: 'amber', text: current ? `Emails sent to ${current.address} are not read here yet (add its app password on the server). Contact page requests still appear.` : 'Receiving email is not switched on yet. Contact page requests still appear here.' }
    : broken ? { tone: 'rose', text: `Could not read ${broken.address}: ${broken.error}` } : null);

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900">{box === 'all' ? 'All inboxes' : `${boxLabel(box)} inbox`}<span className="font-normal text-slate-400"> · {folderLabel[filter]}</span></h2>
            <p className="flex min-w-0 items-center gap-1.5 truncate text-xs text-slate-500">
              <span className={`h-2 w-2 shrink-0 rounded-full ${current ? (current.error ? 'bg-rose-500' : current.receiving === false ? 'bg-slate-300' : current.connected ? 'bg-emerald-500' : 'bg-amber-400') : status?.connected ? 'bg-emerald-500' : status?.configured ? 'bg-rose-500' : 'bg-amber-400'}`} />
              <span className="truncate">
                {current
                  ? current.receiving === false ? <>{current.address} · Contact page requests only</> : <>{current.address}{current.lastSyncAt ? <> · checked {ago(current.lastSyncAt)}</> : null}</>
                  : status?.configured ? <>{boxes.filter(b => b.receiving !== false).map(b => b.address).join(' and ')}{status?.lastSyncAt ? <> · checked {ago(status.lastSyncAt)}</> : null}</> : 'Receiving email is off'}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${box === 'all' ? 'all mail' : boxLabel(box)}`} className="h-10 w-full rounded-xl border-0 bg-slate-100 pl-9 pr-3 text-sm text-slate-900 outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#007ac2]" aria-label="Search mail" />
          </label>
          <button onClick={sync} disabled={syncing || !status?.configured} title={status?.configured ? 'Check for new email' : 'Receiving email is not switched on'}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white px-3.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40">
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">{syncMsg || 'Check mail'}</span>
          </button>
        </div>
      </div>
      {banner && (
        <div className={`flex items-start gap-2 px-4 py-3 text-sm ${banner.tone === 'rose' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-900'}`}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{banner.text}</span>
        </div>
      )}

      {loading ? (
        <div className="divide-y divide-slate-100">{[0, 1, 2, 3, 4].map(i => <div key={i} className="flex gap-3 p-4"><div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" /><div className="flex-1 space-y-2"><div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" /><div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" /></div></div>)}</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Inbox className="h-7 w-7" /></span>
          <p className="mt-4 font-semibold text-slate-900">{query ? 'Nothing matches your search' : filter === 'unread' ? 'You’re all caught up' : filter === 'archived' ? 'Nothing archived' : filter === 'contact' ? 'No open contact requests' : 'No messages here'}</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">{box === 'all' ? 'Emails to your Hogicar addresses and requests from the Contact page appear here.' : `Emails to ${box} appear here.`}</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map(r => (
            <li key={r.id}>
              <button onClick={() => { setOpenId(r.id); setRows(rs => rs.map(x => x.id === r.id ? { ...x, read: true } : x)); }}
                className={`group relative flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 sm:px-5 ${r.read ? '' : 'bg-sky-50/40'}`}>
                {!r.read && <span className="absolute left-0 top-0 h-full w-[3px] bg-[#007ac2]" />}
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white ${avatarTone(r.fromAddress)}`}>{initials(r.fromName, r.fromAddress)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className={`truncate text-sm ${r.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>{r.fromName || r.fromAddress}</span>
                    {r.source === 'CONTACT' && <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">Contact form</span>}
                    {r.replied && <span className="shrink-0 text-emerald-600" title="Answered"><CheckCircle className="h-3.5 w-3.5" /></span>}
                    {box === 'all' && boxes.length > 1 && r.mailbox && <span className="hidden shrink-0 rounded-md bg-slate-100 px-1.5 py-px text-[10px] font-semibold text-slate-500 sm:inline">{boxLabel(r.mailbox)}</span>}
                    <span className="ml-auto shrink-0 text-xs text-slate-500">{when(r.receivedAt)}</span>
                  </span>
                  <span className={`mt-0.5 flex items-center gap-1.5 truncate text-sm ${r.read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                    <span className="truncate">{r.subject || '(no subject)'}</span>
                    {r.attachmentCount > 0 && <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-slate-500">{r.snippet}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <AnimatePresence>
        {openId != null && <Reader id={openId} onClose={() => setOpenId(null)} onReply={m => { setOpenId(null); onReply(m); }} onChanged={() => load(true)} />}
      </AnimatePresence>
      {syncing && <span className="sr-only"><Spinner /></span>}
    </section>
  );
};

export default InboxPanel;
