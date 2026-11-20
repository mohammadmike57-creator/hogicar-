import * as React from 'react';
import { createPortal } from 'react-dom';
import X from 'lucide-react/dist/esm/icons/x';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Clock from 'lucide-react/dist/esm/icons/clock';
import ThumbsUp from 'lucide-react/dist/esm/icons/thumbs-up';
import Users from 'lucide-react/dist/esm/icons/users';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import { CarRatings } from '../types';
import { RatingBadge } from './RatingBadge';
import { fetchSupplierReviewSummary } from '../api';
import MessageSquareQuote from 'lucide-react/dist/esm/icons/message-square-quote';

interface RatingsModalProps {
  open: boolean;
  onClose: () => void;
  ratings: CarRatings;
  rating: number;
  supplierName: string;
  supplierLogo?: React.ReactNode;
  reviewCount?: number;
  /** When set, a short summary of this company's latest reviews at this location is shown. */
  reviewSupplierId?: string;
  reviewLocationId?: string;
}

const ratingItems: { key: keyof CarRatings; label: string; icon: React.ElementType }[] = [
  { key: 'condition', label: 'Car condition', icon: ShieldCheck },
  { key: 'cleanliness', label: 'Car cleanliness', icon: Sparkles },
  { key: 'staffService', label: 'Staff helpfulness', icon: Users },
  { key: 'valueForMoney', label: 'Value for money', icon: ThumbsUp },
  { key: 'easeOfLocating', label: 'Ease of finding the desk', icon: MapPin },
  { key: 'pickupSpeed', label: 'Pick-up speed', icon: Clock },
  { key: 'dropoffSpeed', label: 'Drop-off speed', icon: RotateCcw },
];

const clampPercent = (value: number | undefined) => Math.max(0, Math.min(100, Number(value || 0)));

const barColor = (percent: number) => {
  if (percent >= 80) return 'bg-emerald-500';
  if (percent >= 60) return 'bg-lime-500';
  if (percent >= 40) return 'bg-amber-500';
  return 'bg-red-500';
};

/**
 * Supplier rating breakdown shown as a centred dialog. Rendered into document.body so it
 * is never clipped or offset by a transformed/overflowing parent card.
 */
export const RatingsModal: React.FC<RatingsModalProps> = ({ open, onClose, ratings, rating, supplierName, supplierLogo, reviewCount, reviewSupplierId, reviewLocationId }) => {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [summary, setSummary] = React.useState<{ summary?: string; reviewCount?: number } | null>(null);

  React.useEffect(() => {
    if (!open || !reviewSupplierId || !reviewLocationId) return;
    let alive = true;
    setSummary(null);
    fetchSupplierReviewSummary(reviewSupplierId, reviewLocationId).then(r => { if (alive) setSummary(r); });
    return () => { alive = false; };
  }, [open, reviewSupplierId, reviewLocationId]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const stop = (e: React.SyntheticEvent) => { e.stopPropagation(); };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/50 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ratings-modal-title"
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
        onClick={stop}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {supplierLogo && <div className="flex h-10 shrink-0 items-center">{supplierLogo}</div>}
            <div className="min-w-0">
              <h2 id="ratings-modal-title" className="truncate text-base font-bold text-slate-900">{supplierName}</h2>
              <p className="text-sm text-slate-500">Customer ratings</p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close ratings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pt-5">
          <RatingBadge
            rating={rating}
            size="lg"
            inline
            reviewCount={reviewCount}
            fallbackText="Based on recent customer ratings"
          />
        </div>

        {reviewSupplierId && reviewLocationId && (summary === null || summary.summary) && (
          <div className="mx-5 mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <MessageSquareQuote className="h-4 w-4 text-accent" /> What customers say
            </p>
            {summary === null ? (
              <div className="mt-2 space-y-1.5" aria-label="Loading reviews">
                <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-slate-200" />
              </div>
            ) : (
              <>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{summary.summary}</p>
                {!!summary.reviewCount && <p className="mt-1.5 text-xs text-slate-500">Summary of the latest {summary.reviewCount} reviews at this location</p>}
              </>
            )}
          </div>
        )}

        <ul className="space-y-4 px-5 py-5">
          {ratingItems.map(item => {
            const percent = clampPercent(ratings[item.key]);
            return (
              <li key={item.key}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-700">
                    <item.icon className="h-4 w-4 text-slate-400" />
                    {item.label}
                  </span>
                  <span className="font-semibold text-slate-900">{(percent / 10).toFixed(1)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${barColor(percent)}`} style={{ width: `${percent}%` }} />
                </div>
              </li>
            );
          })}
        </ul>

        <p className="border-t border-slate-100 px-5 py-4 text-xs leading-relaxed text-slate-500">
          Scores come from customers who rented from this company at this location.
        </p>
      </div>
    </div>,
    document.body
  );
};

export default RatingsModal;
