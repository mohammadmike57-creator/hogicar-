import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Send from 'lucide-react/dist/esm/icons/send';
import PenLine from 'lucide-react/dist/esm/icons/pen-line';
import Paperclip from 'lucide-react/dist/esm/icons/paperclip';
import X from 'lucide-react/dist/esm/icons/x';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import FileSpreadsheet from 'lucide-react/dist/esm/icons/file-spreadsheet';
import MailCheck from 'lucide-react/dist/esm/icons/mail-check';
import MailX from 'lucide-react/dist/esm/icons/mail-x';
import Signature from 'lucide-react/dist/esm/icons/signature';
import AtSign from 'lucide-react/dist/esm/icons/at-sign';
import Upload from 'lucide-react/dist/esm/icons/upload';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import { adminAxios, API_BASE_URL } from '../../api';
import InboxPanel, { InboxMessage, InboxStatus } from './mail/InboxPanel';
import Reply from 'lucide-react/dist/esm/icons/reply';
import { Hero, heroPrimary, heroButton, Drawer, ErrorBanner, Spinner, Toast, useToast, errorOf, num, ago, inputCls, Field, Toggle, Segmented } from './commercialUi';

const BASE = `${API_BASE_URL}/api/admin/mail`;
const EMAIL = /^[^@\s<>,;]+@[^@\s<>,;]+\.[^@\s<>,;]+$/;

type Settings = {
  fromAddress: string; senderName: string; signatureName: string; signatureTitle: string; signaturePhone: string;
  signatureEmail: string; signatureWebsite: string; signatureNote: string; signatureAddress?: string; signatureLogo: boolean;
};
type SentMail = {
  id: number; fromAddress: string; to: string; cc?: string; bcc?: string; subject: string; body?: string; attachments?: string;
  attachmentBytes?: number; withSignature?: boolean; status: 'SENT' | 'FAILED'; error?: string; sentAt: string;
};

const size = (b: number) => b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
const fileIcon = (name: string) => /\.(png|jpe?g|gif|webp|heic|svg)$/i.test(name) ? ImageIcon : /\.(xlsx?|csv|numbers)$/i.test(name) ? FileSpreadsheet : FileText;

/** Recipients as chips; type an address and press Enter, comma or space. */
const Recipients: React.FC<{ label: string; value: string[]; onChange: (v: string[]) => void; autoFocus?: boolean; extra?: React.ReactNode }> = ({ label, value, onChange, autoFocus, extra }) => {
  const [text, setText] = React.useState('');
  const commit = (raw: string) => {
    const parts = raw.split(/[\s,;]+/).map(p => p.trim().replace(/^<|>$/g, '')).filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) if (!next.some(x => x.toLowerCase() === p.toLowerCase())) next.push(p);
    onChange(next);
    setText('');
  };
  return (
    <div className="flex min-h-[52px] items-start gap-3 border-b border-slate-200 px-4 py-2.5 focus-within:bg-sky-50/40">
      <span className="w-14 shrink-0 pt-1.5 text-sm text-slate-500">{label}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {value.map(a => {
          const ok = EMAIL.test(a);
          return (
            <span key={a} className={`inline-flex max-w-full items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-sm ${ok ? 'bg-slate-100 text-slate-800' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'}`} title={ok ? a : 'Not a valid email address'}>
              <span className="truncate">{a}</span>
              <button type="button" onClick={() => onChange(value.filter(x => x !== a))} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/10" aria-label={`Remove ${a}`}><X className="h-3 w-3" /></button>
            </span>
          );
        })}
        <input
          value={text}
          autoFocus={autoFocus}
          onChange={e => { const v = e.target.value; if (/[\s,;]$/.test(v)) commit(v); else setText(v); }}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commit(text); }
            if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => commit(text)}
          onPaste={e => { e.preventDefault(); commit(text + ' ' + e.clipboardData.getData('text')); }}
          type="email"
          inputMode="email"
          placeholder={value.length ? '' : 'name@company.com'}
          className="min-w-[7rem] flex-1 border-0 bg-transparent py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          aria-label={label}
        />
      </div>
      {extra}
    </div>
  );
};

