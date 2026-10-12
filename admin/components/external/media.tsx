import * as React from 'react';
import CarIcon from 'lucide-react/dist/esm/icons/car';
import { API_BASE_URL } from '../../../lib/config';

/** Visual building blocks for the External suppliers screen: logos, car photos, flags, skeletons, empty states. */

/** Relative image paths from the API ("/uploads/x.png") live on the backend host. */
export const resolveImageUrl = (url?: string | null): string | null => {
  const u = typeof url === 'string' ? url.trim() : '';
  if (!u) return null;
  if (u.startsWith('//') || /^(https?:|data:|blob:)/i.test(u)) return u;
  if (u.startsWith('/')) return `${API_BASE_URL}${u}`;
  return u;
};

/** First non-empty string among the given candidates. */
export const firstString = (...values: unknown[]): string | undefined => {
  for (const v of values) if (typeof v === 'string' && v.trim()) return v;
  return undefined;
};

const MONO_TONES = [
  'bg-sky-50 text-sky-700 ring-sky-100',
  'bg-emerald-50 text-emerald-700 ring-emerald-100',
  'bg-violet-50 text-violet-700 ring-violet-100',
  'bg-amber-50 text-amber-700 ring-amber-100',
  'bg-rose-50 text-rose-700 ring-rose-100',
  'bg-teal-50 text-teal-700 ring-teal-100',
  'bg-indigo-50 text-indigo-700 ring-indigo-100',
];

export const initialsOf = (name?: string) =>
  (name || '?').replace(/[^\p{L}\p{N}\s&-]/gu, ' ').split(/[\s&-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

const toneOf = (name?: string) => MONO_TONES[[...(name || '')].reduce((n, c) => n + c.charCodeAt(0), 0) % MONO_TONES.length];

const LOGO_SIZES = {
  sm: 'h-10 w-14 rounded-lg p-1 text-xs',
  md: 'h-14 w-20 rounded-xl p-1.5 text-sm',
  lg: 'h-16 w-24 rounded-2xl p-2 text-base',
} as const;

/** Supplier logo on a white tile; falls back to a soft monogram when missing or broken. */
export const SupplierLogo: React.FC<{ src?: string | null; name?: string; size?: keyof typeof LOGO_SIZES; className?: string }> = ({ src, name, size = 'md', className = '' }) => {
  const url = resolveImageUrl(src);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [url]);
  const box = `flex shrink-0 items-center justify-center overflow-hidden ring-1 ring-inset ${LOGO_SIZES[size]} ${className}`;
  if (!url || failed) {
    return <span className={`${box} font-semibold tracking-wide ${toneOf(name)}`} aria-hidden="true">{initialsOf(name)}</span>;
  }
  return (
    <span className={`${box} bg-white ring-slate-200`}>
      <img src={url} alt={name ? `${name} logo` : ''} loading="lazy" className="h-full w-full object-contain" onError={() => setFailed(true)} />
    </span>
  );
};

/** 4:3 car photo on light slate; car icon when there is no usable image. */
export const CarImage: React.FC<{ src?: string | null; alt?: string; className?: string }> = ({ src, alt = '', className = '' }) => {
  const url = resolveImageUrl(src);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [url]);
  return (
    <span className={`flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-inset ring-slate-100 ${className}`}>
      {url && !failed
        ? <img src={url} alt={alt} loading="lazy" className="h-full w-full object-contain p-1.5" onError={() => setFailed(true)} />
        : <CarIcon className="h-1/3 w-1/3 text-slate-300" aria-hidden="true" />}
    </span>
  );
};

export const flagOf = (code?: string) =>
  /^[A-Za-z]{2}$/.test(code || '') ? (code as string).toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('') : '🌐';

export const Flag: React.FC<{ code?: string; className?: string }> = ({ code, className = 'h-12 w-12 text-2xl' }) => (
  <span className={`flex shrink-0 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-inset ring-slate-100 ${className}`} aria-hidden="true">{flagOf(code)}</span>
);

export const Bone: React.FC<{ className?: string }> = ({ className = '' }) => <span className={`block animate-pulse rounded-md bg-slate-200/70 ${className}`} />;

export const CountrySkeletons: React.FC = () => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="flex items-center gap-3"><Bone className="h-12 w-12 rounded-xl" /><div className="flex-1 space-y-2"><Bone className="h-4 w-32" /><Bone className="h-3 w-10" /></div></div>
        <Bone className="mt-4 h-14 w-full rounded-xl" />
      </div>
    ))}
  </div>
);

export const LocationSkeletons: React.FC = () => (
  <div className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200" aria-busy="true">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-3.5">
        <Bone className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2"><Bone className="h-4 w-48 max-w-full" /><Bone className="h-3 w-20" /></div>
        <Bone className="h-6 w-12" />
      </div>
    ))}
  </div>
);

export const SupplierSkeletons: React.FC = () => (
  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3" aria-busy="true">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
        <div className="flex items-center gap-3"><Bone className="h-14 w-20 rounded-xl" /><div className="flex-1 space-y-2"><Bone className="h-4 w-40 max-w-full" /><Bone className="h-3 w-16" /></div></div>
        <Bone className="mt-4 h-16 w-full rounded-xl" />
        <div className="mt-4 flex gap-2"><Bone className="h-7 w-28 rounded-full" /><Bone className="h-7 w-24 rounded-full" /></div>
        <Bone className="mt-4 h-10 w-full rounded-xl" />
      </div>
    ))}
  </div>
);

export const EmptyState: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  action?: { label: string; onClick: () => void; icon?: React.ComponentType<{ className?: string }>; disabled?: boolean };
}> = ({ icon: Icon, title, text, action }) => (
  <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-slate-200">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon className="h-6 w-6" /></span>
    <p className="mt-4 text-base font-semibold text-slate-900">{title}</p>
    <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
    {action && (
      <button type="button" onClick={action.onClick} disabled={action.disabled}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#007ac2] px-4 text-sm font-semibold text-white hover:bg-[#00679f] disabled:opacity-60">
        {action.icon && <action.icon className="h-4 w-4" />}{action.label}
      </button>
    )}
  </div>
);
