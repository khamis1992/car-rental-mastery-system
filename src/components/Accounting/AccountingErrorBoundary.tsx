
import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorDisplay } from './ErrorDisplay';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface AccountingErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{error: Error; resetError: () => void}>;
}

const DefaultErrorFallback: React.FC<{error: Error; resetError: () => void}> = ({ error, resetError }) => (
  <div className="p-6 text-center space-y-4">
    <ErrorDisplay
      error={error}
      title="حدث خطأ في النظام المحاسبي"
      showDetails={true}
    />
    <Button onClick={resetError} className="rtl-flex">
      <RefreshCw className="w-4 h-4" />
      إعادة المحاولة
    </Button>
  </div>
);

export const AccountingErrorBoundary: React.FC<AccountingErrorBoundaryProps> = ({ 
  children, 
  fallback: Fallback = DefaultErrorFallback 
}) => {
  return (
    <ErrorBoundary 
      fallback={<Fallback error={new Error('Unknown error')} resetError={() => window.location.reload()} />}
    >
      {children}
    </ErrorBoundary>
  );
};
