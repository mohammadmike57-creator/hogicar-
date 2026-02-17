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
  const currentStepInfo = steps.find(s => s.step === currentStep);

  return (
    <div className="w-full mb-4 md:mb-6">
      {/* --- MOBILE STEPPER --- */}
      <div className="md:hidden bg-white py-1.5 px-4 shadow-sm border-b border-slate-200">
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-2">
            {currentStepInfo && (
              <>
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-600 text-white flex-shrink-0">
                  <currentStepInfo.icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Step {currentStep}</p>
                  <p className="font-bold text-[11px] text-slate-800">{currentStepInfo.label}</p>
                </div>
              </>
            )}
          </div>
          <p className="text-xs font-bold text-slate-500 flex-shrink-0 ml-2">{currentStep} <span className="font-normal">/ {steps.length}</span></p>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-0.5 mt-1.5">
          <div
            className="bg-blue-600 h-0.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* --- DESKTOP STEPPER --- */}
      <div className="hidden md:block w-full bg-transparent py-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.step;
              const isActive = currentStep === step.step;
              const Icon = step.icon;

              return (
                <React.Fragment key={step.step}>
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                        ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                        ${isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/50' : ''}
                        ${!isCompleted && !isActive ? 'bg-white border-slate-300 text-slate-400' : ''}
                      `}
                    >
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <p
                      className={`mt-2 text-[10px] md:text-xs font-bold w-20 md:w-24 transition-colors duration-300
                        ${isActive ? 'text-blue-600' : ''}
                        ${isCompleted ? 'text-slate-700' : 'text-slate-400'}
                      `}
                    >
                      {step.label}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 transition-colors duration-500 -mt-8
                        ${isCompleted ? 'bg-green-500' : 'bg-slate-200'}
                      `}
                    ></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingStepper;