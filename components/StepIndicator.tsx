import React from 'react';

interface StepProps {
  step: number;
  label: string;
  isCurrent: boolean;
  isCompleted: boolean;
}

const Step: React.FC<StepProps> = ({ step, label, isCurrent, isCompleted }) => {
  const circleClasses = isCurrent
    ? 'bg-brand-accent text-white border-brand-accent'
    : isCompleted
    ? 'bg-brand-success border-brand-success text-white'
    : 'bg-brand-secondary border-brand-border text-brand-text-secondary';
  
  const labelClasses = isCurrent ? 'text-brand-accent font-semibold' : isCompleted ? 'text-brand-text-primary' : 'text-brand-text-secondary';

  return (
    <div className="flex flex-col items-center text-center space-y-2">
      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-300 ${circleClasses}`}>
        {isCompleted && !isCurrent ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        ) : step}
      </div>
      <span className={`text-xs md:text-sm ${labelClasses}`}>{label}</span>
    </div>
  );
};

interface StepIndicatorProps {
  currentStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { id: 1, label: 'Prompt AI' },
    { id: 2, label: 'Visualize Schema' },
    { id: 3, label: 'Generate & Visualize Data' },
    { id: 4, label: 'Export Artifacts' },
  ];
  
  const lastCompletedStep = currentStep - 1;

  return (
    <div className="w-full max-w-4xl p-4 rounded-lg bg-brand-secondary border border-brand-border">
      <div className="flex justify-between items-start relative">
        <div className="absolute top-5 left-0 w-full h-1 bg-brand-border transform -translate-y-1/2 -z-1"></div>
        <div 
          className="absolute top-5 left-0 h-1 bg-brand-success transform -translate-y-1/2 -z-1 transition-all duration-500"
          style={{ width: `${(lastCompletedStep / (steps.length - 1)) * 100}%` }}
        ></div>
        
        {steps.map((step) => (
          <div key={step.id} className="flex-1 flex justify-center">
            <Step
              step={step.id}
              label={step.label}
              isCurrent={currentStep === step.id}
              isCompleted={currentStep > step.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
};