

import * as React from 'react';
import SEOMetadata from '../components/SEOMetadata';
import { Building, Car, Globe, CheckCircle, ArrowRight, BarChart3, ShieldCheck, Database, Send } from 'lucide-react';
import { submitSupplierApplication } from '../services/mockData';
import { SupplierApplication } from '../types';

const BecomeSupplier: React.FC = () => {
  const [submitted, setSubmitted] = React.useState(false);
  // FIX: Explicitly type the formData state to ensure type compatibility with submitSupplierApplication.
  const [formData, setFormData] = React.useState<Omit<SupplierApplication, 'id' | 'status' | 'submissionDate'>>({
    companyName: '',
    website: '',
    contactName: '',
    email: '',
    phone: '',
    fleetSize: '1-50',
    primaryLocation: '',
    integrationType: 'api'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API submission and save to mock DB
    setTimeout(() => {
        submitSupplierApplication(formData);
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-slate-50 font-sans min-h-screen">
      <SEOMetadata
        title="Become a Partner | Hogicar Partner Network"
        description="Partner with Hogicar to distribute your car rental fleet to millions of travelers worldwide. Integration options available."
      />

      {/* Hero Section */}
      <div className="bg-[#003580] text-white pt-20 pb-24 relative overflow-hidden">
         <div className="absolute top-0 right-0 opacity-10">
             <Car className="w-96 h-96 -mr-20 -mt-20" />
         </div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
             <div className="max-w-3xl">
                 <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                     Grow Your Fleet Business with <span className="text-[#FF9F1C]">Hogicar</span>
                 </h1>
                 <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                     Connect with millions of travelers globally. We provide the technology and marketing reach to maximize your fleet utilization and revenue.
                 </p>
                 <div className="flex flex-wrap gap-4 text-sm font-bold text-blue-200">
                     <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-[#FF9F1C]"/> Global Reach</span>
                     <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-[#FF9F1C]"/> Seamless API Integration</span>
                     <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-[#FF9F1C]"/> Guaranteed Payments</span>
                 </div>
             </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-20 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Form Card */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                  <div className="p-8 border-b border-slate-100">
                      <h2 className="text-2xl font-bold text-slate-800">Partner Application</h2>
                      <p className="text-slate-500 mt-1 text-sm">Fill out the form below to join our network. Our partnerships team will review your application within 48 hours.</p>
                  </div>
                  
                  <div className="p-8">
                      {submitted ? (
                          <div className="text-center py-16">
                              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                  <CheckCircle className="w-10 h-10"/>
                              </div>
                              <h3 className="text-2xl font-bold text-slate-900 mb-3">Application Received</h3>
                              <p className="text-slate-600 max-w-md mx-auto mb-8">
                                  Thank you for your interest in partnering with Hogicar. A member of our supply team will contact you at <strong>{formData.email}</strong> shortly to discuss the next steps.
                              </p>
                              <a href="/" className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors">
                                  Return to Home
                              </a>
                          </div>
                      ) : (
                          <form onSubmit={handleSubmit} className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">Company Name</label>
                                      <div className="relative">
                                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                                          <input 
                                              type="text" 
                                              name="companyName"
                                              required
                                              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
                                              placeholder="e.g. Best Cars Rental"
                                              onChange={handleChange}
                                          />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">Website URL <span className="text-slate-400 font-normal text-xs">(Optional)</span></label>
                                      <div className="relative">
                                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                                          <input 
                                              type="url" 
                                              name="website"
                                              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
                                              placeholder="https://www.example.com"
                                              onChange={handleChange}
                                          />
                                      </div>
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">Primary Location (City/HQ)</label>
                                      <input 
                                          type="text" 
                                          name="primaryLocation"
                                          required
                                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
                                          placeholder="e.g. Miami, FL"
                                          onChange={handleChange}
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">Fleet Size</label>
                                      <select 
                                          name="fleetSize"
                                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-base"
                                          onChange={handleChange}
                                      >
                                          <option value="1-50">1 - 50 Vehicles</option>
                                          <option value="51-200">51 - 200 Vehicles</option>
                                          <option value="201-1000">201 - 1,000 Vehicles</option>
                                          <option value="1000+">1,000+ Vehicles</option>
                                      </select>
                                  </div>
                              </div>

                              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                  <h4 className="font-bold text-blue-900 text-sm mb-3">Contact Person Details</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <input 
                                          type="text" 
                                          name="contactName"
                                          required
                                          placeholder="Full Name"
                                          className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-base"
                                          onChange={handleChange}
                                      />
                                      <input 
                                          type="email" 
                                          name="email"
                                          required
                                          placeholder="Email Address"
                                          className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-base"
                                          onChange={handleChange}
                                      />
                                      <input 
                                          type="tel" 
                                          name="phone"
                                          required
                                          placeholder="Phone Number"
                                          className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-base"
                                          onChange={handleChange}
                                      />
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Integration Method</label>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <label className={`border rounded-lg p-4 cursor-pointer transition-all ${formData.integrationType === 'api' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}>
                                          <div className="flex items-center gap-2 mb-1">
                                              <input type="radio" name="integrationType" value="api" checked={formData.integrationType === 'api'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500"/>
                                              <span className="font-bold text-slate-800 text-sm">Direct API / XML</span>
                                          </div>
                                          <p className="text-xs text-slate-500 pl-6">Automated sync of rates & inventory.</p>
                                      </label>
                                      
                                      <label className={`border rounded-lg p-4 cursor-pointer transition-all ${formData.integrationType === 'portal' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}>
                                          <div className="flex items-center gap-2 mb-1">
                                              <input type="radio" name="integrationType" value="portal" checked={formData.integrationType === 'portal'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500"/>
                                              <span className="font-bold text-slate-800 text-sm">Supplier Portal</span>
                                          </div>
                                          <p className="text-xs text-slate-500 pl-6">Manual management via our dashboard.</p>
                                      </label>

                                      <label className={`border rounded-lg p-4 cursor-pointer transition-all ${formData.integrationType === 'unsure' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}>
                                          <div className="flex items-center gap-2 mb-1">
                                              <input type="radio" name="integrationType" value="unsure" checked={formData.integrationType === 'unsure'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500"/>
                                              <span className="font-bold text-slate-800 text-sm">Not Sure</span>
                                          </div>
                                          <p className="text-xs text-slate-500 pl-6">Let's discuss the best option.</p>
                                      </label>
                                  </div>
                              </div>

                              <div className="pt-4 border-t border-slate-100">
                                  <button type="submit" className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-4 rounded-lg shadow-md transition-transform active:scale-[0.99] flex items-center justify-center gap-2 text-lg">
                                      Submit Application <ArrowRight className="w-5 h-5"/>
                                  </button>
                                  <p className="text-center text-xs text-slate-400 mt-4">By submitting this form, you agree to our B2B Terms of Service.</p>
                              </div>
                          </form>
                      )}
                  </div>
              </div>

              {/* Sidebar Benefits */}
              <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-900 mb-4 text-lg">Why Hogicar?</h3>
                      <ul className="space-y-4">
                          <li className="flex gap-3">
                              <div className="bg-blue-100 p-2 rounded text-blue-600 h-fit"><BarChart3 className="w-5 h-5"/></div>
                              <div>
                                  <h4 className="font-bold text-slate-800 text-sm">Data-Driven Insights</h4>
                                  <p className="text-xs text-slate-500 mt-1">Access real-time analytics on fleet performance and market demand.</p>
                              </div>
                          </li>
                          <li className="flex gap-3">
                              <div className="bg-green-100 p-2 rounded text-green-600 h-fit"><ShieldCheck className="w-5 h-5"/></div>
                              <div>
                                  <h4 className="font-bold text-slate-800 text-sm">Secure Payments</h4>
                                  <p className="text-xs text-slate-500 mt-1">Guaranteed payouts and fraud protection for every booking.</p>
                              </div>
                          </li>
                          <li className="flex gap-3">
                              <div className="bg-purple-100 p-2 rounded text-purple-600 h-fit"><Database className="w-5 h-5"/></div>
                              <div>
                                  <h4 className="font-bold text-slate-800 text-sm">Flexible Integration</h4>
                                  <p className="text-xs text-slate-500 mt-1">Connect via XML/JSON API or use our intuitive extranet portal.</p>
                              </div>
                          </li>
                      </ul>
                  </div>

                  <div className="bg-[#003580] p-6 rounded-xl shadow-sm text-white">
                      <h3 className="font-bold text-lg mb-2">Already a Partner?</h3>
                      <p className="text-blue-200 text-sm mb-4">Log in to your portal to manage inventory and view reservations.</p>
                      <a href="/#/supplier-login" className="block w-full bg-white text-blue-900 font-bold text-center py-3 rounded-lg hover:bg-blue-50 transition-colors text-sm">
                          Partner Login
                      </a>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};

export default BecomeSupplier;