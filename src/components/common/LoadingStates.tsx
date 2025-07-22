
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';

// Skeleton Components for different content types
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex space-x-3 rtl:space-x-reverse">
        {Array.from({ length: columns }, (_, j) => (
          <Skeleton key={j} className="h-12 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <Card className="rtl-card">
    <CardHeader>
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </CardContent>
  </Card>
);

export const StatCardSkeleton = () => (
  <Card className="rtl-card">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </CardContent>
  </Card>
);

export const FormSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-20 w-full" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-16" />
    </div>
  </div>
);

// Enhanced loading spinner with context
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message = 'جارٍ التحميل...', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
};

// Smart loading component that adapts to loading states
interface SmartLoadingProps {
  loading: boolean;
  error?: string | null;
  retryFn?: () => void;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  children: React.ReactNode;
  loadingKey?: string;
}

export const SmartLoading: React.FC<SmartLoadingProps> = ({
  loading,
  error,
  retryFn,
  loadingComponent,
  errorComponent,
  children,
  loadingKey
}) => {
  const { getLoadingState, retryOperation } = useGlobalLoading();
  
  // Get enhanced loading state if key is provided
  const enhancedState = loadingKey ? getLoadingState(loadingKey) : null;
  const isLoading = loading || enhancedState?.isLoading || false;
  const currentError = error || enhancedState?.error || null;

  if (currentError && errorComponent) {
    return <>{errorComponent}</>;
  }

  if (currentError) {
    return (
      <Card className="rtl-card">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
          <h3 className="font-medium text-red-600 mb-2">حدث خطأ</h3>
          <p className="text-sm text-muted-foreground mb-4">{currentError}</p>
          {(retryFn || loadingKey) && (
            <Button 
              variant="outline" 
              onClick={() => {
                if (loadingKey && retryOperation) {
                  retryOperation(loadingKey, async () => {
                    if (retryFn) retryFn();
                  });
                } else if (retryFn) {
                  retryFn();
                }
              }}
              className="rtl-button"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              إعادة المحاولة
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return loadingComponent ? <>{loadingComponent}</> : <LoadingSpinner />;
  }

  return <>{children}</>;
};

// Progress indicator for multi-step operations
interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>الخطوة {currentStep + 1} من {steps.length}</span>
        <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      
      <div className="text-sm font-medium">
        {steps[currentStep]}
      </div>
    </div>
  );
};
