export const getRatingDescription = (rating: number): string => {
    if (rating >= 4.8) return 'Exceptional';
    if (rating >= 4.5) return 'Very Good';
    if (rating >= 4.0) return 'Good';
    if (rating >= 3.0) return 'Average';
    return 'Fair';
};
