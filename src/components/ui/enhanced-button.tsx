import React, { forwardRef, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface EnhancedButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  showToastOnSuccess?: boolean;
  showToastOnError?: boolean;
  confirmBeforeAction?: boolean;
  confirmMessage?: string;
  icon?: React.ReactNode;
  disableOnClick?: boolean;
  cooldown?: number; // ثواني
}

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({
    onClick,
    children,
    disabled,
    loadingText = 'جاري المعالجة...',
    successText,
    errorText,
    showToastOnSuccess = false,
    showToastOnError = true,
    confirmBeforeAction = false,
    confirmMessage = 'هل أنت متأكد من هذا الإجراء؟',
    icon,
    disableOnClick = true,
    cooldown = 0,
    className,
    ...props
  }, ref) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [isOnCooldown, setIsOnCooldown] = useState(false);
    const { toast } = useToast();

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!onClick || isLoading || (disableOnClick && isOnCooldown)) return;

      // تأكيد قبل العمل
      if (confirmBeforeAction) {
        const confirmed = window.confirm(confirmMessage);
        if (!confirmed) return;
      }

      try {
        setIsLoading(true);
        setShowSuccess(false);
        setShowError(false);

        await onClick(e);

        // إظهار حالة النجاح
        if (successText) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        }

        if (showToastOnSuccess) {
          toast({
            title: 'تم بنجاح',
            description: successText || 'تم تنفيذ العملية بنجاح',
            duration: 3000,
          });
        }

        // تطبيق فترة التبريد
        if (cooldown > 0) {
          setIsOnCooldown(true);
          setTimeout(() => setIsOnCooldown(false), cooldown * 1000);
        }

      } catch (error: any) {
        console.error('Button action failed:', error);
        
        if (errorText || showToastOnError) {
          setShowError(true);
          setTimeout(() => setShowError(false), 3000);
        }

        if (showToastOnError) {
          toast({
            title: 'خطأ في العملية',
            description: errorText || error.message || 'حدث خطأ غير متوقع',
            variant: 'destructive',
            duration: 5000,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    const getButtonContent = () => {
      if (isLoading) {
        return (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {loadingText}
          </>
        );
      }

      if (showSuccess && successText) {
        return (
          <>
            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            {successText}
          </>
        );
      }

      if (showError && errorText) {
        return (
          <>
            <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
            {errorText}
          </>
        );
      }

      return (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      );
    };

    const isDisabled = disabled || isLoading || (disableOnClick && isOnCooldown);

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          'transition-all duration-200',
          showSuccess && 'bg-green-600 hover:bg-green-700',
          showError && 'bg-red-600 hover:bg-red-700',
          isOnCooldown && 'opacity-60',
          className
        )}
        {...props}
      >
        {getButtonContent()}
      </Button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

// مكون زر العمل مع التأكيد
interface ActionButtonProps extends EnhancedButtonProps {
  action: 'create' | 'edit' | 'delete' | 'save' | 'cancel' | 'submit' | 'export' | 'import';
  itemName?: string;
}

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ action, itemName = 'العنصر', ...props }, ref) => {
    const actionConfig = {
      create: {
        loadingText: 'جاري الإنشاء...',
        successText: 'تم الإنشاء',
        confirmMessage: `هل تريد إنشاء ${itemName} جديد؟`,
        variant: 'default' as const,
      },
      edit: {
        loadingText: 'جاري التحديث...',
        successText: 'تم التحديث',
        confirmMessage: `هل تريد تحديث ${itemName}؟`,
        variant: 'default' as const,
      },
      delete: {
        loadingText: 'جاري الحذف...',
        successText: 'تم الحذف',
        confirmMessage: `هل أنت متأكد من حذف ${itemName}؟ هذا الإجراء لا يمكن التراجع عنه.`,
        variant: 'destructive' as const,
        confirmBeforeAction: true,
      },
      save: {
        loadingText: 'جاري الحفظ...',
        successText: 'تم الحفظ',
        variant: 'default' as const,
      },
      cancel: {
        variant: 'outline' as const,
      },
      submit: {
        loadingText: 'جاري الإرسال...',
        successText: 'تم الإرسال',
        variant: 'default' as const,
      },
      export: {
        loadingText: 'جاري التصدير...',
        successText: 'تم التصدير',
        variant: 'outline' as const,
      },
      import: {
        loadingText: 'جاري الاستيراد...',
        successText: 'تم الاستيراد',
        variant: 'outline' as const,
      },
    };

    const config = actionConfig[action];

    return (
      <EnhancedButton
        ref={ref}
        variant={config.variant}
        loadingText={config.loadingText}
        successText={config.successText}
        confirmMessage={config.confirmMessage}
        confirmBeforeAction={config.confirmBeforeAction}
        showToastOnSuccess={['create', 'edit', 'delete', 'save', 'submit'].includes(action)}
        {...props}
      />
    );
  }
);

ActionButton.displayName = 'ActionButton';

// Hook للتحكم في حالة مجموعة من الأزرار
export const useButtonGroup = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [cooldownStates, setCooldownStates] = useState<Record<string, boolean>>({});

  const setLoading = (buttonId: string, isLoading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [buttonId]: isLoading }));
  };

  const setCooldown = (buttonId: string, cooldownTime: number) => {
    setCooldownStates(prev => ({ ...prev, [buttonId]: true }));
    setTimeout(() => {
      setCooldownStates(prev => ({ ...prev, [buttonId]: false }));
    }, cooldownTime * 1000);
  };

  const isLoading = (buttonId: string) => loadingStates[buttonId] || false;
  const isOnCooldown = (buttonId: string) => cooldownStates[buttonId] || false;
  const isDisabled = (buttonId: string) => isLoading(buttonId) || isOnCooldown(buttonId);

  return {
    setLoading,
    setCooldown,
    isLoading,
    isOnCooldown,
    isDisabled,
  };
};

// مكون زر مع تتبع التقدم
interface ProgressButtonProps extends EnhancedButtonProps {
  progress?: number; // 0-100
  showProgress?: boolean;
}

export const ProgressButton = forwardRef<HTMLButtonElement, ProgressButtonProps>(
  ({ progress = 0, showProgress = false, children, className, ...props }, ref) => {
    return (
      <div className="relative">
        <EnhancedButton
          ref={ref}
          className={cn('relative overflow-hidden', className)}
          {...props}
        >
          {children}
          {showProgress && (
            <div 
              className="absolute bottom-0 left-0 h-1 bg-primary-foreground/30 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          )}
        </EnhancedButton>
      </div>
    );
  }
);

ProgressButton.displayName = 'ProgressButton'; 