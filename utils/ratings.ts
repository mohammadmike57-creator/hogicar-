import { Car, CarRatings } from '../types';

export const normalizeRatingScore = (rating: number): number => {
    const safeRating = Number.isFinite(rating) ? rating : 0;
    return safeRating > 5 ? safeRating : safeRating * 2;
};

export const getCarRatings = (car: Car): CarRatings => {
    if (car.detailedRatings) return car.detailedRatings;
    if (car.supplier?.detailedRatings) return car.supplier.detailedRatings;

    const base = normalizeRatingScore(car.supplier?.rating || 0) * 10;
    return {
        cleanliness: Math.min(Math.round(base), 100),
        condition: Math.min(Math.round(base), 100),
        valueForMoney: Math.min(Math.round(base), 100),
        pickupSpeed: Math.min(Math.round(base), 100),
        dropoffSpeed: Math.min(Math.round(base), 100),
        staffService: Math.min(Math.round(base), 100),
        easeOfLocating: Math.min(Math.round(base), 100),
    };
};

export const getRatingDescription = (rating: number): string => {
    const score = normalizeRatingScore(rating);
    if (score >= 9.2) return 'Exceptional';
    if (score >= 8.5) return 'Fabulous';
    if (score >= 7.0) return 'Very good';
    if (score >= 6.0) return 'Good';
    if (score >= 5.0) return 'Average';
    if (score >= 3.5) return 'Below Average';
    return 'Poor';
};

export const getRatingColor = (rating: number): string => {
    const score = normalizeRatingScore(rating);
    if (score >= 8.5) return 'bg-[#008009]';
    if (score >= 7.0) return 'bg-emerald-600';
    if (score >= 6.0) return 'bg-lime-600';
    if (score >= 5.0) return 'bg-amber-500';
    if (score >= 3.5) return 'bg-orange-500';
    return 'bg-red-600';
};

export const getRatingTextColor = (rating: number): string => {
    const score = normalizeRatingScore(rating);
    if (score >= 8.5) return 'text-[#008009]';
    if (score >= 7.0) return 'text-emerald-700';
    if (score >= 6.0) return 'text-lime-700';
    if (score >= 5.0) return 'text-amber-700';
    if (score >= 3.5) return 'text-orange-700';
    return 'text-red-600';
};

export const getRatingBorderColor = (rating: number): string => {
    const score = normalizeRatingScore(rating);
    if (score >= 7.0) return 'border-[#2f9b67] text-[#268454]';
    if (score >= 5.0) return 'border-[#d97706] text-[#b45309]';
    return 'border-[#dc2626] text-[#b91c1c]';
};

export const formatCategoryName = (category: string): string => {
    if (!category) return '';
    return category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};
