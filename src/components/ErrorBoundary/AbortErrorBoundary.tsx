import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isAbortError: boolean;
}

export class AbortErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isAbortError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isAbortError = error.name === 'AbortError' || 
                        error.message?.includes('abort') ||
                        error.message?.includes('signal is aborted');
    
    return {
      hasError: true,
      error,
      isAbortError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    
    // Don't report AbortErrors as they're expected during navigation
    if (!this.state.isAbortError) {
      this.props.onError?.(error, errorInfo);
    } else {
      console.log('🔄 AbortError caught and handled gracefully');
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, isAbortError: false });
  };

  render() {
    if (this.state.hasError) {
      // For AbortErrors, try to recover automatically
      if (this.state.isAbortError) {
        // Auto-recover from AbortErrors after a short delay
        setTimeout(() => {
          this.handleReset();
        }, 100);
        
        return (
          <div className="flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-sm text-muted-foreground">
                  جاري إعادة التحميل...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      }

      // For other errors, show the fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                حدث خطأ غير متوقع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  {this.state.error?.message || 'حدث خطأ في التطبيق'}
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  إعادة تحميل الصفحة
                </Button>
                <Button onClick={this.handleReset}>
                  المحاولة مرة أخرى
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

  return this.props.children;
  }
}

export default AbortErrorBoundary;

// Hook version for functional components
export const useAbortErrorHandler = () => {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      if (error?.name === 'AbortError' || 
          error?.message?.includes('abort') ||
          error?.message?.includes('signal is aborted')) {
        console.log('🔄 Unhandled AbortError caught and ignored:', error.message);
        event.preventDefault(); // Prevent logging to console
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
};