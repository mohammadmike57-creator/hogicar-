import { openCookieSettings } from '../utils/consent';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Facebook from 'lucide-react/dist/esm/icons/facebook';
import Twitter from 'lucide-react/dist/esm/icons/twitter';
import Instagram from 'lucide-react/dist/esm/icons/instagram';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Star from 'lucide-react/dist/esm/icons/star';
import Mail from 'lucide-react/dist/esm/icons/mail';
import { CONTACT_EMAIL } from '../lib/config';
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
        <div className="text-start leading-tight">
            <span className="font-bold text-[9px] block">PCI DSS</span>
            <span className="font-medium text-[8px] block opacity-80">COMPLIANT</span>
        </div>
    </div>
);

const COLUMNS: { title: string; links: { label: string; to?: string; onClick?: () => void }[] }[] = [
  {
    title: 'Support',
    links: [
      { label: 'Help Center', to: '/help' },
      { label: 'Manage Booking', to: '/my-bookings' },
      { label: 'Contact Us', to: '/contact' },
      { label: 'Cancellation Policy', to: '/cancellation-policy' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about-us' },
      { label: 'Become a Supplier', to: '/become-supplier' },
      { label: 'Affiliate Program', to: '/affiliate-program' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms & Conditions', to: '/terms-and-conditions' },
      { label: 'Privacy Policy', to: '/privacy-policy' },
      { label: 'Cookies Policy', to: '/cookies-policy' },
      { label: 'Cookie Settings', onClick: openCookieSettings },
    ],
  },
];

const DESTINATIONS = [
                    {
                        country: 'UAE',
                        links: [
                            { name: 'Car Rental Dubai', path: '/car-rental-dubai' },
                            { name: 'Car Rental Abu Dhabi', path: '/car-rental-abu-dhabi' },
                            { name: 'Airport Car Rental Dubai', path: '/airport-car-rental-dubai' },
                            { name: 'Cheap Car Rental Dubai', path: '/cheap-car-rental-dubai' },
                            { name: 'Luxury Car Rental Dubai', path: '/luxury-car-rental-dubai' },
                            { name: 'Car Rental Sharjah', path: '/car-rental-sharjah' },
                            { name: 'Car Rental Ras Al Khaimah', path: '/car-rental-ras-al-khaimah' },
                        ]
                    },
                    {
                        country: 'Egypt',
                        links: [
                            { name: 'Car Rental Cairo', path: '/car-rental-cairo' },
                            { name: 'Airport Car Rental Cairo', path: '/airport-car-rental-cairo' },
                            { name: 'Car Rental Hurghada', path: '/car-rental-hurghada' },
                            { name: 'Car Rental Sharm El Sheikh', path: '/car-rental-sharm-el-sheikh' },
                            { name: 'Car Rental Alexandria', path: '/car-rental-alexandria' },
                            { name: 'Car Rental Giza', path: '/car-rental-giza' },
                        ]
                    },
                    {
                        country: 'Saudi Arabia',
                        links: [
                            { name: 'Car Rental Riyadh', path: '/car-rental-riyadh' },
                            { name: 'Car Rental Jeddah', path: '/car-rental-jeddah' },
                            { name: 'Airport Car Rental Riyadh', path: '/airport-car-rental-riyadh' },
                            { name: 'Car Rental Dammam', path: '/car-rental-dammam' },
                            { name: 'Car Rental Medina', path: '/car-rental-medina' },
                            { name: 'Car Rental Mecca', path: '/car-rental-mecca' },
                        ]
                    },
                    {
                        country: 'Jordan & Others',
                        links: [
                            { name: 'Car Rental Amman', path: '/car-rental-amman' },
                            { name: 'Airport Car Rental Amman', path: '/airport-car-rental-amman' },
                            { name: 'Car Rental Aqaba', path: '/car-rental-aqaba' },
                            { name: 'Car Rental Doha', path: '/car-rental-doha' },
                            { name: 'Car Rental Muscat', path: '/car-rental-muscat' },
                            { name: 'Car Rental Salalah', path: '/car-rental-salalah' },
                            { name: 'Car Rental Manama', path: '/car-rental-manama' },
                            { name: 'Car Rental Kuwait City', path: '/car-rental-kuwait-city' },
                        ]
                    }
];

const linkClass = 'text-sm text-blue-100/85 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:underline';

export const Footer = React.memo(() => (
    <footer className="bg-[#003580] text-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Brand and main links */}
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 py-12 md:grid-cols-4 lg:grid-cols-12 lg:py-14">
          <div className="col-span-2 md:col-span-4 lg:col-span-5 lg:pr-12">
            <Link to="/" className="inline-block" aria-label="Hogicar Home">
              <Logo className="h-8 w-auto" variant="light" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-blue-100/85">
              Connecting you with the best wheels for your journey. Reliable, transparent, and global car rental comparison.
            </p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-blue-200">
              <Mail className="h-4 w-4 text-blue-300" /> {CONTACT_EMAIL}
            </a>
            <div className="mt-6 flex gap-3">
              {[
                { label: 'Facebook', Icon: Facebook },
                { label: 'Twitter', Icon: Twitter },
                { label: 'Instagram', Icon: Instagram },
              ].map(({ label, Icon }) => (
                <a key={label} href="#" aria-label={`Follow us on ${label}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-blue-100 ring-1 ring-white/15 transition-colors hover:bg-white/20 hover:text-white">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col, i) => (
            <div key={col.title} className={`lg:col-span-2 ${i === COLUMNS.length - 1 ? 'col-span-2 md:col-span-1' : ''}`}>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">{col.title}</h3>
              <ul className="mt-5 space-y-3.5">
                {col.links.map(link => (
                  <li key={link.label}>
                    {link.to
                      ? <Link to={link.to} className={linkClass}>{link.label}</Link>
                      : <button type="button" onClick={link.onClick} className={linkClass}>{link.label}</button>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Popular destinations */}
        <section aria-labelledby="footer-destinations" className="border-t border-white/10 py-10">
          <h3 id="footer-destinations" className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">Popular car rental destinations</h3>
          <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
            {DESTINATIONS.map(group => (
              <div key={group.country}>
                <h4 className="text-sm font-semibold text-white">{group.country}</h4>
                <ul className="mt-3 space-y-2.5">
                  {group.links.map(link => (
                    <li key={link.path}>
                      <Link to={link.path} className="text-[13px] text-blue-100/70 transition-colors hover:text-white">{link.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-5 border-t border-white/10 py-7 md:flex-row">
          <p className="order-2 text-sm text-blue-200/80 md:order-1">&copy; {new Date().getFullYear()} Hogicar. All rights reserved.</p>
          <div className="order-1 flex flex-wrap items-center justify-center gap-4 md:order-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-200"><Lock className="h-3.5 w-3.5" /> Secure payments</span>
            <div className="flex items-center gap-2">
              <VisaIcon />
              <MastercardIcon />
              <AmexIcon />
            </div>
            <div className="hidden h-5 w-px bg-white/15 sm:block" />
            <PciDssIcon />
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-3 w-3 fill-current text-green-400" />)}
              </div>
              <span className="text-xs font-bold text-blue-100">Trustpilot Excellent</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
));

export default Footer;
