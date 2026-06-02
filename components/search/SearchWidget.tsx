import React, { useState } from 'react';
import { MapPin, Calendar, Users, Search, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const SearchWidget = () => {
  const [isFocused, setIsFocused] = useState<string | null>(null);

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="w-full max-w-6xl mx-auto"
    >
      <div className="bg-white p-2 md:p-4 rounded-[32px] shadow-premium border border-gray-100 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          {/* Pickup Location */}
          <div className={cn(
            "lg:col-span-4 p-4 rounded-2xl transition-all cursor-pointer hover:bg-surface relative group",
            isFocused === 'pickup' && "bg-surface ring-2 ring-primary/20"
          )}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Pick-up Location</label>
                <input 
                  placeholder="Where are you going?"
                  className="bg-transparent border-none outline-none w-full text-base font-semibold text-secondary placeholder:text-gray-300"
                  onFocus={() => setIsFocused('pickup')}
                  onBlur={() => setIsFocused(null)}
                />
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center lg:col-span-1">
            <div className="h-10 w-10 rounded-full border border-gray-100 flex items-center justify-center bg-white shadow-sm hover:rotate-180 transition-transform duration-500 cursor-pointer text-gray-400 hover:text-primary">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
          </div>

          {/* Dates */}
          <div className={cn(
            "lg:col-span-4 grid grid-cols-2 gap-0 border-l border-r border-gray-50",
          )}>
            <div className="p-4 hover:bg-surface rounded-2xl transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Pick-up Date</label>
                  <span className="text-base font-semibold text-secondary">Select Date</span>
                </div>
              </div>
            </div>
            <div className="p-4 hover:bg-surface rounded-2xl transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Return Date</label>
                  <span className="text-base font-semibold text-secondary">Select Date</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="lg:col-span-3 p-2 flex items-center">
            <Button size="lg" className="w-full h-full rounded-2xl text-lg font-bold gap-3 shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform">
              <Search className="h-6 w-6" />
              Search Deals
            </Button>
          </div>
        </div>
      </div>
      
      {/* Optional driver age checkbox or similar can go here */}
      <div className="mt-4 flex flex-wrap gap-4 px-6">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
          <span className="text-sm font-medium text-gray-500 group-hover:text-secondary transition-colors">Driver aged 30 – 65</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
          <span className="text-sm font-medium text-gray-500 group-hover:text-secondary transition-colors">Return car to different location</span>
        </label>
      </div>
    </motion.div>
  );
};

export default SearchWidget;
