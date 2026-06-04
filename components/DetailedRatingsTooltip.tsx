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
            className={`absolute bottom-full ${alignClass} mb-3 w-[min(19rem,calc(100vw-2rem))] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) z-[1000] ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-[0.98] pointer-events-none'} ${className}`}
        >
            <div className="relative bg-white text-slate-900 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05)] border border-white overflow-hidden backdrop-blur-3xl">
                {/* Premium Gradient Header */}
                <div className="bg-gradient-to-br from-slate-50 to-white px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-emerald-100 rounded-lg">
                                    <ShieldCheck className="w-3.5 h-3.5 text-[#008009]" />
                                </div>
                                <h4 className="font-black text-[12px] uppercase tracking-[0.15em] text-slate-800">Trust Score</h4>
                            </div>
                            <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-[#008009] animate-pulse" />
                                Verified Feedback
                            </p>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#008009] rounded-xl shadow-lg shadow-[#008009]/20 border border-white/20">
                                <Star className="w-3 h-3 fill-white text-white" />
                                <span className="text-sm font-black text-white">{(averageRating / 20).toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {ratingItems.map((item, index) => (
                        <div key={item.key} className="group/item">
                            <div className="flex justify-between items-end mb-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 group-hover/item:bg-emerald-50 transition-colors">
                                        <item.icon className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-[#008009] transition-colors" />
                                    </div>
                                    <span className="text-[11px] font-black text-slate-500 group-hover/item:text-slate-900 transition-colors uppercase tracking-wider">{item.label}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-black text-slate-900 tracking-tight">{ratings[item.key] || 0}%</span>
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative shadow-inner">
                                <div 
                                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) ${getProgressBarColor(ratings[item.key] || 0)}`}
                                    style={{ 
                                        width: visible ? `${ratings[item.key] || 0}%` : '0%',
                                        transitionDelay: visible ? `${index * 80}ms` : '0ms'
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                                    <div className="absolute inset-0 opacity-30 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[move-bg_20s_linear_infinite]" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Refined Footer */}
                <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#008009]" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">100% Authentic</p>
                    </div>
                    <div className="h-4 w-[1px] bg-slate-200" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Updated Hourly</p>
                </div>
            </div>
        </div>
    );
};
