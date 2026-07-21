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
    <div className="w-full mb-6 sm:mb-10 pt-4">
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
      <div className="md:hidden px-3">
        <div className="rounded-3xl border border-slate-100 bg-white/80 backdrop-blur-md p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white shadow-lg shadow-accent/20">
                    {steps[currentStep-1]?.icon && React.createElement(steps[currentStep-1].icon, { className: "w-6 h-6 stroke-[2.5px]" })}
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Step {currentStep} of {steps.length}</p>
                    <p className="text-base font-black text-slate-950 uppercase tracking-tight">{steps[currentStep-1]?.label}</p>
                </div>
            </div>
            <div className="text-base font-black text-accent">{Math.round((currentStep / steps.length) * 100)}%</div>
          </div>
          <div className="mt-5 h-2 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1 p-0.5">
                {steps.map(s => (
                    <div 
                        key={s.step} 
                        className={`h-full transition-all duration-700 rounded-full ${s.step <= currentStep ? 'bg-accent flex-grow shadow-[0_0_8px_rgba(0,122,194,0.4)]' : 'w-3 bg-slate-200 opacity-40'}`}
                    ></div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingStepper;