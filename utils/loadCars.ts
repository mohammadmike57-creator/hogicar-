
import { ApiSearchResult, CarCategory } from '../types';
import { LocationSuggestion } from '../api';
import { MOCK_APP_CONFIG } from '../services/mockData';
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

export async function loadCars(params: LoadCarsParams): Promise<ApiSearchResult[]> {
    const { locationsOptions, pickupCode, dropoffCode, pickupDate, dropoffDate } = params;

    const defaultCode = locationsOptions?.[0]?.value || "AMM";
    // Use default code if the provided code is falsy (null, undefined, or empty string)
    const pickup = pickupCode || defaultCode;
    const dropoff = dropoffCode || defaultCode;
    
    appState.search = { pickupCode: pickup, dropoffCode: dropoff, pickupDate, dropoffDate };
    sessionStorage.setItem("hogicar_search", JSON.stringify(appState.search));

    const url = `${API_URL}/api/cars?pickup=${pickup}&dropoff=${dropoff}&pickupDate=${pickupDate}&dropoffDate=${dropoffDate}`;

    try {
        const response = await fetch(url);

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
                    gracePeriodDays: car.supplierGracePeriodDays ?? 0
                };
            }
            
            // Normalize other fields as per requirements
            normalizedCar.image = car.imageUrl || car.image || "";
            normalizedCar.netPrice = car.netPrice ?? car.price ?? 0;
            normalizedCar.brand = car.brand ?? "";
            normalizedCar.model = car.model ?? "";

            // NEW: Commission Calculation
            const net = normalizedCar.netPrice;
            const commissionPercent = MOCK_APP_CONFIG.commissionPercent ?? 0;
            const commissionAmount = +(net * commissionPercent / 100).toFixed(2);
            const finalPrice = +(net + commissionAmount).toFixed(2);
            
            normalizedCar.finalPrice = finalPrice;
            normalizedCar.commissionAmount = commissionAmount;
            normalizedCar.commissionPercent = commissionPercent;

            return normalizedCar;
        });

        return normalizedCars;

    } catch (error) {
        console.error("Error in loadCars:", error);
        throw error;
    }
}