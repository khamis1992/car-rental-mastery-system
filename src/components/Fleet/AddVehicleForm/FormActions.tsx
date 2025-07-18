
import React from 'react';
import { Button } from '@/components/ui/button';
import { Car, RotateCcw } from 'lucide-react';

interface FormActionsProps {
  onReset: () => void;
  onCancel: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({ onReset, onCancel }) => {
  return (
    <div className="flex justify-between gap-4 pt-4 border-t border-border/50">
      <Button
        type="button"
        variant="outline"
        onClick={onReset}
        className="rtl-flex h-12 px-6"
      >
        <RotateCcw className="w-4 h-4" />
        تفريغ النموذج
      </Button>
      
      <div className="flex gap-3 flex-row-reverse">
        <Button 
          type="submit" 
          className="rtl-flex h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all"
        >
          <Car className="w-4 h-4" />
          إضافة المركبة
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-12 px-6"
        >
          إلغاء
        </Button>
      </div>
    </div>
  );
};
