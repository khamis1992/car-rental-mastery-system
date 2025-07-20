
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class SafeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    console.error('SafeErrorBoundary: Caught error:', error);
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SafeErrorBoundary: Error details:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      errorBoundary: this
    });

    this.setState({
      error,
      errorInfo
    });

    // يمكن إضافة تقرير الخطأ لخدمة خارجية هنا
    // reportErrorToService(error, errorInfo);
  }

  private handleRetry = () => {
    console.log('SafeErrorBoundary: Retrying...');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleReload = () => {
    console.log('SafeErrorBoundary: Reloading page...');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const {
        fallbackTitle = 'حدث خطأ غير متوقع',
        fallbackMessage = 'نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.',
        showDetails = false
      } = this.props;

      return (
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="rtl-title flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              {fallbackTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{fallbackMessage}</p>
            
            {showDetails && this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  عرض تفاصيل الخطأ
                </summary>
                <div className="mt-2 p-3 bg-muted rounded-lg text-sm font-mono overflow-auto max-h-32">
                  <div className="text-red-600 font-semibold">
                    {this.state.error.name}: {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={this.handleRetry} variant="default" className="rtl-flex">
                <RefreshCw className="w-4 h-4" />
                المحاولة مرة أخرى
              </Button>
              <Button onClick={this.handleReload} variant="outline" className="rtl-flex">
                <RefreshCw className="w-4 h-4" />
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
