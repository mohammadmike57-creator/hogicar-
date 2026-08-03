/**
 * SEO Utility for dynamic route metadata
 */
export const getRouteSEO = (routeType: string, cityOrCountry: string, fullPath: string) => {
  const capitalize = (str: string) =>
    str
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  
  const displayName = capitalize(cityOrCountry || '');

  const titles: Record<string, string> = {
    country: `${displayName} Car Rental – Compare Best Deals | Hogicar`,
    carRental: `Car Rental ${displayName} – Best Rates in ${displayName} | Hogicar`,
    airportCarRental: `Airport Car Rental ${displayName} – Pick Up at Airport | Hogicar`,
    bestCarRental: `Best Car Rental in ${displayName} – Top Reviewed Services | Hogicar`,
    cheapCarRental: `Cheap Car Rental ${displayName} – Lowest Prices Guaranteed | Hogicar`,
    cheapAirport: `Cheap Airport Car Rental ${displayName} – Best Deals | Hogicar`,
    economyCarRental: `Economy Car Rental ${displayName} – Affordable Cars | Hogicar`,
    luxuryCarRental: `Luxury Car Rental ${displayName} – Premium Vehicles | Hogicar`,
    monthlyCarRental: `Monthly Car Rental ${displayName} – Long-Term Deals | Hogicar`,
    longTermRental: `Long Term Car Rental ${displayName} – Monthly Rentals | Hogicar`,
    suvRental: `SUV Rental ${displayName} – Spacious 4x4 Cars | Hogicar`,
    vanRental: `Van Rental ${displayName} – Passenger & Cargo Vans | Hogicar`,
    rentACar: `Rent a Car in ${displayName} – Book Online | Hogicar`,
    airportSpecific: `${displayName} Car Rental – Compare Airport Offers | Hogicar`,
  };

  const descriptions: Record<string, string> = {
    country: `Find the best car rental deals in ${displayName}. Compare prices from 900+ suppliers, book online and save on your trip to ${displayName}.`,
    carRental: `Looking for car rental in ${displayName}? Compare cheap rates from trusted suppliers, with free cancellation and 24/7 support. Book with Hogicar.`,
    airportCarRental: `Pick up your rental car at ${displayName} Airport. Compare airport car rental deals and save up to 30%. Easy online booking with Hogicar.`,
    bestCarRental: `Discover the best car rental services in ${displayName}. Top-rated, reliable, and affordable. Compare and book in minutes with Hogicar.`,
    cheapCarRental: `Get the cheapest car rental in ${displayName}. Compare low-cost deals from local and international suppliers. Book now with Hogicar.`,
    cheapAirport: `Find cheap car rental at ${displayName} Airport. Exclusive low-price deals, no hidden fees. Book online and save with Hogicar.`,
    economyCarRental: `Rent an economy car in ${displayName} at the best price. Compact, fuel-efficient vehicles perfect for city driving. Compare and book with Hogicar.`,
    luxuryCarRental: `Experience luxury car rental in ${displayName}. Choose from premium sedans, sports cars, and SUVs. Book with Hogicar for top-tier service.`,
    monthlyCarRental: `Need a car for a month in ${displayName}? Compare monthly car rental deals, long-term discounts, and flexible terms with Hogicar.`,
    longTermRental: `Long term car rental in ${displayName} made easy. Compare monthly rates and book extended rentals with no hidden costs. Hogicar.`,
    suvRental: `Rent an SUV in ${displayName} – perfect for families, desert trips, or extra space. Compare 4x4 rental prices and book with Hogicar.`,
    vanRental: `Van rental in ${displayName} for passenger transport or cargo. Find affordable minivans and full-size vans. Book with Hogicar.`,
    rentACar: `Rent a car in ${displayName} quickly and easily. Compare hundreds of deals from trusted suppliers and book your perfect car with Hogicar.`,
    airportSpecific: `${displayName} airport car rental – Compare and book rental cars directly at the airport terminal. Secure the best rates with Hogicar.`,
  };

  return {
    title: titles[routeType] || `Car Rental ${displayName} | Hogicar`,
    description:
      descriptions[routeType] ||
      `Find affordable car rental in ${displayName}. Compare prices and book online with Hogicar.`,
    canonical: `https://www.hogicar.com${fullPath}`,
  };
};
