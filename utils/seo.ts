/**
 * SEO Utility for dynamic route metadata
 */

export const detectRouteType = (path: string) => {
  let routeType = '';
  let locationSlug = '';

  if (path.startsWith('/car-rental-')) {
    routeType = 'carRental';
    locationSlug = path.replace('/car-rental-', '');
  } else if (path.startsWith('/airport-car-rental-')) {
    routeType = 'airportCarRental';
    locationSlug = path.replace('/airport-car-rental-', '');
  } else if (path.startsWith('/best-car-rental-')) {
    routeType = 'bestCarRental';
    locationSlug = path.replace('/best-car-rental-', '');
  } else if (path.startsWith('/cheap-car-rental-')) {
    const slug = path.replace('/cheap-car-rental-', '');
    if (slug.includes('airport')) {
      routeType = 'cheapAirport';
    } else {
      routeType = 'cheapCarRental';
    }
    locationSlug = slug;
  } else if (path.startsWith('/economy-car-rental-')) {
    routeType = 'economyCarRental';
    locationSlug = path.replace('/economy-car-rental-', '');
  } else if (path.startsWith('/luxury-car-rental-')) {
    routeType = 'luxuryCarRental';
    locationSlug = path.replace('/luxury-car-rental-', '');
  } else if (path.startsWith('/monthly-car-rental-')) {
    routeType = 'monthlyCarRental';
    locationSlug = path.replace('/monthly-car-rental-', '');
  } else if (path.startsWith('/long-term-rental-')) {
    routeType = 'longTermRental';
    locationSlug = path.replace('/long-term-rental-', '');
  } else if (path.startsWith('/suv-rental-')) {
    routeType = 'suvRental';
    locationSlug = path.replace('/suv-rental-', '');
  } else if (path.startsWith('/van-rental-')) {
    routeType = 'vanRental';
    locationSlug = path.replace('/van-rental-', '');
  } else if (path.startsWith('/rent-a-car-')) {
    routeType = 'rentACar';
    locationSlug = path.replace('/rent-a-car-', '');
  } else if (path.endsWith('-airport-car-rental')) {
    routeType = 'airportSpecific';
    locationSlug = path.substring(1).replace('-airport-car-rental', '');
  } else {
    const countries = ['bahrain', 'egypt', 'jordan', 'kuwait', 'oman', 'qatar', 'saudi-arabia', 'united-arab-emirates'];
    const slug = path.substring(1).toLowerCase();
    if (countries.includes(slug)) {
      routeType = 'country';
      locationSlug = slug;
    }
  }

  return { routeType, locationSlug };
};

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

  const introTexts: Record<string, string> = {
    country: `Find the best car rental deals in ${displayName}. Compare prices from over 900 trusted suppliers and enjoy free cancellation and 24/7 support.`,
    carRental: `Looking for car rental in ${displayName}? Compare cheap rates from trusted suppliers, with free cancellation and 24/7 support. Book with Hogicar.`,
    airportCarRental: `Pick up your rental car at ${displayName} Airport. Compare airport car rental deals and save up to 30% with Hogicar.`,
    bestCarRental: `Discover the best car rental services in ${displayName}. Top-rated, reliable, and affordable – compare and book in minutes with Hogicar.`,
    cheapCarRental: `Get the cheapest car rental in ${displayName}. Compare low-cost deals and exclusive discounts, book online with Hogicar.`,
    cheapAirport: `Find cheap car rental at ${displayName} Airport. Exclusive low-price deals, no hidden fees. Book online and save with Hogicar.`,
    economyCarRental: `Rent an economy car in ${displayName} at the best price. Compact, fuel-efficient vehicles perfect for city driving. Compare and save with Hogicar.`,
    luxuryCarRental: `Experience luxury car rental in ${displayName}. Choose from premium sedans, sports cars, and SUVs. Book with Hogicar for top-tier service.`,
    monthlyCarRental: `Need a car for a month in ${displayName}? Compare monthly car rental deals, long-term discounts, and flexible terms with Hogicar.`,
    longTermRental: `Long-term car rental in ${displayName} made easy. Compare extended rental rates and enjoy no hidden costs with Hogicar.`,
    suvRental: `Rent an SUV in ${displayName} – perfect for families, desert trips, or extra space. Compare 4x4 rental prices and book with Hogicar.`,
    vanRental: `Van rental in ${displayName} for passenger transport or cargo. Find affordable minivans and full-size vans. Book with Hogicar.`,
    rentACar: `Rent a car in ${displayName} quickly and easily. Compare hundreds of deals from trusted suppliers and book your perfect car with Hogicar.`,
    airportSpecific: `${displayName} airport car rental – compare and book rental cars directly at the terminal. Secure the best rates with Hogicar.`,
  };

  return {
    title: titles[routeType] || `Car Rental ${displayName} | Hogicar`,
    description:
      descriptions[routeType] ||
      `Find affordable car rental in ${displayName}. Compare prices and book online with Hogicar.`,
    introText:
      introTexts[routeType] ||
      `Find affordable car rental in ${displayName}. Compare prices and book online with Hogicar.`,
    canonical: `https://www.hogicar.com${fullPath}`,
  };
};
