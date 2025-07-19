
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorInfo {
  error: Error;
  context?: string;
  userId?: string;
  timestamp: Date;
}

export const useErrorTracking = () => {
  const { toast } = useToast();

  const logError = (error: Error, context?: string) => {
    const errorInfo: ErrorInfo = {
      error,
      context,
      timestamp: new Date()
    };

    // سجل الخطأ في وحدة التحكم
    console.group('🚨 خطأ في النظام');
    console.error('الخطأ:', error.message);
    console.error('السياق:', context);
    console.error('الوقت:', errorInfo.timestamp.toISOString());
    console.error('التفاصيل:', error);
    if (error.stack) {
      console.error('المسار:', error.stack);
    }
    console.groupEnd();

    // إرسال تنبيه للمستخدم حسب نوع الخطأ
    if (shouldNotifyUser(error)) {
      toast({
        title: "تنبيه",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }

    // يمكن إضافة إرسال الخطأ لخدمة تتبع الأخطاء هنا
    // مثل Sentry أو LogRocket
  };

  const shouldNotifyUser = (error: Error): boolean => {
    // لا نريد إظهار بعض الأخطاء للمستخدم
    const silentErrors = [
      'Network request failed',
      'AbortError',
      'fetch aborted'
    ];

    return !silentErrors.some(silent => 
      error.message.toLowerCase().includes(silent.toLowerCase())
    );
  };

  const getErrorMessage = (error: Error): string => {
    const errorMessages: Record<string, string> = {
      'Failed to fetch': 'خطأ في الاتصال بالخادم',
      'NetworkError': 'خطأ في الشبكة',
      'TimeoutError': 'انتهت مهلة الاتصال',
      'ValidationError': 'خطأ في التحقق من البيانات',
      'PermissionError': 'ليس لديك صلاحية لهذا الإجراء',
      'NotFoundError': 'البيانات المطلوبة غير موجودة'
    };

    for (const [key, message] of Object.entries(errorMessages)) {
      if (error.message.includes(key) || error.name.includes(key)) {
        return message;
      }
    }

    return 'حدث خطأ غير متوقع';
  };

  const handleGlobalError = (event: ErrorEvent) => {
    logError(new Error(event.message), 'Global Error Handler');
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error ? 
      event.reason : 
      new Error(String(event.reason));
    
    logError(error, 'Unhandled Promise Rejection');
  };

  useEffect(() => {
    // تسجيل معالجات الأخطاء العامة
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return {
    logError
  };
};
