import * as React from 'react';
import { CarRatings } from '../types';

interface DetailedRatingsTooltipProps {
    ratings: CarRatings;
    visible?: boolean;
    className?: string;
}

const getProgressBarColor = (value: number) => {
    if (value >= 90) return 'bg-green-500';
    if (value >= 80) return 'bg-blue-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
};

export const DetailedRatingsTooltip: React.FC<DetailedRatingsTooltipProps> = ({ ratings, visible, className = '' }) => {
    const ratingItems: { key: keyof CarRatings, label: string }[] = [
        { key: 'cleanliness', label: 'Cleanliness' },
        { key: 'condition', label: 'Car Condition' },
        { key: 'valueForMoney', label: 'Value for Money' },
        { key: 'pickupSpeed', label: 'Pick-up Speed' },
    ];

    return (
        <div 
            className={`absolute bottom-full right-0 mb-3 w-[260px] sm:w-72 p-4 bg-white text-slate-900 rounded-2xl shadow-2xl ring-1 ring-slate-200 transition-all duration-300 z-[100] ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 group-hover/rating:opacity-100 group-hover/rating:translate-y-0 pointer-events-none'} ${className}`}
        >
            <h4 className="font-black text-[10px] mb-3 uppercase tracking-[0.1em] text-slate-400">Customer Ratings Breakdown</h4>
            <div className="space-y-3">
                {ratingItems.map(item => (
                    <div key={item.key}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] font-bold text-slate-700">{item.label}</span>
                            <span className="text-[11px] font-black text-[#008009]">{ratings[item.key]}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(ratings[item.key])}`}
                                style={{ width: visible ? `${ratings[item.key]}%` : '0%' }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="absolute top-full right-4 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white shadow-sm"></div>
        </div>
    );
};
