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
            className={`absolute bottom-full ${alignClass} mb-3 w-[min(20rem,calc(100vw-2rem))] transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) z-[1000] ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'} ${className}`}
        >
            <div className="relative bg-white/98 backdrop-blur-md text-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.05)] border border-white/20 overflow-hidden">
                {/* Refined Header */}
                <div className="bg-gradient-to-r from-slate-50 to-white p-4 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#008009]" />
                                <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-800">Trust Score</h4>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Verified Reviews</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#008009] rounded-xl shadow-sm">
                            <Star className="w-3 h-3 fill-white text-white" />
                            <span className="text-sm font-black text-white">{(averageRating / 20).toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {ratingItems.map((item, index) => (
                        <div key={item.key} className="group/item">
                            <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover/item:text-[#008009] group-hover/item:bg-[#008009]/5 transition-colors">
                                        <item.icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-bold text-slate-600 group-hover/item:text-slate-900 transition-colors uppercase tracking-tight leading-none mb-0.5">{item.label}</span>
                                        <span className="text-[10px] font-black text-[#008009] uppercase tracking-wider">{ratings[item.key] || 0}% Score</span>
                                    </div>
                                </div>
                                <span className="text-[13px] font-black text-slate-900 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 shadow-sm">{ratings[item.key] || 0}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressBarColor(ratings[item.key] || 0)} shadow-[0_0_10px_rgba(0,0,0,0.05)]`}
                                    style={{ 
                                        width: visible ? `${ratings[item.key] || 0}%` : '0%',
                                        transitionDelay: visible ? `${index * 60}ms` : '0ms'
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Clean Footer */}
                <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100">
                    <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-slate-400" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">100% Authentic Feedback</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
