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
    <div className="w-full mb-8 sm:mb-12">
      {/* --- DESKTOP STEPPER --- */}
      <div className="hidden md:block w-full">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between relative">
            {/* Background connecting line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 z-0"></div>
            
            {/* Active/Completed connecting line progress */}
            <div 
              className="absolute top-5 left-0 h-0.5 bg-accent transition-all duration-700 ease-in-out z-0"
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                      ${isCompleted ? 'bg-accent border-accent text-white' : ''}
                      ${isActive ? 'bg-white border-accent text-accent shadow-md ring-4 ring-accent/10' : ''}
                      ${!isCompleted && !isActive ? 'bg-white border-slate-300 text-slate-400' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 fill-white/20" />
                    ) : (
                      <span className={`text-sm font-bold ${isActive ? 'text-accent' : ''}`}>
                        {step.step}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="absolute top-12 flex flex-col items-center w-32 text-center">
                    <p className={`text-[13px] font-bold transition-colors duration-300 whitespace-nowrap
                      ${isActive ? 'text-slate-900' : isCompleted ? 'text-slate-700' : 'text-slate-400'}
                    `}>
                      {step.label}
                    </p>
                    {isActive && (
                      <span className="mt-1 w-1 h-1 rounded-full bg-accent animate-pulse"></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Spacer for the absolute positioned labels */}
          <div className="h-14"></div>
        </div>
      </div>

      {/* --- MOBILE STEPPER (COMPACT) --- */}
      <div className="md:hidden px-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-sm">
                    {steps[currentStep-1]?.icon && React.createElement(steps[currentStep-1].icon, { className: "w-5 h-5" })}
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Step {currentStep} of {steps.length}</p>
                    <p className="text-sm font-extrabold text-slate-900">{steps[currentStep-1]?.label}</p>
                </div>
            </div>
            <div className="text-sm font-black text-accent">{Math.round((currentStep / steps.length) * 100)}%</div>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                {steps.map(s => (
                    <div 
                        key={s.step} 
                        className={`h-full transition-all duration-500 rounded-full ${s.step <= currentStep ? 'bg-accent flex-grow' : 'w-2 bg-slate-200 opacity-50'}`}
                    ></div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingStepper;