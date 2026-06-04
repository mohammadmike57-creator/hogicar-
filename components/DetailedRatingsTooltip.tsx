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
            className={`absolute bottom-full ${alignClass} mb-4 w-[min(22rem,calc(100vw-2rem))] transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) z-[1000] ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'} ${className}`}
        >
            <div className="relative bg-white/95 backdrop-blur-xl text-slate-900 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-slate-200/50 overflow-hidden">
                {/* Premium Header */}
                <div className="bg-gradient-to-br from-slate-50/50 to-white/50 p-5 border-b border-slate-100/50">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-emerald-50 rounded-lg">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#008009]" />
                            </div>
                            <h4 className="font-extrabold text-[11px] uppercase tracking-[0.15em] text-slate-600">Verified Ratings</h4>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#008009] rounded-lg shadow-lg shadow-[#008009]/20">
                            <Star className="w-3 h-3 fill-white text-white" />
                            <span className="text-xs font-black text-white">{(averageRating / 20).toFixed(1)}</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">Based on recent customer experiences</p>
                </div>

                <div className="p-6 space-y-4">
                    {ratingItems.map((item, index) => (
                        <div key={item.key} className="group/item">
                            <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center group-hover/item:bg-[#008009]/10 transition-colors">
                                        <item.icon className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-[#008009] transition-colors" />
                                    </div>
                                    <span className="text-[12px] font-bold text-slate-600 tracking-tight">{item.label}</span>
                                </div>
                                <span className="text-[12px] font-black text-slate-900">{ratings[item.key] || 0}%</span>
                            </div>
                            <div className="w-full bg-slate-100/80 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${getProgressBarColor(ratings[item.key] || 0)}`}
                                    style={{ 
                                        width: visible ? `${ratings[item.key] || 0}%` : '0%',
                                        transitionDelay: visible ? `${index * 80}ms` : '0ms'
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Premium Footer Tag */}
                <div className="px-5 py-3.5 bg-slate-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-[#008009] rounded-full">
                            <ThumbsUp className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.05em]">Highly Recommended</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">Hogicar Trusted Partner</span>
                </div>
            </div>

            {/* Arrow - placed outside overflow-hidden container */}
            <div className={`absolute top-full ${arrowClass} w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-slate-900`}></div>
        </div>
    );
};
