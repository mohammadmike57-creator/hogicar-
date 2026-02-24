
import * as React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Car, Menu, X, User, Globe, ChevronDown, Star, Shield, Facebook, Twitter, Instagram, Check } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { Logo } from './Logo';

// --- SVG Payment Icons ---

const VisaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" width="38" height="24" className="rounded-sm shadow-md bg-white">
    <rect width="38" height="24" rx="3" fill="white"/>
    <path d="M16.66 16.24H14.1l1.62-10.2h2.56l-1.62 10.2zm10.95-9.96c-.97-.27-2.54-.52-4.05-.52-4.45 0-7.58 2.37-7.6 5.77-.02 2.5 2.24 3.9 3.95 4.74 1.75.86 2.34 1.42 2.34 2.2-.02 1.18-1.42 1.74-2.73 1.74-1.54 0-2.37-.23-3.63-.8l-.52-.24-.73 4.54c.94.43 2.68.8 4.48.82 4.7 0 7.78-2.3 7.8-5.9.02-1.97-1.17-3.46-3.77-4.7-1.58-.8-2.54-1.33-2.54-2.15.02-1.06 1.18-1.64 2.62-1.64 1.2-.02 2.1.25 2.84.57l.34.16.73-4.54zm8.08 9.96h-2.22c-.67 0-1.18-.2-1.46-.87l-4.15-9.32h2.7l.53 1.5h3.3l.3-1.5h2.34l-1.35 10.2zm-2.72-2.75l-1.28-3.5-1.03 3.5h2.3zm-22.25-7.2l-2.4 8.54-.6-3.1c-.2-.8-.78-1.3-1.66-1.56L1.5 8.9v1.24c.7.16 1.5.44 1.96.78.3.22.44.5.53.9l1.77 8.46h2.7l4.06-10.2H8.72z" fill="#1A1F71"/>
  </svg>
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
    <footer className="bg-[#003580] text-white pt-12 pb-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TOP ROW: Brand Info & Trustpilot */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10 pb-10 border-b border-blue-800">
            {/* Brand */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                   <Logo className="h-16 w-auto" variant="light" />
                </div>
                <p className="text-blue-100 text-sm leading-relaxed max-w-xs">
                  Connecting you with the best wheels for your journey. Reliable, transparent, and global car rental comparison.
                </p>
            </div>
            {/* Trustpilot */}
            <div className="bg-blue-900/50 p-4 rounded-lg border border-blue-700 w-full md:w-auto flex-shrink-0">
                <p className="font-bold text-sm mb-2 text-blue-100">Rated on Trustpilot</p>
                <div className="flex items-center gap-2">
                    <div className="flex bg-white p-1 rounded-sm">
                        <Star className="w-4 h-4 text-green-500 fill-current" />
                        <Star className="w-4 h-4 text-green-500 fill-current" />
                        <Star className="w-4 h-4 text-green-500 fill-current" />
                        <Star className="w-4 h-4 text-green-500 fill-current" />
                        <Star className="w-4 h-4 text-green-500 fill-current" />
                    </div>
                    <p className="font-bold text-lg">Excellent</p>
                </div>
                <p className="text-xs text-blue-300 mt-1">Based on <strong>12,000+</strong> reviews</p>
            </div>
        </div>

        {/* MIDDLE ROW: Link Groups */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-200 mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-white">
               <li><Link to="/about" className="hover:text-blue-200 transition-colors">About Us</Link></li>
               <li><Link to="/press" className="hover:text-blue-200 transition-colors">Press</Link></li>
               <li><a href="#" className="hover:text-blue-200 transition-colors">Blog</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-200 mb-4">Support</h3>
            <ul className="space-y-3 text-sm text-white">
              <li><Link to="/help" className="hover:text-blue-200 transition-colors">Help Center</Link></li>
              <li><Link to="/terms" className="hover:text-blue-200 transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-200 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cookies" className="hover:text-blue-200 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-200 mb-4">Partners</h3>
            <ul className="space-y-3 text-sm text-white">
              <li><Link to="/supplier-login" className="hover:text-blue-200 transition-colors">Supplier Login</Link></li>
              <li><Link to="/admin-login" className="hover:text-blue-200 transition-colors">Admin Login</Link></li>
              <li><Link to="/affiliate-program" className="hover:text-blue-200 transition-colors">Affiliate Program</Link></li>
              <li><Link to="/become-supplier" className="hover:text-blue-200 transition-colors">Become a Partner</Link></li>
            </ul>
          </div>
        </div>

        {/* BOTTOM ROW: Copyright, PCI, Social */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-blue-300 text-xs order-3 md:order-1 text-center md:text-left">&copy; 2024 Hogicar. All rights reserved.</p>
          
          <div className="flex items-center gap-3 order-1 md:order-2">
              <span className="text-xs font-bold text-blue-200 hidden sm:inline">Secure Payments</span>
              <VisaIcon />
              <MastercardIcon />
              <AmexIcon />
              <div className="w-px h-6 bg-blue-700 mx-1"></div>
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

const SimpleFooter = () => (
    <footer className="bg-white border-t-4 border-[#003580]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 group">
                <Logo className="h-12 w-auto" variant="dark" />
            </Link>
            <p className="text-slate-500 text-xs">&copy; 2024 Hogicar. All rights reserved.</p>
        </div>
    </footer>
);


const Layout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = React.useState(false);
  const { selectedCurrency, setSelectedCurrency, currencies } = useCurrency();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isHomePage = location.pathname === '/';
  const isSearchingPage = location.pathname === '/searching';

  // Affiliate Tracking Logic
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      // Store affiliate ID in session storage for the duration of the booking session
      sessionStorage.setItem('hogicar_affiliate_ref', ref);
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 text-sm font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#004099] border-b border-[#003580] shadow-md transition-all duration-300">
        <div className="max-w-[1600px] mx-auto pl-0 pr-4 sm:pr-6 lg:pr-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2 group transition-transform hover:scale-105">
                <Logo className="h-16 w-auto" variant="light" />
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-6">
               <Link to="/my-bookings" className="text-sm font-bold text-white hover:text-blue-200 transition-colors flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10">
                  <User className="w-4 h-4" />
                  Manage Booking
                </Link>
               {/* Currency Selector */}
              <div className="relative">
                <button 
                  onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                  className="flex items-center space-x-2 text-sm font-bold text-white hover:text-blue-200 px-4 py-2 rounded-full hover:bg-white/10 transition-colors border border-white/20 hover:border-white/40"
                >
                  <Globe className="h-4 w-4" />
                  <span>{selectedCurrency}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCurrencyOpen ? 'rotate-180' : ''}`} />
                </button>
                {isCurrencyOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsCurrencyOpen(false)}></div>
                    <div className="absolute right-0 w-72 mt-3 bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 z-20 max-h-96 overflow-y-auto custom-scrollbar transform origin-top-right transition-all">
                      <div className="p-4 sticky top-0 bg-white/90 backdrop-blur-sm border-b border-slate-100">
                        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Select Currency</span>
                      </div>
                      <div className="p-2">
                        {currencies.map(currency => (
                           <button 
                             key={currency.code} 
                             onClick={() => { setSelectedCurrency(currency.code); setIsCurrencyOpen(false); }}
                             className={`block w-full text-left px-4 py-3 text-sm rounded-xl transition-colors ${selectedCurrency === currency.code ? 'text-blue-700 font-bold bg-blue-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                           >
                             <div className="flex justify-between items-center">
                               <span>{currency.code} - {currency.name}</span>
                               {selectedCurrency === currency.code && <Check className="w-4 h-4 text-blue-600" />}
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
            <div className="-mr-2 flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-white hover:text-blue-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-[#003580] bg-[#004099] absolute w-full shadow-xl">
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
                    {currencies.slice(0,6).map(curr => (
                       <button key={curr.code} onClick={() => {setSelectedCurrency(curr.code); setIsMenuOpen(false)}} className={`text-sm font-bold p-3 rounded-xl border transition-colors ${selectedCurrency === curr.code ? 'bg-white text-[#004099] border-white shadow-md' : 'border-blue-700 text-white hover:bg-white/10'}`}>
                         {curr.code}
                       </button>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {isSearchingPage ? null : (isHomePage ? <FullFooter /> : <SimpleFooter />)}
    </div>
  );
};

export default Layout;
