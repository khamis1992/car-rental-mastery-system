import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // استدعاء callback للتسجيل
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // تسجيل الخطأ للمراقبة
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevResetKeys[index]
      );

      if (hasResetKeyChanged) {
        this.resetError();
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleRetry = () => {
    this.resetError();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.resetError}
          onReload={this.handleRetry}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

// مكون عرض الخطأ الافتراضي
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onRetry?: () => void;
  onReload?: () => void;
  showDetails?: boolean;
  title?: string;
  description?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  onRetry,
  onReload,
  showDetails = false,
  title = 'حدث خطأ غير متوقع',
  description = 'عذراً، حدث خطأ أثناء تحميل هذه الصفحة. يرجى المحاولة مرة أخرى.',
}) => {
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);

  const errorDetails = React.useMemo(() => {
    if (!error) return null;

    return {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
    };
  }, [error, errorInfo]);

  const handleReportError = () => {
    const subject = encodeURIComponent('تقرير خطأ - النظام');
    const body = encodeURIComponent(`
خطأ في النظام:
- الرسالة: ${error?.message || 'غير محدد'}
- الوقت: ${new Date().toLocaleString('ar-SA')}
- المتصفح: ${navigator.userAgent}
- الصفحة: ${window.location.href}

تفاصيل إضافية:
${error?.stack || 'غير متوفرة'}
    `);
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">{description}</p>

          {/* أزرار الإجراءات */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && (
              <Button onClick={onRetry} variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                إعادة المحاولة
              </Button>
            )}
            {onReload && (
              <Button onClick={onReload} variant="outline">
                <Home className="w-4 h-4 mr-2" />
                إعادة تحميل الصفحة
              </Button>
            )}
          </div>

          {/* تفاصيل الخطأ */}
          {(showDetails || showErrorDetails) && errorDetails && (
            <Alert variant="destructive" className="mt-4">
              <Bug className="h-4 w-4" />
              <AlertTitle>تفاصيل الخطأ</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <div className="text-xs bg-destructive/5 p-3 rounded font-mono text-right">
                  <div><strong>الرسالة:</strong> {errorDetails.message}</div>
                  <div><strong>الوقت:</strong> {new Date(errorDetails.timestamp).toLocaleString('ar-SA')}</div>
                  {errorDetails.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">Stack Trace</summary>
                      <pre className="mt-1 text-xs whitespace-pre-wrap">
                        {errorDetails.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* أزرار إضافية */}
          <div className="flex justify-center gap-2 text-sm">
            {showDetails && !showErrorDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowErrorDetails(true)}
              >
                <Bug className="w-4 h-4 mr-2" />
                عرض التفاصيل التقنية
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleReportError}>
              <Mail className="w-4 h-4 mr-2" />
              إبلاغ عن المشكلة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// مكون لعرض حالات التحميل مع خطأ
interface LoadingStateProps {
  loading?: boolean;
  error?: string | Error | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
  onRetry?: () => void;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  loading = false,
  error,
  isEmpty = false,
  emptyMessage = 'لا توجد بيانات للعرض',
  children,
  onRetry,
  className,
}) => {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return (
      <div className={cn('py-8', className)}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>خطأ في التحميل</AlertTitle>
          <AlertDescription className="mt-2">
            {errorMessage}
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="mt-3"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                إعادة المحاولة
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
};

// Hook لمعالجة الأخطاء
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const captureError = React.useCallback((error: Error | string) => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    setError(errorObj);
    console.error('Error captured:', errorObj);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const withErrorHandling = React.useCallback(
    <T extends (...args: any[]) => any>(fn: T) => {
      return ((...args: Parameters<T>) => {
        try {
          const result = fn(...args);
          if (result instanceof Promise) {
            return result.catch(captureError);
          }
          return result;
        } catch (error) {
          captureError(error as Error);
        }
      }) as T;
    },
    [captureError]
  );

  return {
    error,
    captureError,
    clearError,
    withErrorHandling,
  };
};

// مكون عرض الإشعارات المحسن
interface ErrorNotificationProps {
  errors: Array<{
    id: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    timestamp: Date;
  }>;
  onDismiss: (id: string) => void;
  maxErrors?: number;
}

export const ErrorNotifications: React.FC<ErrorNotificationProps> = ({
  errors,
  onDismiss,
  maxErrors = 5,
}) => {
  const visibleErrors = errors.slice(0, maxErrors);

  return (
    <div className="fixed top-4 left-4 z-50 space-y-2 max-w-sm">
      {visibleErrors.map((error) => (
        <Alert
          key={error.id}
          variant={error.type === 'error' ? 'destructive' : 'default'}
          className="shadow-lg"
        >
          <AlertTriangle className="h-4 w-4" />
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <AlertDescription>{error.message}</AlertDescription>
              <div className="text-xs text-muted-foreground mt-1">
                {error.timestamp.toLocaleTimeString('ar-SA')}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(error.id)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </Alert>
      ))}
      
      {errors.length > maxErrors && (
        <Badge variant="secondary" className="block text-center">
          +{errors.length - maxErrors} خطأ إضافي
        </Badge>
      )}
    </div>
  );
}; 