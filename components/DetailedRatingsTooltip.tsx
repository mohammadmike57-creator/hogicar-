import * as React from 'react';
import { CarRatings } from '../types';
import { Star, ShieldCheck, Sparkles, Clock, ThumbsUp, Users, CheckCircle2 } from 'lucide-react';
import { getRatingDescription } from '../utils/ratings';

interface DetailedRatingsTooltipProps {
    ratings: CarRatings;
    visible?: boolean;
    className?: string;
    align?: 'left' | 'right' | 'center';
}

const getProgressBarColor = (value: number) => {
    if (value >= 90) return 'bg-[#008009]';
    if (value >= 80) return 'bg-emerald-500';
    if (value >= 70) return 'bg-lime-500';
    if (value >= 60) return 'bg-amber-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-rose-500';
};

export const DetailedRatingsTooltip: React.FC<DetailedRatingsTooltipProps> = ({ ratings, visible, className = '', align = 'right' }) => {
    const ratingItems: { key: keyof CarRatings, label: string, icon: any }[] = [
        { key: 'cleanliness', label: 'Cleanliness', icon: Sparkles },
        { key: 'condition', label: 'Car condition', icon: ShieldCheck },
        { key: 'valueForMoney', label: 'Value', icon: ThumbsUp },
        { key: 'pickupSpeed', label: 'Pick-up', icon: Clock },
        { key: 'staffService', label: 'Service', icon: Users },
    ];

    const averageScore = Object.values(ratings).reduce((a, b) => a + b, 0) / ratingItems.length;
    const averageRating = Number((averageScore / 20).toFixed(1));
    const ratingLabel = getRatingDescription(averageRating);

    let alignClass = 'right-0';
    let arrowClass = 'right-5';
    
    if (align === 'left') {
        alignClass = 'left-0';
        arrowClass = 'left-5';
    } else if (align === 'center') {
        alignClass = 'left-1/2 -translate-x-1/2';
        arrowClass = 'left-1/2 -translate-x-1/2';
    }

    return (
        <div
            className={`absolute bottom-full ${alignClass} mb-2 w-[min(16.5rem,calc(100vw-2rem))] transition-all duration-200 ease-out z-[1000] ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95 pointer-events-none'} ${className}`}
        >
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-[0_18px_42px_-22px_rgba(15,23,42,0.55)] ring-1 ring-slate-950/5">
                <div className="border-b border-slate-100 bg-white p-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#008009] text-white shadow-sm">
                            <span className="text-base font-black leading-none">{averageRating.toFixed(1)}</span>
                            <span className="mt-0.5 text-[8px] font-black uppercase tracking-widest text-emerald-100">/5</span>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#008009]" />
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Rating details</p>
                            </div>
                            <p className="mt-1 truncate text-sm font-black text-slate-950">{ratingLabel}</p>
                            <p className="mt-0.5 text-[10px] font-bold text-slate-400">Verified customer feedback</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2.5 p-3">
                    {ratingItems.map((item, index) => (
                        <div key={item.key}>
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                    <item.icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                    <span className="truncate text-[10px] font-black uppercase tracking-[0.08em] text-slate-600">{item.label}</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-950">{ratings[item.key] || 0}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressBarColor(ratings[item.key] || 0)}`}
                                    style={{
                                        width: visible ? `${ratings[item.key] || 0}%` : '0%',
                                        transitionDelay: visible ? `${index * 40}ms` : '0ms'
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#008009]" />
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">Trusted supplier</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[9px] font-black text-amber-600 shadow-sm">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {averageRating.toFixed(1)}
                    </div>
                </div>
            </div>
            <div className={`absolute top-full h-3 w-3 rotate-45 border-b border-r border-slate-200 bg-slate-50 ${arrowClass}`} />
        </div>
    );
};
