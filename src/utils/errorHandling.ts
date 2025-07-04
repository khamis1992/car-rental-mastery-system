// محرك معالجة الأخطاء المحسن للتطبيق
export class ErrorManager {
  private static instance: ErrorManager;
  private errorQueue: Map<string, number> = new Map();
  private readonly MAX_RETRY_COUNT = 3;
  private readonly ERROR_THROTTLE_TIME = 5000; // 5 ثوان

  static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  // تصنيف الأخطاء
  private classifyError(error: any): ErrorType {
    if (error?.name === 'AbortError' || error?.message?.includes('abort')) {
      return 'abort';
    }
    if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
      return 'auth';
    }
    if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
      return 'network';
    }
    if (error?.message?.includes('Firestore') || error?.message?.includes('Firebase')) {
      return 'firestore';
    }
    if (error?.name === 'ValidationError') {
      return 'validation';
    }
    return 'unknown';
  }

  // معالجة الأخطاء الذكية
  handleError(error: any, context?: string): ErrorHandleResult {
    const errorType = this.classifyError(error);
    const errorKey = `${errorType}-${context || 'global'}`;
    
    // تجاهل أخطاء AbortError
    if (errorType === 'abort') {
      console.log('🔄 AbortError handled gracefully:', error.message);
      return { handled: true, retry: false, shouldLog: false };
    }

    // تقليل تكرار نفس الخطأ
    const retryCount = this.errorQueue.get(errorKey) || 0;
    if (retryCount >= this.MAX_RETRY_COUNT) {
      console.warn(`⚠️ Error ${errorKey} exceeded retry limit`);
      return { handled: true, retry: false, shouldLog: true };
    }

    // تحديث عداد المحاولات
    this.errorQueue.set(errorKey, retryCount + 1);
    
    // تنظيف العداد بعد فترة
    setTimeout(() => {
      this.errorQueue.delete(errorKey);
    }, this.ERROR_THROTTLE_TIME);

    return this.getErrorStrategy(errorType, retryCount);
  }

  private getErrorStrategy(type: ErrorType, retryCount: number): ErrorHandleResult {
    switch (type) {
      case 'auth':
        return {
          handled: true,
          retry: retryCount < 2,
          shouldLog: true,
          message: 'خطأ في المصادقة. سيتم إعادة توجيهك لتسجيل الدخول.',
          action: () => window.location.href = '/auth'
        };

      case 'network':
        return {
          handled: true,
          retry: retryCount < 3,
          shouldLog: retryCount === 0,
          message: 'مشكلة في الاتصال بالإنترنت. جاري المحاولة مرة أخرى...'
        };

      case 'firestore':
        return {
          handled: true,
          retry: false,
          shouldLog: false,
          message: 'خدمة Firestore غير متوفرة حالياً.'
        };

      case 'validation':
        return {
          handled: true,
          retry: false,
          shouldLog: true,
          message: 'البيانات المدخلة غير صحيحة.'
        };

      default:
        return {
          handled: false,
          retry: retryCount < 1,
          shouldLog: true,
          message: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
        };
    }
  }

  // تنظيف الذاكرة
  cleanup(): void {
    this.errorQueue.clear();
  }
}

type ErrorType = 'abort' | 'auth' | 'network' | 'firestore' | 'validation' | 'unknown';

interface ErrorHandleResult {
  handled: boolean;
  retry: boolean;
  shouldLog: boolean;
  message?: string;
  action?: () => void;
}

// دالة مساعدة للاستخدام السريع
export const handleError = (error: any, context?: string): ErrorHandleResult => {
  return ErrorManager.getInstance().handleError(error, context);
};

// إعداد معالج الأخطاء العام
export const setupGlobalErrorHandling = (): void => {
  // معالجة الأخطاء غير المعالجة
  window.addEventListener('unhandledrejection', (event) => {
    const result = handleError(event.reason, 'unhandledRejection');
    if (result.handled && !result.shouldLog) {
      event.preventDefault();
    }
  });

  // معالجة أخطاء JavaScript
  window.addEventListener('error', (event) => {
    const result = handleError(event.error, 'globalError');
    if (result.handled && !result.shouldLog) {
      event.preventDefault();
    }
  });

  // تنظيف عند إغلاق الصفحة
  window.addEventListener('beforeunload', () => {
    ErrorManager.getInstance().cleanup();
  });
};

// إنشاء AbortController محسن مع تنظيف تلقائي
export const createSafeAbortController = (timeoutMs = 30000): AbortController => {
  const controller = new AbortController();
  
  // إنشاء timeout تلقائي
  const timeoutId = setTimeout(() => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  }, timeoutMs);

  // تنظيف timeout عند الإلغاء
  controller.signal.addEventListener('abort', () => {
    clearTimeout(timeoutId);
  });

  return controller;
};