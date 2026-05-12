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
      referrerPolicy="no-referrer"
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
    <footer 
        className="text-white pt-24 pb-12 relative overflow-hidden"
        style={{ backgroundColor: 'var(--footer-bg, var(--secondary-color, #003580))' }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20 pb-20 border-b border-white/10">
            <div className="lg:col-span-4">
                <Link to="/" className="inline-block mb-8">
                   <Logo className="h-16 w-auto" variant="light" />
                </Link>
                <p className="text-blue-100/70 text-lg leading-relaxed max-w-sm mb-10 font-medium">
                  The world's most trusted car rental comparison platform. We connect you with 900+ suppliers at 60,000+ locations.
                </p>
                <div className="flex space-x-5">
                   <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 transition-all group">
                      <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 transition-all group">
                      <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 transition-all group">
                      <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </a>
                </div>
            </div>

            <div className="lg:col-span-2">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400 mb-8">Company</h3>
                <ul className="space-y-4 text-base font-bold">
                   <li><Link to="/about" className="text-white/70 hover:text-white transition-colors">About Us</Link></li>
                   <li><Link to="/affiliate-program" className="text-white/70 hover:text-white transition-colors">Affiliate</Link></li>
                   <li><Link to="/become-supplier" className="text-white/70 hover:text-white transition-colors">Partner With Us</Link></li>
                   <li><Link to="/careers" className="text-white/70 hover:text-white transition-colors">Careers</Link></li>
                </ul>
            </div>

            <div className="lg:col-span-2">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400 mb-8">Support</h3>
                <ul className="space-y-4 text-base font-bold">
                  <li><Link to="/help" className="text-white/70 hover:text-white transition-colors">Help Center</Link></li>
                  <li><Link to="/contact" className="text-white/70 hover:text-white transition-colors">Contact Us</Link></li>
                  <li><Link to="/faq" className="text-white/70 hover:text-white transition-colors">FAQs</Link></li>
                  <li><Link to="/sitemap" className="text-white/70 hover:text-white transition-colors">Sitemap</Link></li>
                </ul>
            </div>

            <div className="lg:col-span-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400 mb-8">Security & Trust</h3>
                <div className="space-y-6">
                    <div className="flex items-center gap-4 bg-white/5 p-6 rounded-[32px] border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="bg-green-500/20 p-3 rounded-2xl">
                            <Lock className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-white leading-tight mb-1">SSL Encrypted</p>
                            <p className="text-sm text-blue-200/60 font-medium">Your data is safe with us</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 px-2">
                        <VisaIcon />
                        <MastercardIcon />
                        <AmexIcon />
                        <div className="w-px h-8 bg-white/10"></div>
                        <PciDssIcon />
                    </div>
                </div>
            </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <p className="text-blue-100/40 text-sm font-medium">&copy; 2024 Hogicar. All rights reserved.</p>
            <div className="flex items-center gap-6">
                <Link to="/terms" className="text-blue-100/40 hover:text-white text-xs font-bold transition-colors">TERMS</Link>
                <Link to="/privacy" className="text-blue-100/40 hover:text-white text-xs font-bold transition-colors">PRIVACY</Link>
                <Link to="/cookies" className="text-blue-100/40 hover:text-white text-xs font-bold transition-colors">COOKIES</Link>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Global Service</span>
              <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-black">
                         {['🇺🇸', '🇬🇧', '🇪🇺', '🇦🇪'][i-1]}
                      </div>
                  ))}
              </div>
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
    <div className="min-h-screen flex flex-col text-slate-900 text-sm font-sans" style={{ backgroundColor: 'var(--layout-bg, #f8fafc)' }}>
      {/* HEADER */}
      <header 
        className={`${isHomePage ? 'fixed' : 'sticky'} top-0 z-50 w-full transition-all duration-700 ${
          isHomePage 
            ? (isScrolled ? 'backdrop-blur-2xl shadow-2xl py-0' : 'bg-transparent py-4') 
            : 'shadow-xl py-0'
        }`}
        style={{ 
          backgroundColor: isHomePage 
            ? (isScrolled ? 'rgba(var(--secondary-rgb, 0, 53, 128), 0.85)' : 'transparent') 
            : 'var(--footer-bg, var(--secondary-color, #003580))',
          borderBottom: isScrolled || !isHomePage ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent'
        }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20 transition-all duration-500">
          {/* Logo */}
          <Link to="/" className="flex items-center group transition-transform duration-500 hover:scale-105">
            <Logo className={`h-10 lg:h-12 w-auto transition-all duration-500 ${isScrolled || !isHomePage ? 'scale-90' : 'scale-100'}`} variant="light" />
          </Link>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center space-x-2">
            <Link to="/my-bookings" className="text-[13px] font-black uppercase tracking-widest text-white hover:text-blue-300 transition-all flex items-center gap-2.5 px-6 py-3 rounded-2xl hover:bg-white/10 active:scale-95">
              <User className="w-4 h-4" />
              Manage Booking
            </Link>

            <div className="w-px h-6 bg-white/20 mx-2"></div>

            {/* Currency selector */}
            <div className="relative">
              <button 
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className="flex items-center space-x-3 text-[13px] font-black uppercase tracking-widest text-white hover:text-blue-300 px-6 py-3 rounded-2xl hover:bg-white/10 transition-all border border-white/10 hover:border-white/30 active:scale-95"
              >
                {currentCurrency?.flag ? (
                  <span className="text-lg leading-none">{currentCurrency.flag}</span>
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                <span>{selectedCurrency}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isCurrencyOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCurrencyOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsCurrencyOpen(false)}></div>
                  <div className="absolute right-0 mt-4 w-80 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-black/5 z-50 overflow-hidden border border-slate-100">
                    <div className="p-6 bg-slate-50 border-b border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Currency</span>
                    </div>
                    <div className="p-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {currencies.map(currency => (
                        <button 
                          key={currency.code} 
                          onClick={() => { setSelectedCurrency(currency.code); setIsCurrencyOpen(false); }}
                          className={`block w-full text-left px-5 py-4 text-sm rounded-2xl transition-all ${selectedCurrency === currency.code ? 'text-blue-700 font-black bg-blue-50 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold'}`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">{currency.flag}</span>
                                <div className="flex flex-col">
                                   <span className="text-base">{currency.code}</span>
                                   <span className="text-[10px] opacity-60 uppercase tracking-wider">{currency.name}</span>
                                </div>
                            </div>
                            {selectedCurrency === currency.code && <Check className="w-5 h-5 text-blue-600" />}
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
              className="inline-flex items-center justify-center p-2 rounded-lg text-white hover:text-blue-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {isMenuOpen && (
          <div 
            className="md:hidden border-t w-full shadow-xl z-50"
            style={{ 
              backgroundColor: 'var(--footer-bg, var(--secondary-color, #003580))',
              borderColor: 'rgba(255,255,255,0.1)'
            }}
          >
            <div className="pt-2 pb-3 space-y-1">
              <Link to="/my-bookings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 pl-4 pr-4 py-4 border-l-4 border-transparent text-base font-bold text-white hover:text-blue-200 hover:bg-white/5 hover:border-blue-400 transition-colors">
                <User className="w-5 h-5" />
                Manage Booking
              </Link>
            </div>
            <div className="pt-4 pb-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="px-4">
                <p className="text-xs font-extrabold text-blue-300 uppercase tracking-widest mb-3">Currency</p>
                <div className="grid grid-cols-3 gap-2">
                  {currencies.map(curr => (
                    <button 
                      key={curr.code} 
                      onClick={() => {setSelectedCurrency(curr.code); setIsMenuOpen(false)}} 
                      className={`flex flex-col items-center justify-center gap-1 text-[10px] font-black p-3 rounded-xl border transition-all ${selectedCurrency === curr.code ? 'bg-white text-blue-900 border-white shadow-md' : 'border-white/20 text-white hover:bg-white/10'}`}
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

      {/* Footer – only on home page */}
      {isHomePage && !isSearchingPage && <FullFooter />}
    </div>
  );
};

export default Layout;
