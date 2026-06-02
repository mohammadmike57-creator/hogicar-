"use client";

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchWidget from '@/components/search/SearchWidget';
import CarCard from '@/components/search/CarCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, SlidersHorizontal, SortAsc, MapPin, Calendar, Users, Car as CarIcon, Gauge, Fuel, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const mockCars = [
  {
    id: 1,
    name: "Volkswagen Golf",
    category: "Compact",
    model: "or similar",
    supplier: "Hertz",
    rating: 4.8,
    reviews: 1240,
    seats: 5,
    bags: 2,
    transmission: "Automatic",
    price: 45,
    originalPrice: 52,
    totalPrice: 135,
    pickupLocation: "Heathrow Airport",
    pickupType: "Terminal T5",
  },
  {
    id: 2,
    name: "BMW 3 Series",
    category: "Luxury",
    model: "or similar",
    supplier: "Avis",
    rating: 4.9,
    reviews: 850,
    seats: 5,
    bags: 3,
    transmission: "Automatic",
    price: 89,
    originalPrice: 105,
    totalPrice: 267,
    pickupLocation: "Heathrow Airport",
    pickupType: "Meet & Greet",
  },
  {
    id: 3,
    name: "Tesla Model Y",
    category: "Electric",
    model: "or similar",
    supplier: "Sixt",
    rating: 4.7,
    reviews: 420,
    seats: 5,
    bags: 3,
    transmission: "Automatic",
    price: 120,
    originalPrice: 145,
    totalPrice: 360,
    pickupLocation: "Heathrow Airport",
    pickupType: "In Terminal",
  }
];

const SearchResultsPage = () => {
  const [view, setView] = useState<'list' | 'grid'>('list');

  return (
    <div className="min-h-screen flex flex-col bg-surface/50">
      <Header />
      
      {/* Mini Search Widget Bar */}
      <div className="bg-white border-b sticky top-20 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 bg-surface px-4 py-2 rounded-full border border-gray-100 cursor-pointer hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">LHR Airport</span>
            </div>
            <div className="h-4 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Jun 15 – Jun 18</span>
            </div>
            <div className="h-4 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">1 Adult</span>
            </div>
          </div>
          
          <Button variant="outline" className="rounded-full font-bold">Modify Search</Button>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-1/4 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100 sticky top-40">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  Filters
                </h2>
                <button className="text-xs font-bold text-primary hover:underline">Clear All</button>
              </div>

              {/* Filter Sections */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Price Range</h3>
                  <div className="px-2">
                    {/* Placeholder for Slider */}
                    <div className="h-1 bg-gray-100 rounded-full relative">
                      <div className="absolute left-0 right-1/2 h-full bg-primary rounded-full"></div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 bg-white border-2 border-primary rounded-full shadow-sm"></div>
                      <div className="absolute right-1/2 top-1/2 -translate-y-1/2 h-4 w-4 bg-white border-2 border-primary rounded-full shadow-sm"></div>
                    </div>
                    <div className="flex justify-between mt-4">
                      <span className="text-xs font-bold">$20</span>
                      <span className="text-xs font-bold">$500+</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Car Category</h3>
                  <div className="space-y-3">
                    {['Compact', 'Economy', 'SUV', 'Luxury', 'Van'].map((cat) => (
                      <label key={cat} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded border border-gray-300 group-hover:border-primary transition-colors flex items-center justify-center">
                            {cat === 'Compact' && <div className="w-2.5 h-2.5 bg-primary rounded-sm"></div>}
                          </div>
                          <span className="text-sm font-medium text-gray-600 group-hover:text-secondary transition-colors">{cat}</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-300">12</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Transmission</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 rounded-xl bg-surface border-primary">Auto</Button>
                    <Button variant="outline" size="sm" className="flex-1 rounded-xl">Manual</Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Fuel Policy</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center"></div>
                      <span className="text-sm font-medium text-gray-600">Full to Full</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1">
            {/* Sort & Info Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-soft border border-gray-100 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CarIcon className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold text-secondary">158 vehicles found</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <SortAsc className="h-4 w-4" />
                  <span>Sort by:</span>
                  <select className="bg-transparent font-bold text-secondary outline-none cursor-pointer">
                    <option>Recommended</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Rating: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Car List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {mockCars.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination/Load More */}
            <div className="mt-12 text-center">
              <Button variant="outline" size="lg" className="rounded-2xl px-12 border-2 hover:bg-surface font-bold text-secondary">
                Load More Results
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SearchResultsPage;
