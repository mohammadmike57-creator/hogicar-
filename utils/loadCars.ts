

import { ApiSearchResult, CarCategory } from '../types';
import { LocationSuggestion } from '../api';
import { appState } from '../appState';
import { API_BASE_URL } from '../lib/config';

const API_URL = API_BASE_URL;

interface LoadCarsParams {
    locationsOptions?: LocationSuggestion[];
    pickupCode?: string;
    dropoffCode?: string;
    pickupDate: string;
    dropoffDate: string;
}

export const loadCars = async (params: LoadCarsParams): Promise<ApiSearchResult[]> => {
    const { locationsOptions, pickupCode, dropoffCode, pickupDate, dropoffDate } = params;

    const defaultCode = locationsOptions?.[0]?.value || "AMM";
    // Use default code if the provided code is falsy (null, undefined, or empty string)
    const pickup = pickupCode || defaultCode;
    const dropoff = dropoffCode || defaultCode;
    
    appState.search = { pickupCode: pickup, dropoffCode: dropoff, pickupDate, dropoffDate };
    sessionStorage.setItem("hogicar_search", JSON.stringify(appState.search));

    const url = `${API_URL}/api/cars?pickup=${pickup}&dropoff=${dropoff}&pickupDate=${pickupDate}&dropoffDate=${dropoffDate}`;

    try {
        const response = await fetch(url, { 
            credentials: 'omit',
            cache: 'no-cache'
        });

        if (!response.ok) {
            const body = await response.text();
            console.error("Failed to fetch cars. Status:", response.status, "Body:", body);
            throw new Error(`Failed to fetch cars. The server responded with status: ${response.status}`);
        }

        const rawCars: any[] = await response.json();

        const normalizedCars = rawCars.map(car => {
            const normalizedCar: ApiSearchResult = { ...car };

            // Ensure supplier object is always present
            if (!normalizedCar.supplier) {
                normalizedCar.supplier = {
                    id: car.supplierId ?? null,
                    name: car.supplierName ?? "",
                    logoUrl: car.supplierLogoUrl ?? "",
                    terms: car.supplierTerms ?? "",
                    gracePeriodDays: car.supplierGracePeriodDays ?? 0,
                    rating: car.supplierRating ?? undefined,
                    ratingReviewCount: car.ratingReviewCount ?? undefined,
                    ratingCleanliness: car.ratingCleanliness ?? undefined,
                    ratingCondition: car.ratingCondition ?? undefined,
                    ratingValueForMoney: car.ratingValueForMoney ?? undefined,
                    ratingPickupSpeed: car.ratingPickupSpeed ?? undefined,
                    ratingDropoffSpeed: car.ratingDropoffSpeed ?? undefined,
                    ratingStaffService: car.ratingStaffService ?? undefined,
                    ratingEaseOfLocating: car.ratingEaseOfLocating ?? undefined
                };
            }
            
            // Normalize other fields as per requirements
            const rawImage = car.imageUrl || car.image || "";
            normalizedCar.image = rawImage;
            
            // Add a cache-busting parameter for external images to ensure mobile devices get fresh versions
            // This helps bypass potentially stale "expired" images cached on mobile browsers
            if (rawImage && (rawImage.startsWith('http') || rawImage.startsWith('//')) && !rawImage.includes('unsplash.com')) {
                const separator = rawImage.includes('?') ? '&' : '?';
                // Use a timestamp that changes every minute to ensure fresh images while allowing some caching
                const cacheBuster = Math.floor(Date.now() / (60 * 1000));
                normalizedCar.image = `${rawImage}${separator}hcb=${cacheBuster}`;
            }

            normalizedCar.netPrice = car.netPrice ?? car.price ?? 0;
            normalizedCar.brand = car.brand ?? "";
            normalizedCar.model = car.model ?? "";

            // Preserve backend pricing exactly as returned by /api/cars.
            if (normalizedCar.finalPrice === undefined || normalizedCar.finalPrice === null) {
                normalizedCar.finalPrice = normalizedCar.netPrice ?? 0;
            }
            if (normalizedCar.commissionAmount === undefined || normalizedCar.commissionAmount === null) {
                normalizedCar.commissionAmount = 0;
            }
            if (normalizedCar.commissionPercent === undefined || normalizedCar.commissionPercent === null) {
                normalizedCar.commissionPercent = 0;
            }

            return normalizedCar;
        });

        return normalizedCars;

    } catch (error) {
        console.error("Error in loadCars:", error);
        throw error;
    }
}
