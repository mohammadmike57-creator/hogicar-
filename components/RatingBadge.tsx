import * as React from 'react';
import { getRatingDescription, normalizeRatingScore } from '../utils/ratings';

type Size = 'sm' | 'md' | 'lg';

interface RatingBadgeProps {
  rating: number;
  reviewCount?: number | null;
  size?: Size;
  /** Score tile only, no words next to it. */
  tileOnly?: boolean;
  /** Text under the label when there is no review count. */
  fallbackText?: string;
  /** Adds a "See details" hint next to the review count. */
  showDetailsHint?: boolean;
}

const tileTone = (score: number) => {
  if (score >= 8.5) return 'bg-[#0b3d6e]';
  if (score >= 7.0) return 'bg-[#0f6b4f]';
  if (score >= 6.0) return 'bg-[#4d7c0f]';
  if (score >= 5.0) return 'bg-[#b45309]';
  if (score >= 3.5) return 'bg-[#c2410c]';
  return 'bg-[#b91c1c]';
};

const tileSize: Record<Size, string> = {
  sm: 'h-7 min-w-[2.25rem] rounded-md px-1.5 text-[13px]',
  md: 'h-9 min-w-[2.75rem] rounded-lg px-2 text-[15px]',
  lg: 'h-14 min-w-[4rem] rounded-xl px-3 text-2xl',
};

const labelSize: Record<Size, string> = {
  sm: 'text-[13px]',
  md: 'text-sm',
  lg: 'text-lg',
};

const subSize: Record<Size, string> = {
  sm: 'text-[11px]',
  md: 'text-xs',
  lg: 'text-sm',
};

export const reviewCountText = (count?: number | null) => {
  const n = Number(count || 0);
  if (!n) return '';
  return `${n.toLocaleString()} ${n === 1 ? 'review' : 'reviews'}`;
};

/** Supplier score (out of 10) with its word and review count. */
export const RatingBadge: React.FC<RatingBadgeProps> = ({ rating, reviewCount, size = 'md', tileOnly, fallbackText = 'Customer rating', showDetailsHint }) => {
  const score = normalizeRatingScore(rating);
  const tile = (
    <span
      className={`${tileTone(score)} ${tileSize[size]} inline-flex shrink-0 items-center justify-center font-bold tabular-nums leading-none tracking-tight text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)]`}
      aria-hidden={tileOnly ? undefined : true}
      title={tileOnly ? `${score.toFixed(1)} out of 10 · ${getRatingDescription(score)}` : undefined}
    >
      {score.toFixed(1)}
    </span>
  );
  if (tileOnly) return tile;

  const count = reviewCountText(reviewCount);
  return (
    <span className="inline-flex items-center gap-2.5">
      {tile}
      <span className="leading-tight">
        <span className={`block font-semibold text-slate-900 ${labelSize[size]}`}>
          {getRatingDescription(score)}
          <span className="sr-only">, {score.toFixed(1)} out of 10</span>
        </span>
        <span className={`mt-0.5 block text-slate-500 ${subSize[size]}`}>
          {count || fallbackText}
          {showDetailsHint && <span className="text-accent"> · See details</span>}
        </span>
      </span>
    </span>
  );
};

export default RatingBadge;