/** Renders the email HTML exactly as sent, in an isolated frame. */
const MailFrame: React.FC<{ html: string; minHeight?: number; title: string }> = ({ html, minHeight = 260, title }) => {
  const ref = React.useRef<HTMLIFrameElement>(null);
  const [h, setH] = React.useState(minHeight);
  const fit = () => {
    try { const d = ref.current?.contentDocument; if (d) setH(Math.max(minHeight, d.documentElement.scrollHeight + 8)); } catch { /* ignore */ }
  };
  return <iframe ref={ref} title={title} srcDoc={html} onLoad={fit} sandbox="allow-same-origin" className="w-full rounded-b-2xl border-0 bg-white" style={{ height: h }} />;
};

const SignatureDrawer: React.FC<{ settings: Settings; fromOptions: string[]; onClose: () => void; onSaved: (s: Settings) => void }> = ({ settings, fromOptions, onClose, onSaved }) => {
  const [s, setS] = React.useState<Settings>(settings);
  const [html, setHtml] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const set = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setS(p => ({ ...p, [k]: e.target.value }));

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      adminAxios.post(`${BASE}/preview`, { ...s, body: 'Kind regards,', withSignature: true }).then(r => setHtml(r.data.html)).catch(() => {});
    }, 250);
    return () => window.clearTimeout(t);
  }, [s]);

  const save = async () => {
    setBusy(true); setErr('');
    try { const r = await adminAxios.put(`${BASE}/settings`, s); onSaved(r.data); }
    catch (e) { setErr(errorOf(e, 'The signature could not be saved.')); }
    finally { setBusy(false); }
  };

  return (
    <Drawer eyebrow="Email signature" title="Your signature" onClose={onClose} busy={busy} width="max-w-[680px]"
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="hidden text-xs text-slate-500 sm:block">Added to the end of every email you send from here.</p>
          <div className="flex w-full justify-end gap-2 sm:w-auto">
            <button onClick={onClose} disabled={busy} className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
            <button onClick={save} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0b2545] px-5 text-sm font-semibold text-white hover:bg-[#123c69] disabled:opacity-60">{busy ? <Spinner light /> : <MailCheck className="h-4 w-4" />} Save signature</button>
          </div>
        </div>
      }>
      <div className="space-y-5">
        {err && <ErrorBanner text={err} onRetry={save} />}
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <p className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"><Eye className="h-3.5 w-3.5" /> Preview</p>
          {html ? <MailFrame html={html} minHeight={420} title="Signature preview" /> : <div className="h-[420px] animate-pulse bg-slate-50" />}
        </section>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><input className={inputCls} value={s.signatureName} onChange={set('signatureName')} placeholder="Mohammad Ahmad" /></Field>
          <Field label="Job title"><input className={inputCls} value={s.signatureTitle} onChange={set('signatureTitle')} placeholder="Business Development Manager" /></Field>
          <Field label="Phone"><input className={inputCls} value={s.signaturePhone} onChange={set('signaturePhone')} placeholder="+962 7 9000 0000" inputMode="tel" /></Field>
          <Field label="Email"><input className={inputCls} value={s.signatureEmail} onChange={set('signatureEmail')} placeholder="business@hogicar.com" inputMode="email" /></Field>
          <Field label="Website"><input className={inputCls} value={s.signatureWebsite} onChange={set('signatureWebsite')} placeholder="www.hogicar.com" /></Field>
          <Field label="Office address" hint="Optional."><input className={inputCls} value={s.signatureAddress || ''} onChange={set('signatureAddress')} placeholder="Amman, Jordan" /></Field>
        </div>
        <Field label="Sender name" hint="Shown as the sender in the inbox, e.g. “Mohammad Mike | Hogicar”."><input className={inputCls} value={s.senderName} onChange={set('senderName')} placeholder="Hogicar" /></Field>
        <Field label="Small print" hint="Optional, e.g. a confidentiality note. Shown in small grey text under the signature.">
          <textarea className={`${inputCls} min-h-[80px] py-2.5`} value={s.signatureNote} onChange={set('signatureNote')} maxLength={500} />
        </Field>
        <Field label="Send from" hint="Replies come back to this address.">
          <select className={inputCls} value={s.fromAddress} onChange={set('fromAddress')}>{fromOptions.map(f => <option key={f} value={f}>{f}</option>)}</select>
        </Field>
        <Toggle checked={s.signatureLogo} onChange={v => setS(p => ({ ...p, signatureLogo: v }))} label="HOGICAR letterhead" hint="Logo and navy-orange line at the top of every email. Turn off for a plain letter." />
      </div>
    </Drawer>
  );
};

