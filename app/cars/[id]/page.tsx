"use client";

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, Fuel, Gauge, ShieldCheck, Star, Info, ChevronRight, 
  Luggage, Wind, CheckCircle2, MapPin, Calendar, Clock,
  ArrowLeft, Share2, Heart, Shield, Zap, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';

const CarDetailsPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface/30">
      <Header />
      
      <main className="flex-1">
        {/* Breadcrumbs & Actions */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/search" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to search results
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="rounded-full gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full gap-2">
                <Heart className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Info & Gallery */}
            <div className="flex-1 space-y-8">
              {/* Vehicle Title & Badges */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success" className="bg-success/10 text-success border-success/20 py-1">
                    <Zap className="h-3 w-3 mr-1.5 fill-success" />
                    Verified Choice
                  </Badge>
                  <Badge variant="outline" className="py-1">
                    Premium Luxury
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-secondary tracking-tight">
                  Volkswagen Golf <span className="text-gray-300 font-light">or similar</span>
                </h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-5 w-5 fill-warning text-warning" />
                    <span className="font-bold text-secondary">4.8</span>
                    <span className="text-gray-400 text-sm">(1,240 verified reviews)</span>
                  </div>
                  <div className="h-4 w-px bg-gray-200"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">Hertz</span>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">Top Rated Supplier</Badge>
                  </div>
                </div>
              </div>

              {/* Gallery Placeholder */}
              <div className="aspect-[16/9] bg-white rounded-[40px] shadow-premium border border-gray-100 flex items-center justify-center overflow-hidden group relative">
                <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
                {/* Image would go here */}
                <div className="z-10 bg-white/80 backdrop-blur px-6 py-3 rounded-2xl border border-white/20 font-bold text-secondary shadow-lg">
                  View all 24 photos
                </div>
              </div>

              {/* Vehicle Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: <Users className="h-5 w-5" />, label: "5 Seats", value: "Spacious Interior" },
                  { icon: <Gauge className="h-5 w-5" />, label: "Automatic", value: "Easy Driving" },
                  { icon: <Luggage className="h-5 w-5" />, label: "2 Bags", value: "Large Boot" },
                  { icon: <Fuel className="h-5 w-5" />, label: "Full to Full", value: "Fair Policy" }
                ].map((spec, i) => (
                  <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-soft">
                    <div className="text-primary mb-3">{spec.icon}</div>
                    <div className="font-bold text-secondary">{spec.label}</div>
                    <div className="text-xs text-gray-400">{spec.value}</div>
                  </div>
                ))}
              </div>

              {/* Description & Features */}
              <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-soft space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-secondary mb-4">Vehicle Features</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "Bluetooth & Apple CarPlay",
                      "GPS Navigation System",
                      "Rear View Camera",
                      "Cruise Control",
                      "USB Charging Ports",
                      "Climate Control AC",
                      "Parking Sensors",
                      "Leather Steering Wheel"
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <span className="text-gray-600 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div>
                  <h2 className="text-2xl font-bold text-secondary mb-4">Rental Conditions</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-success/5 border border-success/10">
                      <ShieldCheck className="h-6 w-6 text-success shrink-0" />
                      <div>
                        <div className="font-bold text-secondary">Free Cancellation</div>
                        <p className="text-sm text-gray-500">Cancel for free up to 48 hours before pick-up. No questions asked.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                      <Shield className="h-6 w-6 text-primary shrink-0" />
                      <div>
                        <div className="font-bold text-secondary">Basic Protection Included</div>
                        <p className="text-sm text-gray-500">Collision Damage Waiver and Theft Protection are included in the price.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Booking Card */}
            <div className="lg:w-[400px]">
              <div className="sticky top-40 space-y-6">
                <Card className="rounded-[32px] shadow-premium overflow-hidden border-none ring-1 ring-gray-100">
                  <div className="bg-secondary p-8 text-white">
                    <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Total Price</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black">$135.00</span>
                      <span className="text-white/60 text-sm">/ 3 days</span>
                    </div>
                  </div>
                  <CardContent className="p-8 space-y-6 bg-white">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">Rental Cost (3 days)</span>
                        <span className="font-bold">$115.00</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">Local Taxes & Fees</span>
                        <span className="font-bold">$20.00</span>
                      </div>
                      <hr className="border-gray-50" />
                      <div className="flex justify-between items-center text-lg">
                        <span className="font-black text-secondary">Total Due</span>
                        <span className="font-black text-primary">$135.00</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4">
                      <Button className="w-full h-14 rounded-2xl text-lg font-bold gap-3 shadow-lg shadow-primary/30">
                        Reserve Now
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                      <p className="text-[10px] text-center text-gray-400">
                        <ShieldCheck className="h-3 w-3 inline mr-1" />
                        Secure Payment · Instant Confirmation
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
                  <h4 className="font-bold text-secondary mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Pick-up Information
                  </h4>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-1 h-auto bg-gray-100 rounded-full"></div>
                      <div className="space-y-1">
                        <div className="text-xs font-black uppercase text-gray-400">Monday, Jun 15 · 10:00</div>
                        <div className="text-sm font-bold text-secondary">Heathrow Airport (LHR)</div>
                        <div className="text-xs text-gray-500">Terminal 5 Arrivals Hall, Hertz Desk</div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-1 h-auto bg-gray-100 rounded-full"></div>
                      <div className="space-y-1">
                        <div className="text-xs font-black uppercase text-gray-400">Thursday, Jun 18 · 10:00</div>
                        <div className="text-sm font-bold text-secondary">Heathrow Airport (LHR)</div>
                        <div className="text-xs text-gray-500">Return to Hertz Parking Area</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button variant="link" className="text-gray-400 text-xs font-bold gap-1">
                    <HelpCircle className="h-3 w-3" />
                    Read Full Rental Conditions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CarDetailsPage;
