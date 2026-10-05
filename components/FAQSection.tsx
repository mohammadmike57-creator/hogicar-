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
    <section className="bg-slate-50 py-14 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_2fr] lg:gap-12 lg:px-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
          <p className="mt-2 text-base text-slate-600">{subtitle}</p>
          <div className="mt-6 hidden rounded-xl border border-slate-200 bg-white p-5 lg:block">
            <p className="text-sm font-semibold text-slate-900">Still have questions?</p>
            <p className="mt-1 text-sm text-slate-600">Our support team is here to help, day and night.</p>
            <a href="mailto:support@hogicar.com" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
              <Mail className="h-4 w-4" /> Contact support
            </a>
          </div>
        </div>

        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            const panelId = `faq-panel-${index}`;
            return (
              <div key={faq.id || index}>
                <h3>
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-base font-semibold text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </h3>
                <div id={panelId} hidden={!isOpen} className="px-5 pb-5">
                  <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:hidden">
          <a href="mailto:support@hogicar.com" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
            <Mail className="h-4 w-4" /> Still have questions? Contact support
          </a>
        </div>
      </div>
    </section>
  );
};

export default React.memo(FAQSection);
