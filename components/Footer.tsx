import React from 'react';
import { Logo } from './Logo';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Logo className="h-10 mb-4 text-white" />
            <p className="text-sm text-gray-400 mb-4">Find the best car rental deals worldwide. 60,000+ locations.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white"><Facebook size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><Twitter size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><Instagram size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><Linkedin size={20} /></a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-400 hover:text-white">Home</a></li>
              <li><a href="/cars" className="text-gray-400 hover:text-white">Cars</a></li>
              <li><a href="/my-bookings" className="text-gray-400 hover:text-white">My Bookings</a></li>
              <li><a href="/affiliate-program" className="text-gray-400 hover:text-white">Affiliate Program</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="/help" className="text-gray-400 hover:text-white">Help Center</a></li>
              <li><a href="/faq" className="text-gray-400 hover:text-white">FAQ</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-white">Contact Us</a></li>
              <li><a href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
              <li><a href="/terms" className="text-gray-400 hover:text-white">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <MapPin size={18} className="text-gray-400 mt-0.5" />
                <span className="text-gray-400">123 Main St, City, Country</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={18} className="text-gray-400" />
                <a href="tel:+1234567890" className="text-gray-400 hover:text-white">+1 234 567 890</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={18} className="text-gray-400" />
                <a href="mailto:support@hogicar.com" className="text-gray-400 hover:text-white">support@hogicar.com</a>
              </li>
            </ul>
            <div className="mt-6">
              <h4 className="text-white font-semibold mb-3">We Accept</h4>
              <div className="flex flex-wrap gap-2">
                <div className="bg-white rounded px-2 py-1">
                  <svg width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="25" rx="4" fill="#1A1F71"/>
                    <text x="5" y="17" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="white">VISA</text>
                  </svg>
                </div>
                <div className="bg-white rounded px-2 py-1">
                  <svg width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="25" rx="4" fill="#000"/>
                    <circle cx="13" cy="12.5" r="6" fill="#FF5F00"/>
                    <circle cx="27" cy="12.5" r="6" fill="#F79E1B"/>
                  </svg>
                </div>
                <div className="bg-white rounded px-2 py-1">
                  <svg width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="25" rx="4" fill="#006FCF"/>
                    <text x="5" y="17" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold" fill="white">AMEX</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Hogicar. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
