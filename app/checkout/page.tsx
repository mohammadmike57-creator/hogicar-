"use client";

import React, { useState } from 'react';
import Logo from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ShieldCheck, CheckCircle2, CreditCard, User, Mail, Phone, 
  MapPin, Calendar, Clock, ChevronRight, Lock, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';

const CheckoutPage = () => {
  const [step, setStep] = useState(1);

  const steps = [
    { id: 1, name: 'Driver Details' },
    { id: 2, name: 'Protection' },
    { id: 3, name: 'Payment' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface/30">
      {/* Simple Checkout Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-4">
            {steps.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                    step >= s.id ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                  )}>
                    {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                  </div>
                  <span className={cn(
                    "text-sm font-bold",
                    step >= s.id ? "text-secondary" : "text-gray-400"
                  )}>{s.name}</span>
                </div>
                {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-gray-200" />}
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <Lock className="h-4 w-4" />
            Secure Checkout
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
          {/* Main Content */}
          <div className="flex-1 space-y-8">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[32px] p-8 md:p-12 shadow-soft border border-gray-100"
            >
              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-secondary mb-2">Driver Details</h2>
                    <p className="text-gray-500">Please enter the details exactly as they appear on the driver's license.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-secondary">First Name</label>
                      <Input placeholder="e.g. John" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-secondary">Last Name</label>
                      <Input placeholder="e.g. Smith" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-secondary">Email Address</label>
                      <Input type="email" placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-secondary">Phone Number</label>
                      <Input type="tel" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-surface border border-gray-100 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="text-sm font-medium text-gray-600">I am the main driver</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="text-sm font-medium text-gray-600">Keep me updated with exclusive deals and travel tips</span>
                    </label>
                  </div>

                  <Button size="lg" className="w-full md:w-auto px-12 rounded-2xl h-14 font-black" onClick={() => setStep(2)}>
                    Continue to Protection
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-secondary mb-2">Full Protection</h2>
                    <p className="text-gray-500">Avoid unexpected costs with our comprehensive insurance package.</p>
                  </div>

                  <Card className="rounded-3xl border-2 border-primary bg-primary/5 shadow-none overflow-hidden">
                    <div className="p-8 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 text-primary">
                          <ShieldCheck className="h-10 w-10" />
                          <h3 className="text-2xl font-black uppercase tracking-tight">Full Coverage</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-primary">$12.50</div>
                          <div className="text-xs font-bold text-primary/60">PER DAY</div>
                        </div>
                      </div>

                      <ul className="space-y-3">
                        {[
                          "Full refund of the damage excess",
                          "Covers windows, mirrors, wheels & tires",
                          "Protection against theft of personal belongings",
                          "Roadside assistance & towing costs",
                          "Loss of keys replacement"
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-medium text-secondary">
                            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>

                      <Button className="w-full h-14 rounded-2xl font-black bg-primary text-white shadow-xl shadow-primary/20">
                        Add Full Protection
                      </Button>
                    </div>
                  </Card>

                  <div className="text-center">
                    <button className="text-sm font-bold text-gray-400 hover:text-secondary transition-colors" onClick={() => setStep(3)}>
                      No thanks, I'll take the risk with basic protection
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-secondary mb-2">Secure Payment</h2>
                    <p className="text-gray-500">All transactions are encrypted and 100% secure.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary">Cardholder Name</label>
                        <Input placeholder="Full Name" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary">Card Number</label>
                        <div className="relative">
                          <Input placeholder="0000 0000 0000 0000" />
                          <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 h-5 w-5" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary">Expiry Date</label>
                        <Input placeholder="MM / YY" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary">CVC / CVV</label>
                        <Input placeholder="123" />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-surface border border-gray-100 flex items-center gap-4">
                    <Lock className="h-6 w-6 text-success" />
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      Your credit card will be charged <strong>$135.00</strong> immediately. The main driver must present a physical credit card in their name at the counter for the security deposit.
                    </p>
                  </div>

                  <Button size="lg" className="w-full h-14 rounded-2xl font-black shadow-xl shadow-primary/20" onClick={() => alert('Booking Successful!')}>
                    Complete Booking
                  </Button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Sidebar: Summary */}
          <aside className="lg:w-[380px] space-y-6">
            <Card className="rounded-[32px] shadow-soft border-gray-100 overflow-hidden">
              <div className="bg-surface p-6 flex items-center gap-4 border-b">
                <div className="w-20 h-16 bg-white rounded-xl flex items-center justify-center p-2 border border-gray-100">
                  <div className="w-full h-full bg-gray-100 rounded-lg"></div>
                </div>
                <div>
                  <h3 className="font-bold text-secondary">Volkswagen Golf</h3>
                  <p className="text-xs text-gray-400">Compact · Automatic</p>
                </div>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-px h-auto bg-primary/20 rounded-full relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full"></div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                    <div className="space-y-4 flex-1">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-black uppercase text-gray-400">Pick-up</div>
                        <div className="text-sm font-bold text-secondary">Heathrow Airport</div>
                        <div className="text-xs text-gray-500">Jun 15 · 10:00</div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-black uppercase text-gray-400">Return</div>
                        <div className="text-sm font-bold text-secondary">Heathrow Airport</div>
                        <div className="text-xs text-gray-500">Jun 18 · 10:00</div>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-50" />

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Rental Cost</span>
                    <span className="font-bold">$115.00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Taxes & Fees</span>
                    <span className="font-bold">$20.00</span>
                  </div>
                  {step > 1 && (
                    <div className="flex justify-between items-center text-sm text-success">
                      <span className="font-medium">Protection</span>
                      <span className="font-bold">Included</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xl pt-2">
                    <span className="font-black text-secondary">Total Due</span>
                    <span className="font-black text-primary">$135.00</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-success/10 p-6 rounded-3xl border border-success/20 flex gap-4">
              <ShieldCheck className="h-6 w-6 text-success shrink-0" />
              <p className="text-xs text-success font-bold leading-relaxed">
                Free Cancellation until Jun 13 · 10:00
              </p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="py-12 border-t mt-20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-400">© 2026 HOGICAR.com. All rights reserved.</p>
          <div className="flex items-center gap-6 opacity-30">
            <CreditCard className="h-8 w-8" />
            <CreditCard className="h-8 w-8" />
            <CreditCard className="h-8 w-8" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CheckoutPage;
