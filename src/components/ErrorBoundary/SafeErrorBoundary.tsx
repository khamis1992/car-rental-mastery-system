
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug, Copy } from 'lucide-react';
import { handleError } from '@/utils/errorHandling';
import { useToast } from '@/hooks/use-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class SafeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // معالجة الخطأ باستخدام نظام معالجة الأخطاء المحسن
    const errorResult = handleError(error, 'safeBoundary');
    
    if (errorResult.handled && !errorResult.shouldLog) {
      // لا نعرض واجهة الخطأ للأخطاء المعالجة
      return {};
    }

    return {
      hasError: true,
      error,
      errorId: Date.now().toString()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // معالجة متقدمة للأخطاء
    const errorResult = handleError(error, 'safeBoundary');
    
    this.setState({ errorInfo });

    if (errorResult.shouldLog) {
      console.group('🚨 Safe Error Boundary');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();

      // إرسال الخطأ لخدمة المراقبة (في المستقبل)
      this.reportError(error, errorInfo);
    }

    // استدعاء callback إذا كان موجوداً
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // تنفيذ الإجراء المطلوب
    if (errorResult.action) {
      setTimeout(errorResult.action, 2000);
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // هنا يمكن إرسال الخطأ لخدمة مراقبة مثل Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('📊 Safe Error Report:', errorReport);
  }

  private copyErrorToClipboard = () => {
    if (this.state.error && this.state.errorInfo) {
      const errorText = `
خطأ: ${this.state.error.message}
معرف الخطأ: ${this.state.errorId}
الوقت: ${new Date().toISOString()}
المسار: ${this.state.error.stack}
مسار المكونات: ${this.state.errorInfo.componentStack}
      `.trim();

      navigator.clipboard.writeText(errorText).then(() => {
        // يمكن إضافة toast هنا إذا كنا خارج hook context
        console.log('تم نسخ تفاصيل الخطأ');
      }).catch(() => {
        console.log('فشل في نسخ تفاصيل الخطأ');
      });
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // استخدام fallback مخصص إذا كان متوفراً
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-lg border-destructive/20">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl text-destructive rtl-title">
                حدث خطأ في العرض
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">تفاصيل الخطأ:</p>
                    <p className="text-sm">{this.state.error.message}</p>
                    {this.state.errorId && (
                      <p className="text-xs text-muted-foreground">
                        معرف الخطأ: {this.state.errorId}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <p className="mb-2">خيارات الحل:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>المحاولة مرة أخرى - قد يحل المشكلة المؤقتة</li>
                  <li>إعادة تحميل الصفحة - ينظف الذاكرة ويبدأ من جديد</li>
                  <li>العودة للوحة الرئيسية</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button 
                    onClick={this.handleRetry}
                    className="flex items-center gap-2 flex-1 rtl-flex"
                    variant="default"
                  >
                    <RefreshCw className="w-4 h-4" />
                    المحاولة مرة أخرى
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={this.handleReload}
                    className="flex items-center gap-2 flex-1 rtl-flex"
                  >
                    <RefreshCw className="w-4 h-4" />
                    إعادة تحميل
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="secondary"
                    onClick={this.handleGoHome}
                    className="flex items-center gap-2 flex-1 rtl-flex"
                  >
                    <Home className="w-4 h-4" />
                    العودة للرئيسية
                  </Button>

                  <Button 
                    variant="outline"
                    onClick={this.copyErrorToClipboard}
                    className="flex items-center gap-2 rtl-flex"
                  >
                    <Copy className="w-4 h-4" />
                    نسخ التفاصيل
                  </Button>
                </div>
              </div>

              {this.props.showDetails && process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    تفاصيل تقنية (للمطورين)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="font-medium">Stack Trace:</p>
                      <pre className="p-2 bg-muted rounded text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    <div>
                      <p className="font-medium">Component Stack:</p>
                      <pre className="p-2 bg-muted rounded text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook للاستخدام في المكونات الوظيفية
export const useSafeErrorHandler = () => {
  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error(`❌ Safe Error Handler [${context || 'unknown'}]:`, error);
    
    // يمكن إضافة المزيد من المنطق هنا
    return {
      error,
      context,
      timestamp: new Date().toISOString(),
    };
  }, []);

  return { handleError };
};
