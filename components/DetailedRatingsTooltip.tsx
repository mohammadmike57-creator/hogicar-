import * as React from 'react';
import { CarRatings } from '../types';
import { Sparkles, Clock, ThumbsUp, Users, ShieldCheck, MapPin, RotateCcw } from 'lucide-react';

interface DetailedRatingsTooltipProps {
    ratings: CarRatings;
    visible?: boolean;
    className?: string;
    align?: 'left' | 'right' | 'center';
    supplierName?: string;
    rating?: number;
    reviewCount?: number;
    compact?: boolean;
}

const getProgressBarColor = (value: number) => {
    if (value >= 80) return 'bg-[#5fd018]';
    if (value >= 70) return 'bg-[#73d13d]';
    if (value >= 60) return 'bg-[#f59e0b]';
    if (value >= 40) return 'bg-[#f97316]';
    return 'bg-[#ef4444]';
};

const clampPercent = (value: number | undefined) => Math.max(0, Math.min(100, Number(value || 0)));
const scoreFromPercent = (value: number | undefined) => (clampPercent(value) / 10).toFixed(1);

export const DetailedRatingsTooltip: React.FC<DetailedRatingsTooltipProps> = ({ ratings, visible, className = '', align = 'right', supplierName = 'Supplier', rating, reviewCount, compact = false }) => {
    const ratingItems: { key: keyof CarRatings, label: string, icon: any }[] = [
        { key: 'staffService', label: 'Staff helpfulness', icon: Users },
        { key: 'condition', label: 'Car condition', icon: ShieldCheck },
        { key: 'easeOfLocating', label: 'Ease of locating', icon: MapPin },
        { key: 'valueForMoney', label: 'Value for money', icon: ThumbsUp },
        { key: 'dropoffSpeed', label: 'Drop-off speed', icon: RotateCcw },
        { key: 'pickupSpeed', label: 'Pick-up speed', icon: Clock },
        { key: 'cleanliness', label: 'Car cleanliness', icon: Sparkles },
    ];

    const reviewText = reviewCount && reviewCount > 0 ? `${reviewCount} customer ratings` : 'recent customer ratings';

    let alignClass = 'right-0';
    let arrowClass = 'right-4';
    
    if (align === 'left') {
        alignClass = 'left-0';
        arrowClass = 'left-4';
    } else if (align === 'center') {
        alignClass = 'left-1/2 -translate-x-1/2';
        arrowClass = 'left-1/2 -translate-x-1/2';
    }

    return (
        <div 
            className={`absolute bottom-full ${alignClass} mb-3 ${compact ? 'w-[min(20rem,calc(100vw-1.5rem))]' : 'w-[min(34rem,calc(100vw-2rem))]'} transition-all duration-300 z-[1000] ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-[0.98] pointer-events-none'} ${className}`}
        >
            <div className={`absolute -bottom-2 h-4 w-4 rotate-45 rounded-sm bg-[#171717] ${arrowClass}`} />
            <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#171717] text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)]">
                <div className={`${compact ? 'px-3 py-3' : 'px-5 py-4'} border-b border-white/10`}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h4 className={`${compact ? 'text-sm' : 'text-base'} font-black leading-tight`}>{supplierName} · Customer ratings</h4>
                            <p className={`mt-1 ${compact ? 'text-xs' : 'text-sm'} font-medium leading-snug text-white/75`}>Based on {reviewText} from post-trip surveys for this location.</p>
                        </div>
                        {rating ? (
                            <div className={`shrink-0 rounded-md border border-[#48a868] bg-white ${compact ? 'px-2 py-1 text-sm' : 'px-3 py-1.5 text-lg'} font-black leading-none text-[#22854a]`}>
                                {rating.toFixed(1)}
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className={`grid grid-cols-1 ${compact ? 'gap-y-2.5 p-3' : 'gap-x-8 gap-y-4 p-5 sm:grid-cols-2'}`}>
                    {ratingItems.map((item, index) => (
                        <div key={item.key} className="group/item">
                            <div className={`${compact ? 'mb-1' : 'mb-2'} flex items-center justify-between gap-3`}>
                                <span className={`flex min-w-0 items-center gap-2 ${compact ? 'text-xs' : 'text-sm'} font-semibold text-white/90`}>
                                    <item.icon className="h-3.5 w-3.5 shrink-0 text-white/45" />
                                    <span className="truncate">{item.label}</span>
                                </span>
                                <span className={`shrink-0 ${compact ? 'text-xs' : 'text-sm'} font-black text-white`}>{scoreFromPercent(ratings[item.key])}</span>
                            </div>
                            <div className={`relative ${compact ? 'h-1.5' : 'h-2.5'} w-full overflow-hidden rounded-full bg-white/10`}>
                                <div 
                                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${getProgressBarColor(ratings[item.key] || 0)}`}
                                    style={{ 
                                        width: visible ? `${clampPercent(ratings[item.key])}%` : '0%',
                                        transitionDelay: visible ? `${index * 50}ms` : '0ms'
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className={`border-t border-white/10 ${compact ? 'px-3 py-2' : 'px-5 py-3'}`}>
                    <p className={`${compact ? 'text-[10px]' : 'text-xs'} font-medium leading-relaxed text-white/65`}>Ratings are based on recent customer reviews from this supplier's location. Reviews older than 12 months are archived to keep scores relevant.</p>
                </div>
            </div>
        </div>
    );
};
