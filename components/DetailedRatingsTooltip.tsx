import * as React from 'react';
import { CarRatings } from '../types';
import { Star, ShieldCheck, Sparkles, Clock, ThumbsUp } from 'lucide-react';

interface DetailedRatingsTooltipProps {
    ratings: CarRatings;
    visible?: boolean;
    className?: string;
    align?: 'left' | 'right';
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
    ];

    const averageRating = Object.values(ratings).reduce((a, b) => a + b, 0) / ratingItems.length;

    const alignClass = align === 'left' ? 'left-0' : 'right-0';
    const arrowClass = align === 'left' ? 'left-4' : 'right-4';

    return (
        <div 
            className={`absolute bottom-full ${alignClass} mb-4 w-[min(20rem,calc(100vw-2rem))] bg-white text-slate-900 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-slate-100 transition-all duration-500 z-[1000] overflow-hidden ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'} ${className}`}
        >
            {/* Header with Average */}
            <div className="bg-slate-50/50 p-5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="font-black text-[11px] uppercase tracking-[0.15em] text-slate-400">Verified Experience</h4>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#008009]/10 rounded-full">
                        <Star className="w-3 h-3 fill-[#008009] text-[#008009]" />
                        <span className="text-xs font-black text-[#008009]">{(averageRating / 20).toFixed(1)}</span>
                    </div>
                </div>
                <p className="text-[10px] font-bold text-slate-500 leading-tight">Based on real verified bookings from the last 12 months.</p>
            </div>

            <div className="p-5 space-y-4">
                {ratingItems.map(item => (
                    <div key={item.key} className="group/item">
                        <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-2">
                                <item.icon className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-[#008009] transition-colors" />
                                <span className="text-[11px] font-black text-slate-700">{item.label}</span>
                            </div>
                            <span className="text-[11px] font-black text-slate-900">{ratings[item.key]}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                                className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out ${getProgressBarColor(ratings[item.key])}`}
                                style={{ width: visible ? `${ratings[item.key]}%` : '0%' }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Tag */}
            <div className="px-5 py-3 bg-[#008009] flex items-center justify-center gap-2">
                <ThumbsUp className="w-3 h-3 text-white" />
                <span className="text-[10px] font-black text-white uppercase tracking-wider">Top Rated Supplier</span>
            </div>

            <div className={`absolute top-full ${arrowClass} w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white`}></div>
        </div>
    );
};
