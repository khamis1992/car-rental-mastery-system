
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface EnhancedButtonProps extends React.ComponentProps<typeof Button> {
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
  ...props
}) => {
  return (
    <Button 
      disabled={disabled || loading} 
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin ml-2" />
          {loadingText || children}
        </>
      ) : (
        <>
          {icon && <span className="ml-2">{icon}</span>}
          {children}
        </>
      )}
    </Button>
  );
};

interface ActionButtonProps extends EnhancedButtonProps {
  action: 'create' | 'edit' | 'delete' | 'view';
  itemName?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  action,
  itemName = '',
  children,
  ...props
}) => {
  const getVariant = () => {
    switch (action) {
      case 'delete':
        return 'destructive' as const;
      case 'create':
        return 'default' as const;
      default:
        return 'outline' as const;
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
