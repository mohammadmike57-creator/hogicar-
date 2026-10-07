// Maps search API results to the Car shape the site uses (shared by search and the car page).
import { CarCategory, Car, Transmission, FuelPolicy, CommissionType, ApiSearchResult, Supplier, BookingMode, CarType, RateTier, PickupType } from '../types';

const ratingToPercent = (rating: number | undefined) => {
    const safeRating = Number(rating || 4.5);
    return Math.round(Math.max(0, Math.min(100, safeRating > 5 ? safeRating * 10 : safeRating * 20)));
};

const normalizeForMatch = (value: unknown) => (
    String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, '')
);

export const isBlockedExternalCar = (apiCar: ApiSearchResult) => {
    const supplierName = normalizeForMatch(apiCar.supplier?.name || (apiCar as any).supplierName || (apiCar as any).supplier_name);
    const vendorCode = normalizeForMatch((apiCar as any)._vendorCode || (apiCar as any).vendorCode);
    const carName = normalizeForMatch(apiCar.name || `${apiCar.brand || ''} ${apiCar.model || ''}`);

    return (supplierName.includes('URDRIVEJO') || vendorCode.includes('URDRIVEJO')) && carName.includes('TOYOTACAMRY');
};

export const apiCarToCar = (apiCar: ApiSearchResult): Car => {
    const hasFinalPrice = apiCar.finalPrice !== undefined && apiCar.finalPrice !== null;
    const dailyPrice = hasFinalPrice ? apiCar.finalPrice : apiCar.netPrice;
    
    const mappedSupplier: Supplier = {
        id: apiCar.supplierId || `api-supplier-${((apiCar.supplier?.name ?? 'Unknown')).replace(/\s+/g, '-')}`,
        name: apiCar.supplier?.name || apiCar.name || 'Unknown Supplier',
        rating: apiCar.supplier?.rating || 4.5,
        ratingReviewCount: apiCar.supplier?.ratingReviewCount,
        detailedRatings: {
            cleanliness: apiCar.supplier?.ratingCleanliness ?? ratingToPercent(apiCar.supplier?.rating),
            condition: apiCar.supplier?.ratingCondition ?? ratingToPercent(apiCar.supplier?.rating),
            valueForMoney: apiCar.supplier?.ratingValueForMoney ?? ratingToPercent(apiCar.supplier?.rating),
            pickupSpeed: apiCar.supplier?.ratingPickupSpeed ?? ratingToPercent(apiCar.supplier?.rating),
            dropoffSpeed: apiCar.supplier?.ratingDropoffSpeed ?? ratingToPercent(apiCar.supplier?.rating),
            staffService: apiCar.supplier?.ratingStaffService ?? ratingToPercent(apiCar.supplier?.rating),
            easeOfLocating: apiCar.supplier?.ratingEaseOfLocating ?? ratingToPercent(apiCar.supplier?.rating),
        },
        logo: apiCar.supplier?.logoUrl || '',
        commissionType: CommissionType.PAY_AT_DESK,
        commissionValue: 0,
        bookingMode: BookingMode.FREE_SALE,
        status: 'active',
        location: '',
        locations: [],
        contactEmail: 'contact@api.supplier',
        gracePeriodHours: 1,
        minBookingLeadTime: 2,
        termsAndConditions: "Standard terms apply.",
        connectionType: 'api',
        includesCDW: true,
        includesTP: true,
        enableSocialProof: false,
        pickupType: apiCar.supplier?.pickupType as any || apiCar.pickupType as any || PickupType.IN_TERMINAL
    };
    
    const apiRateTier: RateTier = {
        id: `api-tier-${apiCar.id}`,
        name: 'Standard Rate',
        startDate: '2020-01-01',
        endDate: '2099-12-31',
        rates: [{ minDays: 1, maxDays: 99, dailyRate: dailyPrice || 0 }]
    };

    const rawName = apiCar.name || "";
    const parts = rawName.trim().split(" ");
    const inferredMake = parts.length > 0 ? parts[0] : "";
    const inferredModel = parts.length > 1 ? parts.slice(1).join(" ") : "";

    const make = apiCar.brand || inferredMake || "Unknown";
    const model = apiCar.model || inferredModel || "Unknown";

    const displayName = (rawName || `${make} ${model}`.trim() || "Unknown Car").replace(/\s*\([^)]*\)\s*/g, "").trim();
    
    return {
        id: String(apiCar.id),
        make: make,
        model: model,
        displayName: displayName,
        netPrice: apiCar.netPrice,
        commissionPercent: apiCar.commissionPercent,
        commissionAmount: apiCar.commissionAmount,
        finalPrice: apiCar.finalPrice,
        year: apiCar.year || new Date().getFullYear(),
        category: apiCar.category as CarCategory || CarCategory.ECONOMY,
        type: CarType.SEDAN,
        sippCode: apiCar.sippCode || 'XXXX',
        transmission: apiCar.transmission as Transmission || Transmission.AUTOMATIC,
        passengers: apiCar.passengers || 4,
        bags: apiCar.bags || 2,
        doors: apiCar.doors || 4,
        airCon: apiCar.airCon || false,
        image: apiCar.image || '',
        supplier: mappedSupplier,
        features: [],
        fuelPolicy: apiCar.fuelPolicy as FuelPolicy || FuelPolicy.FULL_TO_FULL,
        isAvailable: apiCar.available !== false,
        location: '',
        deposit: apiCar.deposit || 0,
        excess: apiCar.excess || 0,
        stopSales: [],
        rateTiers: [apiRateTier],
        extras: [],
        locationDetail: apiCar.locationDetail || 'In Terminal',
        unlimitedMileage: apiCar.unlimitedMileage || true,
        tags: ["Online Deal"],
        detailedRatings: mappedSupplier.detailedRatings,
        hasFinalPriceFromApi: hasFinalPrice,
        supplierId: apiCar.supplierId,
        currency: apiCar.currency,
        hogicarChoice: apiCar.hogicarChoice,
        promotionAmount: apiCar.promotionAmount,
        promotionPercent: apiCar.promotionPercent,
        supplierPromotion: apiCar.supplierPromotion || null,
        vendorCode: (apiCar as any)._vendorCode || (apiCar as any).vendorCode || (apiCar.supplier as any)?.vendorCode,
    };
};

export const apiCarsToCars = (data: ApiSearchResult[]): Car[] => {
    const mappedCars = data.filter(apiCar => !isBlockedExternalCar(apiCar)).map(apiCarToCar);
    const finalCars: Car[] = [];

    mappedCars.forEach(car => {
        finalCars.push({ ...car, isHogicarChoiceBranded: false });
        if (car.hogicarChoice && car.supplier.name !== 'Hogi Car Choice') {
            const choiceCar = JSON.parse(JSON.stringify(car));
            choiceCar.id = `choice-${car.id}`;
            choiceCar.supplier.name = 'Hogi Car Choice';
            choiceCar.supplier.logo = 'HOGICAR_CHOICE_LOGO';
            choiceCar.isHogicarChoiceBranded = true;
            finalCars.push(choiceCar);
        }
    });

    return finalCars;
};
