
import * as React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Car, Menu, X, User, Globe, ChevronDown, Star, Shield, Facebook, Twitter, Instagram } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

// --- SVG Payment Icons ---

const VisaIcon = () => (
    <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-sm shadow-md">
        <rect width="38" height="24" rx="3" fill="white"/>
        <path d="M24.738 11.235C24.738 8.163 28.104 6.819 29.838 6.171L30.078 6.063C30.294 5.964 30.45 5.796 30.45 5.589V5.535C30.45 5.202 30.15 4.986 29.85 4.986H26.586C26.214 4.986 25.968 5.274 25.902 5.631L24.966 11.235H24.738ZM34.206 17.613L37.518 4.986H34.938L31.626 17.613H34.206ZM23.838 17.613H26.73L27.666 12.006C27.732 11.649 27.486 11.361 27.114 11.361H23.01C22.653 11.361 22.386 11.616 22.302 11.961L19.23 17.613H22.098L22.653 14.679H25.926L25.434 17.613H23.838ZM17.43 17.613L14.118 4.986H11.25L7.938 17.613H10.746L11.31 14.535H14.886L15.342 17.613H17.43ZM12.21 8.847L13.11 12.987H13.218L14.118 8.847L12.21 8.847ZM5.766 5.607C5.55 5.283 5.058 5.043 4.458 5.043C3.426 5.043 2.538 5.643 2.538 6.84C2.538 7.749 3.198 8.253 3.846 8.586C4.548 8.946 4.848 9.198 4.848 9.543C4.848 9.936 4.41 10.164 3.834 10.164C3.048 10.164 2.592 9.924 2.25 9.531L1.71 9.873C2.106 10.491 2.91 10.8 3.93 10.8C5.07 10.8 6.042 10.2 6.042 8.973C6.042 7.869 5.25 7.26 4.446 6.858C3.762 6.513 3.426 6.297 3.426 5.925C3.426 5.517 3.822 5.322 4.35 5.322C4.908 5.322 5.262 5.466 5.49 5.751L5.766 5.607Z" fill="#142688"/>
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
                   <div className="relative">
                      <Car className="h-6 w-6 text-white" />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF9F1C] rounded-full border border-[#003580]"></div>
                   </div>
                   <span className="font-bold text-xl">
                      <span>Hogi</span><span className="text-[#FF9F1C]">car</span>
                   </span>
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
                <div className="relative">
                    <Car className="h-6 w-6 text-[#003580]" />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF9F1C] rounded-full border border-white"></div>
                </div>
                <span className="font-bold text-xl tracking-tight">
                    <span className="text-[#003580]">Hogi</span>
                    <span className="text-[#FF9F1C]">car</span>
                </span>
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
      console.log(`Affiliate tracking activated: ${ref}`);
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 text-sm font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
                <div className="relative">
                    <Car className="h-8 w-8 text-[#003580]" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF9F1C] rounded-full border-2 border-white"></div>
                </div>
                <span className="font-bold text-2xl tracking-tight">
                    <span className="text-[#003580]">Hogi</span>
                    <span className="text-[#FF9F1C]">car</span>
                </span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-4">
               <Link to="/my-bookings" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                  Manage Booking
                </Link>
               {/* Currency Selector */}
              <div className="relative">
                <button 
                  onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                  className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-[#003580] px-3 py-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span>{selectedCurrency}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isCurrencyOpen ? 'rotate-180' : ''}`} />
                </button>
                {isCurrencyOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsCurrencyOpen(false)}></div>
                    <div className="absolute right-0 w-64 mt-2 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-20 max-h-96 overflow-y-auto custom-scrollbar">
                      <div className="p-2 sticky top-0 bg-white border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Select Currency</span>
                      </div>
                      {currencies.map(currency => (
                         <button 
                           key={currency.code} 
                           onClick={() => { setSelectedCurrency(currency.code); setIsCurrencyOpen(false); }}
                           className={`block w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors ${selectedCurrency === currency.code ? 'text-[#003580] font-bold bg-blue-50' : 'text-slate-700'}`}
                         >
                           {currency.code} - {currency.name}
                         </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#003580]"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200">
            <div className="pt-2 pb-3 space-y-1">
              <Link to="/my-bookings" onClick={() => setIsMenuOpen(false)} className="block pl-3 pr-4 py-3 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">Manage Booking</Link>
            </div>
            <div className="pt-4 pb-4 border-t border-slate-200">
               <div className="px-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Currency</p>
                  <div className="grid grid-cols-3 gap-2">
                    {currencies.slice(0,6).map(curr => (
                       <button key={curr.code} onClick={() => {setSelectedCurrency(curr.code); setIsMenuOpen(false)}} className={`text-xs p-2 rounded border ${selectedCurrency === curr.code ? 'bg-[#003580] text-white border-[#003580]' : 'border-slate-200 text-slate-700'}`}>
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
