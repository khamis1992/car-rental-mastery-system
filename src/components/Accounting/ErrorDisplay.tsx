
import React from 'react';
import { AlertCircle, RefreshCw, Bug } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorDisplayProps {
  error: Error | null;
  title?: string;
  onRetry?: () => void;
  showDetails?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title = "حدث خطأ",
  onRetry,
  showDetails = false
}) => {
  if (!error) return null;

  const getErrorMessage = (error: Error) => {
    // ترجمة الأخطاء الشائعة
    const commonErrors: Record<string, string> = {
      'Network Error': 'خطأ في الاتصال بالشبكة',
      'Unauthorized': 'غير مخول للوصول',
      'Forbidden': 'ممنوع الوصول',
      'Not Found': 'البيانات غير موجودة',
      'Internal Server Error': 'خطأ داخلي في الخادم',
      'Bad Gateway': 'خطأ في الاتصال بالخادم',
      'Service Unavailable': 'الخدمة غير متاحة مؤقتاً',
      'Timeout': 'انتهت مهلة الاتصال'
    };

    return commonErrors[error.message] || error.message || 'حدث خطأ غير متوقع';
  };

  const getErrorSeverity = (error: Error) => {
    const criticalKeywords = ['server', 'database', 'connection', 'network'];
    const warningKeywords = ['validation', 'format', 'missing'];
    
    const message = error.message.toLowerCase();
    
    if (criticalKeywords.some(keyword => message.includes(keyword))) {
      return 'critical';
    } else if (warningKeywords.some(keyword => message.includes(keyword))) {
      return 'warning';
    }
    
    return 'error';
  };

  const severity = getErrorSeverity(error);

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive rtl-title">
          <AlertCircle className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>خطأ في النظام</AlertTitle>
          <AlertDescription className="mt-2">
            {getErrorMessage(error)}
          </AlertDescription>
        </Alert>

        {showDetails && error.stack && (
          <details className="text-sm">
            <summary className="cursor-pointer flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Bug className="w-4 h-4" />
              تفاصيل تقنية
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-40">
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>نوع الخطأ:</span>
          <span className={`px-2 py-1 rounded text-xs ${
            severity === 'critical' ? 'bg-red-100 text-red-700' :
            severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {severity === 'critical' ? 'حرج' : 
             severity === 'warning' ? 'تحذير' : 'خطأ'}
          </span>
        </div>

        {onRetry && (
          <div className="flex justify-start">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="rtl-flex"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>إذا استمر هذا الخطأ، يرجى:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>التحقق من اتصال الإنترنت</li>
            <li>تحديث الصفحة</li>
            <li>التواصل مع الدعم الفني إذا لزم الأمر</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
