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
            className={`absolute bottom-full left-1/2 -translate-x-1/2 w-64 mb-2 p-3 bg-white text-slate-900 rounded-lg shadow-xl ring-1 ring-slate-200 transition-opacity z-30 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover/rating:opacity-100 pointer-events-none'} ${className}`}
        >
            <h4 className="font-black text-[10px] mb-3 uppercase tracking-[0.1em] text-slate-400">Customer Ratings Breakdown</h4>
            <div className="space-y-3">
                {ratingItems.map(item => (
                    <div key={item.key}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[12px] font-bold text-slate-700">{item.label}</span>
                            <span className="text-[12px] font-black text-[#008009]">{ratings[item.key]}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1">
                            <div 
                                className={`h-1 rounded-full ${getProgressBarColor(ratings[item.key])}`}
                                style={{ width: `${ratings[item.key]}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white"></div>
        </div>
    );
};
