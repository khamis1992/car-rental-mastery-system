
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ErrorDisplayProps {
  error: Error | string;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title = 'حدث خطأ',
  onRetry,
  onDismiss,
  showDetails = false,
  className = ''
}) => {
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'object' && error.stack ? error.stack : null;

  return (
    <Alert variant="destructive" className={`${className} border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive`}>
      <AlertTriangle className="h-4 w-4" />
      <div className="flex-1">
        <AlertTitle className="rtl-title flex items-center justify-between">
          <span>{title}</span>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-auto p-1 text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </AlertTitle>
        <AlertDescription className="mt-2 text-right">
          <div className="space-y-2">
            <p className="text-sm">{errorMessage}</p>
            
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="rtl-flex border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </Button>
            )}
            
            {showDetails && errorStack && (
              <Collapsible open={showErrorDetails} onOpenChange={setShowErrorDetails}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                  >
                    {showErrorDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <pre className="text-xs bg-destructive/5 p-2 rounded border border-destructive/20 overflow-auto max-h-32 text-left">
                    {errorStack}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
};
