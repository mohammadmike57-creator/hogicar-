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
    <div className="w-full mb-10">
      {/* --- DESKTOP STEPPER --- */}
      <div className="hidden md:block w-full">
        <div className="max-w-[1000px] mx-auto">
          <div className="flex items-center justify-between relative">
            {/* Background connecting line */}
            <div className="absolute top-5 left-0 right-0 h-[2px] bg-slate-100 z-0"></div>
            
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.step;
              const isActive = currentStep === step.step;
              const Icon = step.icon;

              return (
                <div key={step.step} className="relative z-10 flex flex-col items-center group">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-700
                      ${isCompleted ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' : ''}
                      ${isActive ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-900/30 scale-110' : ''}
                      ${!isCompleted && !isActive ? 'bg-white border-slate-100 text-slate-300' : ''}
                    `}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className={`w-4.5 h-4.5 ${isActive ? 'animate-pulse' : ''}`} />}
                  </div>
                  <div className="absolute top-14 w-32 text-center">
                    <p
                      className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500
                        ${isActive ? 'text-slate-900 opacity-100' : 'text-slate-400 opacity-60'}
                        ${isCompleted ? 'text-emerald-600 opacity-100' : ''}
                      `}
                    >
                      {step.label}
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
        <div className="flex items-center justify-between bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                    {steps[currentStep-1]?.icon && React.createElement(steps[currentStep-1].icon, { className: "w-5 h-5" })}
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Step 0{currentStep}</p>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-[0.1em]">{steps[currentStep-1]?.label}</p>
                </div>
            </div>
            <div className="flex gap-1">
                {steps.map(s => (
                    <div key={s.step} className={`h-1.5 rounded-full transition-all duration-500 ${s.step === currentStep ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200'}`}></div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default BookingStepper;