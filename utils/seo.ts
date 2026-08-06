/**
 * SEO Utility for dynamic route metadata
 */

export const detectRouteType = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  let routeType = '';
  let locationSlug = '';

  if (normalizedPath.startsWith('/car-rental-')) {
    routeType = 'carRental';
    locationSlug = normalizedPath.replace('/car-rental-', '');
  } else if (normalizedPath.startsWith('/car-hire-')) {
    routeType = 'carHire';
    locationSlug = normalizedPath.replace('/car-hire-', '');
  } else if (normalizedPath.startsWith('/weekly-car-rental-')) {
    routeType = 'weeklyCarRental';
    locationSlug = normalizedPath.replace('/weekly-car-rental-', '');
  } else if (normalizedPath.startsWith('/daily-car-rental-')) {
    routeType = 'dailyCarRental';
    locationSlug = normalizedPath.replace('/daily-car-rental-', '');
  } else if (normalizedPath.startsWith('/electric-car-rental-')) {
    routeType = 'electricCarRental';
    locationSlug = normalizedPath.replace('/electric-car-rental-', '');
  } else if (normalizedPath.startsWith('/convertible-rental-')) {
    routeType = 'convertibleRental';
    locationSlug = normalizedPath.replace('/convertible-rental-', '');
  } else if (normalizedPath.startsWith('/one-way-car-rental-')) {
    routeType = 'oneWayCarRental';
    locationSlug = normalizedPath.replace('/one-way-car-rental-', '');
  } else if (normalizedPath.startsWith('/cheap-car-rental-')) {
    const slug = normalizedPath.replace('/cheap-car-rental-', '');
    if (slug.includes('airport')) {
      routeType = 'cheapAirport';
    } else {
      routeType = 'cheapCarRental';
    }
    locationSlug = slug;
  } else if (normalizedPath.startsWith('/cheap-airport-car-rental-')) {
    routeType = 'cheapAirport';
    locationSlug = normalizedPath.replace('/cheap-airport-car-rental-', '');
  } else if (normalizedPath.startsWith('/best-car-rental-')) {
    routeType = 'bestCarRental';
    locationSlug = normalizedPath.replace('/best-car-rental-', '');
  } else if (normalizedPath.startsWith('/airport-car-rental-')) {
    routeType = 'airportCarRental';
    locationSlug = normalizedPath.replace('/airport-car-rental-', '');
  } else if (normalizedPath.startsWith('/luxury-car-rental-')) {
    routeType = 'luxuryCarRental';
    locationSlug = normalizedPath.replace('/luxury-car-rental-', '');
  } else if (normalizedPath.startsWith('/economy-car-rental-')) {
    routeType = 'economyCarRental';
    locationSlug = normalizedPath.replace('/economy-car-rental-', '');
  } else if (normalizedPath.startsWith('/monthly-car-rental-')) {
    routeType = 'monthlyCarRental';
    locationSlug = normalizedPath.replace('/monthly-car-rental-', '');
  } else if (normalizedPath.startsWith('/long-term-car-rental-')) {
    routeType = 'longTermRental';
    locationSlug = normalizedPath.replace('/long-term-car-rental-', '');
  } else if (normalizedPath.startsWith('/long-term-rental-')) {
    routeType = 'longTermRental';
    locationSlug = normalizedPath.replace('/long-term-rental-', '');
  } else if (normalizedPath.startsWith('/suv-rental-')) {
    routeType = 'suvRental';
    locationSlug = normalizedPath.replace('/suv-rental-', '');
  } else if (normalizedPath.startsWith('/van-rental-')) {
    routeType = 'vanRental';
    locationSlug = normalizedPath.replace('/van-rental-', '');
  } else if (normalizedPath.startsWith('/rent-a-car-')) {
    routeType = 'rentACar';
    locationSlug = normalizedPath.replace('/rent-a-car-', '');
  } else if (normalizedPath.endsWith('-airport-car-rental')) {
    routeType = 'airportSpecific';
    locationSlug = normalizedPath.substring(1).replace('-airport-car-rental', '');
  } else {
    // Check if it's a country page
    const countries = ['bahrain', 'egypt', 'jordan', 'kuwait', 'oman', 'qatar', 'saudi-arabia', 'united-arab-emirates'];
    const slug = normalizedPath.substring(1).toLowerCase();
    if (countries.includes(slug)) {
      routeType = 'country';
      locationSlug = slug;
    }
  }

  return { routeType, locationSlug };
};

