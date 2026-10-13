import * as React from 'react';
import Star from 'lucide-react/dist/esm/icons/star';
import Info from 'lucide-react/dist/esm/icons/info';
import { getRatingDescription, normalizeRatingScore } from '../utils/ratings';

type Size = 'sm' | 'md' | 'lg';

interface RatingBadgeProps {
  rating: number;
  reviewCount?: number | null;
  size?: Size;
  /** Score box only, no words under it. */
  tileOnly?: boolean;
  /** Text under the label when there is no rating count. */
  fallbackText?: string;
  /** Small info icon after the label (the badge opens the breakdown). */
  showInfo?: boolean;
  /** Words beside the box instead of under it. */
  inline?: boolean;
}

const box: Record<Size, string> = {
  sm: 'h-9 gap-1 rounded-[10px] px-2.5 text-[17px]',
  md: 'h-11 gap-1.5 rounded-xl px-3 text-xl',
  lg: 'h-16 gap-2 rounded-2xl px-4 text-[28px]',
};
const star: Record<Size, string> = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-7 w-7' };
const label: Record<Size, string> = { sm: 'text-sm', md: 'text-[15px]', lg: 'text-lg' };
const sub: Record<Size, string> = { sm: 'text-xs', md: 'text-[13px]', lg: 'text-sm' };

export const reviewCountText = (count?: number | null) => {
  const n = Number(count || 0);
  if (!n) return '';
  return `${n.toLocaleString()} ${n === 1 ? 'rating' : 'ratings'}`;
};

/** Supplier score (out of 10): outlined box with a star, the word and the number of ratings. */
export const RatingBadge: React.FC<RatingBadgeProps> = ({ rating, reviewCount, size = 'md', tileOnly, fallbackText = 'Customer rating', showInfo, inline }) => {
  const score = normalizeRatingScore(rating);
  const scoreBox = (
    <span
      className={`${box[size]} inline-flex shrink-0 items-center justify-center border border-slate-300/80 bg-white font-bold tabular-nums leading-none tracking-tight text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]`}
      title={tileOnly ? `${score.toFixed(1)} out of 10 · ${getRatingDescription(score)}` : undefined}
    >
      {score.toFixed(1)}
      <Star className={`${star[size]} fill-[#f5b301] text-[#f5b301]`} aria-hidden="true" />
    </span>
  );
  if (tileOnly) return scoreBox;

  // Rating counts are hidden for now; the line under the word stays the same for every supplier.
  const count = '';
  return (
    <span className={inline ? 'inline-flex items-center gap-3' : 'inline-flex flex-col items-start gap-2'}>
      {scoreBox}
      <span className="leading-tight">
        <span className={`flex items-center gap-1.5 font-semibold text-slate-900 ${label[size]}`}>
          {getRatingDescription(score)}
          <span className="sr-only">, {score.toFixed(1)} out of 10</span>
          {showInfo && <Info className="h-4 w-4 text-accent" aria-hidden="true" />}
        </span>
        <span className={`mt-0.5 block text-slate-500 ${sub[size]}`}>{count || fallbackText}</span>
      </span>
    </span>
  );
};

export default RatingBadge;
