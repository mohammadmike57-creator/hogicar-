import * as React from 'react';
import { Link } from 'react-router-dom';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Percent from 'lucide-react/dist/esm/icons/percent';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Star from 'lucide-react/dist/esm/icons/star';
import Plane from 'lucide-react/dist/esm/icons/plane';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Tag from 'lucide-react/dist/esm/icons/tag';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

export type PromoBanner = {
  id?: number;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  badge?: string | null;
  badgeCaption?: string | null;
  theme: string;
  icon?: string | null;
  imageUrl?: string | null;
  positionAfter?: number;
  audience?: string;
};

export const BANNER_ICONS: Record<string, any> = { gift: Gift, percent: Percent, shield: ShieldCheck, star: Star, plane: Plane, crown: Crown, sparkles: Sparkles, clock: Clock, tag: Tag };

export const BANNER_THEMES: Record<string, { label: string; bg: string; glow: string; iconTile: string; badge: string; cta: string; eyebrow: string; sub: string; swatch: string }> = {
  NAVY: { label: 'Navy', bg: 'bg-gradient-to-r from-[#00244f] via-[#003a7a] to-[#0a5fa8]', glow: 'bg-amber-400/25', iconTile: 'bg-amber-400 text-[#00244f] shadow-amber-500/30', badge: 'text-amber-300', cta: 'bg-white text-[#00244f] hover:bg-amber-50', eyebrow: 'text-amber-300', sub: 'text-white/75', swatch: 'from-[#00244f] to-[#0a5fa8]' },
  GOLD: { label: 'Gold', bg: 'bg-gradient-to-r from-[#3b2604] via-[#7a5310] to-[#c99a35]', glow: 'bg-yellow-200/30', iconTile: 'bg-gradient-to-br from-yellow-100 to-amber-300 text-[#3b2604] shadow-amber-900/30', badge: 'text-yellow-100', cta: 'bg-[#1c1303] text-amber-100 hover:bg-black', eyebrow: 'text-yellow-200', sub: 'text-amber-50/80', swatch: 'from-[#3b2604] to-[#c99a35]' },
  EMERALD: { label: 'Emerald', bg: 'bg-gradient-to-r from-[#032f27] via-[#065f4b] to-[#0e9f77]', glow: 'bg-emerald-300/25', iconTile: 'bg-emerald-300 text-[#032f27] shadow-emerald-900/30', badge: 'text-emerald-200', cta: 'bg-white text-[#044034] hover:bg-emerald-50', eyebrow: 'text-emerald-200', sub: 'text-emerald-50/80', swatch: 'from-[#032f27] to-[#0e9f77]' },
  SUNSET: { label: 'Sunset', bg: 'bg-gradient-to-r from-[#6b1d0b] via-[#c2410c] to-[#f59e0b]', glow: 'bg-yellow-300/30', iconTile: 'bg-white text-[#c2410c] shadow-orange-900/30', badge: 'text-yellow-100', cta: 'bg-white text-[#9a3412] hover:bg-orange-50', eyebrow: 'text-yellow-100', sub: 'text-orange-50/85', swatch: 'from-[#6b1d0b] to-[#f59e0b]' },
  MIDNIGHT: { label: 'Midnight', bg: 'bg-gradient-to-r from-[#0a0d16] via-[#151b2c] to-[#2a3350]', glow: 'bg-sky-400/20', iconTile: 'bg-gradient-to-br from-sky-300 to-indigo-400 text-[#0a0d16] shadow-indigo-900/40', badge: 'text-sky-200', cta: 'bg-gradient-to-r from-sky-300 to-indigo-300 text-[#0a0d16] hover:brightness-110', eyebrow: 'text-sky-300', sub: 'text-slate-300', swatch: 'from-[#0a0d16] to-[#2a3350]' },
  IMAGE: { label: 'Picture', bg: 'bg-slate-900', glow: 'bg-transparent', iconTile: 'bg-white/95 text-slate-900 shadow-black/30', badge: 'text-white', cta: 'bg-white text-slate-900 hover:bg-slate-100', eyebrow: 'text-amber-300', sub: 'text-white/85', swatch: 'from-slate-700 to-slate-400' },
};

