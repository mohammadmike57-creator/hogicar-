import * as React from 'react';
import Search from 'lucide-react/dist/esm/icons/search';
import Car from 'lucide-react/dist/esm/icons/car';
import List from 'lucide-react/dist/esm/icons/list';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';

interface BookingStepperProps {
  currentStep: number;
}

const steps = [
  { step: 1, label: 'Search', icon: Search },
  { step: 2, label: 'Choose Vehicle', icon: Car },
  { step: 3, label: 'Details & Extras', icon: List },
  { step: 4, label: 'Book & Pay', icon: CreditCard },
  { step: 5, label: 'Confirmation', icon: CheckCircle },
];

const BookingStepper: React.FC<BookingStepperProps> = ({ currentStep }) => {
  return (
    <div className="w-full mb-3 md:mb-10 pt-2 md:pt-4">
      {/* --- DESKTOP STEPPER --- */}
      <div className="hidden md:block w-full">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between relative px-2">
            {/* Background connecting line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-slate-100 z-0 rounded-full"></div>
            
            {/* Active/Completed connecting line progress */}
            <div 
              className="absolute top-5 left-0 h-1 bg-accent transition-all duration-1000 ease-in-out z-0 rounded-full shadow-[0_0_8px_rgba(0,122,194,0.4)]"
              style={{ width: `${Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100)}%` }}
            ></div>
            
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.step;
              const isActive = currentStep === step.step;
              const Icon = step.icon;

              return (
                <div key={step.step} className="relative z-10 flex flex-col items-center group">
                  {/* Step Circle */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 transition-all duration-500
                      ${isCompleted ? 'bg-accent border-accent text-white shadow-lg' : ''}
                      ${isActive ? 'bg-white border-accent text-accent shadow-xl ring-4 ring-accent/10 scale-110' : ''}
                      ${!isCompleted && !isActive ? 'bg-white border-slate-200 text-slate-400' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 fill-white/20" />
                    ) : (
                      <span className={`text-base font-black ${isActive ? 'text-accent' : ''}`}>
                        {step.step}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="absolute top-14 flex flex-col items-center w-32 text-center">
                    <p className={`text-[11px] font-black uppercase tracking-widest transition-colors duration-300 whitespace-nowrap
                      ${isActive ? 'text-slate-950' : isCompleted ? 'text-slate-700' : 'text-slate-400'}
                    `}>
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Spacer for the absolute positioned labels */}
          <div className="h-10"></div>
        </div>
      </div>

      {/* --- MOBILE STEPPER (COMPACT) --- */}
      <div className="md:hidden px-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="w-8 h-8 shrink-0 bg-accent rounded-lg flex items-center justify-center text-white shadow-sm shadow-accent/20">
              {steps[currentStep-1]?.icon && React.createElement(steps[currentStep-1].icon, { className: "w-4 h-4 stroke-[2.5px]" })}
            </div>
            <p className="min-w-0 truncate text-sm font-black text-slate-950">
              {steps[currentStep-1]?.label}
            </p>
          </div>
          <p className="shrink-0 text-xs font-bold text-slate-500">Step {currentStep} of {steps.length}</p>
        </div>
        <div className="mt-2.5 flex gap-1" aria-hidden="true">
          {steps.map(s => (
            <div
              key={s.step}
              className={`h-1 flex-1 rounded-full transition-colors duration-700 ${s.step <= currentStep ? 'bg-accent' : 'bg-slate-200'}`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookingStepper;