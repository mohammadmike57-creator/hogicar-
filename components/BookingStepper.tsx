import * as React from 'react';
import { Search, Car, List, CreditCard, CheckCircle } from 'lucide-react';

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
    <div className="w-full mb-8 sm:mb-10">
      {/* --- DESKTOP STEPPER --- */}
      <div className="hidden md:block w-full">
        <div className="max-w-[1040px] mx-auto rounded-3xl border border-slate-300/70 bg-slate-100/85 backdrop-blur-sm px-6 py-6 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between relative">
            {/* Background connecting line */}
            <div className="absolute top-6 left-10 right-10 h-[2px] bg-slate-300 z-0"></div>
            
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.step;
              const isActive = currentStep === step.step;
              const Icon = step.icon;

              return (
                <div key={step.step} className="relative z-10 flex flex-col items-center gap-3 text-center">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500
                      ${isCompleted ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' : ''}
                      ${isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105' : ''}
                      ${!isCompleted && !isActive ? 'bg-slate-100 border-slate-300 text-slate-600' : ''}
                    `}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4.5 h-4.5" />}
                  </div>
                  <div className="w-36">
                    <p className={`text-xs font-semibold transition-colors duration-300 ${isActive ? 'text-slate-900' : 'text-slate-500'} ${isCompleted ? 'text-emerald-700' : ''}`}>
                      {step.label}
                    </p>
                    <p className={`mt-1 text-[11px] ${isActive ? 'text-blue-700' : 'text-slate-400'} ${isCompleted ? 'text-emerald-600' : ''}`}>
                      Step {step.step}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- MOBILE STEPPER (COMPACT) --- */}
      <div className="md:hidden">
        <div className="rounded-2xl border border-slate-300/70 bg-slate-100/85 backdrop-blur-sm px-4 py-4 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.65)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/30">
                    {steps[currentStep-1]?.icon && React.createElement(steps[currentStep-1].icon, { className: "w-5 h-5" })}
                </div>
                <div>
                    <p className="text-[11px] font-semibold text-slate-500 leading-none mb-1">Step {currentStep} of {steps.length}</p>
                    <p className="text-sm font-semibold text-slate-900 leading-none">{steps[currentStep-1]?.label}</p>
                </div>
            </div>
            <div className="text-xs font-medium text-slate-500">{Math.round((currentStep / steps.length) * 100)}%</div>
          </div>
          <div className="mt-3 flex gap-1.5">
                {steps.map(s => (
                    <div key={s.step} className={`h-1.5 rounded-full transition-all duration-500 ${s.step === currentStep ? 'w-7 bg-blue-600' : s.step < currentStep ? 'w-3 bg-emerald-500' : 'w-3 bg-slate-300'}`}></div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingStepper;