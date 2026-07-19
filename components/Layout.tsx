import * as React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Menu, X, User, Globe, ChevronDown, Star, Shield, Facebook, Twitter, Instagram, Check, Lock } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { Logo } from './Logo';

const VisaIcon = () => (
  <div className="w-[38px] h-[24px] bg-white rounded-sm shadow-md flex items-center justify-center overflow-hidden px-1">
    <img 
      src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Visa_Inc._logo_%282021%E2%80%93present%29.svg" 
      alt="Visa" 
      className="w-full h-auto object-contain"
    />
  </div>
);

const MastercardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" fill="none" className="rounded-sm shadow-md">
    <rect width="38" height="24" fill="white" rx="3"/>
    <circle cx="13" cy="12" r="7" fill="#EA001B"/>
    <circle cx="25" cy="12" r="7" fill="#F79E1B"/>
    <path d="M20.5 12a7.002 7.002 0 01-7.5-6.96A7.002 7.002 0 0013 19a7.002 7.002 0 007.5-6.96A7.002 7.002 0 0120.5 12z" fill="#FF5F00"/>
  </svg>
);

const AmexIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" fill="none" className="rounded-sm shadow-md">
        <rect width="38" height="24" fill="#006FCF" rx="3"/>
        <rect x="4" y="4" width="30" height="16" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
        <text x="19" y="15.5" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fontWeight="bold" fill="white">AMEX</text>
    </svg>
);

const PciDssIcon = () => (
    <div className="flex items-center gap-1.5 text-blue-300">
        <Shield className="w-6 h-6 text-blue-400" />
        <div className="text-left leading-tight">
            <span className="font-bold text-[9px] block">PCI DSS</span>
            <span className="font-medium text-[8px] block opacity-80">COMPLIANT</span>
        </div>
    </div>
);

const FullFooter = () => (
    <footer className="bg-[#003580] text-white pt-4 pb-2">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4 pb-4 border-b border-blue-800">
            <div>
                <div className="flex items-center gap-2 mb-2">
                   <Logo className="h-8 w-auto" variant="light" />
                </div>
                <p className="text-blue-100 text-xs leading-relaxed max-w-xs opacity-80">
                  Connecting you with the best wheels for your journey. Reliable, transparent, and global car rental comparison.
                </p>
            </div>
            <div className="bg-blue-900/50 p-3 rounded-card border border-blue-700 w-full md:w-auto flex-shrink-0">
                <p className="font-bold text-xs mb-1.5 text-blue-100">Rated on Trustpilot</p>
                <div className="flex items-center gap-2">
                    <div className="flex bg-white p-1 rounded-sm scale-90 origin-left">
                        <Star className="w-3.5 h-3.5 text-green-500 fill-current" />
                        <Star className="w-3.5 h-3.5 text-green-500 fill-current" />
                        <Star className="w-3.5 h-3.5 text-green-500 fill-current" />
                        <Star className="w-3.5 h-3.5 text-green-500 fill-current" />
                        <Star className="w-3.5 h-3.5 text-green-500 fill-current" />
                    </div>
                    <p className="font-bold text-base">Excellent</p>
                </div>
                <p className="text-[10px] text-blue-300 mt-0.5">Based on <strong>12,000+</strong> reviews</p>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 py-8 border-y border-blue-800">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-300 mb-5">Company</h3>
            <ul className="space-y-3 text-xs font-bold">
               <li><Link to="/about-us" className="text-white hover:text-accent transition-colors">About Us</Link></li>
               <li><Link to="/blog" className="text-white hover:text-accent transition-colors">Travel Blog</Link></li>
               <li><Link to="/sitemap" className="text-white hover:text-accent transition-colors">Sitemap</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-300 mb-5">Support</h3>
            <ul className="space-y-3 text-xs font-bold">
              <li><Link to="/help" className="text-white hover:text-accent transition-colors">Help Center</Link></li>
              <li><Link to="/contact" className="text-white hover:text-accent transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-300 mb-5">Partners</h3>
            <ul className="space-y-3 text-xs font-bold">
               <li><Link to="/become-supplier" className="text-white hover:text-accent transition-colors">Become a Partner</Link></li>
               <li><Link to="/affiliate-program" className="text-white hover:text-accent transition-colors">Affiliate Program</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-300 mb-5">Legal</h3>
            <ul className="space-y-3 text-xs font-bold">
              <li><Link to="/terms-and-conditions" className="text-white hover:text-accent transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy-policy" className="text-white hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cookies-policy" className="text-white hover:text-accent transition-colors">Cookies Policy</Link></li>
              <li><Link to="/cancellation-policy" className="text-white hover:text-accent transition-colors">Cancellation Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-blue-300 text-xs order-3 md:order-1 text-center md:text-left">&copy; 2026 Hogicar. All rights reserved.</p>
          
          <div className="flex items-center gap-3 order-1 md:order-2">
              <span className="text-xs font-bold text-blue-200 hidden sm:inline">Secure Payments</span>
              <VisaIcon />
              <MastercardIcon />
              <AmexIcon />
              <div className="w-px h-6 bg-[#007ac2] mx-1"></div>
              <PciDssIcon />
          </div>
          
          <div className="flex space-x-4 order-2 md:order-3">
             <a href="#" aria-label="Facebook" className="text-blue-200 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
            </a>
            <a href="#" aria-label="Twitter" className="text-blue-200 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
            </a>
            <a href="#" aria-label="Instagram" className="text-blue-200 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
);

