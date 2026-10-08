import * as React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Tag from 'lucide-react/dist/esm/icons/tag';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Globe from 'lucide-react/dist/esm/icons/globe';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Star from 'lucide-react/dist/esm/icons/star';
import Award from 'lucide-react/dist/esm/icons/award';
import SearchIcon from 'lucide-react/dist/esm/icons/search';
import FileSymlink from 'lucide-react/dist/esm/icons/file-symlink';
import BookCheck from 'lucide-react/dist/esm/icons/book-check';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Zap from 'lucide-react/dist/esm/icons/zap';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import User from 'lucide-react/dist/esm/icons/user';
import Car from 'lucide-react/dist/esm/icons/car';
import Fuel from 'lucide-react/dist/esm/icons/fuel';
import ParkingCircle from 'lucide-react/dist/esm/icons/parking-circle';
import Compass from 'lucide-react/dist/esm/icons/compass';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Plane from 'lucide-react/dist/esm/icons/plane';
import Quote from 'lucide-react/dist/esm/icons/quote';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Clock from 'lucide-react/dist/esm/icons/clock';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';
import { TRUSTED_BRANDS } from '../constants';
import SEOMetadata from '../components/SEOMetadata';
import SearchWidget from '../components/SearchWidget';
import { lazyRetry } from '../utils/lazyRetry';

// Lazy load truly below-the-fold components
const Reviews = lazyRetry(() => import('../components/Reviews'));
const LatestTravelGuides = lazyRetry(() => import('../components/LatestTravelGuides'));
const PickupRequirements = lazyRetry(() => import('../components/PickupRequirements'));
const TrustedSuppliers = lazyRetry(() => import('../components/TrustedSuppliers'));
const PopularDestinations = lazyRetry(() => import('../components/PopularDestinations'));
const FAQSection = lazyRetry(() => import('../components/FAQSection'));

import { useCurrency } from '../contexts/CurrencyContext';
import Breadcrumbs from '../components/Breadcrumbs';
import { fetchLocations, fetchPublicSuppliers, fetchHomepageLogos, fetchSiteSettings, fetchHomepageContent } from '../api';
import { LocationSuggestion } from '../api';
import { API_BASE_URL } from '../lib/config';

