import { Car, CommissionType, Supplier } from '../types';

export const calculatePrice = (car: Car, days: number, startDate?: string) => {
    // Find matching rate tier based on start date
    const start = startDate ? new Date(startDate) : new Date();
    const tier = car.rateTiers?.find(t => {
        const tStart = new Date(t.startDate);
        const tEnd = new Date(t.endDate);
        
        // Zero out time for date-only comparison
        start.setHours(0,0,0,0);
        tStart.setHours(0,0,0,0);
        tEnd.setHours(0,0,0,0);
        
        return start >= tStart && start <= tEnd;
    });

    let netDailyRate = 50; // Default fallback
    let promotionLabel = undefined;
    let tierName = undefined;

    if (tier && tier.rates) {
        // Find rate by duration
        const rateBand = tier.rates.find(r => days >= r.minDays && days <= r.maxDays);
        if (rateBand) {
            netDailyRate = rateBand.dailyRate;
        } else if (tier.rates.length > 0) {
             // Fallback to the rate of the last band (longest duration usually)
             netDailyRate = tier.rates[tier.rates.length - 1].dailyRate;
        }
        promotionLabel = tier.promotionLabel;
        tierName = tier.name;
    }
    
    // If final price is from API, it's already the gross daily rate.
    if (car.hasFinalPriceFromApi) {
        const correctNetTotal = (car.netPrice || 0) * days;
        return {
            dailyRate: netDailyRate,
            total: netDailyRate * days,
            netTotal: correctNetTotal,
            promotionLabel,
            tierName
        };
    }

    const netTotal = netDailyRate * days;
    let grossTotal = netTotal;

    // ADD COMMISSION ON TOP
    switch(car.supplier.commissionType) {
        case CommissionType.PARTIAL_PREPAID:
        case CommissionType.FULL_PREPAID:
            // This is a percentage markup
            grossTotal = netTotal * (1 + car.supplier.commissionValue);
            break;
        case CommissionType.PAY_AT_DESK:
            // This is a fixed fee PER BOOKING added on top.
            grossTotal = netTotal + car.supplier.commissionValue;
            break;
    }

    return {
        dailyRate: grossTotal / days, // Return gross daily rate
        total: grossTotal, // Return gross total
        netTotal: netTotal,
        promotionLabel,
        tierName
    };
};

export const calculateBookingFinancials = (grossTotal: number, netTotal: number, extrasTotal: number, supplier: Supplier) => {
    const commissionAmount = grossTotal - netTotal;
    const payNow = commissionAmount;
    const payAtDesk = netTotal + extrasTotal;

    return { payNow, payAtDesk };
};
