import React, { forwardRef, useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

interface EnhancedDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  maxHeight?: string;
  dir?: 'rtl' | 'ltr';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg', 
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] w-[95vw]'
};

export const EnhancedDialog = forwardRef<HTMLDivElement, EnhancedDialogProps>(
  ({
    open,
    onOpenChange,
    title,
    description,
    children,
    trigger,
    footer,
    className,
    size = 'md',
    showCloseButton = true,
    closeOnOverlayClick = true,
    isLoading = false,
    loadingText = 'جاري التحميل...',
    maxHeight = '90vh',
    dir = 'rtl',
    ...props
  }, ref) => {
    const contentRef = useRef<HTMLDivElement>(null);

    // منع إغلاق المودال عند النقر داخل المحتوى
    const handleContentClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    // معالج إغلاق محسن
    const handleClose = () => {
      if (onOpenChange && !isLoading) {
        onOpenChange(false);
      }
    };

    // منع التمرير في الخلفية عند فتح المودال
    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }

      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [open]);

    return (
      <Dialog 
        open={open} 
        onOpenChange={closeOnOverlayClick ? onOpenChange : undefined}
        dir={dir}
      >
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        
        <DialogContent
          ref={ref}
          className={cn(
            'flex flex-col',
            sizeClasses[size],
            'h-auto',
            className
          )}
          style={{ maxHeight }}
          onPointerDownOutside={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
          onEscapeKeyDown={!isLoading ? undefined : (e) => e.preventDefault()}
          onClick={handleContentClick}
          {...props}
        >
          {/* Header مع زر الإغلاق المحسن */}
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <DialogHeader className="flex-1 text-right">
              {title && (
                <DialogTitle className="text-xl font-bold text-right">
                  {title}
                </DialogTitle>
              )}
              {description && (
                <DialogDescription className="text-muted-foreground text-right mt-1">
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
            
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive ml-2"
                onClick={handleClose}
                disabled={isLoading}
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* المحتوى مع التمرير */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">{loadingText}</p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {children}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Footer مثبت في الأسفل */}
          {footer && !isLoading && (
            <DialogFooter className="border-t border-border/50 pt-4 mt-auto">
              <div className="flex justify-end gap-2 w-full">
                {footer}
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    );
  }
);

EnhancedDialog.displayName = 'EnhancedDialog';

// Hook مساعد للتحكم في المودال
export const useEnhancedDialog = (initialOpen = false) => {
  const [open, setOpen] = React.useState(initialOpen);
  const [isLoading, setIsLoading] = React.useState(false);

  const openDialog = () => setOpen(true);
  const closeDialog = () => {
    if (!isLoading) {
      setOpen(false);
    }
  };

  const withLoading = async (callback: () => Promise<void>, loadingText?: string) => {
    setIsLoading(true);
    try {
      await callback();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    open,
    setOpen,
    openDialog,
    closeDialog,
    isLoading,
    setIsLoading,
    withLoading
  };
};

// مكون مودال التأكيد المحسن
interface ConfirmDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: 'default' | 'destructive' | 'warning';
  isLoading?: boolean;
  trigger?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title = 'تأكيد العملية',
  description = 'هل أنت متأكد من هذا الإجراء؟',
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  onConfirm,
  onCancel,
  variant = 'default',
  isLoading = false,
  trigger
}) => {
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const variantStyles = {
    default: 'border-primary text-primary',
    destructive: 'border-destructive text-destructive',
    warning: 'border-orange-500 text-orange-600'
  };

  return (
    <EnhancedDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      size="sm"
      closeOnOverlayClick={!isLoading}
      isLoading={isLoading}
      loadingText="جاري المعالجة..."
    >
      <div className="space-y-6">
        <div className={cn(
          'flex items-center gap-3 p-4 rounded-lg border-2',
          variantStyles[variant]
        )}>
          <div className="text-right flex-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-muted-foreground mt-1">{description}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري المعالجة...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </EnhancedDialog>
  );
}; 