// Desktop-only hero photo, AI-upscaled to 2448px. Every file is under 150 KB (AVIF, WebP fallback).
// Phones never download it; the tiny base64 preview shows on desktop while it loads.
const DESKTOP_HERO = {
  media: '(min-width: 1024px)',
  avifSrcSet: '/images/hero/coastal-road-1600.avif 1600w, /images/hero/coastal-road-1920.avif 1920w, /images/hero/coastal-road-2448.avif 2448w',
  webp: '/images/hero/coastal-road-1280.webp',
  placeholder: 'data:image/webp;base64,UklGRhABAABXRUJQVlA4IAQBAABwBQCdASogABAAPpE6mUeloyKhMAgAsBIJZACdMoMpJn/UoD+u8bSDZ4zf7/tsHsrQRBagAP710of76dKNd3BUPfDfOwxeqvLo915K9T3SGLh1D2PeIRf5yb+MZ3dQqlrPN2/3hxzrIGuNjicJ4Pg8oGRAz23k1jsLfC4FXvLFNJLknx8R8ElhIQFiZZbrytZkvG6zi921ppdVGoGAsvd7CZ9LDG2PWaXbPE1m0oDwdwzTI8yqvVkfT0/3sH/DDEtxGb6UTnyzX2VMHKzO23hXpIlf9X2pFWGvmKh0lZ9sVB88sj6vlsXBtDAusW5johU6oiRgR2wvO/9MzCA9Gu87DPgAAA==',
  alt: 'Aerial view of a car driving a winding coastal road by the sea',
};
const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const normalizeHomepageContent = (content: any) => {
  const safeContent = content && typeof content === 'object' ? content : {};
  const safePopular = safeContent.popularDestinations && typeof safeContent.popularDestinations === 'object'
    ? safeContent.popularDestinations
    : {};

  const normalizeDestinationImage = (destination: any) => {
    const image = typeof destination?.image === 'string' ? destination.image.trim() : '';
    if (image) return image;

    const legacyImage = typeof destination?.imageUrl === 'string' ? destination.imageUrl.trim() : '';
    if (legacyImage) return legacyImage;

    return '';
  };

  const hasDestinationsArray = Array.isArray(safePopular.destinations);
  const hasFeaturesArray = Array.isArray(safeContent.features);

  const destinations = hasDestinationsArray
    ? safePopular.destinations
        .map((destination: any, index: number) => ({
          id: destination?.id || `d${index + 1}`,
          name: destination?.name || '',
          country: destination?.country || '',
          price: Number(destination?.price) || 0,
          image: normalizeDestinationImage(destination)
        }))
        .filter((destination: any) => destination.name || destination.country || destination.image || destination.price > 0)
    : [];

  const features = hasFeaturesArray && safeContent.features.length > 0
    ? safeContent.features
        .map((f: any, index: number) => ({
          id: f?.id || `f${index + 1}`,
          icon: f?.icon || 'CheckCircle',
          title: f?.title || '',
          description: f?.description || ''
        }))
    : [
        {
          id: 'f1',
          icon: 'Shield',
          title: '900+ Suppliers',
          description: 'Compare deals from over 900 global and local car rental companies in one place.'
        },
        {
          id: 'f2',
          icon: 'MapPin',
          title: '60,000+ Locations',
          description: 'Pick up your car at airports, city centers, and stations in over 160 countries.'
        },
        {
          id: 'f3',
          icon: 'Zap',
          title: 'Free Cancellation',
          description: 'Flexible bookings with free cancellation on most rentals up to 48 hours before pickup.'
        },
        {
          id: 'f4',
          icon: 'ShieldCheck',
          title: 'No Hidden Fees',
          description: 'Transparent pricing with all mandatory taxes and fees included in the final price.'
        },
        {
          id: 'f5',
          icon: 'Clock',
          title: '24/7 Support',
          description: 'Our customer excellence team is available around the clock to assist you anywhere.'
        },
        {
          id: 'f6',
          icon: 'BookCheck',
          title: 'Secure Payments',
          description: 'Safe and encrypted payment processing for your peace of mind.'
        },
        {
          id: 'f7',
          icon: 'Star',
          title: 'Verified Reviews',
          description: 'Read authentic experiences from millions of customers to help you decide.'
        },
        {
          id: 'f8',
          icon: 'Award',
          title: 'Trusted Partners',
          description: 'We only work with established, reputable suppliers to ensure quality service.'
        }
      ];

  const rawTop = safeContent.topDestinations || {};
  const topDestinations = {
    title: rawTop.title || 'Top Destinations Worldwide',
    subtitle: rawTop.subtitle || 'Compare car rental deals in over 60,000 locations',
    countries: Array.isArray(rawTop.countries) && rawTop.countries.length > 0 
      ? rawTop.countries 
      : [
          { name: 'United Kingdom', code: 'GB', count: '2,500+', flag: '🇬🇧' },
          { name: 'United States', code: 'US', count: '8,000+', flag: '🇺🇸' },
          { name: 'Spain', code: 'ES', count: '3,200+', flag: '🇪🇸' },
          { name: 'Italy', code: 'IT', count: '2,800+', flag: '🇮🇹' },
          { name: 'France', code: 'FR', count: '2,400+', flag: '🇫🇷' },
          { name: 'Germany', code: 'DE', count: '2,100+', flag: '🇩🇪' },
          { name: 'United Arab Emirates', code: 'AE', count: '1,200+', flag: '🇦🇪' },
          { name: 'Jordan', code: 'JO', count: '800+', flag: '🇯🇴' },
          { name: 'Portugal', code: 'PT', count: '1,500+', flag: '🇵🇹' },
          { name: 'Greece', code: 'GR', count: '1,800+', flag: '🇬🇷' },
          { name: 'Turkey', code: 'TR', count: '1,600+', flag: '🇹🇷' },
          { name: 'Australia', code: 'AU', count: '2,000+', flag: '🇦🇺' },
        ],
    cities: Array.isArray(rawTop.cities) && rawTop.cities.length > 0
      ? rawTop.cities
      : ['London', 'Dubai', 'Amman', 'Paris', 'Rome', 'Madrid', 'Lisbon', 'Athens', 'Istanbul', 'New York'],
    airports: Array.isArray(rawTop.airports) && rawTop.airports.length > 0
      ? rawTop.airports
      : ['Heathrow (LHR)', 'Dubai (DXB)', 'Queen Alia (AMM)', 'Charles de Gaulle', 'Rome Fiumicino', 'JFK Airport', 'LAX Airport', 'Frankfurt (FRA)', 'Istanbul (IST)', 'Barcelona (BCN)'],
    regions: Array.isArray(rawTop.regions) && rawTop.regions.length > 0
      ? rawTop.regions
      : ['Tuscany', 'Algarve', 'Costa del Sol', 'Florida', 'California', 'Bavaria', 'Provence', 'Dead Sea', 'Wadi Rum', 'Cyclades'],
  };

  return {
    ...safeContent,
    features,
    topDestinations,
    hero: {
      title: 'Car Hire – Search, Compare & Save',
      subtitle: 'Free cancellations on most bookings',
      backgroundImage: '',
      ...(safeContent.hero || {})
    },
    howItWorks: {
      title: 'Get Your Perfect Car in 3 Easy Steps',
      subtitle: 'A streamlined rental flow from search to confirmation, built for clear prices, trusted suppliers, and fast booking.',
      steps: [
        {
          id: 'search',
          icon: 'Search',
          title: 'Search your trip',
          description: 'Choose your pickup location, dates, and times to see cars that match your exact journey.'
        },
        {
          id: 'compare',
          icon: 'Shield',
          title: 'Compare with confidence',
          description: 'Review supplier ratings, vehicle details, deposits, and policies before you decide.'
        },
        {
          id: 'book',
          icon: 'BookCheck',
          title: 'Book securely',
          description: 'Reserve online and receive your booking details with clear pickup instructions.'
        }
      ],
      ...(safeContent.howItWorks || {}),
    },
    faqs: {
      title: 'Frequently Asked Questions',
      items: [],
      ...(safeContent.faqs || {}),
    },
    popularDestinations: {
      title: 'Popular Destinations',
      ...safePopular,
      destinations
    }
  };
};

interface HomeProps {
  seoConfig?: any;
  skipSEO?: boolean;
}

