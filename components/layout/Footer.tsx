import React from 'react';
import Logo from '@/components/shared/Logo';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-secondary text-white pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Logo light />
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Experience the future of car rental. We compare thousands of deals to find you the perfect ride at the best price.
            </p>
            <div className="flex gap-4">
              {/* Social icons would go here */}
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="/press" className="hover:text-primary transition-colors">Press</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6">Popular Destinations</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/location/london" className="hover:text-primary transition-colors">London, UK</Link></li>
              <li><Link href="/location/dubai" className="hover:text-primary transition-colors">Dubai, UAE</Link></li>
              <li><Link href="/location/new-york" className="hover:text-primary transition-colors">New York, USA</Link></li>
              <li><Link href="/location/paris" className="hover:text-primary transition-colors">Paris, France</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} HOGICAR.com. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs text-gray-500 uppercase tracking-widest">
            <span>Secure Payment</span>
            <span>24/7 Support</span>
            <span>Trusted Suppliers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
