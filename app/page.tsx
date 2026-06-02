"use client";

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchWidget from '@/components/search/SearchWidget';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ShieldCheck, Clock, Zap, Star, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-white to-white">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6">
                  <Star className="h-4 w-4 fill-primary" />
                  Rated 4.8/5 by 50,000+ happy travelers
                </span>
                <h1 className="text-5xl md:text-6xl lg:text-[72px] font-extrabold leading-[1.1] text-secondary mb-8 tracking-tight">
                  Find the <span className="text-primary">Perfect</span> Rental Car Anywhere
                </h1>
                <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
                  Compare trusted suppliers, unlock exclusive deals, and book with confidence. Your journey starts here.
                </p>
              </motion.div>
            </div>

            <SearchWidget />

            {/* Trust Markers */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-20 flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
            >
              {/* Dummy Supplier Logos */}
              <div className="text-2xl font-black italic tracking-tighter">Hertz.</div>
              <div className="text-2xl font-black italic tracking-tighter">Avis</div>
              <div className="text-2xl font-black italic tracking-tighter">Europcar</div>
              <div className="text-2xl font-black italic tracking-tighter">Sixt</div>
              <div className="text-2xl font-black italic tracking-tighter">Budget</div>
              <div className="text-2xl font-black italic tracking-tighter">Enterprise</div>
            </motion.div>
          </div>

          {/* Abstract decorative elements */}
          <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </section>

        {/* Why Choose Us */}
        <section className="py-24 bg-surface">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Why book with HogiCar?</h2>
              <p className="text-gray-500">We make car rental simple, transparent, and affordable.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <ShieldCheck className="h-8 w-8 text-primary" />,
                  title: "Safe & Secure",
                  desc: "Fully protected bookings and secure payment processing for your peace of mind."
                },
                {
                  icon: <Zap className="h-8 w-8 text-primary" />,
                  title: "Instant Confirmation",
                  desc: "Get your booking confirmation immediately after payment. No waiting required."
                },
                {
                  icon: <Clock className="h-8 w-8 text-primary" />,
                  title: "24/7 Support",
                  desc: "Our dedicated team of travel experts is always here to help you, anytime, anywhere."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl shadow-soft hover:shadow-premium transition-all duration-300 group">
                  <div className="mb-6 p-4 bg-primary/5 w-fit rounded-2xl group-hover:bg-primary/10 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-secondary mb-4">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Explore by vehicle category</h2>
                <p className="text-gray-500">From city compacts to luxury SUVs, find the perfect car for your trip.</p>
              </div>
              <Button variant="outline" size="lg" className="rounded-full">
                View All Categories
              </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {['Compact', 'SUV', 'Luxury', 'Convertible'].map((cat, i) => (
                <div key={i} className="group relative overflow-hidden rounded-[32px] aspect-[4/5] bg-surface cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent z-10"></div>
                  <div className="absolute bottom-0 left-0 p-8 z-20 w-full transform group-hover:translate-y-[-8px] transition-transform">
                    <h3 className="text-white text-2xl font-bold mb-2">{cat}</h3>
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <span>Starting at $24/day</span>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  {/* Image placeholder */}
                  <div className="w-full h-full bg-gray-100 group-hover:scale-110 transition-transform duration-700"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