const isExternal = (url: string) => /^https?:\/\//.test(url);

/** A promotional banner shown between search results (also used for the live preview in the admin). */
const SearchPromoBanner: React.FC<{ banner: PromoBanner; onDismiss?: () => void; preview?: boolean }> = ({ banner, onDismiss, preview = false }) => {
  const t = BANNER_THEMES[banner.theme] || BANNER_THEMES.NAVY;
  const Icon = banner.icon ? BANNER_ICONS[banner.icon] : null;
  const track = () => { try { (window as any).dataLayer?.push({ event: 'promo_banner_click', banner_id: banner.id, banner_title: banner.title }); } catch { /* ignore */ } };

  const cta = banner.ctaLabel && banner.ctaUrl ? (
    preview ? (
      <span className={`inline-flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold shadow-lg ${t.cta}`}>{banner.ctaLabel} <ArrowRight className="h-4 w-4" /></span>
    ) : isExternal(banner.ctaUrl) ? (
      <a href={banner.ctaUrl} target="_blank" rel="noopener noreferrer" onClick={track} className={`inline-flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold shadow-lg transition ${t.cta}`}>{banner.ctaLabel} <ArrowRight className="h-4 w-4" /></a>
    ) : (
      <Link to={banner.ctaUrl} onClick={track} className={`group inline-flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold shadow-lg transition ${t.cta}`}>{banner.ctaLabel} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
    )
  ) : null;

  return (
    <aside aria-label={banner.title} className={`relative isolate overflow-hidden rounded-xl ${t.bg} text-white shadow-[0_18px_40px_-24px_rgba(2,24,64,0.6)] ring-1 ring-black/5`}>
      {banner.theme === 'IMAGE' && banner.imageUrl && (
        <>
          <img src={banner.imageUrl} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/55 to-black/10" />
        </>
      )}
      {banner.theme !== 'IMAGE' && (
        <>
          <div aria-hidden="true" className={`absolute -right-12 -top-20 -z-10 h-56 w-56 rounded-full ${t.glow} blur-3xl`} />
          <div aria-hidden="true" className="absolute -bottom-24 left-1/3 -z-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <svg aria-hidden="true" className="absolute right-0 top-0 -z-10 h-full w-1/2 opacity-[0.07]" preserveAspectRatio="none" viewBox="0 0 200 100">
            {Array.from({ length: 9 }, (_, i) => <circle key={i} cx="200" cy="0" r={20 + i * 18} fill="none" stroke="white" strokeWidth="1" />)}
          </svg>
        </>
      )}
      <div className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5 ${onDismiss ? 'pr-10 sm:pr-12' : ''}`}>
        {Icon && (
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg sm:h-14 sm:w-14 ${t.iconTile}`}>
            <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          {banner.eyebrow && <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${t.eyebrow}`}>{banner.eyebrow}</p>}
          <h3 className="mt-0.5 text-lg font-bold leading-snug tracking-tight sm:text-xl">{banner.title}</h3>
          {banner.subtitle && <p className={`mt-1 max-w-xl text-sm leading-relaxed ${t.sub}`}>{banner.subtitle}</p>}
        </div>
        {(banner.badge || cta) && (
          <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
            {banner.badge && (
              <div className="text-left sm:text-right">
                <p className={`text-3xl font-black leading-none tracking-tight sm:text-4xl ${t.badge}`}>{banner.badge}</p>
                {banner.badgeCaption && <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/70">{banner.badgeCaption}</p>}
              </div>
            )}
            {cta}
          </div>
        )}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Hide this offer" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      )}
    </aside>
  );
};

export default SearchPromoBanner;
