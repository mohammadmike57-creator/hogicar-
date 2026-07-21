import * as React from 'react';
import { Link } from 'react-router-dom';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Shield from 'lucide-react/dist/esm/icons/shield';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Zap from 'lucide-react/dist/esm/icons/zap';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Clock from 'lucide-react/dist/esm/icons/clock';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Award from 'lucide-react/dist/esm/icons/award';
import Search from 'lucide-react/dist/esm/icons/search';
import BookCheck from 'lucide-react/dist/esm/icons/book-check';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';

const iconMap: { [key: string]: any } = {
  Shield, MapPin, Zap, ShieldCheck, Clock, CreditCard, Wallet, Sparkles, Award, Search, BookCheck, HelpCircle, CheckCircle
};

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface WhyChooseUsProps {
  features: Feature[];
}

export const WhyChooseUs: React.FC<WhyChooseUsProps> = ({ features }) => {
  return (
    <section className="py-24 bg-slate-50 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 text-center md:text-left">
              <div className="max-w-2xl mx-auto md:mx-0">
                  <p className="text-accent font-black uppercase text-sm tracking-[0.2em] mb-4">The HogiCar Advantage</p>
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.1] uppercase tracking-tighter">
                      Why Travelers <span className="text-blue-600">Choose Us</span> Over Others
                  </h2>
              </div>
              <div className="hidden md:block pb-2">
                  <Link to="/about-us" className="group flex items-center gap-2 text-slate-900 font-black uppercase text-sm tracking-widest hover:text-blue-600 transition-colors">
                      Learn more about us <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
              </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, i) => {
                  const Icon = iconMap[feature.icon] || CheckCircle;
                  const iconColors = [
                      'bg-blue-600 shadow-blue-200',
                      'bg-accent shadow-accent/20',
                      'bg-indigo-600 shadow-indigo-200',
                      'bg-emerald-600 shadow-emerald-200'
                  ];
                  const colorClass = iconColors[i % iconColors.length];
                  
                  return (
                      <div key={i} className="relative p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:bg-blue-50 transition-colors duration-500" />
                          <div className="relative z-10">
                              <div className={`w-16 h-16 rounded-2xl ${colorClass} shadow-lg flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 text-white`}>
                                  <Icon className="w-8 h-8" />
                              </div>
                              <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight leading-none">{feature.title}</h3>
                              <p className="text-slate-700 text-sm leading-relaxed font-bold">{feature.description}</p>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
