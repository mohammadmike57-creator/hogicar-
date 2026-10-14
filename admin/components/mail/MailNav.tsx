import * as React from 'react';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import Layers from 'lucide-react/dist/esm/icons/layers';
import MailOpen from 'lucide-react/dist/esm/icons/mail';
import MessageSquareText from 'lucide-react/dist/esm/icons/message-square-text';
import Archive from 'lucide-react/dist/esm/icons/archive';
import Send from 'lucide-react/dist/esm/icons/send';
import PenLine from 'lucide-react/dist/esm/icons/pen-line';
import Signature from 'lucide-react/dist/esm/icons/signature';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase-business';
import CalendarCheck from 'lucide-react/dist/esm/icons/calendar-check';
import AtSign from 'lucide-react/dist/esm/icons/at-sign';
import type { InboxStatus, MailboxStatus } from './InboxPanel';

export type Folder = 'all' | 'unread' | 'contact' | 'archived';
export type MailView = { kind: 'inbox'; box: string; folder: Folder } | { kind: 'compose' } | { kind: 'sent' };

/** "booking@hogicar.com" → "Bookings"; "business@…" → "Business". */
export const boxLabel = (address: string) => {
  if (address === 'all') return 'All inboxes';
  const local = address.split('@')[0].toLowerCase();
  const known: Record<string, string> = { booking: 'Bookings', bookings: 'Bookings', business: 'Business', info: 'Info', support: 'Support', sales: 'Sales' };
  return known[local] || local.charAt(0).toUpperCase() + local.slice(1);
};
export const folderLabel: Record<Folder, string> = { all: 'Inbox', unread: 'Unread', contact: 'Contact requests', archived: 'Archived' };

const tone = (address: string) => address === 'all' ? 'bg-slate-900' : /^book/i.test(address) ? 'bg-[#007ac2]' : /^business/i.test(address) ? 'bg-[#0f2b4d]' : 'bg-[#0f766e]';

const Count: React.FC<{ n?: number; active?: boolean }> = ({ n, active }) => n ? (
  <span className={`ml-auto min-w-[22px] rounded-full px-1.5 py-px text-center text-[11px] font-semibold tabular-nums ${active ? 'bg-[#007ac2] text-white' : 'bg-slate-200/80 text-slate-700'}`}>{n > 999 ? '999+' : n}</span>
) : null;

