import * as React from 'react';
import { createPortal } from 'react-dom';
import Check from 'lucide-react/dist/esm/icons/check';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Search from 'lucide-react/dist/esm/icons/search';
import X from 'lucide-react/dist/esm/icons/x';
import { useCurrency } from '../../contexts/CurrencyContext';
import { flagSrc } from './flags';

type Currency = { code: string; name: string; symbol: string; flag?: string };

const POPULAR = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'JOD'];

/** Country code from a flag emoji (🇺🇸 → "us"). */
const isoOf = (flag?: string) => {
  if (!flag) return '';
  const cps = Array.from(flag).map(c => c.codePointAt(0) || 0).filter(cp => cp >= 0x1f1e6 && cp <= 0x1f1ff);
  return cps.length === 2 ? cps.map(cp => String.fromCharCode(cp - 0x1f1e6 + 97)).join('') : '';
};

/** Round flag; falls back to the currency symbol. */
export const CurrencyFlag: React.FC<{ currency?: Currency; size?: number; className?: string }> = ({ currency, size = 22, className = '' }) => {
  const src = flagSrc(isoOf(currency?.flag));
  const box = { width: size, height: size };
  if (!src) {
    return (
      <span style={box} className={`inline-flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 ring-1 ring-black/5 ${className}`} aria-hidden="true">
        {(currency?.symbol || currency?.code || '?').slice(0, 3)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      style={box}
      className={`shrink-0 rounded-full object-cover ring-1 ring-black/10 ${className}`}
    />
  );
};

const useFiltered = (currencies: Currency[], query: string) =>
  React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (c: Currency) => !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q);
    const popular = POPULAR.map(code => currencies.find(c => c.code === code)).filter((c): c is Currency => !!c && match(c));
    const rest = currencies.filter(c => !POPULAR.includes(c.code) && match(c)).sort((a, b) => a.name.localeCompare(b.name));
    return { popular, rest, total: popular.length + rest.length };
  }, [currencies, query]);

