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
    if (value >= 90) return 'from-[#008009] to-[#00a80b]';
    if (value >= 80) return 'from-emerald-500 to-emerald-600';
    if (value >= 70) return 'from-lime-500 to-lime-600';
    if (value >= 60) return 'from-amber-500 to-amber-600';
    if (value >= 40) return 'from-orange-500 to-orange-600';
    return 'from-rose-500 to-rose-600';
};

export const DetailedRatingsTooltip: React.FC<DetailedRatingsTooltipProps> = ({ ratings, visible, className = '', align = 'right' }) => {
    const ratingItems: { key: keyof CarRatings, label: string, icon: any }[] = [
        { key: 'cleanliness', label: 'Cleanliness', icon: Sparkles },
        { key: 'condition', label: 'Car Condition', icon: ShieldCheck },
        { key: 'valueForMoney', label: 'Value for Money', icon: ThumbsUp },
        { key: 'pickupSpeed', label: 'Pick-up Speed', icon: Clock },
        { key: 'staffService', label: 'Staff Service', icon: Users },
    ];

    const averageScore = Object.values(ratings).reduce((a, b) => a + b, 0) / ratingItems.length;
    const averageRating = Number((averageScore / 20).toFixed(1));
    const resultLabel = getRatingDescription(averageRating);

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
            className={`absolute bottom-full ${alignClass} mb-3 w-[min(21rem,calc(100vw-2rem))] transition-all duration-200 ease-out z-[1000] ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95 pointer-events-none'} ${className}`}
        >
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_22px_60px_-24px_rgba(15,23,42,0.45)] ring-1 ring-slate-950/5">
                <div className="border-b border-slate-100 bg-slate-950 p-4 text-white">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-100">Verified rating</span>
                            </div>
                            <h4 className="text-sm font-black tracking-tight">Supplier performance</h4>
                            <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-300">Customer experience result across pickup, vehicle quality, value and service.</p>
                        </div>
                        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#008009] text-white shadow-lg shadow-black/20 ring-4 ring-white/10">
                            <span className="text-xl font-black leading-none">{averageRating.toFixed(1)}</span>
                            <span className="mt-0.5 text-[8px] font-black uppercase tracking-widest text-emerald-100">/ 5</span>
                        </div>
                    </div>
                </div>

                <div className="border-b border-slate-100 bg-emerald-50/70 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Overall result</p>
                            <p className="mt-0.5 text-sm font-black text-[#008009]">{resultLabel}</p>
                        </div>
                        <div className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-black text-amber-600 shadow-sm">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {averageRating.toFixed(1)}
                        </div>
                    </div>
                </div>

                <div className="space-y-3.5 p-4">
                    {ratingItems.map((item, index) => (
                        <div key={item.key} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                                        <item.icon className="h-3.5 w-3.5" />
                                    </span>
                                    <span className="truncate text-[11px] font-black uppercase tracking-[0.08em] text-slate-700">{item.label}</span>
                                </div>
                                <span className="text-xs font-black text-slate-950">{ratings[item.key] || 0}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white shadow-inner">
                                <div 
                                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out ${getProgressBarColor(ratings[item.key] || 0)}`}
                                    style={{ 
                                        width: visible ? `${ratings[item.key] || 0}%` : '0%',
                                        transitionDelay: visible ? `${index * 40}ms` : '0ms'
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-slate-100 bg-white px-4 py-3">
                    <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Verified customer feedback</p>
                </div>
            </div>
            <div className={`absolute top-full h-3 w-3 rotate-45 border-b border-r border-slate-200 bg-white ${arrowClass}`} />
        </div>
    );
};
