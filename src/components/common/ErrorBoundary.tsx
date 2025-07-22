
import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: (string | number)[];
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId: string;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error Boundary Caught Error:', error);
    console.error('📍 Error Info:', errorInfo);
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external error service (if configured)
    this.logErrorToService(error, errorInfo);

    // Show error toast
    toast.error('حدث خطأ في التطبيق', {
      description: 'سيتم إعادة المحاولة تلقائياً...',
      duration: 5000
    });
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys && resetKeys.length > 0) {
        this.resetErrorBoundary();
      }
    }

    if (hasError && resetOnPropsChange) {
      this.resetErrorBoundary();
    }
  }

  logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // Here you could integrate with services like Sentry, LogRocket, etc.
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.warn('📝 Error logged:', errorData);
  };

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorId: '',
      retryCount: 0
    });
  };

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      toast.error('تم تجاوز الحد الأقصى للمحاولات');
      return;
    }

    this.setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1
    }));

    // Auto retry with delay
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary();
      toast.info(`المحاولة ${retryCount + 1} من ${this.maxRetries}`);
    }, 1000 * (retryCount + 1)); // Progressive delay
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="rtl-card mx-auto max-w-md mt-8">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="rtl-title text-red-600">
              حدث خطأ في التطبيق
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
            </p>
            
            {this.state.error && (
              <details className="text-xs text-left bg-gray-50 p-2 rounded">
                <summary className="cursor-pointer font-medium">تفاصيل الخطأ</summary>
                <pre className="mt-2 text-red-600">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="flex gap-2 justify-center">
              <Button 
                onClick={this.handleRetry}
                disabled={this.state.retryCount >= this.maxRetries}
                className="rtl-button"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                إعادة المحاولة ({this.state.retryCount}/{this.maxRetries})
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="rtl-button"
              >
                إعادة تحميل الصفحة
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
