
import React from 'react';
import { Button } from "@/components/ui/button";
import { Building, Loader2, ArrowLeft } from "lucide-react";

interface FormActionsProps {
  onBack: () => void;
  isSubmitting: boolean;
  canGoBack: boolean;
  currentStep: number;
  totalSteps: number;
}

const FormActions: React.FC<FormActionsProps> = ({
  onBack,
  isSubmitting,
  canGoBack,
  currentStep,
  totalSteps
}) => {
  console.info('FormActions rendered with isSubmitting:', isSubmitting);
  
  return (
    <div className="flex flex-col gap-4 p-6 bg-gradient-soft rounded-lg border shadow-elegant" dir="rtl">
      {/* Progress indicator */}
      <div className="rtl-title mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            الخطوة {currentStep} من {totalSteps}
          </span>
          <span className="text-sm text-primary font-semibold">
            {Math.round((currentStep / totalSteps) * 100)}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-gradient-primary h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-end">
        {/* Back button */}
        {canGoBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="rtl-button hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>السابق</span>
          </Button>
        )}

        {/* Submit button - always visible with clear styling */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rtl-button bg-gradient-primary hover:opacity-90 text-white font-semibold 
                     shadow-lg hover:shadow-glow transition-all duration-300 
                     disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]
                     flex-shrink-0"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري الإنشاء...</span>
            </>
          ) : (
            <>
              <Building className="w-4 h-4" />
              <span>إنشاء المؤسسة</span>
            </>
          )}
        </Button>
      </div>

      {/* Helper text */}
      <div className="rtl-title text-xs text-muted-foreground mt-2 p-3 bg-muted/30 rounded">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">ملاحظة مهمة:</p>
            <p>سيتم إنشاء المؤسسة الجديدة مع حساب مدير افتراضي. تأكد من صحة البيانات قبل المتابعة.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormActions;