const SentDrawer: React.FC<{ mail: SentMail; onClose: () => void; onReuse: (m: SentMail) => void }> = ({ mail, onClose, onReuse }) => {
  const files = (mail.attachments || '').split('\n').filter(Boolean);
  return (
    <Drawer eyebrow={mail.status === 'SENT' ? 'Sent' : 'Not sent'} title={mail.subject} onClose={onClose} width="max-w-[680px]"
      footer={<div className="flex justify-end"><button onClick={() => onReuse(mail)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0b2545] px-5 text-sm font-semibold text-white hover:bg-[#123c69]"><PenLine className="h-4 w-4" /> Use as new email</button></div>}>
      <div className="space-y-4">
        {mail.status === 'FAILED' && <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-200"><span className="font-semibold">Not sent.</span> {mail.error}</div>}
        <dl className="divide-y divide-slate-100 rounded-2xl bg-white text-sm ring-1 ring-slate-200">
          {[['From', mail.fromAddress], ['To', mail.to], ['Cc', mail.cc], ['Bcc', mail.bcc], ['Sent', new Date(mail.sentAt).toLocaleString()]].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex gap-4 px-4 py-3"><dt className="w-12 shrink-0 text-slate-500">{k}</dt><dd className="min-w-0 break-words text-slate-900">{v}</dd></div>
          ))}
        </dl>
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map(f => { const I = fileIcon(f); return <span key={f} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200"><I className="h-4 w-4 text-slate-400" />{f}</span>; })}
          </div>
        )}
        <div className="whitespace-pre-wrap rounded-2xl bg-white p-5 text-[15px] leading-relaxed text-slate-800 ring-1 ring-slate-200">{mail.body || <span className="text-slate-400">No message, attachments only.</span>}</div>
      </div>
    </Drawer>
  );
};

export const MailAdmin: React.FC = () => {
  const [tab, setTab] = React.useState<'inbox' | 'compose' | 'sent'>('inbox');
  const [inboxStatus, setInboxStatus] = React.useState<InboxStatus | null>(null);
  const [replyTo, setReplyTo] = React.useState<{ id: number; label: string } | null>(null);
  const [inboxKey, setInboxKey] = React.useState(0);
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [fromOptions, setFromOptions] = React.useState<string[]>([]);
  const [limits, setLimits] = React.useState({ maxFiles: 10, maxTotalBytes: 20 * 1048576 });
  const [loadErr, setLoadErr] = React.useState('');
  const [sent, setSent] = React.useState<SentMail[]>([]);
  const [counts, setCounts] = React.useState({ sent: 0, failed: 0 });
  const [loadingSent, setLoadingSent] = React.useState(true);
  const [showSig, setShowSig] = React.useState(false);
  const [viewing, setViewing] = React.useState<SentMail | null>(null);
  const { toast, notify: show } = useToast();

  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState<string[]>([]);
  const [cc, setCc] = React.useState<string[]>([]);
  const [bcc, setBcc] = React.useState<string[]>([]);
  const [showCc, setShowCc] = React.useState(false);
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);
  const [withSig, setWithSig] = React.useState(true);
  const [preview, setPreview] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [sendErr, setSendErr] = React.useState('');
  const [dragging, setDragging] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const loadSettings = React.useCallback(async () => {
    setLoadErr('');
    try {
      const r = await adminAxios.get(`${BASE}/settings`);
      setSettings(r.data.settings);
      setFromOptions(r.data.fromOptions || []);
      setLimits({ maxFiles: r.data.maxFiles, maxTotalBytes: r.data.maxTotalBytes });
      setFrom(f => f || r.data.settings.fromAddress);
    } catch (e) { setLoadErr(errorOf(e, 'Mail settings could not be loaded.')); }
  }, []);
  const loadSent = React.useCallback(async () => {
    setLoadingSent(true);
    try { const r = await adminAxios.get(`${BASE}/sent`, { params: { size: 50 } }); setSent(r.data.items || []); setCounts(r.data.counts || { sent: 0, failed: 0 }); }
    catch { /* shown as empty */ }
    finally { setLoadingSent(false); }
  }, []);
  React.useEffect(() => { loadSettings(); loadSent(); }, [loadSettings, loadSent]);

  React.useEffect(() => {
    if (tab !== 'compose') return;
    const t = window.setTimeout(() => {
      adminAxios.post(`${BASE}/preview`, { body, withSignature: withSig }).then(r => setPreview(r.data.html)).catch(() => {});
    }, 300);
    return () => window.clearTimeout(t);
  }, [body, withSig, settings, tab]);

  const totalBytes = files.reduce((n, f) => n + f.size, 0);
  const addFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) if (!next.some(x => x.name === f.name && x.size === f.size)) next.push(f);
    if (next.length > limits.maxFiles) { show(`Attach up to ${limits.maxFiles} files.`, 'err'); return; }
    if (next.reduce((n, f) => n + f.size, 0) > limits.maxTotalBytes) { show(`Attachments can be up to ${size(limits.maxTotalBytes)} in total.`, 'err'); return; }
    setFiles(next);
  };

  const bad = [...to, ...cc, ...bcc].filter(a => !EMAIL.test(a));
  const canSend = to.length > 0 && bad.length === 0 && subject.trim() && (body.trim() || files.length) && !sending;
  const reset = () => { setReplyTo(null); setTo([]); setCc([]); setBcc([]); setShowCc(false); setSubject(''); setBody(''); setFiles([]); setWithSig(true); setSendErr(''); };

  const send = async () => {
    if (!canSend) return;
    setSending(true); setSendErr('');
    const fd = new FormData();
    fd.append('from', from);
    fd.append('to', to.join(','));
    if (cc.length) fd.append('cc', cc.join(','));
    if (bcc.length) fd.append('bcc', bcc.join(','));
    fd.append('subject', subject.trim());
    fd.append('body', body);
    fd.append('withSignature', String(withSig));
    files.forEach(f => fd.append('files', f, f.name));
    if (replyTo) fd.append('replyTo', String(replyTo.id));
    try {
      await adminAxios.post(`${BASE}/send`, fd);
      show(`Sent to ${to.length + cc.length + bcc.length === 1 ? to[0] : `${to.length + cc.length + bcc.length} people`}.`);
      reset();
      loadSent();
      setInboxKey(k => k + 1);
    } catch (e) {
      setSendErr(errorOf(e, 'The email could not be sent.'));
      loadSent();
    } finally { setSending(false); }
  };

  const reuse = (m: SentMail) => {
    setViewing(null); setTab('compose');
    setTo((m.to || '').split(',').map(s => s.trim()).filter(Boolean));
    const c = (m.cc || '').split(',').map(s => s.trim()).filter(Boolean);
    const b = (m.bcc || '').split(',').map(s => s.trim()).filter(Boolean);
    setCc(c); setBcc(b); setShowCc(c.length + b.length > 0);
    setSubject(m.subject); setBody(m.body || ''); setWithSig(m.withSignature !== false); setFrom(m.fromAddress || from); setFiles([]);
  };

  const replyFrom = (m: InboxMessage) => {
    reset();
    setReplyTo({ id: m.id, label: m.fromName || m.fromAddress || '' });
    setTo(m.fromAddress ? [m.fromAddress] : []);
    const subj = m.subject || '';
    setSubject(/^re:/i.test(subj) ? subj : `Re: ${subj}${m.contactRef && !subj.includes(m.contactRef) ? ` [${m.contactRef}]` : ''}`);
    const first = (m.fromName || '').trim().split(/\s+/)[0];
    const quoted = (m.bodyText || (m.bodyHtml || '').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' '))
      .trim().split('\n').slice(0, 40).map(l => `> ${l.trim()}`).join('\n');
    const date = new Date(m.receivedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    setBody(`Dear ${first || 'Sir or Madam'},\n\nThank you for your message.\n\n\n\nKind regards,\n\n\nOn ${date}, ${m.fromName || m.fromAddress} wrote:\n${quoted}`);
    setTab('compose');
  };

  const sigReady = !!settings && !!(settings.signatureName || settings.signatureTitle || settings.signaturePhone);

  return (
    <div className="space-y-5">
      <Hero
        eyebrow="Mail"
        eyebrowIcon={Mail}
        title="Mail"
        subtitle="Read and answer emails and Contact page requests, and write new emails with your signature and attachments."
        actions={<>
          <button onClick={() => { setTab('compose'); reset(); }} className={heroPrimary}><PenLine className="h-4 w-4" /> New email</button>
          <button onClick={() => setShowSig(true)} disabled={!settings} className={heroButton}><Signature className="h-4 w-4" /> Signature</button>
        </>}
        kpis={[
          { label: 'Unread', value: num(inboxStatus?.unread), Icon: Mail, note: inboxStatus?.openContact ? `${inboxStatus.openContact} contact request${inboxStatus.openContact === 1 ? '' : 's'} to answer` : undefined },
          { label: 'Sent', value: num(counts.sent), Icon: MailCheck, note: counts.failed ? `${counts.failed} not sent` : undefined },
          { label: 'Sending from', value: from ? from.split('@')[0] : '…', Icon: AtSign, note: from || undefined },
          { label: 'Signature', value: sigReady ? 'Ready' : 'Not set', Icon: Signature, note: sigReady ? settings?.signatureName || undefined : 'Add your name and phone' },
        ]}
        loading={!settings && !loadErr}
      />

      {loadErr && <ErrorBanner text={loadErr} onRetry={loadSettings} />}

      <Segmented value={tab} onChange={setTab} layoutId="mail-tab" items={[{ key: 'inbox', label: 'Inbox', count: inboxStatus?.unread, dot: !!inboxStatus?.unread }, { key: 'compose', label: replyTo ? 'Reply' : 'Compose' }, { key: 'sent', label: 'Sent', count: counts.sent + counts.failed }]} />

      {tab === 'inbox' ? (
        <InboxPanel onReply={replyFrom} onStatus={setInboxStatus} refreshKey={inboxKey} />
      ) : tab === 'compose' ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <section
            className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 transition ${dragging ? 'ring-2 ring-[#007ac2]' : 'ring-slate-200'}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          >
            {replyTo && (
              <div className="flex items-center justify-between gap-3 border-b border-sky-100 bg-sky-50 px-4 py-2.5 text-sm text-sky-900">
                <span className="flex min-w-0 items-center gap-2"><Reply className="h-4 w-4 shrink-0" /><span className="truncate">Replying to <span className="font-semibold">{replyTo.label}</span> · stays in the same conversation</span></span>
                <button type="button" onClick={() => setReplyTo(null)} className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold hover:bg-sky-100">New email instead</button>
              </div>
            )}
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-2.5">
              <span className="w-14 shrink-0 text-sm text-slate-500">From</span>
              <select value={from} onChange={e => setFrom(e.target.value)} className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent py-1.5 text-sm font-medium text-slate-900 outline-none">
                {fromOptions.map(f => <option key={f} value={f}>{settings?.senderName || 'Hogicar'} &lt;{f}&gt;</option>)}
              </select>
            </div>
            <Recipients label="To" value={to} onChange={setTo} autoFocus extra={!showCc && <button type="button" onClick={() => setShowCc(true)} className="shrink-0 pt-1.5 text-sm font-semibold text-[#007ac2] hover:underline">Cc / Bcc</button>} />
            {showCc && <><Recipients label="Cc" value={cc} onChange={setCc} /><Recipients label="Bcc" value={bcc} onChange={setBcc} /></>}
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-2.5">
              <span className="w-14 shrink-0 text-sm text-slate-500">Subject</span>
              <input value={subject} onChange={e => setSubject(e.target.value)} maxLength={300} placeholder="What is this email about?" className="min-w-0 flex-1 border-0 bg-transparent py-1.5 text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400" />
            </div>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={'Dear …,\n\nWrite your message here.\n\nKind regards,'}
              className="block min-h-[300px] w-full resize-y border-0 px-4 py-4 text-[15px] leading-relaxed text-slate-900 outline-none placeholder:text-slate-400"
            />
            <p className="px-4 pb-2 text-xs text-slate-400">Tip: an empty line starts a new paragraph, **text** makes it bold and links become clickable.</p>

            {files.length > 0 && (
              <ul className="grid gap-2 border-t border-slate-100 px-4 py-3 sm:grid-cols-2">
                {files.map(f => {
                  const I = fileIcon(f.name);
                  return (
                    <li key={f.name + f.size} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#007ac2] ring-1 ring-slate-200"><I className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-900">{f.name}</span><span className="block text-xs text-slate-500">{size(f.size)}</span></span>
                      <button type="button" onClick={() => setFiles(files.filter(x => x !== f))} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200" aria-label={`Remove ${f.name}`}><X className="h-4 w-4" /></button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="space-y-3 border-t border-slate-200 bg-slate-50/70 px-4 py-4">
              <button type="button" onClick={() => fileInput.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-600 transition hover:border-[#007ac2] hover:text-[#007ac2]">
                <Upload className="h-4 w-4" /> <span><span className="font-semibold">Attach files</span> or drop them here</span>
                <span className="hidden text-xs text-slate-400 sm:inline">· up to {limits.maxFiles} files, {size(limits.maxTotalBytes)}</span>
              </button>
              <input ref={fileInput} type="file" multiple className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                <input type="checkbox" checked={withSig} onChange={e => setWithSig(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#007ac2]" />
                Add my signature
                {!sigReady && <button type="button" onClick={() => setShowSig(true)} className="font-semibold text-[#007ac2] hover:underline">Set it up</button>}
              </label>
              {sendErr && <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">{sendErr}</div>}
              {bad.length > 0 && <p className="text-sm text-rose-700">Check {bad.length === 1 ? 'this address' : 'these addresses'}: {bad.join(', ')}</p>}
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={reset} disabled={sending} className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-200/70">Discard</button>
                <button type="button" onClick={send} disabled={!canSend}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#007ac2] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0068a5] disabled:cursor-not-allowed disabled:opacity-50">
                  {sending ? <Spinner light /> : <Send className="h-4 w-4" />}
                  {sending ? 'Sending…' : 'Send'}{files.length > 0 && !sending ? <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs"><Paperclip className="h-3 w-3" />{files.length} · {size(totalBytes)}</span> : null}
                </button>
              </div>
            </div>
          </section>

          <section className="h-fit overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 xl:sticky xl:top-4">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"><Eye className="h-3.5 w-3.5" /> What they will see</p>
              <p className="mt-2 truncate text-base font-semibold text-slate-900">{subject || <span className="font-normal text-slate-400">No subject yet</span>}</p>
              <p className="mt-0.5 truncate text-sm text-slate-500">{settings?.senderName || 'Hogicar'} &lt;{from}&gt; {to.length ? <>to {to.join(', ')}</> : null}</p>
              {files.length > 0 && <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><Paperclip className="h-3.5 w-3.5" /> {files.length} attachment{files.length === 1 ? '' : 's'} · {size(totalBytes)}</p>}
            </div>
            {preview ? <MailFrame html={preview} minHeight={360} title="Email preview" /> : <div className="h-[360px] animate-pulse bg-slate-50" />}
          </section>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          {loadingSent ? (
            <div className="space-y-px">{[0, 1, 2, 3].map(i => <div key={i} className="h-[68px] animate-pulse bg-slate-50" />)}</div>
          ) : sent.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Inbox className="h-7 w-7" /></span>
              <p className="mt-4 font-semibold text-slate-900">No emails sent yet</p>
              <p className="mt-1 text-sm text-slate-500">Emails you send from here appear in this list.</p>
              <button onClick={() => setTab('compose')} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#0b2545] px-5 text-sm font-semibold text-white"><PenLine className="h-4 w-4" /> Write an email</button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sent.map(m => {
                const n = (m.attachments || '').split('\n').filter(Boolean).length;
                return (
                  <li key={m.id}>
                    <button onClick={() => setViewing(m)} className="flex w-full items-center gap-4 px-4 py-3.5 text-left hover:bg-slate-50 sm:px-5">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${m.status === 'SENT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{m.status === 'SENT' ? <MailCheck className="h-5 w-5" /> : <MailX className="h-5 w-5" />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2"><span className="truncate text-sm font-semibold text-slate-900">{m.subject}</span>{n > 0 && <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-slate-500"><Paperclip className="h-3.5 w-3.5" />{n}</span>}</span>
                        <span className="block truncate text-sm text-slate-500">To {m.to}{m.cc ? `, cc ${m.cc}` : ''}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-xs text-slate-500">{ago(m.sentAt)}</span>
                        {m.status === 'FAILED' && <span className="mt-1 inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">Not sent</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <AnimatePresence>
        {showSig && settings && <SignatureDrawer settings={settings} fromOptions={fromOptions} onClose={() => setShowSig(false)} onSaved={s => { setSettings(s); setFrom(s.fromAddress); setShowSig(false); show('Signature saved.'); }} />}
        {viewing && <SentDrawer mail={viewing} onClose={() => setViewing(null)} onReuse={reuse} />}
      </AnimatePresence>
      <Toast toast={toast} />
    </div>
  );
};

export default MailAdmin;