export const getDefaultSEOPage = (routeType: string, slug: string, locationData?: any) => {
  const capitalize = (str: string) =>
    str
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  
  const displayName = locationData?.name || capitalize(slug || '');
  
  const COUNTRY_MAP: Record<string, string> = {
    'AE': 'United Arab Emirates',
    'SA': 'Saudi Arabia',
    'OM': 'Oman',
    'QA': 'Qatar',
    'KW': 'Kuwait',
    'BH': 'Bahrain',
    'JO': 'Jordan',
    'EG': 'Egypt',
    'united-arab-emirates': 'United Arab Emirates',
    'saudi-arabia': 'Saudi Arabia',
    'oman': 'Oman',
    'qatar': 'Qatar',
    'kuwait': 'Kuwait',
    'bahrain': 'Bahrain',
    'jordan': 'Jordan',
    'egypt': 'Egypt'
  };

  const getCountryName = (code: string) => {
    if (!code) return '';
    return COUNTRY_MAP[code.toUpperCase()] || COUNTRY_MAP[code.toLowerCase()] || capitalize(code);
  };

  const countryName = getCountryName(locationData?.countryCode || slug);
  const airportCode = locationData?.iataCode || '';

  const titles: Record<string, string> = {
    carRental: `Car Rental in ${displayName} | Best Deals & Rates`,
    carHire: `Car Hire in ${displayName} | Best Deals & Rates`,
    weeklyCarRental: `Weekly Car Rental in ${displayName} | 7-Day Deals`,
    dailyCarRental: `Daily Car Rental in ${displayName} | Short Trips`,
    electricCarRental: `Electric Car Rental in ${displayName} | Eco‑Friendly EVs`,
    convertibleRental: `Convertible Rental in ${displayName} | Open‑Air Luxury`,
    oneWayCarRental: `One‑Way Car Rental in ${displayName} | Flexible Drop‑Off`,
    cheapCarRental: `Cheap Car Rental in ${displayName} | Lowest Prices`,
    cheapAirport: `Cheap Airport Car Rental ${displayName} | Save Up to 30%`,
    bestCarRental: `Best Car Rental in ${displayName} | Top Rated Suppliers`,
    airportCarRental: `Airport Car Rental ${displayName} | Terminal Pickup`,
    airportSpecific: `${displayName} Car Rental | Compare Airport Offers`,
    luxuryCarRental: `Luxury Car Rental in ${displayName} | Premium Cars`,
    economyCarRental: `Economy Car Rental in ${displayName} | Low‑Cost`,
    monthlyCarRental: `Monthly Car Rental in ${displayName} | Long‑Term Deals`,
    longTermRental: `Long‑Term Car Rental in ${displayName} | Flexible Plans`,
    suvRental: `SUV Rental in ${displayName} | 4x4 & Spacious`,
    vanRental: `Van Rental in ${displayName} | Passenger & Cargo`,
    rentACar: `Rent a Car in ${displayName} | Online Booking`,
    country: `${displayName} Car Rental | Compare Best Deals`,
  };

  const descriptions: Record<string, string> = {
    carRental: `Searching for car rental in ${displayName}? Compare cheap rates from 900+ trusted suppliers, free cancellation & 24/7 support. Book with Hogicar.`,
    carHire: `Looking for car hire in ${displayName}? Compare car rental deals from top providers. Best rates, free cancellation. Book online with Hogicar.`,
    weeklyCarRental: `Need a weekly car rental in ${displayName}? Save more with 7‑day deals. Compare weekly rates from 900+ suppliers. Free cancellation.`,
    dailyCarRental: `Book a daily car rental in ${displayName} for short trips & day excursions. Compare cheap daily rates, no long‑term commitment. 24/7 support.`,
    electricCarRental: `Rent an electric car in ${displayName}. Zero‑emission vehicles, charging stations info. Compare EV rental prices from trusted suppliers.`,
    convertibleRental: `Rent a convertible in ${displayName} and cruise in style. Compare open‑top luxury cars for the ultimate driving experience.`,
    oneWayCarRental: `Plan a road trip with one‑way car rental in ${displayName}. Pick up in one city, drop off in another. Flexible options from 900+ suppliers.`,
    cheapCarRental: `Find the cheapest car rental in ${displayName}. Compare low‑cost deals, economy cars, and exclusive discounts. Book online & save with Hogicar.`,
    cheapAirport: `Get cheap airport car rental at ${displayName}. Compare budget‑friendly options, secure the lowest price. No hidden fees, free cancellation.`,
    bestCarRental: `Discover the best car rental services in ${displayName}. Top‑rated, reliable, and affordable. Compare reviews and book in minutes with Hogicar.`,
    airportCarRental: `Pick up your rental car at ${displayName} Airport. Compare airport car rental deals, save up to 30%. Easy online booking.`,
    airportSpecific: `${displayName} airport car rental – compare & book rental cars directly at the terminal. Secure the best rates with Hogicar.`,
    luxuryCarRental: `Experience luxury car rental in ${displayName}. Choose from premium sedans, sports cars, & SUVs. Top‑tier service with Hogicar.`,
    economyCarRental: `Rent an economy car in ${displayName} at the best price. Compact, fuel‑efficient vehicles perfect for city driving. Compare & save.`,
    monthlyCarRental: `Need a car for a month in ${displayName}? Compare monthly car rental deals, long‑term discounts, flexible terms. Book with Hogicar.`,
    longTermRental: `Long‑term car rental in ${displayName} made easy. Compare extended rental rates, enjoy no hidden costs. Flexible monthly plans.`,
    suvRental: `Rent an SUV in ${displayName} – perfect for families, desert trips, or extra space. Compare 4x4 prices and book securely.`,
    vanRental: `Van rental in ${displayName} for passengers or cargo. Find affordable minivans and full‑size vans. Book online with Hogicar.`,
    rentACar: `Rent a car in ${displayName} quickly & easily. Compare hundreds of deals from trusted suppliers. Book your perfect car with Hogicar.`,
    country: `Find the best car rental deals in ${displayName}. Compare prices from 900+ suppliers, book online & save. Reliable, transparent car rental.`,
  };

  const keywords: Record<string, string> = {
    carRental: `car rental ${slug}, rent a car ${slug}, ${slug} car hire`,
    carHire: `car hire ${slug}, car rental ${slug}, rent a car ${slug}`,
    weeklyCarRental: `weekly car rental ${slug}, 7 day car rental ${slug}, long term car rental ${slug}`,
    dailyCarRental: `daily car rental ${slug}, car rental per day ${slug}, short term car rental ${slug}`,
    electricCarRental: `electric car rental ${slug}, ev rental ${slug}, green car rental ${slug}`,
    convertibleRental: `convertible rental ${slug}, luxury car rental ${slug}, sports car rental ${slug}`,
    oneWayCarRental: `one way car rental ${slug}, car rental different drop off ${slug}, road trip car rental ${slug}`,
    cheapCarRental: `cheap car rental ${slug}, affordable car rental ${slug}, low cost car rental ${slug}`,
    cheapAirport: `cheap airport car rental ${slug}, budget airport car rental ${slug}, cheapest car rental ${slug} airport`,
    bestCarRental: `best car rental ${slug}, top car rental companies ${slug}, car rental reviews ${slug}`,
    airportCarRental: `airport car rental ${slug}, car rental ${slug} airport, ${slug} airport car hire`,
    airportSpecific: `${slug} car rental, airport car rental ${slug}, ${slug} airport car hire`,
    luxuryCarRental: `luxury car rental ${slug}, premium car rental ${slug}, sports car rental ${slug}`,
    economyCarRental: `economy car rental ${slug}, cheap car rental ${slug}, compact car rental ${slug}`,
    monthlyCarRental: `monthly car rental ${slug}, long term car rental ${slug}, 30 day car rental ${slug}`,
    longTermRental: `long term car rental ${slug}, monthly car rental ${slug}, extended car rental ${slug}`,
    suvRental: `suv rental ${slug}, 4x4 rental ${slug}, spacious car rental ${slug}`,
    vanRental: `van rental ${slug}, minivan rental ${slug}, passenger van rental ${slug}`,
    rentACar: `rent a car ${slug}, car rental ${slug}, car hire ${slug}`,
    country: `car rental ${slug}, rent a car ${slug}, ${slug} car hire, cheap car rental ${slug}`,
  };

  const focusKeywords: Record<string, string> = {
    carRental: `car rental ${displayName}`,
    carHire: `car hire ${displayName}`,
    weeklyCarRental: `weekly car rental ${displayName}`,
    dailyCarRental: `daily car rental ${displayName}`,
    electricCarRental: `electric car rental ${displayName}`,
    convertibleRental: `convertible rental ${displayName}`,
    oneWayCarRental: `one way car rental ${displayName}`,
    cheapCarRental: `cheap car rental ${displayName}`,
    cheapAirport: `cheap airport car rental ${displayName}`,
    bestCarRental: `best car rental ${displayName}`,
    airportCarRental: `airport car rental ${displayName}`,
    airportSpecific: `${displayName} airport car rental`,
    luxuryCarRental: `luxury car rental ${displayName}`,
    economyCarRental: `economy car rental ${displayName}`,
    monthlyCarRental: `monthly car rental ${displayName}`,
    longTermRental: `long term car rental ${displayName}`,
    suvRental: `suv rental ${displayName}`,
    vanRental: `van rental ${displayName}`,
    rentACar: `rent a car ${displayName}`,
    country: `car rental ${displayName}`,
  };

  let canonical = `https://www.hogicar.com/${slug}`;
  if (routeType === 'carHire') {
    canonical = `https://www.hogicar.com/car-rental-${slug}`;
  } else if (routeType === 'carRental') {
    canonical = `https://www.hogicar.com/car-rental-${slug}`;
  } else if (routeType !== 'country') {
    // For other types, we might need a more specific canonical, but default to current slug
    canonical = `https://www.hogicar.com/${slug}`;
    // Actually, the user wants the final page URL.
    // If we have normalized path, we should use it.
  }

  const title = titles[routeType] || `${displayName} Car Rental | Hogicar`;

  return {
    title: title,
    description: descriptions[routeType] || `Find the best car rental deals in ${displayName}. Book online & save with Hogicar.`,
    keywords: keywords[routeType] || `car rental ${slug}, rent a car ${slug}`,
    canonicalUrl: canonical,
    ogImage: 'https://www.hogicar.com/android-chrome-512x512.png',
    focusKeyword: focusKeywords[routeType] || `car rental ${displayName}`,
    searchIntent: 'Commercial',
    breadcrumbTitle: displayName,
    ogTitle: title,
    twitterTitle: title,
    imageAltText: `Car rental in ${displayName}`,
    imageTitle: `Car rental in ${displayName}`,
    indexable: true,
    published: true,
    destinationName: displayName,
    countryTag: countryName || displayName,
    airportTags: airportCode ? `${airportCode}, ${displayName}` : ''
  };
};

export const getRouteSEO = (routeType: string, cityOrCountry: string, fullPath: string) => {
  const defaults = getDefaultSEOPage(routeType, cityOrCountry);
  return {
    title: defaults.title,
    description: defaults.description,
    introText: defaults.description,
    canonical: `https://www.hogicar.com${fullPath}`,
  };
};
