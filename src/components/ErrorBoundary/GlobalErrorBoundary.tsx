import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { handleError } from '@/utils/errorHandling';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
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
    const errorResult = handleError(error, 'globalBoundary');
    
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
    const errorResult = handleError(error, 'globalBoundary');
    
    this.setState({ errorInfo });

    if (errorResult.shouldLog) {
      console.group('🚨 Global Error Boundary');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();

      // إرسال الخطأ لخدمة المراقبة (في المستقبل)
      this.reportError(error, errorInfo);
    }

    // تنفيذ الإجراء المطلوب
    if (errorResult.action) {
      setTimeout(errorResult.action, 2000);
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // هنا يمكن إرسال الخطأ لخدمة مراقبة مثل Sentry
    // في الوقت الحالي نسجل فقط
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('📊 Error Report:', errorReport);
  }

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
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-700">
                حدث خطأ في التطبيق
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

              <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                <p className="mb-2">اختر إحدى الطرق التالية للمتابعة:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>المحاولة مرة أخرى - قد يحل المشكلة المؤقتة</li>
                  <li>إعادة تحميل الصفحة - ينظف الذاكرة ويبدأ من جديد</li>
                  <li>العودة للرئيسية - للخروج من هذا القسم</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleRetry}
                  className="flex items-center gap-2 flex-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  المحاولة مرة أخرى
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={this.handleReload}
                  className="flex items-center gap-2 flex-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  إعادة تحميل
                </Button>
                
                <Button 
                  variant="secondary"
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2 flex-1"
                >
                  <Home className="w-4 h-4" />
                  الرئيسية
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                    تفاصيل تقنية (للمطورين)
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
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

export default GlobalErrorBoundary;