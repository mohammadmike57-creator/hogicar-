import * as React from 'react';
import Search from 'lucide-react/dist/esm/icons/search';
import Shield from 'lucide-react/dist/esm/icons/shield';
import BookCheck from 'lucide-react/dist/esm/icons/book-check';

const iconMap: { [key: string]: any } = {
  Search, Shield, BookCheck
};

interface Step {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface HowItWorksProps {
  title: string;
  subtitle: string;
  steps: Step[];
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ title, subtitle, steps }) => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 uppercase tracking-tighter leading-none">{title}</h2>
          <p className="text-slate-600 font-bold uppercase text-[10px] tracking-[0.2em] max-w-xl mx-auto leading-relaxed">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = iconMap[step.icon] || Search;
            return (
              <div key={step.id} className="relative p-10 rounded-[3rem] bg-slate-50 border border-slate-100 transition-all duration-300 hover:shadow-xl group">
                <div className="absolute -top-6 left-10 w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-200">
                  {index + 1}
                </div>
                <div className="mb-8 mt-4">
                   <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-blue-600" />
                   </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">{step.title}</h3>
                <p className="text-slate-600 font-bold text-sm leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
