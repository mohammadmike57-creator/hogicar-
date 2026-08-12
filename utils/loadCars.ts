

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
    startTime?: string;
    endTime?: string;
    page?: number;
    size?: number;
    sort?: string;
    categories?: string[];
    suppliers?: string[];
    transmissions?: string[];
    fuelPolicies?: string[];
    passengers?: number;
    minPrice?: number;
    maxPrice?: number;
}

const normalizeForMatch = (value: unknown) => (
    String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, '')
);

const isBlockedExternalCar = (car: ApiSearchResult) => {
    const supplierName = normalizeForMatch(car.supplier?.name || (car as any).supplierName || (car as any).supplier_name);
    const vendorCode = normalizeForMatch((car as any)._vendorCode || (car as any).vendorCode);
    const carName = normalizeForMatch(car.name || `${car.brand || ''} ${car.model || ''}`);

    return (supplierName.includes('URDRIVEJO') || vendorCode.includes('URDRIVEJO')) && carName.includes('TOYOTACAMRY');
};

export interface PaginatedCars {
    cars: ApiSearchResult[];
    page: number;
    size: number;
    hasNext: boolean;
    total?: number;
}

export const loadCars = async (params: LoadCarsParams): Promise<PaginatedCars> => {
    const { 
        locationsOptions, pickupCode, dropoffCode, pickupDate, dropoffDate, startTime, endTime, 
        page = 0, size = 20, sort, categories, suppliers, transmissions, fuelPolicies, passengers, minPrice, maxPrice 
    } = params;

    const defaultCode = locationsOptions?.[0]?.value || "AMM";
    const pickup = pickupCode || defaultCode;
    const dropoff = dropoffCode || defaultCode;
    const start = startTime || '10:00';
    const end = endTime || '10:00';
    
    appState.search = { pickupCode: pickup, dropoffCode: dropoff, pickupDate, dropoffDate, startTime: start, endTime: end };
    sessionStorage.setItem("hogicar_search", JSON.stringify(appState.search));

    let url = `${API_URL}/api/search/all?pickup=${pickup}&dropoff=${dropoff}&pickupDate=${pickupDate}&dropoffDate=${dropoffDate}&startTime=${start}&endTime=${end}&page=${page}&size=${size}`;
    
    if (sort) url += `&sort=${encodeURIComponent(sort)}`;
    if (categories && categories.length > 0) categories.forEach(c => url += `&categories=${encodeURIComponent(c)}`);
    if (suppliers && suppliers.length > 0) suppliers.forEach(s => url += `&suppliers=${encodeURIComponent(s)}`);
    if (transmissions && transmissions.length > 0) transmissions.forEach(t => url += `&transmissions=${encodeURIComponent(t)}`);
    if (fuelPolicies && fuelPolicies.length > 0) fuelPolicies.forEach(f => url += `&fuelPolicies=${encodeURIComponent(f)}`);
    if (passengers) url += `&passengers=${passengers}`;
    if (minPrice !== undefined) url += `&minPrice=${minPrice}`;
    if (maxPrice !== undefined) url += `&maxPrice=${maxPrice}`;

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

        const data: { cars: any[], page: number, size: number, hasNext: boolean, total?: number } = await response.json();
        const rawCars = data.cars || [];

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
            
            if (rawImage && (rawImage.startsWith('http') || rawImage.startsWith('//')) && 
                !rawImage.includes('unsplash.com') && 
                !rawImage.includes('Signature=') && 
                !rawImage.includes('Expires=')) {
                const separator = rawImage.includes('?') ? '&' : '?';
                const cacheBuster = Math.floor(Date.now() / (60 * 1000));
                normalizedCar.image = `${rawImage}${separator}hcb=${cacheBuster}`;
            }

            normalizedCar.netPrice = car.netPrice ?? car.price ?? 0;
            normalizedCar.brand = car.brand ?? "";
            normalizedCar.model = car.model ?? "";

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

        return {
            cars: normalizedCars.filter(car => !isBlockedExternalCar(car)),
            page: data.page,
            size: data.size,
            hasNext: data.hasNext,
            total: data.total
        };

    } catch (error) {
        console.error("Error in loadCars:", error);
        throw error;
    }
}
