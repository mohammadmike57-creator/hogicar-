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
  
  const [locationsOptions, setLocationsOptions] = React.useState<LocationSuggestion[]>([]);
  const [pickupCode, setPickupCode] = React.useState<string>('');
  const [dropoffCode, setDropoffCode] = React.useState<string>('');
  const [pickupName, setPickupName] = React.useState<string>('');
  const [dropoffName, setDropoffName] = React.useState<string>('');
  
  React.useEffect(() => {
    const loadLocations = async () => {
      try {
        const options = await fetchLocations('');
        setLocationsOptions(options);
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
      
      {/* HERO SECTION – NO EXTRA WRAPPER, WITH OVERFLOW HIDDEN */}
      <section className="bg-[#003580] pt-16 pb-14 text-center text-white overflow-hidden">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
            Search, Compare & Save on
            <span className="text-[#FF9F1C]"> Car Rentals</span>
          </h1>
          <p className="text-blue-100 text-base mb-8">
            Compare prices from 900+ car rental suppliers worldwide.
          </p>

          {/* SearchWidget directly – no extra white card wrapper */}
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

          <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Free Cancellation
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
              <Shield className="w-4 h-4 text-blue-300" />
              No Hidden Fees
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
              <Award className="w-4 h-4 text-orange-400" />
              24/7 Support
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED PARTNERS – FIXED MARQUEE */}
      <section className="py-6 md:py-8 bg-white border-b border-slate-100 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 md:mb-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Trusted by the world's leading car rental suppliers</h2>
            <p className="text-base text-slate-500 mt-2">We partner with top brands to bring you the best vehicles at the best prices, ensuring quality and reliability wherever you go.</p>
          </div>
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            display: flex;
            width: max-content;
            max-width: 100%;
            animation: marquee 40s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>
        <div className="relative w-full flex overflow-hidden py-4">
          <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          <div className="animate-marquee flex items-center gap-10 md:gap-20 opacity-80 px-6 max-w-full overflow-hidden">
            {[...SUPPLIERS, ...SUPPLIERS, ...SUPPLIERS].map((s, idx) => (
              <img 
                key={`${s.id}-${idx}`}
                src={s.logo} 
                alt={s.name} 
                className="h-12 md:h-16 lg:h-20 w-auto max-w-[120px] md:max-w-[180px] object-contain filter grayscale hover:grayscale-0 transition-all duration-500 cursor-pointer hover:scale-105"
              />
            ))}
          </div>
        </div>
      </section>

      {/* WHY BOOK WITH HOGICAR? & STATS */}
      <section className="py-8 lg:py-12 bg-slate-50/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-2">The Hogicar Advantage</h2>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">Unbeatable value, unparalleled convenience.</h3>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              We streamline the car rental process from start to finish, ensuring you get the best vehicle for your needs without the hassle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {content.features.slice(0, 4).map((feature, index) => {
              const Icon = iconMap[feature.icon] || CheckCircle;
              const colors = [
                'bg-blue-100 text-blue-600',
                'bg-green-100 text-green-600',
                'bg-yellow-100 text-yellow-600',
                'bg-purple-100 text-purple-600'
              ];
              const colorClass = colors[index % colors.length];
              return (
                <div key={feature.id} className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100/80">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>

          <div className="relative bg-slate-900 rounded-[1.5rem] shadow-xl overflow-hidden mt-6">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none"></div>
            <div className="relative p-6 md:p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="lg:w-1/2 text-center lg:text-left z-10">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10 border border-white/10 text-blue-300 text-[9px] font-semibold tracking-wide uppercase mb-2 backdrop-blur-md">
                  <Globe className="w-2.5 h-2.5" /> Global Reach
                </div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-extrabold text-white tracking-tight mb-2 leading-tight">Join our global network</h3>
                <p className="text-slate-300 text-xs max-w-sm leading-relaxed mb-4 mx-auto lg:mx-0">
                  We've built a vast network of trusted partners to provide you with an exceptional car rental experience, anywhere in the world.
                </p>
                <Link to="/supplier-login" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] text-[10px]">
                  Become a Partner <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="lg:w-1/2 flex flex-col sm:flex-row justify-center lg:justify-end gap-2 sm:gap-3 w-full z-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-center flex-1 transform hover:-translate-y-1 transition-transform duration-300">
                  <div className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tight mb-1">900<span className="text-blue-500">+</span></div>
                  <div className="text-[8px] font-bold text-blue-300 uppercase tracking-widest">Trusted Suppliers</div>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-center flex-1 transform hover:-translate-y-1 transition-transform duration-300">
                  <div className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tight mb-1">60k<span className="text-blue-500">+</span></div>
                  <div className="text-[8px] font-bold text-blue-300 uppercase tracking-widest">Global Locations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GET YOUR PERFECT CAR */}
      <section className="py-8 lg:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-2">Simple Process</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{content.howItWorks.title}</h3>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">{content.howItWorks.subtitle}</p>
          </div>
          <div className="max-w-4xl mx-auto space-y-6">
            {content.howItWorks.steps.map((step, index) => {
              const Icon = iconMap[step.icon] || CheckCircle;
              const colors = [
                'from-blue-500 to-cyan-400',
                'from-purple-500 to-pink-400',
                'from-emerald-500 to-teal-400'
              ];
              const colorClass = colors[index % colors.length];
              return (
                <div key={step.id} className={`relative flex items-center gap-6 sm:gap-8 p-6 rounded-2xl bg-gradient-to-r ${colorClass} text-white shadow-lg transform hover:-translate-y-1 transition-transform duration-300`}>
                  <div className="flex-shrink-0 relative">
                    <span className="font-sans text-7xl font-black text-white/20 -z-10">{`0${index + 1}`}</span>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-md text-white rounded-full shadow-inner border border-white/30">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                    <p className="text-white/90 leading-relaxed text-sm">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* POPULAR DESTINATIONS */}
      <section className="py-8 lg:py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {destinations.slice(0, 5).map((dest, index) => (
              <Link 
                to={`/search?location=${encodeURIComponent(dest.name)}`} 
                key={dest.name} 
                className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 block text-white aspect-[4/3]"
              >
                <img src={dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                    <h4 className="font-bold text-white tracking-tight text-lg">{dest.name}</h4>
                    <p className="text-blue-200 text-xs mb-2 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3" /> {dest.country}
                    </p>
                    <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-xl px-2 py-1 rounded-lg text-white font-medium border border-white/20 shadow-inner">
                      <span className="text-slate-300 text-[10px]">From</span>
                      <span className="font-bold text-sm">{getCurrencySymbol()}{convertPrice(dest.price).toFixed(0)}</span>
                      <span className="text-slate-300 text-[10px]">/d</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER CTA */}
      <section className="py-8 lg:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-3xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-5 md:p-8">
                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">Get exclusive car rental deals.</h2>
                <p className="mt-3 text-xs text-slate-300 max-w-sm">Join our newsletter for insider offers, travel inspiration, and early access to our best discounts. Straight to your inbox.</p>
                <form className="mt-5 flex flex-col sm:flex-row gap-2 max-w-sm">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="flex-grow px-3 py-2 rounded-full text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all bg-white placeholder-slate-400"
                  />
                  <button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 shadow-sm hover:shadow-md whitespace-nowrap text-xs"
                  >
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
      
      {/* FAQS */}
      <section className="py-8 lg:py-12 bg-slate-50/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto text-center mb-6">
            <h2 className="text-[10px] font-bold tracking-widest text-blue-600 uppercase mb-1.5">Support</h2>
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">{content.faqs.title}</h3>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              Have questions? We've got answers. Explore our most frequently asked questions to find the information you need.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <div key={faq.id} className="bg-white rounded-lg shadow-sm border border-slate-100/80 overflow-hidden">
                  <button 
                    onClick={() => toggleFaq(index)} 
                    className="w-full flex justify-between items-center text-left p-3 sm:p-4 focus:outline-none group"
                  >
                    <span className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors">{faq.question}</span>
                    <span className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full transition-colors ${openFaqIndex === index ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openFaqIndex === index ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  <div 
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${openFaqIndex === index ? 'max-h-96' : 'max-h-0'}`}
                  >
                    <div className="text-slate-600 leading-relaxed text-xs sm:text-sm px-3 sm:px-4 pb-4">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-extrabold rounded-full text-white bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 transform border-none">
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
