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
            className={`absolute bottom-full ${alignClass} mb-3 w-64 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) z-[1000] ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-[0.98] pointer-events-none'} ${className}`}
        >
            <div className="relative bg-white text-slate-900 rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
                {/* Compact Header */}
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#008009]" />
                                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-700">Verified Rating</h4>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#008009] rounded-lg">
                            <Star className="w-2.5 h-2.5 fill-white text-white" />
                            <span className="text-xs font-black text-white">{(averageRating / 20).toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-3">
                    {ratingItems.map((item, index) => (
                        <div key={item.key} className="group/item">
                            <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2">
                                    <item.icon className="w-3 h-3 text-slate-400 group-hover/item:text-[#008009] transition-colors" />
                                    <span className="text-[10px] font-bold text-slate-500 group-hover/item:text-slate-900 transition-colors uppercase tracking-tight">{item.label}</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-900">{ratings[item.key] || 0}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
                                <div 
                                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) ${getProgressBarColor(ratings[item.key] || 0)}`}
                                    style={{ 
                                        width: visible ? `${ratings[item.key] || 0}%` : '0%',
                                        transitionDelay: visible ? `${index * 50}ms` : '0ms'
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Compact Footer */}
                <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Updated Hourly</p>
                </div>
            </div>
        </div>
    );
};
