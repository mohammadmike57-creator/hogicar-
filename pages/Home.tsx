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
  const [pickupCode, setPickupCode] = React.useState<string>('AMM');
  const [dropoffCode, setDropoffCode] = React.useState<string>('AMM');
  const [pickupName, setPickupName] = React.useState<string>('Amman, Jordan (AMM)');
  const [dropoffName, setDropoffName] = React.useState<string>('Amman, Jordan (AMM)');
  
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
                
                <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden p-2 sm:p-4">
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
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Trusted by the world's leading car rental suppliers</h2>
                <p className="text-slate-500 mt-2">We partner with top brands to bring you the best vehicles at the best prices.</p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
                {SUPPLIERS.slice(0, 6).map((s) => (
                    <img 
                        key={s.id}
                        src={s.logo} 
                        alt={s.name} 
                        className="h-8 md:h-10 object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                    />
                ))}
            </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Why Book With Hogicar?</h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                    Experience a seamless car rental journey with our premium service, transparent pricing, and global network.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {content.features.slice(0, 3).map((feature) => {
                    const Icon = iconMap[feature.icon];
                    return (
                        <div key={feature.id} className="flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                                <Icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                            <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                        </div>
                    );
                })}
            </div>

            <div className="mt-16 bg-[#003580] rounded-2xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden">
                {/* Decorative background for the stats banner */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

                <div className="flex-1 relative z-10">
                    <h3 className="text-2xl md:text-3xl font-bold mb-3">Join our global network</h3>
                    <p className="text-blue-100 text-lg">Connecting you with the best vehicles worldwide.</p>
                </div>
                <div className="flex gap-8 md:gap-16 text-center md:text-left relative z-10">
                    <div>
                        <div className="text-4xl md:text-5xl font-black mb-1">900+</div>
                        <div className="text-sm font-medium text-blue-200 uppercase tracking-wider">Trusted Suppliers</div>
                    </div>
                    <div className="w-px bg-blue-400/50 hidden md:block"></div>
                    <div>
                        <div className="text-4xl md:text-5xl font-black mb-1">60k+</div>
                        <div className="text-sm font-medium text-blue-200 uppercase tracking-wider">Global Locations</div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 bg-white relative overflow-hidden border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">{content.howItWorks.title}</h2>
                <p className="text-slate-600 text-lg">{content.howItWorks.subtitle}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                {/* Connecting line for desktop */}
                <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-0.5 bg-slate-200 z-0"></div>
                
                {content.howItWorks.steps.map((step, index) => {
                    const Icon = iconMap[step.icon];
                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center text-center group">
                            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center mb-8 relative group-hover:-translate-y-2 transition-transform duration-300">
                                <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#003580] rounded-full text-white font-bold flex items-center justify-center text-sm shadow-md border-2 border-white">
                                    {index + 1}
                                </div>
                                <Icon className="w-10 h-10 text-[#003580] transition-colors duration-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                            <p className="text-slate-600 leading-relaxed">{step.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
      </section>

      {/* POPULAR DESTINATIONS */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
               <div>
                   <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{content.popularDestinations.title}</h2>
                   <p className="text-slate-600 mt-2">{content.popularDestinations.subtitle}</p>
               </div>
               <Link to="/search" className="hidden md:flex items-center gap-2 text-[#003580] font-semibold hover:underline transition-colors">
                   See all locations <ArrowRight className="w-4 h-4" />
               </Link>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
               {destinations.map((dest) => (
                   <Link to={`/search?location=${encodeURIComponent(dest.name)}`} key={dest.name} className="group relative h-64 md:h-72 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                       <img src={dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                       <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
                       
                       <div className="absolute bottom-0 left-0 right-0 p-5">
                           <h3 className="text-xl font-bold text-white mb-1">{dest.name}</h3>
                           <p className="text-slate-300 text-sm mb-4 flex items-center gap-1.5">
                               <MapPin className="w-3.5 h-3.5" /> {dest.country}
                           </p>
                           <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium border border-white/10">
                               From <span className="font-bold">{getCurrencySymbol()}{convertPrice(dest.price).toFixed(0)}</span> / day
                           </div>
                       </div>
                   </Link>
               ))}
           </div>
           
           <Link to="/search" className="md:hidden mt-6 flex items-center justify-center gap-2 text-[#003580] font-semibold w-full border border-slate-200 py-3 rounded-lg hover:bg-slate-50 transition-colors">
               See all locations
           </Link>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight text-slate-900">Get exclusive car rental deals</h2>
            <p className="text-slate-600 mb-10 text-lg max-w-2xl mx-auto leading-relaxed">Sign up for our newsletter and receive special offers, travel inspiration, and discounts directly to your inbox.</p>
            
            <form className="max-w-xl mx-auto bg-slate-50 p-2 rounded-2xl flex flex-col sm:flex-row gap-2 border border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300">
                <div className="flex-grow relative flex items-center">
                    <div className="absolute left-4 text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <input type="email" placeholder="Enter your email address" className="w-full pl-12 pr-4 py-4 rounded-xl text-slate-900 text-base focus:outline-none bg-transparent"/>
                </div>
                <button type="submit" className="bg-[#003580] hover:bg-blue-900 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap">
                    Subscribe
                </button>
            </form>
            <p className="text-slate-400 text-sm mt-4">We respect your privacy. Unsubscribe at any time.</p>
        </div>
      </section>
      
      {/* FAQs */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
                <div className="lg:w-1/3">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">{content.faqs.title}</h2>
                    <p className="text-lg text-slate-600 leading-relaxed mb-8">Find answers to common questions about renting a car with Hogicar.</p>
                    <div className="hidden lg:block">
                        <p className="text-slate-600 mb-4 font-medium">Still have questions?</p>
                        <Link to="/contact" className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 shadow-sm text-base font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                            Contact our support team
                        </Link>
                    </div>
                </div>
                
                <div className="lg:w-2/3">
                    <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                        {faqs.map((faq, index) => (
                            <div key={faq.id} className="py-6">
                                <button 
                                    onClick={() => toggleFaq(index)} 
                                    className="w-full flex justify-between items-center text-left focus:outline-none group"
                                >
                                    <span className="font-semibold text-slate-900 text-lg pr-6 group-hover:text-[#003580] transition-colors">{faq.question}</span>
                                    <span className="ml-6 flex items-center">
                                        <ChevronDown className={`w-5 h-5 text-slate-400 group-hover:text-[#003580] transition-transform duration-300 ${openFaqIndex === index ? 'rotate-180' : ''}`} />
                                    </span>
                                </button>
                                <div 
                                    className={`text-slate-600 leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === index ? 'max-h-96 pt-4 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    {faq.answer}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-8 lg:hidden text-center">
                        <p className="text-slate-600 mb-4 font-medium">Still have questions?</p>
                        <Link to="/contact" className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 shadow-sm text-base font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors w-full">
                            Contact our support team
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      </section>

    </div>
  );
};
export default Home;