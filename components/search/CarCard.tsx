import React from 'react';
import { Users, Fuel, Gauge, ShieldCheck, Star, Info, ChevronRight, Luggage, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CarCardProps {
  car: any; // Using any for simplicity in mock
}

const CarCard: React.FC<CarCardProps> = ({ car }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-gray-200 hover:border-primary/30 hover:shadow-premium group">
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="md:w-1/3 relative bg-surface p-6 flex items-center justify-center overflow-hidden">
            <div className="absolute top-4 left-4 z-10">
              <Badge variant="success" className="bg-success/10 text-success border-success/20">
                <Zap className="h-3 w-3 mr-1 fill-success" />
                Instant Book
              </Badge>
            </div>
            {/* Image Placeholder */}
            <div className="w-full aspect-[4/3] bg-gray-200 rounded-2xl transform group-hover:scale-105 transition-transform duration-500"></div>
            
            <div className="absolute bottom-4 left-4 flex gap-2">
              <div className="h-10 w-10 bg-white rounded-lg shadow-sm flex items-center justify-center p-1 border border-gray-100">
                {/* Supplier Logo Placeholder */}
                <span className="text-[10px] font-black uppercase tracking-tighter text-secondary">{car.supplier}</span>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-6 flex flex-col justify-between border-r border-gray-100">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-bold text-secondary">{car.name}</h3>
                  <p className="text-sm text-gray-500">{car.category} · {car.model}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-secondary/5 px-2.5 py-1 rounded-lg">
                  <span className="text-sm font-bold text-secondary">{car.rating}</span>
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  <span className="text-[10px] font-medium text-gray-400">({car.reviews})</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="flex items-center gap-2 text-gray-500">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">{car.seats} Seats</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Luggage className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">{car.bags} Bags</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Gauge className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">{car.transmission}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Wind className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">A/C</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-success/5 text-success border-success/20 py-1 px-3">
                  <ShieldCheck className="h-3 w-3 mr-1.5" />
                  Free Cancellation
                </Badge>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-1 px-3">
                  <Fuel className="h-3 w-3 mr-1.5" />
                  Full to Full
                </Badge>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-[11px] text-gray-400">
              <Info className="h-3.5 w-3.5" />
              <span>Pick-up: {car.pickupLocation} ({car.pickupType})</span>
            </div>
          </div>

          {/* Price Section */}
          <div className="md:w-1/4 p-6 bg-surface/30 flex flex-col justify-between items-end text-right">
            <div className="space-y-1">
              <Badge variant="destructive" className="bg-danger/10 text-danger border-none text-[10px] font-bold">
                SAVE 15% TODAY
              </Badge>
              <div className="text-gray-400 text-sm line-through">${car.originalPrice}</div>
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-3xl font-black text-secondary">${car.price}</span>
                <span className="text-xs font-bold text-gray-400">/day</span>
              </div>
              <div className="text-[11px] font-bold text-success uppercase tracking-wider">Total: ${car.totalPrice}</div>
            </div>

            <div className="w-full space-y-3 mt-8">
              <p className="text-[10px] text-gray-400 leading-tight">Price includes all taxes and fees.</p>
              <Button className="w-full h-12 rounded-xl text-sm font-bold group/btn shadow-lg shadow-primary/20">
                View Deal
                <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

import { Zap } from 'lucide-react';
export default CarCard;
