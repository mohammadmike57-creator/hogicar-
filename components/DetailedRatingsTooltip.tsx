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
            className={`absolute bottom-full ${alignClass} mb-2 w-[min(19rem,calc(100vw-2rem))] transition-all duration-200 ease-out z-[1000] ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95 pointer-events-none'} ${className}`}
        >
            <div className="relative bg-white text-slate-900 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden">
                {/* Clean Header */}
                <div className="bg-slate-50 p-3.5 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#008009]" />
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-600">Supplier Performance</h4>
                        </div>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded-sm">
                            <Star className="w-2.5 h-2.5 fill-[#008009] text-[#008009]" />
                            <span className="text-[11px] font-bold text-slate-900">{(averageRating / 20).toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-3.5">
                    {ratingItems.map((item, index) => (
                        <div key={item.key} className="group/item">
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                    <item.icon className="w-3 h-3 text-slate-400" />
                                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-tight">{item.label}</span>
                                </div>
                                <span className="text-[11px] font-bold text-slate-900">{ratings[item.key] || 0}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ease-out ${getProgressBarColor(ratings[item.key] || 0)}`}
                                    style={{ 
                                        width: visible ? `${ratings[item.key] || 0}%` : '0%',
                                        transitionDelay: visible ? `${index * 40}ms` : '0ms'
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Clean Footer */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">Verified Customer Feedback</p>
                </div>
            </div>
        </div>
    );
};
