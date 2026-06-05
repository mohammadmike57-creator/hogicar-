export const getRatingDescription = (rating: number): string => {
    if (rating >= 4.8) return 'Exceptional';
    if (rating >= 4.5) return 'Fabulous';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Average';
    if (rating >= 2.0) return 'Below Average';
    return 'Poor';
};

export const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return 'bg-[#008009]'; // Dark Green for Exceptional/Fabulous
    if (rating >= 4.0) return 'bg-emerald-600'; // Emerald for Very Good
    if (rating >= 3.5) return 'bg-lime-600'; // Lime for Good
    if (rating >= 3.0) return 'bg-amber-500'; // Amber for Average
    if (rating >= 2.0) return 'bg-orange-500'; // Orange for Below Average
    return 'bg-red-600'; // Red for Poor
};

export const getRatingTextColor = (rating: number): string => {
    if (rating >= 4.5) return 'text-[#008009]';
    if (rating >= 4.0) return 'text-emerald-600';
    if (rating >= 3.5) return 'text-lime-600';
    if (rating >= 3.0) return 'text-amber-600';
    if (rating >= 2.0) return 'text-orange-600';
    return 'text-red-600';
};

export const formatCategoryName = (category: string): string => {
    if (!category) return '';
    return category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};
