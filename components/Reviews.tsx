import React, { useEffect, useState } from 'react';
import { Star, User, Quote, CheckCircle } from 'lucide-react';

interface Review {
  id: number;
  author: string;
  location: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: 1,
    author: "James Wilson",
    location: "United Kingdom",
    rating: 5,
    comment: "Fantastic service! Booked a car in Amman through Hogicar and everything was seamless. The supplier was professional and the car was in great condition.",
    date: "2 weeks ago",
    verified: true
  },
  {
    id: 2,
    author: "Elena Rodriguez",
    location: "Spain",
    rating: 5,
    comment: "Best prices I found for my trip to Dubai. The comparison tool is really helpful and saved me at least 20% compared to other sites.",
    date: "1 month ago",
    verified: true
  },
  {
    id: 3,
    author: "Ahmed Mansour",
    location: "Jordan",
    rating: 4,
    comment: "Very easy to use platform. I like that I can see all local suppliers in one place. Highly recommended for car rentals in the Middle East.",
    date: "3 weeks ago",
    verified: true
  },
  {
    id: 4,
    author: "Sarah Chen",
    location: "Singapore",
    rating: 5,
    comment: "Excellent customer support. I had to change my booking dates and they handled it quickly without any extra fees. Will definitely use again.",
    date: "2 months ago",
    verified: true
  }
];

export const Reviews: React.FC<{ accentColor?: string }> = ({ accentColor = '#007ac2' }) => {
  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: accentColor }}>Trusted by Travelers</h2>
          <h3 className="text-3xl font-extrabold text-slate-900 mb-4">What Our Customers Say</h3>
          <div className="h-1 w-20 bg-blue-500 mx-auto rounded-full" style={{ backgroundColor: accentColor }}></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_REVIEWS.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-card shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} 
                  />
                ))}
              </div>
              
              <div className="relative mb-6">
                <Quote className="absolute -top-2 -left-2 w-8 h-8 text-slate-50 opacity-50 z-0" />
                <p className="text-slate-600 text-sm leading-relaxed relative z-10 italic">
                  "{review.comment}"
                </p>
              </div>

              <div className="mt-auto flex items-center gap-3 border-t border-slate-50 pt-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-slate-900">{review.author}</span>
                    {review.verified && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                    {review.location} • {review.date}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm border border-slate-100">
                <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <span className="text-sm font-bold text-slate-700">4.8/5 based on 12,000+ reviews</span>
            </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews;