const Home: React.FC<HomeProps> = ({ seoConfig, skipSEO }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);
  const { convertPrice, getCurrencySymbol } = useCurrency();
  
  const [locationsOptions, setLocationsOptions] = React.useState<LocationSuggestion[]>([]);
  const [pickupCode, setPickupCode] = React.useState<string>('');
  const [dropoffCode, setDropoffCode] = React.useState<string>('');
  const [pickupName, setPickupName] = React.useState<string>('');
  const [dropoffName, setDropoffName] = React.useState<string>('');
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const [heroImageUrl, setHeroImageUrl] = React.useState<string>('');
  const [homepageContent, setHomepageContent] = React.useState<any>(normalizeHomepageContent(null));

  const isCustomLanding = !!seoConfig;

  const builderConfig = React.useMemo(() => {
    if (!seoConfig?.contentJson) return null;
    try {
      return JSON.parse(seoConfig.contentJson);
    } catch (e) {
      return null;
    }
  }, [seoConfig]);

  const sections = {
    hero: seoConfig?.showHero ?? true,
    search: seoConfig?.showSearch ?? true,
    promotions: seoConfig?.showPromotions ?? true,
    suppliers: seoConfig?.showSuppliers ?? true,
    benefits: seoConfig?.showBenefits ?? true,
    reviews: seoConfig ? seoConfig.showReviews : !!homepageContent?.showReviews,
    faq: seoConfig?.showFaq ?? true,
    content: seoConfig?.showSeoContent ?? true,
    relatedBlogs: seoConfig?.showSeoContent ?? true,
    popularDestinations: seoConfig?.showRelatedDestinations ?? true,
    featuredCars: seoConfig?.showFeaturedCars ?? true,
    cta: true
  };

  const customStyles = {
    primaryColor: seoConfig?.primaryColor || '#007ac2',
    secondaryColor: seoConfig?.secondaryColor || '#ffffff',
    buttonColor: seoConfig?.buttonColor || '#007ac2',
    backgroundColor: seoConfig?.backgroundColor || '#ffffff',
    accentColor: seoConfig?.accentColor || '#007ac2',
    textColor: seoConfig?.heroTextColor || '#0f172a'
  };
  
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await fetchSiteSettings();
        if (settings && settings.heroImageUrl) {
          setHeroImageUrl(settings.heroImageUrl);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };

    const loadLocations = async () => {
      try {
        const options = await fetchLocations('');
        setLocationsOptions(options);
        
        let targetOption = null;

        // 1. Explicit prefill from builder config
        if (sections.search?.pickupPrefill) {
           const prefill = sections.search.pickupPrefill.toLowerCase();
           targetOption = options.find(o => 
             o.name.toLowerCase().includes(prefill) || 
             o.label.toLowerCase().includes(prefill) ||
             o.value.toLowerCase() === prefill
           );
        }

        // 2. Heuristic pre-fill based on SEO config or current route
        if (!targetOption && seoConfig) {
          const lowerDest = (seoConfig.destinationName || '').toLowerCase();
          const lowerRoute = (seoConfig.route || '').toLowerCase();
          
          if (lowerDest || lowerRoute) {
            targetOption = options.find(o => {
              const name = (o.name || '').toLowerCase();
              const label = (o.label || '').toLowerCase();
              const iata = (o.iataCode || o.iata || '').toLowerCase();
              
              return (name.length > 2 && lowerDest.includes(name)) || 
                     (label.length > 2 && lowerDest.includes(label)) ||
                     (iata.length === 3 && (lowerDest.includes(iata) || lowerRoute.includes(iata)));
            });
          }
        }

        if (targetOption) {
            setPickupName(targetOption.label);
            setPickupCode(targetOption.value);
            setDropoffName(targetOption.label);
            setDropoffCode(targetOption.value);
        }
      } catch (error) {
         console.error("Failed to load locations on homepage:", error);
      }
    };
    
    const loadSuppliers = async () => {
        try {
            const [realSuppliers, homepageLogos] = await Promise.all([
                fetchPublicSuppliers(),
                fetchHomepageLogos()
            ]);
            
            let allLogos: any[] = [];
            
            // 1. Add admin-managed homepage logos first
            if (homepageLogos && homepageLogos.length > 0) {
                allLogos = homepageLogos.map(l => ({
                    name: l.name,
                    logo: l.logoUrl,
                    scale: l.scale,
                    mobileScale: l.mobileScale,
                    spacing: l.spacing
                }));
            }
            
            // Fallback to global brands ONLY if no logos are configured at all
            if (allLogos.length === 0) {
                allLogos = TRUSTED_BRANDS;
            }
            
            setSuppliers(allLogos);
        } catch (error) {
            console.error('Error loading home suppliers:', error);
            setSuppliers(TRUSTED_BRANDS);
        }
    };

    const loadHomepageData = async () => {
      try {
        const contentData = await fetchHomepageContent();
        const normalized = normalizeHomepageContent(contentData);
        setHomepageContent(normalized);
        if (normalized?.hero?.backgroundImage && !heroImageUrl) {
          setHeroImageUrl(normalized.hero.backgroundImage);
        }
      } catch (error) {
        console.error('Error loading homepage content:', error);
      }
    };

    loadSettings();
    loadLocations();
    loadSuppliers();
    loadHomepageData();
  }, [seoConfig, location.pathname]);

  const handleSearch = (params: any) => {
    if (!params.pickup || !params.dropoff) {
      alert("Please select a pickup and dropoff location.");
      return;
    }
    const { pickup, pickupName, dropoff, dropoffName, pickupDate, dropoffDate, startTime, endTime } = params;

    const searchParams = new URLSearchParams();
    searchParams.set('pickup', pickup);
    if(pickupName) searchParams.set('pickupName', pickupName);
    if(pickupDate) searchParams.set('pickupDate', pickupDate);
    if(dropoffDate) searchParams.set('dropoffDate', dropoffDate);
    if(startTime) searchParams.set('startTime', startTime);
    if(endTime) searchParams.set('endTime', endTime);
    if(dropoff) searchParams.set('dropoff', dropoff);
    if(dropoffName) searchParams.set('dropoffName', dropoffName);
    navigate(`/searching?${searchParams.toString()}`);
  };

  const scrollToSearchWidget = () => {
    document.getElementById('search')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };
  
  const content = homepageContent;
  
  const faqs = React.useMemo(() => {
    const globalFaqs = [
      {
        question: "What do I need to rent a car?",
        answer: "Firstly, you need a valid driver’s license. In most cases, you must have held it for at least one (1) year. You also need a credit (or debit, where accepted) card to pay for the rental and leave a deposit and the voucher received after your booking is confirmed. When renting in a foreign country, you often need another form of identification, usually a passport.",
        icon: 'BookCheck',
        color: 'bg-blue-500'
      },
      {
        question: "At what age can I rent a car?",
        answer: "This depends on where you would like to rent a car. Though you can rent a car at the age of 18 in many European countries and the states of New York and Michigan in the United States, in many locations you must be 21 to rent a car. You can conveniently check this by entering your age before clicking 'Search now'. Note that most rental suppliers charge an additional Young Driver Fee for renters under the age of 25, though this age varies by supplier and location. If you enter your age before searching, we include this fee in the total, allowing for the simplest comparison.",
        icon: 'User',
        color: 'bg-purple-500'
      },
      {
        question: "What should I look for when choosing a rental supplier?",
        answer: "There are two things you should use to determine which supplier to rent from - reviews and the Rental Conditions. We ask every customer to rate their rental experience after they drop off the car and show their ratings when you search for a car. If you want to be sure you get great service, look for the Excellent Car Rental Service badge which we award to the top three suppliers in each location with an average rating of 8 or higher. You should also check the Rental Conditions to make sure the rental supplier you choose works best for your requirements.",
        icon: 'Star',
        color: 'bg-yellow-500'
      },
      {
        question: "Can I rent a car without a credit card?",
        answer: "Though just a few years ago it was impossible to rent a car without a credit card, things have changed quickly. Many suppliers, especially global companies such as Avis, Dollar, Hertz, etc., allow renters to both pay and leave a deposit with a debit card (though the card must be a Mastercard or Visa). If you do not have a credit card, be sure to check the Payment Policy section of the Rental Conditions prior to booking to see if the supplier accepts debit cards.",
        icon: 'CreditCard',
        color: 'bg-green-500'
      },
      {
        question: "What if my plans change?",
        answer: "When you book a car through Hogicar.com, you can make changes or cancel your booking for free at any point prior to 48 hours before you are scheduled to pick up the car.",
        icon: 'Clock',
        color: 'bg-rose-500'
      }
    ];

    if (seoConfig?.faqJson) {
      try {
        const parsed = JSON.parse(seoConfig.faqJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse FAQ JSON from SEO config:", e);
      }
    }
    
    const contentFaqs = content.faqs.items || [];
    return contentFaqs.length > 0 ? contentFaqs : globalFaqs;
  }, [seoConfig, content.faqs.items]);

  const destinations = content.popularDestinations.destinations;
  const [heroLoaded, setHeroLoaded] = React.useState(false);
  // The static boot shell from index.html (scripts/generate-boot-shell.mjs) paints the header and
  // hero before the app loads; drop it as soon as the real hero is on screen.
  React.useLayoutEffect(() => {
    document.getElementById('boot-shell')?.remove();
  }, []);
  // PRIORITIZE SEO CONFIG HERO IMAGE FOR DESTINATION PAGES
  const initialHeroImage = seoConfig?.heroImage || heroImageUrl || content.hero.backgroundImage;
  
  // FIXED: Only prefix with API_BASE_URL if it's an uploaded asset. 
  // Local assets like /hero-home.png should be loaded from the frontend origin.
  const heroBackgroundImage = React.useMemo(() => {
    if (!initialHeroImage) return '';
    if (initialHeroImage.startsWith('http')) return initialHeroImage;
    if (initialHeroImage.startsWith('/uploads/')) return `${API_BASE_URL}${initialHeroImage}`;
    return initialHeroImage; // Keep as relative path for local assets
  }, [initialHeroImage]);

  const isLocalHero = heroBackgroundImage?.includes('/uploads/hero/');
  
  // Use .webp only if the source is already .webp
  const isWebpSource = heroBackgroundImage?.toLowerCase().endsWith('.webp');
  
  const heroWebpSrcSet = (isLocalHero && isWebpSource) ? 
    `${heroBackgroundImage.replace('.webp', '_thumb.webp')} 400w, ${heroBackgroundImage.replace('.webp', '_medium.webp')} 800w, ${heroBackgroundImage.replace('.webp', '_large.webp')} 1600w` 
    : undefined;
    
  const heroPngSrcSet = isLocalHero ? (
    isWebpSource ?
      `${heroBackgroundImage.replace('.webp', '_thumb.png')} 400w, ${heroBackgroundImage.replace('.webp', '_medium.png')} 800w, ${heroBackgroundImage.replace('.webp', '_large.png')} 1600w` 
      : `${heroBackgroundImage.replace('.png', '_thumb.png').replace('.jpg', '_thumb.png').replace('.jpeg', '_thumb.png')} 400w, ${heroBackgroundImage.replace('.png', '_medium.png').replace('.jpg', '_medium.png').replace('.jpeg', '_medium.png')} 800w, ${heroBackgroundImage.replace('.png', '_large.png').replace('.jpg', '_large.png').replace('.jpeg', '_large.png')} 1600w`
    ) : undefined;
  
  const heroMobileImage = heroBackgroundImage;
  const heroVideo = seoConfig?.heroVideo || content.hero.video;
  const heroOverlayOpacity = seoConfig?.heroOverlayOpacity ?? 0.4;
  const heroTextColor = seoConfig?.heroTextColor || content.hero.textColor || '#FFFFFF';
  const heroButtonText = seoConfig?.heroButtonText || content.hero.buttonText;
  const heroButtonLink = seoConfig?.heroButtonLink || content.hero.buttonLink || '#search';
  const heroPromotion = {
    active: !!seoConfig?.heroPromotionActive && !!seoConfig?.heroPromotionText,
    text: seoConfig?.heroPromotionText || '',
    link: seoConfig?.heroPromotionLink || '',
    color: seoConfig?.heroPromotionColor || '#E11D48'
  };
  // Pages with their own hero image or video keep it; everywhere else desktop gets the coastal photo.
  const useDesktopHero = sections.hero && !heroVideo && !seoConfig?.heroImage;
  const shouldPreloadHeroImage = sections.hero && !heroVideo && !useDesktopHero && !!heroBackgroundImage && (!isCustomLanding || !!seoConfig?.heroImage);

  const displayH1 = seoConfig?.h1Title || content.hero.title || 'Search, Compare & Save on Car Rentals';
  const displaySubtitle = seoConfig?.heroSubtitle || seoConfig?.introText || content.hero.subtitle || 'Compare prices from 900+ car rental suppliers worldwide with transparent pricing and flexible terms.';

  const iconMap: { [key: string]: React.ElementType } = {
      Globe, Tag, Star, Award, Search: SearchIcon, FileSymlink, BookCheck, CheckCircle, Shield, Sparkles, Zap, MapPin, Mail, ArrowRight, Plane, CreditCard, Wallet, User, Clock, HelpCircle
  };

  const processSteps = Array.isArray(content.howItWorks.steps) ? content.howItWorks.steps : [];
  const processDetails = [
    'Live location and date matching',
    'Transparent terms before payment',
    'Confirmation sent after booking'
  ];

  const accentColor = customStyles.accentColor;
  const backgroundColor = customStyles.backgroundColor;
  const textColor = customStyles.textColor;
  const primaryColor = customStyles.primaryColor;
  const buttonColor = customStyles.buttonColor;

  const relatedBlogs = React.useMemo(() => {
    if (!seoConfig?.relatedBlogsJson) return [];
    try {
      return JSON.parse(seoConfig.relatedBlogsJson);
    } catch (e) {
      return [];
    }
  }, [seoConfig]);

  const breadcrumbItems = React.useMemo(() => {
    if (!seoConfig) return [];
    const items = [];
    try {
      if (seoConfig.countryTag && typeof seoConfig.countryTag === 'string' && seoConfig.routeType !== 'COUNTRY') {
        const countrySlug = seoConfig.countryTag.toLowerCase().replace(/\s+/g, '-');
        const countryRoute = seoConfig.countryRoute || `/car-rental-${countrySlug}`;
        items.push({ 
          name: seoConfig.countryTag, 
          route: countryRoute 
        });
      }
      if (seoConfig.cityTag && typeof seoConfig.cityTag === 'string' && seoConfig.routeType === 'AIRPORT') {
        const citySlug = seoConfig.cityTag.toLowerCase().replace(/\s+/g, '-');
        items.push({ 
          name: seoConfig.cityTag, 
          route: `/car-rental-${citySlug}` 
        });
      }
      const destName = seoConfig.destinationName || seoConfig.h1Title || 'Car Rental';
      items.push({ 
        name: destName, 
        route: seoConfig.route || location.pathname 
      });
    } catch (e) {
      console.warn("Home: Failed to build breadcrumbs:", e);
    }
    return items;
  }, [seoConfig, location.pathname]);

  const searchInitialValues = React.useMemo(() => ({
    pickup: pickupCode,
    pickupName: pickupName,
    dropoff: dropoffCode,
    dropoffName: dropoffName
  }), [pickupCode, pickupName, dropoffCode, dropoffName]);

  const heroHighlights = [
    { icon: CheckCircle, text: 'Free cancellation on most bookings' },
    { icon: ShieldCheck, text: 'No hidden fees' },
    { icon: Clock, text: '24/7 customer support' },
  ];

  const stats = [
    { value: '900+', label: 'Rental companies' },
    { value: '60,000+', label: 'Pick-up locations' },
    { value: '2M+', label: 'Verified ratings' },
    { value: '24/7', label: 'Customer support' },
  ];

  const featureTones = [
    'bg-blue-50 text-blue-600',
    'bg-emerald-50 text-emerald-600',
    'bg-amber-50 text-amber-600',
    'bg-violet-50 text-violet-600',
  ];

  const regionalDestinations = [
    { country: 'United Arab Emirates', cities: [['Dubai', 'dubai'], ['Abu Dhabi', 'abu-dhabi'], ['Sharjah', 'sharjah'], ['Ras Al Khaimah', 'ras-al-khaimah'], ['Fujairah', 'fujairah'], ['Ajman', 'ajman']] },
    { country: 'Saudi Arabia', cities: [['Riyadh', 'riyadh'], ['Jeddah', 'jeddah'], ['Dammam', 'dammam']] },
    { country: 'Egypt', cities: [['Cairo', 'cairo'], ['Hurghada', 'hurghada'], ['Alexandria', 'alexandria'], ['Giza', 'giza']] },
    { country: 'Jordan & the Gulf', cities: [['Amman', 'amman'], ['Aqaba', 'aqaba'], ['Muscat', 'muscat'], ['Salalah', 'salalah'], ['Doha', 'doha'], ['Manama', 'manama'], ['Kuwait City', 'kuwait-city']] },
  ];

  const sectionHeading = (eyebrow: string, title: string, subtitle?: string) => (
    <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
      <p className="text-sm font-semibold text-accent">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-base text-slate-600 sm:text-lg">{subtitle}</p>}
    </div>
  );

  const linkList = (items: { label: string; to: string }[]) => (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
      {items.map(item => (
        <li key={item.to}>
          <Link to={item.to} className="text-sm text-slate-600 transition-colors hover:text-accent hover:underline">{item.label}</Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="bg-white font-sans text-slate-900">
      {!skipSEO && (
        <SEOMetadata
          title={seoConfig?.title}
          description={seoConfig?.description}
          keywords={seoConfig?.keywords}
          canonicalUrl={seoConfig?.canonicalUrl}
          ogImage={seoConfig?.ogImage}
          ogTitle={seoConfig?.ogTitle}
          ogDescription={seoConfig?.ogDescription}
          twitterTitle={seoConfig?.twitterTitle}
          twitterDescription={seoConfig?.twitterDescription}
          noIndex={seoConfig ? !seoConfig.indexable : undefined}
          structuredData={seoConfig?.structuredData}
          config={seoConfig}
          preloadImageUrl={shouldPreloadHeroImage ? heroBackgroundImage : undefined}
          preloadImageSrcSet={shouldPreloadHeroImage ? (heroWebpSrcSet || heroPngSrcSet) : undefined}
          desktopPreload={useDesktopHero ? { href: '/images/hero/coastal-road-1920.avif', srcSet: DESKTOP_HERO.avifSrcSet, type: 'image/avif', media: DESKTOP_HERO.media } : undefined}
        />
      )}

      {/* ===== Hero and search ===== */}
      {sections.hero && (
        <section className="relative z-30 overflow-visible pb-12 pt-[104px] text-white sm:pb-16 sm:pt-32 lg:pb-24 lg:pt-40" style={{ color: heroTextColor }}>
          <div className="absolute inset-0 z-0 overflow-hidden bg-[#00224f]">
            {heroVideo ? (
              <video autoPlay muted loop playsInline className="h-full w-full object-cover" onCanPlay={() => setHeroLoaded(true)}>
                <source src={heroVideo} type="video/mp4" />
              </video>
            ) : useDesktopHero ? (
              <>
                {/* Phones: lightweight brand gradient, no photo download, so the headline paints straight away. */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#0b5cc4_0%,_#003580_45%,_#00224f_100%)] lg:hidden" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.07] lg:hidden" />
                {/* Desktop: high-resolution photo over a tiny blurred preview. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 hidden scale-110 bg-cover bg-center blur-2xl lg:block"
                  style={{ backgroundImage: `url(${DESKTOP_HERO.placeholder})` }}
                />
                <picture>
                  <source media={DESKTOP_HERO.media} type="image/avif" srcSet={DESKTOP_HERO.avifSrcSet} sizes="100vw" />
                  <source media={DESKTOP_HERO.media} type="image/webp" srcSet={DESKTOP_HERO.webp} />
                  <img
                    src={TRANSPARENT_PIXEL}
                    className="relative hidden h-full w-full object-cover object-[center_40%] lg:block"
                    alt={DESKTOP_HERO.alt}
                    fetchPriority="high"
                    decoding="async"
                  />
                </picture>
                <div className="hidden lg:block">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#001b3d]/70 via-[#001b3d]/20 to-[#001b3d]/65" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,20,45,0.4)_100%)]" />
                </div>
              </>
            ) : heroBackgroundImage ? (
              <picture>
                {isLocalHero && <source type="image/webp" srcSet={heroWebpSrcSet} sizes="100vw" />}
                <img
                  key={heroBackgroundImage}
                  src={heroBackgroundImage}
                  srcSet={heroPngSrcSet}
                  sizes="100vw"
                  className="h-full w-full object-cover"
                  alt={seoConfig?.imageAltText || displayH1}
                  title={seoConfig?.imageTitle || displayH1}
                  fetchPriority="high"
                  decoding="async"
                  onLoad={() => setHeroLoaded(true)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    setHeroLoaded(true);
                  }}
                />
              </picture>
            ) : (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#0b5cc4_0%,_#003580_45%,_#00224f_100%)]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.07]" />
              </>
            )}
            {!heroLoaded && !heroVideo && !useDesktopHero && heroBackgroundImage && <div className="absolute inset-0 bg-[#00224f]" />}
            {!useDesktopHero && (heroVideo || heroBackgroundImage) && (
              <>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/35 to-slate-950/55" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/50 to-transparent" />
              </>
            )}
          </div>

          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {isCustomLanding && (
              <div className="mb-5 flex flex-col items-center text-center">
                <Breadcrumbs items={breadcrumbItems} variant="light" />
                {seoConfig.countryTag && typeof seoConfig.countryTag === 'string' && seoConfig.routeType !== 'COUNTRY' && (
                  <span className="mt-3 inline-block rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                    {seoConfig.countryTag}
                  </span>
                )}
              </div>
            )}

            <div className="mx-auto max-w-6xl text-center">
              {heroPromotion.active ? (
                <a
                  href={heroPromotion.link || '#search'}
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm"
                  style={{ backgroundColor: heroPromotion.color }}
                >
                  <Tag className="h-4 w-4" /> {heroPromotion.text}
                </a>
              ) : !isCustomLanding && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="sm:hidden">900+ rental companies</span>
                  <span className="hidden sm:inline">900+ rental companies · 60,000+ locations</span>
                </span>
              )}
              <h1 className={`mx-auto mt-5 font-extrabold leading-[1.1] tracking-tight drop-shadow-sm ${displayH1.length <= 40
                ? 'whitespace-nowrap text-[min(3.5rem,calc((100vw-2.75rem)/19.5))]'
                : 'max-w-4xl text-balance text-[2rem] sm:text-5xl lg:text-6xl'}`}>
                {displayH1}
              </h1>
              <p className="route-description mx-auto mt-3 max-w-2xl text-balance text-sm text-white/85 sm:mt-4 sm:text-lg lg:text-xl">
                {displaySubtitle}
              </p>
            </div>

            {sections.search && (
              <div id="search" className="relative z-20 mt-7 scroll-mt-24 sm:mt-9">
                <SearchWidget
                  onSearch={handleSearch}
                  showTitle={false}
                  initialValues={searchInitialValues}
                  accentColor={accentColor}
                  style={seoConfig?.searchWidgetStyle}
                  customColor={seoConfig?.searchWidgetColor}
                  buttonColor={seoConfig?.searchWidgetButtonColor}
                />
              </div>
            )}

            <ul className="mx-auto mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2.5 text-sm text-white/90 sm:gap-x-8">
              {heroHighlights.map(item => (
                <li key={item.text} className="inline-flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                    <item.icon className="h-3.5 w-3.5 text-emerald-300" />
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ===== Supplier logos ===== */}
      {sections.suppliers && (
        <React.Suspense fallback={<div className="h-36 bg-white" />}>
          <TrustedSuppliers />
        </React.Suspense>
      )}

      {/* ===== Why book with us ===== */}
      {sections.benefits && (
        <section className="bg-slate-50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {sectionHeading('Why Hogicar', 'Car rental made simple', 'Clear prices, trusted suppliers and real people to help — from search to drop-off.')}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {content.features.map((feature: any, i: number) => {
                const Icon = iconMap[feature.icon] || CheckCircle;
                return (
                  <div key={feature.id || i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${featureTones[i % featureTones.length]}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-slate-900">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== Destination photos ===== */}
      {!isCustomLanding && sections.popularDestinations && (
        <React.Suspense fallback={<div className="h-96 bg-white" />}>
          <PopularDestinations
            destinations={destinations}
            title="Explore popular destinations"
            subtitle="Our most booked locations this season"
          />
        </React.Suspense>
      )}

      {/* ===== How it works + numbers ===== */}
      {!isCustomLanding && (
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
            <div>
              <p className="text-sm font-semibold text-accent">How it works</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{content.howItWorks.title}</h2>
              <p className="mt-3 text-base text-slate-600 sm:text-lg">{content.howItWorks.subtitle}</p>
              <ol className="mt-8 space-y-6">
                {processSteps.map((step: any, i: number) => {
                  const Icon = iconMap[step.icon] || CheckCircle;
                  return (
                    <li key={step.id || i} className="flex gap-4">
                      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                        <Icon className="h-5 w-5" />
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-accent ring-2 ring-accent">{i + 1}</span>
                      </span>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <button
                type="button"
                onClick={scrollToSearchWidget}
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-accent-700"
              >
                Start your search <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003580] to-[#0b5cc4] p-8 text-white shadow-xl sm:p-10">
              <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
              <div className="relative">
                <p className="text-sm font-medium text-white/70">Hogicar in numbers</p>
                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8">
                  {stats.map(stat => (
                    <div key={stat.label}>
                      <dt className="text-sm text-white/75">{stat.label}</dt>
                      <dd className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{stat.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <ShieldCheck className="h-8 w-8 shrink-0 text-emerald-300" />
                  <p className="text-sm text-white/90">All mandatory taxes and fees are shown up front, with free cancellation on most bookings.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== Countries and links ===== */}
      {!isCustomLanding && (
        <section className="bg-slate-50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {sectionHeading('Destinations', homepageContent.topDestinations.title, homepageContent.topDestinations.subtitle)}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {homepageContent.topDestinations.countries.map((country: any) => (
                <Link
                  key={country.code}
                  to={`/car-rental-${country.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
                >
                  <span className="text-3xl leading-none" aria-hidden="true">{country.flag}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight text-slate-900 group-hover:text-accent">{country.name}</span>
                    <span className="block text-xs text-slate-500">{country.count} cars</span>
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:grid-cols-3">
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900"><MapPin className="h-4 w-4 text-accent" /> Popular cities</h3>
                {linkList(homepageContent.topDestinations.cities.map((city: string) => ({ label: city, to: `/car-rental-${city.toLowerCase().replace(/\s+/g, '-')}` })))}
              </div>
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900"><Plane className="h-4 w-4 text-accent" /> Major airports</h3>
                {linkList(homepageContent.topDestinations.airports.map((airport: string) => {
                  const iataMatch = airport.match(/\(([A-Z]{3})\)/);
                  const slug = iataMatch ? `car-rental-${iataMatch[1].toLowerCase()}-airport` : `car-rental-${airport.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`;
                  return { label: airport, to: `/${slug}` };
                }))}
              </div>
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900"><Compass className="h-4 w-4 text-accent" /> Trending regions</h3>
                {linkList(homepageContent.topDestinations.regions.map((region: string) => ({ label: region, to: `/car-rental-${region.toLowerCase().replace(/\s+/g, '-')}` })))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== What you need at pick-up ===== */}
      <React.Suspense fallback={<div className="h-96 bg-white" />}>
        <PickupRequirements />
      </React.Suspense>

      {/* ===== Customer reviews ===== */}
      {sections.reviews && (
        <React.Suspense fallback={<div className="h-64 bg-white" />}>
          <Reviews
            customReviews={seoConfig ? builderConfig?.sections?.reviews?.items : homepageContent?.selectedReviews}
            accentColor={customStyles.accentColor}
          />
        </React.Suspense>
      )}

      {/* ===== Destination information (unique content) ===== */}
      {sections.content && (seoConfig?.content || builderConfig?.sections?.content?.html || builderConfig?.sections?.content?.text || builderConfig?.html || builderConfig?.text) && (
        <section id="main-seo-content" className="border-t border-slate-100 bg-white py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-slate-600 prose-strong:text-slate-900">
              {seoConfig?.content ? (
                <div dangerouslySetInnerHTML={{ __html: seoConfig.content }} />
              ) : (builderConfig?.sections?.content?.html || builderConfig?.html) ? (
                <div dangerouslySetInnerHTML={{ __html: builderConfig?.sections?.content?.html || builderConfig?.html }} />
              ) : (
                <div className="whitespace-pre-wrap text-slate-600">{builderConfig?.sections?.content?.text || builderConfig?.text}</div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===== FAQ ===== */}
      {sections.faq && (
        <React.Suspense fallback={<div className="h-96 bg-white" />}>
          <FAQSection
            faqs={faqs}
            title="Frequently asked questions"
            subtitle={`Everything you need to know about renting in ${displayH1.replace('Car Rental in ', '')}.`}
          />
        </React.Suspense>
      )}

      {/* ===== Related articles ===== */}
      <React.Suspense fallback={<div className="h-96 bg-white" />}>
        <LatestTravelGuides
          variant={isCustomLanding ? 'DEFAULT' : 'HOMEPAGE'}
          route={seoConfig?.route || '/'}
          destination={seoConfig?.destinationName}
          country={seoConfig?.countryTag}
          airport={seoConfig?.airportTags}
          limit={isCustomLanding ? 3 : 6}
        />
      </React.Suspense>

      {/* ===== Regional links ===== */}
      {!isCustomLanding && (
        <section className="border-t border-slate-200 bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Car rental across the Middle East</h2>
            <div className="mt-6 grid grid-cols-2 gap-8 lg:grid-cols-4">
              {regionalDestinations.map(group => (
                <div key={group.country}>
                  <h3 className="text-sm font-semibold text-slate-900">{group.country}</h3>
                  <ul className="mt-3 space-y-2">
                    {group.cities.map(([name, slug]) => (
                      <li key={slug}>
                        <Link to={`/car-rental-${slug}`} className="text-sm text-slate-600 transition-colors hover:text-accent hover:underline">Car rental {name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Newsletter ===== */}
      {sections.cta && (
        <section className="bg-white pb-16 pt-2 sm:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003580] to-[#0b5cc4] px-6 py-10 text-white shadow-xl sm:px-12 sm:py-14">
              <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
              <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Get exclusive car rental deals</h2>
                  <p className="mt-2 text-white/80 sm:text-lg">Join 10,000+ travellers who receive our best offers by email.</p>
                </div>
                <form className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
                  <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                  <input
                    id="newsletter-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Your email address"
                    className="h-12 flex-1 rounded-xl border-0 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                  <button type="submit" className="h-12 rounded-xl bg-amber-400 px-6 text-base font-semibold text-slate-900 transition-colors hover:bg-amber-300">
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
