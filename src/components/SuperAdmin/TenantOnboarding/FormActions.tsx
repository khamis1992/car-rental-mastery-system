
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, X, RotateCcw } from 'lucide-react';

interface FormActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  onReset?: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({ 
  isSubmitting, 
  onCancel, 
  onReset 
}) => {
  console.log('FormActions rendered with isSubmitting:', isSubmitting);
  
  return (
    <div className="flex justify-between items-center pt-6 border-t border-border/50 bg-card rounded-lg p-4 mt-4">
      <div className="flex gap-2">
        {onReset && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={isSubmitting}
            className="rtl-flex"
          >
            <RotateCcw className="w-4 h-4" />
            إعادة تعيين
          </Button>
        )}
      </div>
      
      <div className="flex gap-3 flex-row-reverse">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rtl-flex h-12 px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري الإنشاء...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              إنشاء المؤسسة
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rtl-flex h-12 px-6"
        >
          <X className="w-4 h-4" />
          إلغاء
        </Button>
      </div>
    </div>
  );
};