/** The mailbox list and folders, like the side of a mail app. On phones it folds into a mailbox picker and folder chips. */
export const MailNav: React.FC<{
  view: MailView; status: InboxStatus | null; sentCount: number;
  onView: (v: MailView) => void; onCompose: () => void; onSignature: () => void; composeLabel: string;
}> = ({ view, status, sentCount, onView, onCompose, onSignature, composeLabel }) => {
  const boxes: MailboxStatus[] = status?.mailboxes || [];
  const all: MailboxStatus = { address: 'all', unread: status?.unread || 0, connected: !!status?.connected };
  const list = boxes.length > 1 ? [all, ...boxes] : boxes.length ? boxes : [all];
  const box = view.kind === 'inbox' ? view.box : null;
  const folder = view.kind === 'inbox' ? view.folder : null;
  const current = box ? list.find(b => b.address === box) || all : null;
  const contactBox = status?.contactMailbox || '';
  const showContact = !current || current.address === 'all' || current.address === contactBox;
  const unreadHere = current ? current.unread : status?.unread;
  const openBox = (address: string) => onView({ kind: 'inbox', box: address, folder: folder || 'all' });
  const openFolder = (f: Folder) => onView({ kind: 'inbox', box: box || (list[0]?.address ?? 'all'), folder: f });

  const folders: { key: Folder; Icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { key: 'all', Icon: Inbox, count: unreadHere },
    { key: 'unread', Icon: MailOpen },
    ...(showContact ? [{ key: 'contact' as Folder, Icon: MessageSquareText, count: status?.openContact }] : []),
    { key: 'archived', Icon: Archive },
  ];

  const dot = (b: MailboxStatus) => b.address === 'all' ? null
    : <span title={b.error ? `Not connected: ${b.error}` : b.receiving === false ? 'Contact page requests only' : b.connected ? 'Connected' : 'Waiting for the first check'}
        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${b.error ? 'bg-rose-500' : b.receiving === false ? 'bg-slate-300' : b.connected ? 'bg-emerald-500' : 'bg-amber-400'}`} />;

  return (
    <>
      {/* Phones and tablets: pick the mailbox, then the folder. */}
      <div className="min-w-0 space-y-3 lg:hidden">
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Mailbox</span>
            <select value={view.kind === 'inbox' ? view.box : view.kind} onChange={e => {
              const v = e.target.value;
              if (v === 'sent') onView({ kind: 'sent' }); else if (v === 'compose') onCompose(); else openBox(v);
            }} className="h-12 w-full appearance-none rounded-xl bg-white pl-4 pr-10 text-[16px] font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-[#007ac2]">
              <optgroup label="Mailboxes">
                {list.map(b => <option key={b.address} value={b.address}>{b.address === 'all' ? 'All inboxes' : `${boxLabel(b.address)} inbox`}{b.unread ? ` (${b.unread})` : ''}</option>)}
              </optgroup>
              <optgroup label="Other">
                <option value="sent">Sent</option>
                {view.kind === 'compose' && <option value="compose">{composeLabel}</option>}
              </optgroup>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          </label>
          <button onClick={onCompose} className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-[#007ac2] px-4 text-sm font-semibold text-white shadow-sm"><PenLine className="h-4 w-4" /><span className="hidden sm:inline">New email</span></button>
        </div>
        {view.kind === 'inbox' && (
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {folders.map(f => {
              const active = folder === f.key;
              return (
                <button key={f.key} onClick={() => openFolder(f.key)} className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition ${active ? 'bg-[#0f2b4d] text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>
                  <f.Icon className="h-4 w-4" />{folderLabel[f.key]}{f.count ? <span className={`rounded-full px-1.5 text-[11px] ${active ? 'bg-white/20' : 'bg-sky-100 text-sky-800'}`}>{f.count}</span> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop: a fixed side panel. */}
      <aside className="hidden h-fit rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-4 lg:block">
        <button onClick={onCompose} className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold shadow-sm transition ${view.kind === 'compose' ? 'bg-[#0f2b4d] text-white' : 'bg-[#007ac2] text-white hover:bg-[#0068a5]'}`}>
          <PenLine className="h-4 w-4" /> {view.kind === 'compose' ? composeLabel : 'New email'}
        </button>

        <p className="mb-1.5 mt-5 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Mailboxes</p>
        <ul className="space-y-0.5">
          {list.map(b => {
            const active = box === b.address;
            return (
              <li key={b.address}>
                <button onClick={() => openBox(b.address)} aria-current={active ? 'true' : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${active ? 'bg-sky-50 ring-1 ring-sky-200' : 'hover:bg-slate-50'}`}>
                  <span className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${tone(b.address)}`}>
                    {(() => { const I = b.address === 'all' ? Layers : /^book/i.test(b.address) ? CalendarCheck : /^business/i.test(b.address) ? Briefcase : AtSign; return <I className="h-4 w-4" />; })()}
                    {dot(b)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${active ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>{boxLabel(b.address)}</span>
                    <span className="block truncate text-xs text-slate-500">{b.address === 'all' ? `${boxes.length} address${boxes.length === 1 ? '' : 'es'}` : b.address}</span>
                  </span>
                  <Count n={b.unread} active={active} />
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mb-1.5 mt-5 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{current ? `Folders · ${boxLabel(current.address)}` : 'Folders'}</p>
        <ul className="space-y-0.5">
          {folders.map(f => {
            const active = folder === f.key;
            return (
              <li key={f.key}>
                <button onClick={() => openFolder(f.key)} className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition ${active ? 'bg-slate-900 font-semibold text-white' : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                  <f.Icon className="h-4 w-4 shrink-0" />{folderLabel[f.key]}
                  {f.count ? <span className={`ml-auto rounded-full px-1.5 text-[11px] font-semibold ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-700'}`}>{f.count}</span> : null}
                </button>
              </li>
            );
          })}
          <li>
            <button onClick={() => onView({ kind: 'sent' })} className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition ${view.kind === 'sent' ? 'bg-slate-900 font-semibold text-white' : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Send className="h-4 w-4 shrink-0" />Sent
              {sentCount ? <span className={`ml-auto text-xs tabular-nums ${view.kind === 'sent' ? 'text-white/70' : 'text-slate-400'}`}>{sentCount}</span> : null}
            </button>
          </li>
        </ul>

        <div className="mt-5 border-t border-slate-100 pt-3">
          <button onClick={onSignature} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"><Signature className="h-4 w-4" /> Signature</button>
        </div>
      </aside>
    </>
  );
};

export default MailNav;
