import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Shield, Tag, ChevronDown, Globe, Compass, ArrowRight, Star, Award, Search, FileSymlink, BookCheck, MapPin } from 'lucide-react';
import { SUPPLIERS, MOCK_HOMEPAGE_CONTENT } from '../services/mockData';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import SearchWidget from '../components/SearchWidget';
import { fetchLocations } from '../api';
import { LocationSuggestion } from '../api';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);
  const { convertPrice, getCurrencySymbol } = useCurrency();
  
  // --- START: NEW SEARCH LOGIC ---
  const [locationsOptions, setLocationsOptions] = React.useState<LocationSuggestion[]>([]);
  const [pickupCode, setPickupCode] = React.useState<string>('');
  const [dropoffCode, setDropoffCode] = React.useState<string>('');
  const [pickupName, setPickupName] = React.useState<string>('');
  const [dropoffName, setDropoffName] = React.useState<string>('');
  
  React.useEffect(() => {
    const loadLocations = async () => {
      try {
        // FIX: Pass an empty string to fetchLocations to get default locations, as it expects one argument.
        const options = await fetchLocations('');
        setLocationsOptions(options);

        // Update name for default AMM code if a better label is available from API
        const ammOption = options.find(o => o.value === 'AMM');
        if (ammOption) {
            setPickupName(ammOption.label);
            setDropoffName(ammOption.label);
        }
      } catch (error) {
         console.error("Failed to load locations on homepage:", error);
      }
    };
    loadLocations();
  }, []);
  // --- END: NEW SEARCH LOGIC ---

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

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };
  
  const content = MOCK_HOMEPAGE_CONTENT;
  const faqs = content.faqs.items;
  const destinations = content.popularDestinations.destinations;

  const iconMap: { [key: string]: React.ElementType } = {
      Globe, Tag, Star, Award, Search, FileSymlink, BookCheck, CheckCircle, Shield
  };

  return (
    <div className="bg-white font-sans text-slate-900">
      <SEOMetadata
        title="Hogicar | Affordable Car Rentals Worldwide"
        description="Compare car rental deals from 900+ suppliers at 60,000+ locations. Find the perfect car for your next trip with Hogicar."
      />
      
      {/* 1. HERO SECTION & SEARCH WIDGET */}
      <section className="relative bg-[#003580] pt-4 pb-8 lg:pt-10 lg:pb-16 overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0 z-0">
            <img src={content.hero.backgroundImage} alt="Background" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#003580]/90 via-[#003580]/80 to-[#001a40]/95"></div>
        </div>
        
        {/* Decorative Shapes */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-[#FF9F1C] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center mb-4 lg:mb-6">
                <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-sm font-medium mb-4 shadow-lg">
                    <Star className="w-4 h-4 text-[#FF9F1C] fill-[#FF9F1C]" />
                    <span>Rated 4.9/5 by 10,000+ customers</span>
                </div>
                
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2 lg:mb-4 leading-[1.1] mt-2 sm:mt-0">
                  {content.hero.title.split(' ').map((word, i) => 
                    word.toLowerCase() === 'perfect' || word.toLowerCase() === 'car' ? 
                    <span key={i} className="text-[#FF9F1C]">{word} </span> : 
                    <span key={i}>{word} </span>
                  )}
                </h1>
                
                <p className="hidden sm:block text-blue-100 text-base sm:text-lg font-medium mb-6 max-w-2xl mx-auto leading-relaxed">
                  {content.hero.subtitle}
                </p>
            </div>

            <div className="relative z-20 max-w-5xl mx-auto">
                {/* Decorative glow behind widget */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-[#FF9F1C] rounded-3xl blur-2xl opacity-20"></div>
                
                <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 sm:p-4">
                    <SearchWidget 
                        onSearch={handleSearch} 
                        showTitle={false} 
                        initialValues={{
                        pickup: pickupCode,
                        pickupName: pickupName,
                        dropoff: dropoffCode,
                        dropoffName: dropoffName
                        }}
                    />
                </div>
            </div>
            
            {/* Quick Trust Badges */}
            <div className="mt-6 lg:mt-8 flex flex-wrap justify-center gap-3 sm:gap-6 text-white text-xs sm:text-sm font-medium">
                <div className="flex items-center gap-2 sm:gap-3 bg-white/5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="bg-green-500/20 p-1 sm:p-1.5 rounded-full">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    </div>
                    <span>Free Cancellation</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 bg-white/5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="bg-blue-500/20 p-1 sm:p-1.5 rounded-full">
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    </div>
                    <span>No Hidden Fees</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 bg-white/5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="bg-[#FF9F1C]/20 p-1 sm:p-1.5 rounded-full">
                        <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF9F1C]" />
                    </div>
                    <span>24/7 Support</span>
                </div>
            </div>
        </div>
      </section>

      {/* TRUSTED PARTNERS */}
      <section className="py-8 md:py-12 bg-white border-b border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 md:mb-8">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Trusted by the world's leading car rental suppliers</h2>
                <p className="text-base text-slate-500 mt-2">We partner with top brands to bring you the best vehicles at the best prices, ensuring quality and reliability wherever you go.</p>
            </div>
        </div>
        
        <style>
            {`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    display: flex;
                    width: max-content;
                    animation: marquee 40s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}
        </style>

        <div className="relative w-full flex overflow-hidden py-4">
            <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
            
            <div className="animate-marquee flex items-center gap-20 md:gap-32 opacity-80 px-12">
                {[...SUPPLIERS, ...SUPPLIERS, ...SUPPLIERS].map((s, idx) => (
                    <img 
                        key={`${s.id}-${idx}`}
                        src={s.logo} 
                        alt={s.name} 
                        className="h-20 md:h-32 lg:h-40 w-auto max-w-[250px] md:max-w-[350px] object-contain filter grayscale hover:grayscale-0 transition-all duration-500 cursor-pointer hover:scale-105"
                    />
                ))}
            </div>
        </div>
      </section>

      {/* WHY BOOK WITH HOGICAR? & STATS - NEW PROFESSIONAL DESIGN */}
      <section className="py-12 lg:py-16 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-10">
                <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-2">The Hogicar Advantage</h2>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">Unbeatable value, unparalleled convenience.</h3>
                <p className="mt-3 text-base text-slate-600 leading-relaxed">
                    We streamline the car rental process from start to finish, ensuring you get the best vehicle for your needs without the hassle.
                </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {content.features.slice(0, 4).map((feature) => {
                    const Icon = iconMap[feature.icon] || CheckCircle;
                    return (
                        <div key={feature.id} className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100/80">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-xl mb-4">
                                <Icon className="w-6 h-6" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                        </div>
                    );
                })}
            </div>

            {/* Integrated Stats & Network Section - PRO DESIGN */}
            <div className="relative bg-slate-900 rounded-[1.5rem] shadow-xl overflow-hidden mt-6">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none"></div>
                
                <div className="relative p-6 md:p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="lg:w-1/2 text-center lg:text-left z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-blue-300 text-[10px] font-semibold tracking-wide uppercase mb-3 backdrop-blur-md">
                            <Globe className="w-3 h-3" /> Global Reach
                        </div>
                        <h3 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-3 leading-tight">Join our global network</h3>
                        <p className="text-slate-300 text-sm md:text-base max-w-lg leading-relaxed mb-5 mx-auto lg:mx-0">
                            We've built a vast network of trusted partners to provide you with an exceptional car rental experience, anywhere in the world.
                        </p>
                        <Link to="/supplier-login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] text-sm">
                            Become a Partner <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    
                    <div className="lg:w-1/2 flex flex-col sm:flex-row justify-center lg:justify-end gap-4 sm:gap-6 w-full z-10">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 text-center flex-1 transform hover:-translate-y-1 transition-transform duration-300">
                            <div className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight mb-1">900<span className="text-blue-500">+</span></div>
                            <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Trusted Suppliers</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 text-center flex-1 transform hover:-translate-y-1 transition-transform duration-300">
                            <div className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight mb-1">60k<span className="text-blue-500">+</span></div>
                            <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Global Locations</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* GET YOUR PERFECT CAR - NEW PROFESSIONAL DESIGN */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-2">Simple Process</h2>
                <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{content.howItWorks.title}</h3>
                <p className="mt-3 text-base text-slate-600 leading-relaxed">{content.howItWorks.subtitle}</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-12">
                {content.howItWorks.steps.map((step, index) => {
                    const Icon = iconMap[step.icon] || CheckCircle;
                    return (
                        <div key={step.id} className="relative flex items-center gap-6 sm:gap-8">
                            {/* Number and Icon */}
                            <div className="flex-shrink-0 relative">
                                <span className="font-sans text-7xl font-black text-slate-100/80 -z-10">{`0${index + 1}`}</span>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg">
                                    <Icon className="w-6 h-6" />
                                </div>
                            </div>
                            {/* Text Content */}
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h4>
                                <p className="text-slate-600 leading-relaxed text-sm">{step.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </section>

      {/* POPULAR DESTINATIONS - PRO DESIGN */}
      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
               <div className="max-w-2xl">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold tracking-widest uppercase mb-3">
                       <MapPin className="w-3 h-3" /> Top Destinations
                   </div>
                   <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">{content.popularDestinations.title}</h3>
                   <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed">{content.popularDestinations.subtitle}</p>
               </div>
               <Link to="/search" className="group flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-full hover:bg-blue-600 transition-colors duration-300 shadow-lg hover:shadow-xl text-sm">
                   Explore All Locations
                   <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </Link>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6">
               {destinations.slice(0, 5).map((dest, index) => {
                   // Create a dynamic bento-box style layout
                   let colSpan = "md:col-span-6 lg:col-span-4";
                   let aspectRatio = "aspect-[4/3] lg:aspect-[3/2]";
                   
                   if (index === 0) {
                       colSpan = "md:col-span-12 lg:col-span-8";
                       aspectRatio = "aspect-[16/9] lg:aspect-[21/9]";
                   } else if (index === 1 || index === 2) {
                       colSpan = "md:col-span-6 lg:col-span-4";
                       aspectRatio = "aspect-[4/3] lg:aspect-[4/3]";
                   } else if (index === 3 || index === 4) {
                       colSpan = "md:col-span-6 lg:col-span-6";
                       aspectRatio = "aspect-[4/3] lg:aspect-[16/9]";
                   }

                   return (
                       <Link 
                           to={`/search?location=${encodeURIComponent(dest.name)}`} 
                           key={dest.name} 
                           className={`group relative rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 block text-white ${colSpan}`}>
                           
                           <div className={`w-full ${aspectRatio}`}>
                               <img src={dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                               
                               {/* Enhanced gradient overlay */}
                               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
                               
                               <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                                   <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                                       <div className="flex items-center justify-between mb-2">
                                           <h4 className={`font-extrabold text-white tracking-tight ${index === 0 ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>
                                               {dest.name}
                                           </h4>
                                           <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                               <ArrowRight className="w-5 h-5 text-white" />
                                           </div>
                                       </div>
                                       
                                       <p className="text-blue-200 text-sm md:text-base mb-4 flex items-center gap-1.5 font-medium">
                                           <MapPin className="w-4 h-4" /> {dest.country}
                                       </p>
                                       
                                       <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl text-white font-medium border border-white/20 shadow-inner">
                                           <span className="text-slate-300 text-xs">Starting from</span>
                                           <span className="font-bold text-lg">{getCurrencySymbol()}{convertPrice(dest.price).toFixed(0)}</span>
                                           <span className="text-slate-300 text-xs">/ day</span>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </Link>
                   );
               })}
           </div>
        </div>
      </section>

      {/* NEWSLETTER CTA - NEW PROFESSIONAL DESIGN */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-900 rounded-3xl overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="p-10 md:p-16">
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">Get exclusive car rental deals.</h2>
                        <p className="mt-6 text-lg text-slate-300 max-w-md">Join our newsletter for insider offers, travel inspiration, and early access to our best discounts. Straight to your inbox.</p>
                        <form className="mt-10 flex flex-col sm:flex-row gap-4 max-w-md">
                            <input 
                                type="email" 
                                placeholder="Enter your email" 
                                className="flex-grow px-5 py-4 rounded-full text-slate-900 text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all bg-white placeholder-slate-400"
                            />
                            <button 
                                type="submit" 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap">
                                Subscribe
                            </button>
                        </form>
                    </div>
                    <div className="hidden lg:block relative">
                        <img 
                            src="https://images.unsplash.com/photo-1568605117036-5fe5e7185743?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                            alt="Modern car interior" 
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/20"></div>
                    </div>
                </div>
            </div>
        </div>
      </section>
      
      {/* FAQS - NEW PROFESSIONAL DESIGN */}
      <section className="py-24 lg:py-32 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-20">
                <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-3">Support</h2>
                <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{content.faqs.title}</h3>
                <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                    Have questions? We've got answers. Explore our most frequently asked questions to find the information you need.
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={faq.id} className="bg-white rounded-2xl shadow-sm border border-slate-100/80 overflow-hidden">
                            <button 
                                onClick={() => toggleFaq(index)} 
                                className="w-full flex justify-between items-center text-left p-6 sm:p-8 focus:outline-none group"
                            >
                                <span className="font-bold text-lg sm:text-xl text-slate-900 group-hover:text-blue-600 transition-colors">{faq.question}</span>
                                <span className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full transition-colors ${openFaqIndex === index ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                                    <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${openFaqIndex === index ? 'rotate-180' : ''}`} />
                                </span>
                            </button>
                            <div 
                                className={`overflow-hidden transition-all duration-500 ease-in-out ${openFaqIndex === index ? 'max-h-96' : 'max-h-0'}`}
                            >
                                <div className="text-slate-600 leading-relaxed text-base sm:text-lg px-6 sm:px-8 pb-8">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-16 text-center">
                    <Link to="/contact" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-full text-slate-700 bg-white hover:bg-slate-100 transition-all shadow-md border border-slate-200">
                        Still have questions? Contact Support
                    </Link>
                </div>
            </div>
        </div>
      </section>

    </div>
  );
};
export default Home;