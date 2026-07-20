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
const Reviews = React.lazy(() => import('../components/Reviews'));
const TrustedSuppliers = React.lazy(() => import('../components/TrustedSuppliers'));
const LatestTravelGuides = React.lazy(() => import('../components/LatestTravelGuides'));
import { useCurrency } from '../contexts/CurrencyContext';
import SearchWidget from '../components/SearchWidget';
import Breadcrumbs from '../components/Breadcrumbs';
import { fetchLocations, fetchPublicSuppliers, fetchHomepageLogos, fetchSiteSettings, fetchHomepageContent } from '../api';
import { LocationSuggestion } from '../api';
import { API_BASE_URL } from '../lib/config';

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
}

const Home: React.FC<HomeProps> = ({ seoConfig }) => {
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
  // PRIORITIZE SEO CONFIG HERO IMAGE FOR DESTINATION PAGES
  const initialHeroImage = seoConfig?.heroImage || heroImageUrl || content.hero.backgroundImage;
  const heroBackgroundImage = (initialHeroImage?.startsWith('/') && !initialHeroImage?.startsWith('http') ? `${API_BASE_URL}${initialHeroImage}` : initialHeroImage);
  const isLocalHero = heroBackgroundImage?.includes('/uploads/hero/');
  
  // Use .webp only if the source is already .webp
  const isWebpSource = heroBackgroundImage?.toLowerCase().endsWith('.webp');
  
  const heroWebpSrcSet = (isLocalHero && isWebpSource) ? 
    `${heroBackgroundImage.replace('.webp', '_thumb.webp')} 400w, ${heroBackgroundImage.replace('.webp', '_medium.webp')} 800w, ${heroBackgroundImage.replace('.webp', '_large.webp')} 1600w` 
    : undefined;
    
  const heroPngSrcSet = isLocalHero ? (
    isWebpSource ?
      `${heroBackgroundImage.replace('.webp', '_thumb.png')} 400w, ${heroBackgroundImage.replace('.webp', '_medium.png')} 800w, ${heroBackgroundImage.replace('.webp', '_large.png')} 1600w` 
      : `${heroBackgroundImage.replace('.png', '_thumb.png').replace('.jpg', '_thumb.png').replace('.jpeg', '_thumb.png')} 400w, 
         ${heroBackgroundImage.replace('.png', '_medium.png').replace('.jpg', '_medium.png').replace('.jpeg', '_medium.png')} 800w, 
         ${heroBackgroundImage.replace('.png', '_large.png').replace('.jpg', '_large.png').replace('.jpeg', '_large.png')} 1600w`
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
    if (seoConfig.countryTag && seoConfig.routeType !== 'COUNTRY') {
      items.push({ 
        name: seoConfig.countryTag, 
        route: `/car-rental-${seoConfig.countryTag.toLowerCase().replace(/\s+/g, '-')}` 
      });
    }
    if (seoConfig.cityTag && seoConfig.routeType === 'AIRPORT') {
      items.push({ 
        name: seoConfig.cityTag, 
        route: `/car-rental-${seoConfig.cityTag.toLowerCase().replace(/\s+/g, '-')}` 
      });
    }
    items.push({ 
      name: seoConfig.h1Title || seoConfig.title, 
      route: seoConfig.route 
    });
    return items;
  }, [seoConfig]);

  return (
    <div className="bg-white font-sans">
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
        preloadImageUrl={heroBackgroundImage}
        preloadImageSrcSet={heroWebpSrcSet || heroPngSrcSet}
      />
      
      {/* 1. HERO & 2. SEARCH WIDGET */}
      {sections.hero && (
        <section className="relative z-30 pt-10 pb-6 sm:pt-12 sm:pb-8 lg:pt-16 lg:pb-12 text-white overflow-visible flex flex-col justify-center min-h-[550px] sm:min-h-[500px] lg:min-h-[480px]" style={{ color: heroTextColor }}>
          <div className="absolute inset-0 z-0 bg-[#003580]">
            {heroVideo ? (
              <video 
                autoPlay 
                muted 
                loop 
                playsInline 
                className="w-full h-full object-cover"
                onCanPlay={() => setHeroLoaded(true)}
              >
                <source src={heroVideo} type="video/mp4" />
              </video>
            ) : heroBackgroundImage && (
              <picture>
                {isLocalHero && (
                    <source 
                        type="image/webp" 
                        srcSet={heroWebpSrcSet} 
                        sizes="100vw"
                    />
                )}
                <img 
                  key={heroBackgroundImage}
                  src={heroBackgroundImage}
                  srcSet={heroPngSrcSet}
                  sizes="100vw"
                  className="w-full h-full object-cover"
                  alt={seoConfig?.imageAltText || displayH1}
                  title={seoConfig?.imageTitle || displayH1}
                  fetchPriority="high"
                  onLoad={() => setHeroLoaded(true)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    setHeroLoaded(true);
                  }}
                />
              </picture>
            )}
            {!heroLoaded && !heroVideo && heroBackgroundImage && (
              <div className="absolute inset-0 bg-[#003580]"></div>
            )}
            {!heroBackgroundImage && !heroVideo && (
              <div className="absolute inset-0 bg-gradient-to-b from-[#003580] via-[#0047AB] to-[#003580]"></div>
            )}
            <div className="absolute inset-0 bg-black/5"></div>
          </div>

          <div className="max-w-7xl mx-auto w-full px-4 text-center relative z-10">
            {isCustomLanding && <div className="mb-4"><Breadcrumbs items={breadcrumbItems} variant="light" /></div>}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 lg:mb-4 leading-tight tracking-tight drop-shadow-xl max-w-4xl mx-auto px-4">
              {displayH1}
            </h1>
            <p className="text-white/95 mb-6 lg:mb-8 max-w-2xl mx-auto text-xs sm:text-base lg:text-lg font-medium leading-relaxed px-6 drop-shadow-md">
              {displaySubtitle}
            </p>
            
            {sections.search && (
              <div id="search" className="relative z-20 mt-4 scroll-mt-24 lg:mt-0 max-w-[950px] mx-auto min-h-[380px] lg:min-h-[180px]">
                <SearchWidget
                  onSearch={handleSearch}
                  showTitle={false}
                  initialValues={{
                    pickup: pickupCode,
                    pickupName: pickupName,
                    dropoff: dropoffCode,
                    dropoffName: dropoffName
                  }}
                  accentColor={accentColor}
                  style={seoConfig?.searchWidgetStyle}
                  customColor={seoConfig?.searchWidgetColor}
                  buttonColor={seoConfig?.searchWidgetButtonColor}
                />
                
                {/* Mobile Features Bar */}
                <div className="lg:hidden mt-6 flex flex-wrap justify-center gap-2 px-4">
                    {[
                        { icon: Shield, text: 'Fully Insured' },
                        { icon: Zap, text: 'Free Cancellation' },
                        { icon: CheckCircle, text: 'No Hidden Fees' },
                        { icon: Clock, text: '24/7 Support' }
                    ].map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
                            <f.icon className="w-3.5 h-3.5 text-blue-200" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/90">{f.text}</span>
                        </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}


      {/* 4. POPULAR SUPPLIERS */}
      {sections.suppliers && (
        <React.Suspense fallback={<div className="h-48 animate-pulse bg-slate-50 rounded-3xl m-8"></div>}>
          <TrustedSuppliers />
        </React.Suspense>
      )}

      {/* 4.6 HOW TO FIND A GREAT CAR RENTAL DEAL */}
      {!isCustomLanding && (
        <section className="py-24 bg-slate-50 overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.1] uppercase tracking-tighter mb-4">
                        How to find a <span className="text-blue-600">great car rental deal</span>
                    </h2>
                    <p className="text-slate-700 font-bold uppercase text-sm tracking-[0.2em]">Follow these simple steps to save more on your next trip</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { 
                            title: 'Book Early', 
                            desc: 'Secure your vehicle at least 2-4 weeks before pickup to save up to 40% on peak season rates.',
                            icon: Calendar,
                            color: 'bg-emerald-500',
                            shadow: 'shadow-emerald-500/20'
                        },
                        { 
                            title: 'Compare Deals', 
                            desc: 'We compare prices from 900+ suppliers including global brands like Hertz and local experts.',
                            icon: Zap,
                            color: 'bg-blue-600',
                            shadow: 'shadow-blue-600/20'
                        },
                        { 
                            title: 'Check Conditions', 
                            desc: 'Always read the rental conditions for fuel policy, mileage, and insurance coverage to avoid surprises.',
                            icon: ShieldCheck,
                            color: 'bg-amber-500',
                            shadow: 'shadow-amber-500/20'
                        },
                        { 
                            title: 'Save Big', 
                            desc: 'Enjoy your trip with the best price guaranteed and 24/7 support throughout your journey.',
                            icon: Sparkles,
                            color: 'bg-rose-500',
                            shadow: 'shadow-rose-500/20'
                        },
                    ].map((step, i) => (
                        <div key={i} className="group p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 hover:-translate-y-2">
                            <div className={`w-16 h-16 rounded-2xl ${step.color} ${step.shadow} flex items-center justify-center text-white mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                <step.icon className="w-8 h-8" />
                            </div>
                            <h3 className="font-black text-slate-900 uppercase text-xl tracking-tight mb-4">{i+1}. {step.title}</h3>
                            <p className="text-slate-700 text-sm font-bold leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
      )}

      {/* 4.5 POPULAR COUNTRIES & LOCATIONS */}
      {!isCustomLanding && (
        <section className="py-20 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 uppercase tracking-tight">{homepageContent.topDestinations.title}</h2>
                    <p className="text-slate-700 font-bold uppercase text-sm tracking-[0.2em]">{homepageContent.topDestinations.subtitle}</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {homepageContent.topDestinations.countries.map((country: any) => (
                        <Link 
                          key={country.code} 
                          to={`/car-rental-${country.name.toLowerCase().replace(/\s+/g, '-')}`}
                          className="flex flex-col items-center p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md hover:border-accent transition-all group"
                        >
                            <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">{country.flag}</span>
                            <span className="font-black text-[13px] text-slate-900 uppercase tracking-tighter text-center group-hover:text-accent transition-colors">{country.name}</span>
                            <span className="text-[10px] text-slate-600 font-bold mt-2 uppercase tracking-widest">{country.count} Cars</span>
                        </Link>
                    ))}
                </div>

                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                            <MapPin className="text-accent" /> Popular Cities
                        </h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            {homepageContent.topDestinations.cities.map((city: string) => (
                                <Link 
                                  key={city} 
                                  to={`/car-rental-${city.toLowerCase().replace(/\s+/g, '-')}`}
                                  className="text-slate-600 font-bold text-sm flex items-center gap-2 hover:text-accent transition-colors"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> {city}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                            <Plane className="text-accent" /> Major Airports
                        </h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            {homepageContent.topDestinations.airports.map((airport: string) => {
                                const iataMatch = airport.match(/\(([A-Z]{3})\)/);
                                const slug = iataMatch ? `car-rental-${iataMatch[1].toLowerCase()}-airport` : `car-rental-${airport.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`;
                                return (
                                    <Link 
                                      key={airport} 
                                      to={`/${slug}`}
                                      className="text-slate-600 font-bold text-sm flex items-center gap-2 hover:text-accent transition-colors"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> {airport}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                            <Compass className="text-accent" /> Trending Regions
                        </h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            {homepageContent.topDestinations.regions.map((region: string) => (
                                <Link 
                                  key={region} 
                                  to={`/car-rental-${region.toLowerCase().replace(/\s+/g, '-')}`}
                                  className="text-slate-600 font-bold text-sm flex items-center gap-2 hover:text-accent transition-colors"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> {region}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
      )}

      {/* 4.7 GLOBAL REACH */}
      {!isCustomLanding && (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Partners', value: '900+', sub: 'Global & Local Suppliers' },
                        { label: 'Locations', value: '60,000+', sub: 'In 160+ Countries' },
                        { label: 'Reviews', value: '2M+', sub: 'Verified Customer Ratings' },
                        { label: 'Support', value: '24/7', sub: 'In 30+ Languages' },
                    ].map((stat, i) => (
                        <div key={i} className="text-center p-8 rounded-[2rem] bg-slate-50 border border-slate-100">
                            <div className="text-3xl md:text-4xl font-black text-blue-600 mb-2 tracking-tighter">{stat.value}</div>
                            <div className="text-[12px] font-black text-slate-900 uppercase tracking-widest mb-1">{stat.label}</div>
                            <div className="text-[10px] text-slate-600 font-bold uppercase">{stat.sub}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
      )}

      {/* 5. WHY CHOOSE HOGICAR */}
      {sections.benefits && (
          <section className="py-24 bg-slate-50 overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 text-center md:text-left">
                    <div className="max-w-2xl mx-auto md:mx-0">
                        <p className="text-accent font-black uppercase text-sm tracking-[0.2em] mb-4">The HogiCar Advantage</p>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.1] uppercase tracking-tighter">
                            Why Travelers <span className="text-blue-600">Choose Us</span> Over Others
                        </h2>
                    </div>
                    <div className="hidden md:block pb-2">
                        <Link to="/about-us" className="group flex items-center gap-2 text-slate-900 font-black uppercase text-sm tracking-widest hover:text-blue-600 transition-colors">
                            Learn more about us <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {content.features.map((feature, i) => {
                        const Icon = iconMap[feature.icon] || CheckCircle;
                        // Unique brand colors for icons
                        const iconColors = [
                            'bg-blue-600 shadow-blue-200',
                            'bg-accent shadow-accent/20',
                            'bg-indigo-600 shadow-indigo-200',
                            'bg-emerald-600 shadow-emerald-200'
                        ];
                        const colorClass = iconColors[i % iconColors.length];
                        
                        return (
                            <div key={i} className="relative p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:bg-blue-50 transition-colors duration-500" />
                                <div className="relative z-10">
                                    <div className={`w-16 h-16 rounded-2xl ${colorClass} shadow-lg flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 text-white`}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight leading-none">{feature.title}</h3>
                                    <p className="text-slate-700 text-sm leading-relaxed font-bold">{feature.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          </section>
      )}

      {/* 6. CUSTOMER REVIEWS */}
      {sections.reviews && (
        <React.Suspense fallback={<div className="h-64 animate-pulse bg-slate-50 rounded-3xl m-8"></div>}>
          <Reviews 
            customReviews={seoConfig ? builderConfig?.sections?.reviews?.items : homepageContent?.selectedReviews}
            accentColor={customStyles.accentColor}
          />
        </React.Suspense>
      )}

      {/* 7. DESTINATION INFORMATION (Unique Content) */}
      {sections.content && (seoConfig?.content || builderConfig?.sections?.content?.html || builderConfig?.sections?.content?.text || builderConfig?.html || builderConfig?.text) && (
        <section id="main-seo-content" className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4">
            <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-900">
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



      {/* 14. FREQUENTLY ASKED QUESTIONS */}
      {sections.faq && (
        <section className="py-20 bg-slate-50/50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-accent/10 text-accent mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight">Frequently Asked Questions</h2>
              <p className="text-slate-700 font-bold uppercase text-xs tracking-widest max-w-lg mx-auto leading-relaxed">Everything you need to know about renting in {displayH1.replace('Car Rental in ', '')} for a smooth journey.</p>
            </div>

            <div className="grid gap-4">
                {faqs.map((faq, index) => {
                  const Icon = iconMap[faq.icon] || HelpCircle;
                  const isOpen = openFaqIndex === index;
                  
                  return (
                    <div 
                      key={faq.id || index} 
                      className={`group rounded-3xl transition-all duration-300 border ${isOpen ? 'bg-white shadow-xl shadow-slate-200/50 border-accent/20' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}
                    >
                      <button 
                        onClick={() => toggleFaq(index)} 
                        className="w-full flex items-center text-left p-5 sm:p-7 focus:outline-none"
                      >
                        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isOpen ? (faq.color || 'bg-accent') : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                          <Icon className={`w-6 h-6 ${isOpen ? 'text-white' : 'text-slate-500'}`} />
                        </div>
                        <div className="ml-5 flex-1 pr-4">
                          <span className={`block font-black uppercase tracking-tight transition-colors duration-300 ${isOpen ? 'text-slate-900 text-lg' : 'text-slate-700 group-hover:text-slate-900'}`}>
                            {faq.question}
                          </span>
                        </div>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-accent border-accent text-white rotate-180' : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300'}`}>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </button>
                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-5 sm:px-7 pb-7 ml-0 sm:ml-12">
                          <div className="h-px w-10 bg-slate-100 mb-6 hidden sm:block"></div>
                          <p className="text-slate-600 leading-relaxed font-medium text-base">
                            {faq.answer}
                          </p>
                          {isOpen && (
                            <div className="mt-6 flex items-center gap-2 text-accent font-black text-[10px] uppercase tracking-widest">
                              <Sparkles className="w-3 h-3" />
                              Was this helpful?
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="mt-16 text-center">
              <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mb-4">Still have questions?</p>
              <a href="mailto:support@hogicar.com" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                Contact Support <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* 15. RELATED ARTICLES */}
      <React.Suspense fallback={<div className="h-96 animate-pulse bg-slate-50 rounded-3xl m-8"></div>}>
        <LatestTravelGuides 
          variant={isCustomLanding ? 'DEFAULT' : 'HOMEPAGE'}
          route={seoConfig?.route || '/'} 
          destination={seoConfig?.destinationName}
          country={seoConfig?.countryTag} 
          airport={seoConfig?.airportTags}
          limit={isCustomLanding ? 3 : 6} 
        />
      </React.Suspense>

      {/* FOOTER is outside the Home component usually or at the bottom of the main layout. 
          Assuming Newsletter section is the last part before the real footer. */}
      {sections.cta && (
        <section className="py-16 bg-slate-950 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-6 uppercase tracking-tight">Get Exclusive Car Rental Deals</h2>
            <p className="text-slate-400 mb-10 font-bold uppercase text-sm tracking-widest">Join 10,000+ travelers receiving insider offers</p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-accent"
                />
                <button type="submit" className="bg-accent hover:brightness-110 text-white font-black px-8 py-4 rounded-2xl transition-all uppercase tracking-widest text-xs">
                    Join Now
                </button>
            </form>
          </div>
        </section>
      )}

      {/* 16. POPULAR DESTINATIONS (Extra, not explicitly requested in order but good for SEO internal linking) */}
      {!isCustomLanding && sections.popularDestinations && (
        <section className="bg-slate-50 py-16">
          <div className="max-w-7xl mx-auto px-4">
             <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                 <div>
                     <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Popular Destinations</h2>
                     <p className="text-slate-700 font-bold uppercase text-xs tracking-widest">Explore our most booked locations</p>
                 </div>
                 <Link to="/search" className="text-accent font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                     View All <ArrowRight className="w-4 h-4" />
                 </Link>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                 {destinations.slice(0, 5).map((dest, index) => (
                    <Link to={`/search?location=${encodeURIComponent(dest.name)}`} key={index} className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-slate-900">
                        <img src={dest.image} alt={dest.name} className="h-full w-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">{dest.name}</h3>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">{dest.country}</p>
                        </div>
                    </Link>
                 ))}
             </div>
          </div>
        </section>
      )}

    </div>
  );
};
export default Home;
