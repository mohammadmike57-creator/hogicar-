import * as React from 'react';
import { Link } from 'react-router-dom';
import Facebook from 'lucide-react/dist/esm/icons/facebook';
import Twitter from 'lucide-react/dist/esm/icons/twitter';
import Instagram from 'lucide-react/dist/esm/icons/instagram';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Star from 'lucide-react/dist/esm/icons/star';
import { Logo } from './Logo';

const VisaIcon = () => (
  <div className="w-[38px] h-[24px] bg-white rounded-sm shadow-md flex items-center justify-center overflow-hidden px-1">
    <span className="text-[8px] font-bold text-blue-800">VISA</span>
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

export const Footer = React.memo(() => (
    <footer className="bg-[#003580] text-white pt-12 pb-8">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16" aria-label="Footer Navigation">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block mb-6" aria-label="Hogicar Home">
              <Logo className="h-8 w-auto" variant="light" />
            </Link>
            <p className="text-blue-100 text-sm leading-relaxed opacity-95 mb-8 max-w-xs">
              Connecting you with the best wheels for your journey. Reliable, transparent, and global car rental comparison.
            </p>
            <div className="flex space-x-5">
              <a href="#" aria-label="Follow us on Facebook" className="text-blue-200 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Follow us on Twitter" className="text-blue-200 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Follow us on Instagram" className="text-blue-200 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-base mb-6">Company</h3>
            <ul className="space-y-4 text-sm">
              <li><Link to="/about-us" className="text-blue-50 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/blog" className="text-blue-50 hover:text-white transition-colors">Travel Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-base mb-6">Support</h3>
            <ul className="space-y-4 text-sm">
              <li><Link to="/contact" className="text-blue-50 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/help" className="text-blue-50 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/my-bookings" className="text-blue-50 hover:text-white transition-colors">Manage Booking</Link></li>
              <li><Link to="/cancellation-policy" className="text-blue-50 hover:text-white transition-colors">Cancellation Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-base mb-6">Partners</h3>
            <ul className="space-y-4 text-sm">
              <li><Link to="/become-supplier" className="text-blue-50 hover:text-white transition-colors">Become a Supplier</Link></li>
              <li><Link to="/affiliate-program" className="text-blue-50 hover:text-white transition-colors">Affiliate Program</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-base mb-6">Legal</h3>
            <ul className="space-y-4 text-sm">
              <li><Link to="/terms-and-conditions" className="text-blue-50 hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy-policy" className="text-blue-50 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cookies-policy" className="text-blue-50 hover:text-white transition-colors">Cookies Policy</Link></li>
              <li><Link to="/sitemap" className="text-blue-50 hover:text-white transition-colors">Sitemap</Link></li>
            </ul>
          </div>
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-blue-800/50 gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p className="text-blue-300 text-sm">&copy; 2026 Hogicar. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <VisaIcon />
              <MastercardIcon />
              <AmexIcon />
              <div className="w-px h-4 bg-blue-800 hidden md:block"></div>
              <PciDssIcon />
            </div>
          </div>
          
          <div className="bg-blue-900/40 px-4 py-2 rounded-lg border border-blue-700/50 flex items-center gap-3">
             <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-green-400 fill-current" />
                ))}
             </div>
             <span className="text-xs font-bold text-blue-100">Trustpilot Excellent</span>
          </div>
        </div>
      </div>
    </footer>
));

export default Footer;
