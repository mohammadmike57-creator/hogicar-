import * as React from 'react';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Star from 'lucide-react/dist/esm/icons/star';
import Award from 'lucide-react/dist/esm/icons/award';
import SearchIcon from 'lucide-react/dist/esm/icons/search';
import FileSymlink from 'lucide-react/dist/esm/icons/file-symlink';
import BookCheck from 'lucide-react/dist/esm/icons/book-check';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Zap from 'lucide-react/dist/esm/icons/zap';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Mail from 'lucide-react/dist/esm/icons/mail';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Plane from 'lucide-react/dist/esm/icons/plane';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import User from 'lucide-react/dist/esm/icons/user';
import Clock from 'lucide-react/dist/esm/icons/clock';

const iconMap: { [key: string]: React.ElementType } = {
    Globe, Tag, Star, Award, Search: SearchIcon, FileSymlink, BookCheck, CheckCircle, Shield, Sparkles, Zap, MapPin, Mail, ArrowRight, Plane, CreditCard, Wallet, User, Clock, HelpCircle
};

interface FAQItem {
  id?: string;
  icon?: any;
  question: string;
  answer: string;
  color?: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  title: string;
  subtitle: string;
}

const FAQSection: React.FC<FAQSectionProps> = ({ faqs, title, subtitle }) => {
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);
  
  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="bg-white py-24">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight">{title}</h2>
          <p className="text-slate-600 text-lg font-medium">{subtitle}</p>
        </div>
        <div className="space-y-4">
            {faqs.map((faq, index) => {
              const Icon = iconMap[faq.icon] || HelpCircle;
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={faq.id || index}
                  className={`group border-2 transition-all duration-500 rounded-3xl overflow-hidden ${isOpen ? 'border-accent bg-slate-50 shadow-xl shadow-accent/5' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                >
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center text-left p-5 sm:p-7 focus:outline-none"
                  >
                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isOpen ? (faq.color || 'bg-accent') : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                      <Icon className={`w-6 h-6 ${isOpen ? 'text-white' : 'text-slate-500'}`} />
                    </div>
                    <div className="ml-5 flex-1 pr-4">
                      <span className={`block font-black uppercase tracking-tight transition-colors duration-300 ${isOpen ? 'text-slate-900 text-lg' : 'text-slate-700 group-hover:text-slate-900'}`}>
                        {faq.question}
                      </span>
                    </div>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-accent border-accent text-white rotate-180' : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300'}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-5 sm:px-7 pb-7 ml-0 sm:ml-12">
                      <div className="h-px w-10 bg-slate-100 mb-6 hidden sm:block"></div>
                      <p className="text-slate-600 leading-relaxed font-medium text-base">
                        {faq.answer}
                      </p>
                      {isOpen && (
                        <div className="mt-6 flex items-center gap-2 text-accent font-black text-[10px] uppercase tracking-widest">
                          <Sparkles className="w-3 h-3" />
                          Was this helpful?
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mb-4">Still have questions?</p>
          <a href="mailto:support@hogicar.com" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
            Contact Support <Mail className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default React.memo(FAQSection);