const Layout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { selectedCurrency, setSelectedCurrency, currencies } = useCurrency();
  const currentCurrency = currencies.find(c => c.code === selectedCurrency);
  const location = useLocation();

  const isHomePage = location.pathname === '/';
  const isSearchingPage = location.pathname === '/searching';

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      sessionStorage.setItem('hogicar_affiliate_ref', ref);
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 text-base font-sans">
      {/* HEADER */}
      <header className={`${isHomePage ? 'fixed' : 'sticky'} top-0 z-50 w-full transition-all duration-500 ${
        isHomePage 
          ? (isScrolled ? 'bg-[#003580]/95 backdrop-blur-md shadow-xl border-b border-white/10 py-0.5' : 'bg-transparent border-b border-transparent py-3') 
          : 'bg-[#003580] shadow-md py-1 border-b border-[#002a66]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 transition-all duration-500">
          {/* Logo */}
          <Link to="/" className="flex items-center max-w-[140px] lg:max-w-[160px] overflow-hidden transition-all duration-500">
            <Logo className="w-full h-auto" variant="light" />
          </Link>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/my-bookings" className="text-sm font-bold text-white hover:text-blue-200 transition-colors flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10">
              <User className="w-4 h-4" />
              Manage Booking
            </Link>

            {/* Currency selector */}
            <div className="relative">
              <button 
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className="flex items-center space-x-2 text-sm font-bold text-white hover:text-blue-200 px-4 py-2 rounded-full hover:bg-white/10 transition-colors border border-white/20 hover:border-white/40"
              >
                {currentCurrency?.flag ? (
                  <span className="text-base leading-none">{currentCurrency.flag}</span>
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                <span>{selectedCurrency}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCurrencyOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCurrencyOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsCurrencyOpen(false)}></div>
                  {/* Dropdown panel */}
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-card shadow-2xl ring-1 ring-black/5 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 sticky top-0 bg-white/90 backdrop-blur-sm border-b border-slate-100">
                      <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Select Currency</span>
                    </div>
                    <div className="p-2">
                      {currencies.map(currency => (
                        <button 
                          key={currency.code} 
                          onClick={() => { setSelectedCurrency(currency.code); setIsCurrencyOpen(false); }}
                          className={`block w-full text-left px-4 py-3 text-sm rounded-card transition-colors ${selectedCurrency === currency.code ? 'text-[#007ac2] font-bold bg-blue-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{currency.flag}</span>
                                <span>{currency.code} - {currency.name}</span>
                            </div>
                            {selectedCurrency === currency.code && <Check className="w-4 h-4 text-accent" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-card text-white hover:text-blue-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-[#003580] bg-[#004099] w-full shadow-xl z-50">
            <div className="pt-2 pb-3 space-y-1">
              <Link to="/my-bookings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 pl-4 pr-4 py-4 border-l-4 border-transparent text-base font-bold text-white hover:text-blue-200 hover:bg-white/5 hover:border-blue-400 transition-colors">
                <User className="w-5 h-5" />
                Manage Booking
              </Link>
            </div>
            <div className="pt-4 pb-6 border-t border-[#003580]">
              <div className="px-4">
                <p className="text-xs font-extrabold text-blue-300 uppercase tracking-widest mb-3">Currency</p>
                <div className="grid grid-cols-3 gap-2">
                  {currencies.map(curr => (
                    <button 
                      key={curr.code} 
                      onClick={() => {setSelectedCurrency(curr.code); setIsMenuOpen(false)}} 
                      className={`flex flex-col items-center justify-center gap-1 text-[10px] font-extrabold p-3 rounded-card border transition-all ${selectedCurrency === curr.code ? 'bg-white text-[#004099] border-white shadow-md' : 'border-blue-700 text-white hover:bg-white/10'}`}
                    >
                      <span className="text-lg">{curr.flag}</span>
                      <span>{curr.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer – shown on all pages except searching */}
      {!isSearchingPage && <FullFooter />}
    </div>
  );
};

export default Layout;
