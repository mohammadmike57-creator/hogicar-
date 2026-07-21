import * as React from 'react';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Shield from 'lucide-react/dist/esm/icons/shield';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import User from 'lucide-react/dist/esm/icons/user';

const iconMap: { [key: string]: any } = {
  HelpCircle, Clock, CreditCard, Shield, FileText, User, ShieldCheck
};

interface FAQItem {
  id?: string | number;
  icon: string;
  title: string;
  description: string;
  color?: string;
}

interface FAQSectionProps {
  title: string;
  subtitle: string;
  items: FAQItem[];
}

export const FAQSection: React.FC<FAQSectionProps> = ({ title, subtitle, items }) => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-slate-50/50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-accent/10 text-accent mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight">{title}</h2>
          <p className="text-slate-700 font-bold uppercase text-xs tracking-widest max-w-lg mx-auto leading-relaxed">{subtitle}</p>
        </div>

        <div className="grid gap-4">
            {items.map((faq, index) => {
              const Icon = iconMap[faq.icon] || HelpCircle;
              const isOpen = openIndex === index;
              
              return (
                <div 
                  key={faq.id || index} 
                  className={`group rounded-3xl transition-all duration-300 border ${isOpen ? 'bg-white shadow-xl shadow-slate-200/50 border-accent/20' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}
                >
                  <button 
                    onClick={() => toggle(index)} 
                    className="w-full flex items-center text-left p-5 sm:p-7 focus:outline-none"
                  >
                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isOpen ? (faq.color || 'bg-accent') : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                      <Icon className={`w-6 h-6 ${isOpen ? 'text-white' : 'text-slate-500'}`} />
                    </div>
                    <div className="ml-5 flex-grow">
                      <h3 className={`text-[15px] sm:text-[17px] font-black uppercase tracking-tight ${isOpen ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                        {faq.title}
                      </h3>
                    </div>
                    <div className={`ml-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent' : 'text-slate-300'}`}>
                      {isOpen ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </div>
                  </button>
                  
                  {isOpen && (
                    <div className="px-5 sm:px-7 pb-7 pt-0 ml-[4.25rem]">
                      <div className="h-px bg-slate-100 mb-6 w-full" />
                      <p className="text-slate-600 text-[15px] leading-relaxed font-medium">
                        {faq.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
