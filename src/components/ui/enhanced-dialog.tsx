
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EnhancedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
  children: React.ReactNode;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export const EnhancedDialog: React.FC<EnhancedDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  showCloseButton = false,
  children,
  className,
}) => {
  const descriptionId = React.useMemo(() => `enhanced-dialog-desc-${Math.random().toString(36).substr(2, 9)}`, []);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(sizeClasses[size], className)} 
        dir="rtl"
        aria-describedby={description ? descriptionId : undefined}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="rtl-title">{title}</DialogTitle>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
                aria-label="إغلاق النافذة"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {description && (
            <DialogDescription id={descriptionId}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="mt-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};