const Option: React.FC<{ c: Currency; selected: boolean; onPick: (code: string) => void; dense?: boolean }> = ({ c, selected, onPick, dense }) => (
  <button
    type="button"
    role="option"
    aria-selected={selected}
    onClick={() => onPick(c.code)}
    className={`group flex w-full items-center gap-3 rounded-xl text-start transition-colors ${dense ? 'px-2.5 py-2' : 'px-3 py-3'} ${selected ? 'bg-[#007ac2]/[0.08] ring-1 ring-inset ring-[#007ac2]/30' : 'hover:bg-slate-50 active:bg-slate-100'}`}
  >
    <CurrencyFlag currency={c} size={dense ? 24 : 28} />
    <span className="min-w-0 flex-1">
      <span className={`block text-sm font-semibold ${selected ? 'text-[#007ac2]' : 'text-slate-900'}`}>{c.code}</span>
      <span className="block truncate text-xs text-slate-500">{c.name}</span>
    </span>
    {selected
      ? <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#007ac2] text-white"><Check className="h-3 w-3" strokeWidth={3} /></span>
      : <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 group-hover:bg-white">{c.symbol}</span>}
  </button>
);

const SearchBox: React.FC<{ value: string; onChange: (v: string) => void; autoFocus?: boolean }> = ({ value, onChange, autoFocus }) => (
  <label className="relative block">
    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      autoFocus={autoFocus}
      placeholder="Search currency or country"
      aria-label="Search currencies"
      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 ps-9 pe-9 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#007ac2] focus:bg-white focus:ring-4 focus:ring-[#007ac2]/15 sm:text-sm"
    />
    {value && (
      <button type="button" onClick={() => onChange('')} className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600" aria-label="Clear search">
        <X className="h-3.5 w-3.5" />
      </button>
    )}
  </label>
);

const Lists: React.FC<{ query: string; selected: string; onPick: (code: string) => void; columns: 1 | 2 }> = ({ query, selected, onPick, columns }) => {
  const { currencies } = useCurrency();
  const { popular, rest, total } = useFiltered(currencies as Currency[], query);
  const grid = columns === 2 ? 'grid grid-cols-2 gap-1' : 'grid gap-1';
  if (total === 0) {
    return <p className="px-3 py-10 text-center text-sm text-slate-500">No currency matches “{query}”.</p>;
  }
  return (
    <div role="listbox" aria-label="Currencies" className="space-y-4">
      {popular.length > 0 && (
        <div>
          <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Popular</p>
          <div className={grid}>{popular.map(c => <Option key={c.code} c={c} selected={c.code === selected} onPick={onPick} dense={columns === 2} />)}</div>
        </div>
      )}
      {rest.length > 0 && (
        <div>
          <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">All currencies</p>
          <div className={grid}>{rest.map(c => <Option key={c.code} c={c} selected={c.code === selected} onPick={onPick} dense={columns === 2} />)}</div>
        </div>
      )}
    </div>
  );
};

/** Desktop header currency button with a searchable popover. */
export const CurrencyMenu: React.FC = () => {
  const { selectedCurrency, setSelectedCurrency, currencies } = useCurrency();
  const current = (currencies as Currency[]).find(c => c.code === selectedCurrency);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) { setQuery(''); return; }
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const pick = (code: string) => { setSelectedCurrency(code); setOpen(false); };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Currency: ${selectedCurrency}. Change currency`}
        className={`flex h-10 items-center gap-2 rounded-full ps-1.5 pe-3 text-sm font-semibold text-white ring-1 ring-inset transition ${open ? 'bg-white/15 ring-white/50' : 'ring-white/25 hover:bg-white/10 hover:ring-white/45'}`}
      >
        <CurrencyFlag currency={current} size={26} />
        <span className="tracking-wide">{selectedCurrency}</span>
        {current?.symbol && current.symbol !== selectedCurrency && <span className="text-white/60">{current.symbol}</span>}
        <ChevronDown className={`h-4 w-4 text-white/70 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
          <div
            style={{ transformOrigin: 'top right' }}
            className="hc-anim-pop absolute end-0 top-full z-50 mt-2.5 w-[440px] overflow-hidden rounded-2xl bg-white text-slate-900 shadow-[0_24px_60px_-12px_rgba(2,24,64,0.35)] ring-1 ring-black/5"
          >
            <span className="absolute -top-1.5 end-6 h-3 w-3 rotate-45 bg-white ring-1 ring-black/5" aria-hidden="true" />
            <div className="relative border-b border-slate-100 bg-white p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <p className="text-base font-semibold text-slate-900">Choose your currency</p>
                <p className="text-xs text-slate-500">Prices update instantly</p>
              </div>
              <SearchBox value={query} onChange={setQuery} autoFocus />
            </div>
            <div className="max-h-[min(420px,60vh)] overflow-y-auto overscroll-contain p-3">
              <Lists query={query} selected={selectedCurrency} onPick={pick} columns={2} />
            </div>
            <p className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] text-slate-500">
              Shown prices are converted for guidance. You pay in the currency stated at checkout.
            </p>
          </div>
      )}
    </div>
  );
};

/** Phone currency picker: a bottom sheet with search. */
export const CurrencySheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    if (!open) { setQuery(''); return; }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="currency-sheet-title">
          <div onClick={onClose} className="hc-anim-fade absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" />
          <div
            className="hc-anim-sheet relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-white text-slate-900 shadow-2xl sm:rounded-[28px]"
          >
            <div className="flex justify-center pb-1 pt-2.5" aria-hidden="true"><span className="h-1.5 w-10 rounded-full bg-slate-300" /></div>
            <div className="flex items-center justify-between gap-3 px-5 pb-3">
              <div>
                <h2 id="currency-sheet-title" className="text-lg font-semibold">Currency</h2>
                <p className="text-xs text-slate-500">Prices update instantly</p>
              </div>
              <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 active:bg-slate-200" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-5 pb-3"><SearchBox value={query} onChange={setQuery} /></div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Lists query={query} selected={selectedCurrency} onPick={code => { setSelectedCurrency(code); onClose(); }} columns={1} />
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
};
