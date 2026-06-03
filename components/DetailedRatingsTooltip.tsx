import * as React from 'react';
import { CarRatings } from '../types';
import { Star, ShieldCheck, Sparkles, Clock, ThumbsUp, Users, CheckCircle2 } from 'lucide-react';

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

    const averageRating = Object.values(ratings).reduce((a, b) => a + b, 0) / ratingItems.length;

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
            className={`absolute bottom-full ${alignClass} mb-6 w-[min(24rem,calc(100vw-2rem))] bg-white text-slate-900 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.2)] ring-1 ring-slate-100 transition-all duration-500 z-[1000] overflow-hidden ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'} ${className}`}
        >
            {/* Premium Header */}
            <div className="bg-gradient-to-br from-slate-50 to-white p-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#008009]" />
                        <h4 className="font-black text-[12px] uppercase tracking-[0.2em] text-slate-800">Verified Ratings</h4>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#008009] rounded-xl shadow-lg shadow-[#008009]/20">
                        <Star className="w-3.5 h-3.5 fill-white text-white" />
                        <span className="text-sm font-black text-white">{(averageRating / 20).toFixed(1)}</span>
                    </div>
                </div>
                <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">Authentic feedback from verified customers.</p>
            </div>

            <div className="p-7 space-y-5">
                {ratingItems.map(item => (
                    <div key={item.key} className="group/item">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover/item:bg-[#008009]/10 transition-colors">
                                    <item.icon className="w-4 h-4 text-slate-400 group-hover/item:text-[#008009] transition-colors" />
                                </div>
                                <span className="text-[13px] font-black text-slate-700 tracking-tight">{item.label}</span>
                            </div>
                            <span className="text-[13px] font-black text-slate-900">{ratings[item.key] || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) ${getProgressBarColor(ratings[item.key] || 0)}`}
                                style={{ width: visible ? `${ratings[item.key] || 0}%` : '0%' }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Premium Footer Tag */}
            <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-[#008009] rounded-full">
                        <ThumbsUp className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[11px] font-black text-white uppercase tracking-[0.1em]">Highly Recommended</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Hogicar Trusted Partner</span>
            </div>

            <div className={`absolute top-full ${arrowClass} w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-900`}></div>
        </div>
    );
};
