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
  return (
    <div className="flex justify-between items-center pt-6 border-t border-border/50">
      <div className="flex gap-2">
        {onReset && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            إعادة تعيين
          </Button>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-gradient-primary hover:opacity-90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الإنشاء...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              إنشاء المؤسسة
            </>
          )}
        </Button>
      </div>
    </div>
  );
};