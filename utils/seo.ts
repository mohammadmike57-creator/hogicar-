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
  } else if (normalizedPath.startsWith('/cheap-car-hire-')) {
    routeType = 'cheapCarHire';
    locationSlug = normalizedPath.replace('/cheap-car-hire-', '');
  } else if (normalizedPath.startsWith('/airport-car-hire-')) {
    routeType = 'airportCarHire';
    locationSlug = normalizedPath.replace('/airport-car-hire-', '');
  } else if (normalizedPath.startsWith('/best-car-hire-')) {
    routeType = 'bestCarHire';
    locationSlug = normalizedPath.replace('/best-car-hire-', '');
  } else if (normalizedPath.startsWith('/luxury-car-hire-')) {
    routeType = 'luxuryCarHire';
    locationSlug = normalizedPath.replace('/luxury-car-hire-', '');
  } else if (normalizedPath.startsWith('/suv-hire-')) {
    routeType = 'suvHire';
    locationSlug = normalizedPath.replace('/suv-hire-', '');
  } else if (normalizedPath.startsWith('/van-hire-')) {
    routeType = 'vanHire';
    locationSlug = normalizedPath.replace('/van-hire-', '');
  } else if (normalizedPath.startsWith('/economy-car-hire-')) {
    routeType = 'economyCarHire';
    locationSlug = normalizedPath.replace('/economy-car-hire-', '');
  } else if (normalizedPath.startsWith('/monthly-car-hire-')) {
    routeType = 'monthlyCarHire';
    locationSlug = normalizedPath.replace('/monthly-car-hire-', '');
  } else if (normalizedPath.startsWith('/long-term-car-hire-')) {
    routeType = 'longTermCarHire';
    locationSlug = normalizedPath.replace('/long-term-car-hire-', '');
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

  // Specific override for Amman to meet strict requirements
  if (slug === 'amman' && routeType === 'carRental') {
    const title = 'Car Rental in Amman, Jordan | Compare & Book Online | Hogicar';
    const description = 'Compare car rental deals in Amman, Jordan with Hogicar. Find rental cars at Queen Alia Airport and city locations and book online.';
    const canonicalUrl = 'https://www.hogicar.com/car-rental-amman';
    const imageUrl = 'https://www.hogicar.com/android-chrome-512x512.png';

    return {
      title,
      description,
      keywords: 'car rental amman, rent a car amman, car hire amman, amman car rental jordan',
      canonicalUrl,
      introText: 'Find the best car rental deals in Amman with Hogicar. Compare top suppliers at Queen Alia International Airport and city locations for your Jordan trip.',
      ogImage: imageUrl,
      primaryKeyword: 'car rental Amman',
      searchIntent: 'Commercial',
      breadcrumbTitle: 'Amman',
      ogTitle: title,
      ogDescription: description,
      twitterTitle: title,
      twitterDescription: description,
      imageAltText: 'Car Rental in Amman',
      imageTitle: 'Car Rental in Amman',
      indexable: true,
      published: true,
      lang: 'en',
      destinationName: 'Amman',
      countryTag: 'Jordan',
      countryRoute: '/car-rental-jo',
      h1Title: 'Car Rental in Amman',
      faqItems: [
        {
          question: 'What documents do I need to rent a car in Amman?',
          answer: 'You typically need a valid driver\'s license from your home country, your passport, and a major credit card for the security deposit. An International Driving Permit (IDP) is recommended if your license is not in English or Arabic. Requirements can vary by supplier, so always check the specific rental terms.',
          icon: 'FileText'
        },
        {
          question: 'What is the minimum age to rent a car in Amman?',
          answer: 'The minimum age is usually 21, but some suppliers may require drivers to be 25 or older for certain vehicle categories. Drivers under 25 may also be subject to a "young driver fee". Specific age requirements depend on the car rental provider.',
          icon: 'User'
        },
        {
          question: 'Can I rent a car at Queen Alia International Airport?',
          answer: 'Yes, Queen Alia International Airport (AMM) has several car rental desks located in the arrivals hall. You can book in advance through Hogicar to ensure your vehicle is ready when you land.',
          icon: 'Plane'
        },
        {
          question: 'Do rental cars in Amman require a security deposit?',
          answer: 'Yes, almost all car rental suppliers in Amman require a security deposit. This is usually held as a pre-authorization on the main driver\'s credit card and is released after the car is returned without damage.',
          icon: 'Wallet'
        },
        {
          question: 'Can I rent an automatic car in Amman?',
          answer: 'Yes, automatic cars are widely available for rent in Amman. While manual cars exist, most rental fleets in Jordan predominantly feature automatic transmissions for comfort and ease of driving.',
          icon: 'Zap'
        },
        {
          question: 'Can I return my rental car in another city in Jordan?',
          answer: 'One-way rentals are often possible (e.g., picking up in Amman and dropping off in Aqaba), but they may incur an additional one-way fee. Availability and fees depend on the specific supplier.',
          icon: 'ArrowRight'
        }
      ],
      structuredData: JSON.stringify([
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": title,
          "description": description,
          "url": canonicalUrl,
          "inLanguage": "en",
          "isPartOf": {
            "@type": "WebSite",
            "name": "Hogicar",
            "url": "https://www.hogicar.com/"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Hogicar",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.hogicar.com/android-chrome-512x512.png"
            }
          },
          "breadcrumb": {
            "@id": "https://www.hogicar.com/car-rental-amman#breadcrumb"
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What documents do I need to rent a car in Amman?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "You typically need a valid driver's license from your home country, your passport, and a major credit card for the security deposit. An International Driving Permit (IDP) is recommended if your license is not in English or Arabic. Requirements can vary by supplier, so always check the specific rental terms."
              }
            },
            {
              "@type": "Question",
              "name": "What is the minimum age to rent a car in Amman?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The minimum age is usually 21, but some suppliers may require drivers to be 25 or older for certain vehicle categories. Drivers under 25 may also be subject to a \"young driver fee\". Specific age requirements depend on the car rental provider."
              }
            },
            {
              "@type": "Question",
              "name": "Can I rent a car at Queen Alia International Airport?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, Queen Alia International Airport (AMM) has several car rental desks located in the arrivals hall. You can book in advance through Hogicar to ensure your vehicle is ready when you land."
              }
            },
            {
              "@type": "Question",
              "name": "Do rental cars in Amman require a security deposit?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, almost all car rental suppliers in Amman require a security deposit. This is usually held as a pre-authorization on the main driver's credit card and is released after the car is returned without damage."
              }
            },
            {
              "@type": "Question",
              "name": "Can I rent an automatic car in Amman?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, automatic cars are widely available for rent in Amman. While manual cars exist, most rental fleets in Jordan predominantly feature automatic transmissions for comfort and ease of driving."
              }
            },
            {
              "@type": "Question",
              "name": "Can I return my rental car in another city in Jordan?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "One-way rentals are often possible (e.g., picking up in Amman and dropping off in Aqaba), but they may incur an additional one-way fee. Availability and fees depend on the specific supplier."
              }
            }
          ]
        }
      ]),
      content: `
        <div class="seo-content-section">
          <h2>Car Hire in Amman: Your Gateway to Jordan</h2>
          <p>Finding a reliable <a href="/car-rental-amman">car rental in Amman</a> is essential for travelers who want to explore Jordan beyond the city limits. Amman is a vibrant city with a rich history, and having a rental car allows you to visit major landmarks like the Citadel and the Roman Theater with ease.</p>
          
          <h3>Queen Alia International Airport Car Rental</h3>
          <p>Most travelers choose to pick up their rental car at <a href="/queen-alia-airport-car-rental">Queen Alia International Airport (AMM)</a>. All major international and local car rental companies have desks at the airport, providing convenient access to your vehicle immediately upon arrival. Alternatively, city locations in West Amman and Abdali offer flexible pickup options.</p>
          
          <h3>Driving and Parking in Amman</h3>
          <p>Driving in Amman can be a unique experience with its hilly terrain and busy traffic. Main areas like Abdoun and Shmeisani are well-connected, but be prepared for congestion during peak hours. Most hotels and malls offer parking, though street parking in downtown Amman can be challenging.</p>
          
          <h3>Explore Jordan from Amman</h3>
          <p>Amman is perfectly situated for day trips. With your rental car, you can drive to the Dead Sea (approx. 1 hour) or the ancient Roman city of Jerash. For longer trips, consider a <a href="/car-rental-jo">car rental in Jordan</a> to visit Petra and Wadi Rum.</p>
          
          <h3>Rental Options in Amman</h3>
          <p>Whether you are looking for a <a href="/cheap-car-rental-amman">cheap car rental in Amman</a> for city errands, a <a href="/luxury-car-rental-amman">luxury car hire</a> for a special occasion, or a <a href="/suv-rental-amman">SUV rental</a> for family adventures, Hogicar connects you with the best options. We also offer <a href="/van-rental-amman">van rentals</a> for larger groups and <a href="/monthly-car-rental-amman">monthly car rentals</a> for extended stays.</p>
          
          <p><em>Note: Requirements and rental conditions vary by supplier and vehicle. Check the individual rental terms before booking.</em></p>
        </div>
      `,
      airportTags: '',
      alternateRoute: '/ar/تأجير-سيارات-في-عمان'
    };
  }

  const titles: Record<string, string> = {
    carRental: `Car Rental in ${displayName} | Best Deals & Rates`,
    carHire: `Car Hire ${displayName} | Compare Best Deals`,
    weeklyCarRental: `Weekly Car Rental ${displayName} – 7-Day Deals`,
    dailyCarRental: `Daily Car Rental ${displayName} – Short Trips & Day Hire`,
    electricCarRental: `Electric Car Rental ${displayName} – Green & Eco‑Friendly`,
    convertibleRental: `Convertible Rental ${displayName} – Open‑Air Luxury`,
    oneWayCarRental: `One‑Way Car Rental ${displayName} – Flexible Drop‑Off`,
    cheapCarRental: `Cheap Car Rental in ${displayName} | Lowest Prices`,
    cheapCarHire: `Cheap Car Hire ${displayName} | Low‑Cost Rentals`,
    cheapAirport: `Cheap Airport Car Rental ${displayName} | Save Up to 30%`,
    bestCarRental: `Best Car Rental in ${displayName} | Top Rated Suppliers`,
    bestCarHire: `Best Car Hire ${displayName} | Top‑Rated Services`,
    airportCarRental: `Airport Car Rental ${displayName} | Terminal Pickup`,
    airportCarHire: `Airport Car Hire ${displayName} | Terminal Pickup`,
    airportSpecific: `${displayName} Car Rental | Compare Airport Offers`,
    luxuryCarRental: `Luxury Car Rental in ${displayName} | Premium Cars`,
    luxuryCarHire: `Luxury Car Hire ${displayName} | Premium Vehicles`,
    economyCarRental: `Economy Car Rental in ${displayName} | Low‑Cost`,
    economyCarHire: `Economy Car Hire ${displayName} | Affordable Cars`,
    monthlyCarRental: `Monthly Car Rental in ${displayName} | Long‑Term Deals`,
    monthlyCarHire: `Monthly Car Hire ${displayName} | Long‑Term Deals`,
    longTermRental: `Long‑Term Car Rental in ${displayName} | Flexible Plans`,
    longTermCarHire: `Long‑Term Car Hire ${displayName} | Extended Rentals`,
    suvRental: `SUV Rental in ${displayName} | 4x4 & Spacious`,
    suvHire: `SUV Hire ${displayName} | 4x4 Rentals`,
    vanRental: `Van Rental in ${displayName} | Passenger & Cargo`,
    vanHire: `Van Hire ${displayName} | Passenger & Cargo`,
    rentACar: `Rent a Car in ${displayName} | Online Booking`,
    country: `${displayName} Car Rental | Compare Best Deals`,
  };

  const descriptions: Record<string, string> = {
    carRental: `Searching for car rental in ${displayName}? Compare cheap rates from 900+ trusted suppliers, free cancellation & 24/7 support. Book with Hogicar.`,
    carHire: `Searching for car hire in ${displayName}? Compare reliable rental cars from 900+ suppliers. Book with Hogicar for free cancellation & 24/7 support.`,
    weeklyCarRental: `Save with weekly car rental in ${displayName}. Compare 7-day hire deals from 900+ suppliers. Free cancellation, no hidden fees.`,
    dailyCarRental: `Need a car for a day in ${displayName}? Compare cheap daily rental rates. Perfect for airport pickups, day trips & short stays.`,
    electricCarRental: `Rent an electric car in ${displayName}. Go green with zero‑emission vehicles. Find EV charging stations & book with Hogicar.`,
    convertibleRental: `Cruise ${displayName} in style with a convertible rental. Compare luxury open‑top cars for the ultimate driving experience.`,
    oneWayCarRental: `Plan a road trip with one‑way car rental in ${displayName}. Pick up in one city, drop off in another. Flexible options on Hogicar.`,
    cheapCarRental: `Find the cheapest car rental in ${displayName}. Compare low‑cost deals, economy cars, and exclusive discounts. Book online & save with Hogicar.`,
    cheapCarHire: `Find cheap car hire in ${displayName}. Compare budget deals & economy cars. No hidden fees, free cancellation. Book now.`,
    cheapAirport: `Get cheap airport car rental at ${displayName}. Compare budget‑friendly options, secure the lowest price. No hidden fees, free cancellation.`,
    bestCarRental: `Discover the best car rental services in ${displayName}. Top‑rated, reliable, and affordable. Compare reviews and book in minutes with Hogicar.`,
    bestCarHire: `Looking for the best car hire in ${displayName}? Compare top-rated suppliers and book reliable vehicles at the lowest prices.`,
    airportCarRental: `Pick up your rental car at ${displayName} Airport. Compare airport car rental deals, save up to 30%. Easy online booking.`,
    airportCarHire: `Pick up your hire car at ${displayName} airport. Compare airport car hire deals and save up to 30%. Easy online booking.`,
    airportSpecific: `${displayName} airport car rental – compare & book rental cars directly at the terminal. Secure the best rates with Hogicar.`,
    luxuryCarRental: `Experience luxury car rental in ${displayName}. Choose from premium sedans, sports cars, & SUVs. Top‑tier service with Hogicar.`,
    luxuryCarHire: `Experience premium travel with luxury car hire in ${displayName}. Compare high-end vehicles, sports cars and executive sedans.`,
    economyCarRental: `Rent an economy car in ${displayName} at the best price. Compact, fuel‑efficient vehicles perfect for city driving. Compare & save.`,
    economyCarHire: `Save more with economy car hire in ${displayName}. Compare low-cost rental deals and fuel-efficient compact cars.`,
    monthlyCarRental: `Need a car for a month in ${displayName}? Compare monthly car rental deals, long‑term discounts, flexible terms. Book with Hogicar.`,
    monthlyCarHire: `Flexible monthly car hire in ${displayName}. Compare long-term rental rates and save with extended booking discounts.`,
    longTermRental: `Long‑term car rental in ${displayName} made easy. Compare extended rental rates, enjoy no hidden costs. Flexible monthly plans.`,
    longTermCarHire: `Searching for long-term car hire in ${displayName}? Compare extended rental deals and enjoy flexible monthly plans with no hidden costs.`,
    suvRental: `Rent an SUV in ${displayName} – perfect for families, desert trips, or extra space. Compare 4x4 prices and book securely.`,
    suvHire: `Rent an SUV in ${displayName} for your next adventure. Compare 4x4 hire deals and spacious family vehicles from top suppliers.`,
    vanRental: `Van rental in ${displayName} for passengers or cargo. Find affordable minivans and full‑size vans. Book online with Hogicar.`,
    vanHire: `Need extra space? Compare van hire in ${displayName} for passengers or cargo. Affordable minivans and full-size vans available.`,
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
    cheapCarHire: `cheap car hire ${slug}, affordable car hire ${slug}, budget car rental ${slug}`,
    cheapAirport: `cheap airport car rental ${slug}, budget airport car rental ${slug}, cheapest car rental ${slug} airport`,
    bestCarRental: `best car rental ${slug}, top car rental companies ${slug}, car rental reviews ${slug}`,
    bestCarHire: `best car hire ${slug}, top car hire ${slug}, car hire reviews ${slug}`,
    airportCarRental: `airport car rental ${slug}, car rental ${slug} airport, ${slug} airport car hire`,
    airportCarHire: `airport car hire ${slug}, car hire ${slug} airport, airport car rental ${slug}`,
    airportSpecific: `${slug} car rental, airport car rental ${slug}, ${slug} airport car hire`,
    luxuryCarRental: `luxury car rental ${slug}, premium car rental ${slug}, sports car rental ${slug}`,
    luxuryCarHire: `luxury car hire ${slug}, premium car hire ${slug}, executive car rental ${slug}`,
    economyCarRental: `economy car rental ${slug}, cheap car rental ${slug}, compact car rental ${slug}`,
    economyCarHire: `economy car hire ${slug}, cheap car hire ${slug}, compact car hire ${slug}`,
    monthlyCarRental: `monthly car rental ${slug}, long term car rental ${slug}, 30 day car rental ${slug}`,
    monthlyCarHire: `monthly car hire ${slug}, 30 day car hire ${slug}, long term car hire ${slug}`,
    longTermRental: `long term car rental ${slug}, monthly car rental ${slug}, extended car rental ${slug}`,
    longTermCarHire: `long term car hire ${slug}, monthly car hire ${slug}, extended car hire ${slug}`,
    suvRental: `suv rental ${slug}, 4x4 rental ${slug}, spacious car rental ${slug}`,
    suvHire: `suv hire ${slug}, 4x4 hire ${slug}, suv rental ${slug}`,
    vanRental: `van rental ${slug}, minivan rental ${slug}, passenger van rental ${slug}`,
    vanHire: `van hire ${slug}, minivan hire ${slug}, van rental ${slug}`,
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
    cheapCarHire: `cheap car hire ${displayName}`,
    cheapAirport: `cheap airport car rental ${displayName}`,
    bestCarRental: `best car rental ${displayName}`,
    bestCarHire: `best car hire ${displayName}`,
    airportCarRental: `airport car rental ${displayName}`,
    airportCarHire: `airport car hire ${displayName}`,
    airportSpecific: `${displayName} airport car rental`,
    luxuryCarRental: `luxury car rental ${displayName}`,
    luxuryCarHire: `luxury car hire ${displayName}`,
    economyCarRental: `economy car rental ${displayName}`,
    economyCarHire: `economy car hire ${displayName}`,
    monthlyCarRental: `monthly car rental ${displayName}`,
    monthlyCarHire: `monthly car hire ${displayName}`,
    longTermRental: `long term car rental ${displayName}`,
    longTermCarHire: `long term car hire ${displayName}`,
    suvRental: `suv rental ${displayName}`,
    suvHire: `suv hire ${displayName}`,
    vanRental: `van rental ${displayName}`,
    vanHire: `van hire ${displayName}`,
    rentACar: `rent a car ${displayName}`,
    country: `car rental ${displayName}`,
  };

  const introTexts: Record<string, string> = {
    weeklyCarRental: `Planning a week in ${displayName}? A weekly car rental gives you the best value with lower daily rates and unlimited freedom to explore.`,
    dailyCarRental: `Only need a car for a day in ${displayName}? Daily rentals are perfect for business trips, quick getaways, or a spontaneous road trip.`,
    electricCarRental: `Drive green in ${displayName} with an electric car rental. Enjoy zero emissions, lower running costs, and access to the city’s growing EV charging network.`,
    convertibleRental: `Feel the wind with a convertible rental in ${displayName}. Ideal for coastal drives, desert sunsets, or simply making an entrance.`,
    oneWayCarRental: `Start your journey in ${displayName} and drop off elsewhere. One‑way car rental gives you the flexibility to explore without backtracking.`,
  };

  const canonicalMap: Record<string, string> = {
    carHire: `/car-rental-${slug}`,
    cheapCarHire: `/cheap-car-rental-${slug}`,
    airportCarHire: `/airport-car-rental-${slug}`,
    bestCarHire: `/best-car-rental-${slug}`,
    luxuryCarHire: `/luxury-car-rental-${slug}`,
    suvHire: `/suv-rental-${slug}`,
    vanHire: `/van-rental-${slug}`,
    economyCarHire: `/economy-car-rental-${slug}`,
    monthlyCarHire: `/monthly-car-rental-${slug}`,
    longTermCarHire: `/long-term-rental-${slug}`,
    rentACar: `/car-rental-${slug}`,
  };

  let canonical = canonicalMap[routeType] ? `https://www.hogicar.com${canonicalMap[routeType]}` : `https://www.hogicar.com/${slug}`;
  
  if (routeType === 'carRental') {
    canonical = `https://www.hogicar.com/car-rental-${slug}`;
  }

  const title = titles[routeType] || `${displayName} Car Rental | Hogicar`;

  return {
    title: title,
    description: descriptions[routeType] || `Find the best car rental deals in ${displayName}. Book online & save with Hogicar.`,
    keywords: keywords[routeType] || `car rental ${slug}, rent a car ${slug}`,
    canonicalUrl: canonical,
    introText: introTexts[routeType] || descriptions[routeType] || `Find the best car rental deals in ${displayName}. Book online & save with Hogicar.`,
    ogImage: 'https://www.hogicar.com/android-chrome-512x512.png',
    primaryKeyword: focusKeywords[routeType] || `car rental ${displayName}`,
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
  
  // Handle canonical overrides for synonyms
  const canonicalMap: Record<string, string> = {
    carHire: `/car-rental-${cityOrCountry}`,
    cheapCarHire: `/cheap-car-rental-${cityOrCountry}`,
    airportCarHire: `/airport-car-rental-${cityOrCountry}`,
    bestCarHire: `/best-car-rental-${cityOrCountry}`,
    luxuryCarHire: `/luxury-car-rental-${cityOrCountry}`,
    suvHire: `/suv-rental-${cityOrCountry}`,
    vanHire: `/van-rental-${cityOrCountry}`,
    economyCarHire: `/economy-car-rental-${cityOrCountry}`,
    monthlyCarHire: `/monthly-car-rental-${cityOrCountry}`,
    longTermCarHire: `/long-term-rental-${cityOrCountry}`,
    rentACar: `/car-rental-${cityOrCountry}`,
  };

  const canonical = canonicalMap[routeType] 
    ? `https://www.hogicar.com${canonicalMap[routeType]}`
    : (defaults.canonicalUrl || `https://www.hogicar.com${fullPath}`);

  return {
    ...defaults,
    canonicalUrl: canonical,
    canonical: canonical,
  };
};
