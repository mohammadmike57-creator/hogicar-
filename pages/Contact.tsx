import React, { useState, useEffect } from 'react';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Send from 'lucide-react/dist/esm/icons/send';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import SEOMetadata from '../components/SEOMetadata';
import { API_BASE_URL } from '../lib/config';

const Contact = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: '',
    message: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/public/settings`);
            if (response.ok) {
                const data = await response.json();
                setHeroImageUrl(data.heroImageUrl || '');
            }
        } catch (e) {
            console.error("Failed to load settings:", e);
        }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitted(true);
      setFormData({ name: '', email: '', reason: '', message: '' });
    }, 1000);
  };

  const heroBackgroundImage = heroImageUrl ? (heroImageUrl.startsWith('/') && !heroImageUrl.startsWith('http') ? `${API_BASE_URL}${heroImageUrl}` : heroImageUrl) : null;

  return (
    <div className="min-h-screen bg-white pb-12 lg:pb-20">
      <SEOMetadata 
        title="Contact Us | Hogicar Support" 
        description="Have questions about your car rental? Reach out to Hogicar's 24/7 customer support team for help with bookings, partnerships, and technical issues."
      />

      {/* Hero Section */}
      <div className={`relative text-white py-16 md:py-24 mb-12 overflow-hidden ${!heroBackgroundImage ? 'bg-[#003580]' : ''}`}>
        {heroBackgroundImage && (
            <div className="absolute inset-0 z-0">
                <img src={heroBackgroundImage} alt="Contact Us" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-[#003580]/80 backdrop-blur-[1px]"></div>
            </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Contact Us</h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            We're here to help! Whether you have a question about a booking, need technical support, or want to partner with us, please reach out.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Contact Information - Only Email */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-6 rounded-card shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Get in Touch</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-[#007ac2] rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Email</p>
                    <p className="text-sm text-slate-600 mt-1">support@hogicar.com</p>
                    <p className="text-sm text-slate-600">partners@hogicar.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-card shadow-sm border border-slate-100">
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-6">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                  <p className="text-slate-600 mb-8">
                    Thank you for reaching out. Our team will get back to you within 24 hours.
                  </p>
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="px-6 py-3 bg-accent text-white font-bold rounded-full hover:bg-accent transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-card border border-slate-200 focus:ring-2 focus:ring-accent focus:border-transparent transition-all outline-none"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-card border border-slate-200 focus:ring-2 focus:ring-accent focus:border-transparent transition-all outline-none"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reason" className="block text-sm font-bold text-slate-700 mb-2">
                      Reason for Contacting <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="reason"
                      name="reason"
                      required
                      value={formData.reason}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-card border border-slate-200 focus:ring-2 focus:ring-accent focus:border-transparent transition-all outline-none bg-white"
                    >
                      <option value="" disabled>Select a reason...</option>
                      <option value="booking_issue">Issue with a Booking</option>
                      <option value="general_inquiry">General Inquiry</option>
                      <option value="partnership">Partnership / Become a Supplier</option>
                      <option value="billing">Billing Question</option>
                      <option value="technical_support">Technical Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-bold text-slate-700 mb-2">
                      Your Inquiry <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-card border border-slate-200 focus:ring-2 focus:ring-accent focus:border-transparent transition-all outline-none resize-y"
                      placeholder="Please provide details about your inquiry..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white font-bold rounded-card hover:bg-accent transition-colors shadow-md hover:shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
