
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  children,
  loading = false,
  loadingText,
  icon,
  disabled,
  className,
  ...props
}) => {
  return (
    <Button
      disabled={disabled || loading}
      className={cn('flex items-center gap-2', className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </Button>
  );
};

interface ActionButtonProps extends EnhancedButtonProps {
  action: 'create' | 'edit' | 'delete' | 'view';
  itemName?: string;
  requireConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  action,
  itemName = '',
  children,
  ...props
}) => {
  const getVariant = () => {
    switch (action) {
      case 'delete': return 'destructive';
      case 'create': return 'default';
      case 'edit': return 'outline';
      case 'view': return 'ghost';
      default: return 'default';
    }
  };

  return (
    <EnhancedButton
      variant={getVariant()}
      {...props}
    >
      {children}
    </EnhancedButton>
  );
};
