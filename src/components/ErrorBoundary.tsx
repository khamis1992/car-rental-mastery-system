import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              حدث خطأ غير متوقع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              عذراً، حدث خطأ أثناء تحميل هذا القسم. يرجى المحاولة مرة أخرى.
            </p>
            
            {this.state.error && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">تفاصيل الخطأ</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={this.handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                المحاولة مرة أخرى
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                تحديث الصفحة
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook version for easier use in functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, retryFn?: () => void) => {
    console.error('❌ Handled error:', error);
    
    // You could integrate with a global error reporting service here
    // For now, we just log it
    
    return {
      error,
      retry: retryFn || (() => window.location.reload()),
    };
  }, []);

  return { handleError };
};