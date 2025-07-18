import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  totalSteps,
  steps
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* مؤشر الخطوات */}
      <div className="flex items-center justify-between mb-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const step = index + 1;
          return (
            <div
              key={step}
              className="flex items-center"
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold ${
                step < currentStep
                  ? 'bg-primary border-primary text-white'
                  : step === currentStep
                  ? 'bg-primary border-primary text-white'
                  : 'bg-muted border-muted-foreground text-muted-foreground'
              }`}>
                {step < currentStep ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step
                )}
              </div>
              {index < totalSteps - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* شريط التقدم */}
      <Progress value={progress} className="h-2" />
      
      {/* تسميات الخطوات */}
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        {steps.map((stepName, index) => (
          <span key={index} className="text-center">{stepName}</span>
        ))}
      </div>
    </div>
  );
};

export default StepProgress;