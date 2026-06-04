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
            className={`absolute bottom-full ${alignClass} mb-3 w-[min(17rem,calc(100vw-2rem))] transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) z-[1000] ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'} ${className}`}
        >
            <div className="relative bg-white/98 backdrop-blur-md text-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.05)] border border-white/20 overflow-hidden">
                {/* Refined Header */}
                <div className="bg-gradient-to-r from-slate-50 to-white p-3.5 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#008009]" />
                                <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-800">Trust Score</h4>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Verified Reviews</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#008009] rounded-lg shadow-sm">
                            <Star className="w-2.5 h-2.5 fill-white text-white" />
                            <span className="text-xs font-black text-white">{(averageRating / 20).toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-3.5">
                    {ratingItems.map((item, index) => (
                        <div key={item.key} className="group/item">
                            <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 rounded-lg bg-slate-50 text-slate-400 group-hover/item:text-[#008009] group-hover/item:bg-[#008009]/5 transition-colors">
                                        <item.icon className="w-3 h-3" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-slate-600 group-hover/item:text-slate-900 transition-colors uppercase tracking-tight leading-none mb-0.5">{item.label}</span>
                                        <span className="text-[9px] font-black text-[#008009] uppercase tracking-wider">{ratings[item.key] || 0}% Score</span>
                                    </div>
                                </div>
                                <span className="text-[11px] font-black text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 shadow-sm">{ratings[item.key] || 0}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressBarColor(ratings[item.key] || 0)}`}
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
                <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100">
                    <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-2.5 h-2.5 text-slate-400" />
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">100% Authentic Feedback</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
