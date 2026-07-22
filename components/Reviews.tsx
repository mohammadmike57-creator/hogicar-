import React, { useEffect, useState } from 'react';
import Star from 'lucide-react/dist/esm/icons/star';
import User from 'lucide-react/dist/esm/icons/user';
import Quote from 'lucide-react/dist/esm/icons/quote';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';

interface Review {
  id: number;
  author: string;
  location: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  avatar?: string;
}

const DEFAULT_REVIEWS: Review[] = [
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

export const Reviews: React.FC<{ accentColor?: string, customReviews?: Review[] }> = React.memo(({ accentColor = '#007ac2', customReviews }) => {
  const reviews = customReviews && customReviews.length > 0 ? customReviews : DEFAULT_REVIEWS;
  
  return (
    <section className="py-16 bg-slate-50 overflow-hidden relative">
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 border border-blue-200 text-blue-700 text-[10px] font-bold tracking-widest uppercase mb-4" style={{ color: accentColor, borderColor: `${accentColor}40`, backgroundColor: `${accentColor}10` }}>
            <Star className="w-3 h-3 fill-current" /> Customer Testimonials
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Real Stories from Real Travelers</h3>
          <p className="max-w-2xl mx-auto text-slate-600 text-sm md:text-base leading-relaxed">
            Join thousands of satisfied customers who have experienced the Hogicar difference in destinations around the globe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="group bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} 
                  />
                ))}
              </div>
              
              <div className="relative mb-6 flex-grow">
                <Quote className="absolute -top-3 -left-3 w-10 h-10 text-slate-100 opacity-40 z-0 group-hover:text-blue-100 transition-colors" />
                <p className="text-slate-700 text-[13px] md:text-sm leading-relaxed relative z-10 italic font-medium">
                  "{review.comment}"
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3 pt-6 border-t border-slate-50">
                <div className="w-11 h-11 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 overflow-hidden shadow-inner">
                  {review.avatar ? (
                    <img src={review.avatar} alt={review.author} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900">{review.author}</span>
                    {review.verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" />}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">
                    {review.location}
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
});

export default Reviews;
