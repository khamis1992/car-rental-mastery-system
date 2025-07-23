import { useCallback } from 'react';
import { useErrorTracking } from './useErrorTracking';
import { useRetry } from './useRetry';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UnifiedErrorOptions {
  context?: string;
  showToast?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  loadingKey?: string;
  successMessage?: string;
  errorMessage?: string;
}

interface ErrorHandlingResult<T> {
  execute: (operation: () => Promise<T>) => Promise<T | null>;
  executeWithRetry: (operation: () => Promise<T>) => Promise<T | null>;
  handleError: (error: Error, options?: UnifiedErrorOptions) => void;
  isRetrying: boolean;
  isLoading: boolean;
}

export const useUnifiedErrorHandling = <T = any>(
  defaultOptions: UnifiedErrorOptions = {}
): ErrorHandlingResult<T> => {
  const { logError } = useErrorTracking();
  const { executeWithRetry: retryExecute, isRetrying } = useRetry();
  const { setLoading, getLoadingState } = useGlobalLoading();

  const {
    context = 'عملية النظام',
    showToast = true,
    enableRetry = false,
    maxRetries = 3,
    loadingKey,
    successMessage,
    errorMessage
  } = defaultOptions;

  // دالة للتحقق من حالة المصادقة مع تشخيص مفصل
  const checkAuthenticationStatus = useCallback(async () => {
    try {
      const { data: userInfo } = await supabase.rpc('get_current_user_info');
      console.log('تشخيص المصادقة:', userInfo);
      
      const info = userInfo as any;
      
      if (!info?.is_authenticated) {
        throw new Error('المستخدم غير مصادق عليه. يرجى تسجيل الدخول أولاً.');
      }
      
      if (!info?.tenant_id) {
        throw new Error('لا يمكن تحديد المؤسسة. يرجى التواصل مع المدير.');
      }
      
      return info;
    } catch (error) {
      console.error('خطأ في فحص المصادقة:', error);
      throw error;
    }
  }, []);

  const handleError = useCallback((error: Error, options: UnifiedErrorOptions = {}) => {
    const opts = { ...defaultOptions, ...options };
    
    // Log error using error tracking
    logError(error, opts.context);
    
    // Show toast if enabled
    if (opts.showToast) {
      const message = opts.errorMessage || getErrorMessage(error);
      toast.error(message);
    }
    
    // Clear loading state if specified
    if (opts.loadingKey) {
      setLoading(opts.loadingKey, false, error.message);
    }
  }, [logError, defaultOptions, setLoading]);

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    try {
      if (loadingKey) {
        setLoading(loadingKey, true);
      }
      
      // فحص المصادقة قبل تنفيذ العملية
      await checkAuthenticationStatus();
      
      const result = await operation();
      
      if (loadingKey) {
        setLoading(loadingKey, false);
      }
      
      if (successMessage) {
        toast.success(successMessage);
      }
      
      return result;
    } catch (error) {
      handleError(error as Error);
      return null;
    }
  }, [handleError, loadingKey, setLoading, successMessage, checkAuthenticationStatus]);

  const executeWithRetry = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    if (!enableRetry) {
      return execute(operation);
    }

    try {
      const result = await retryExecute(operation, {
        maxRetries,
        key: loadingKey,
        successMessage,
        errorMessage
      });
      return result;
    } catch (error) {
      handleError(error as Error);
      return null;
    }
  }, [enableRetry, execute, retryExecute, maxRetries, loadingKey, successMessage, errorMessage, handleError]);

  const getErrorMessage = (error: Error): string => {
    const errorMessages: Record<string, string> = {
      'Failed to fetch': 'خطأ في الاتصال بالخادم',
      'NetworkError': 'خطأ في الشبكة',
      'TimeoutError': 'انتهت مهلة الاتصال',
      'ValidationError': 'خطأ في التحقق من البيانات',
      'PermissionError': 'ليس لديك صلاحية لهذا الإجراء',
      'NotFoundError': 'البيانات المطلوبة غير موجودة',
      'AbortError': 'تم إلغاء العملية',
      'المستخدم غير مصادق عليه': 'يرجى تسجيل الدخول أولاً',
      'لا يمكن تحديد المؤسسة': 'خطأ في إعداد الحساب. يرجى التواصل مع المدير',
      'new row violates row-level security': 'خطأ في الصلاحيات. يرجى التحقق من تسجيل الدخول',
      'JWT expired': 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى'
    };

    for (const [key, message] of Object.entries(errorMessages)) {
      if (error.message.includes(key) || error.name.includes(key)) {
        return message;
      }
    }

    return errorMessage || 'حدث خطأ غير متوقع';
  };

  const currentLoadingState = loadingKey ? getLoadingState(loadingKey) : null;
  const isLoading = currentLoadingState?.isLoading || false;

  return {
    execute,
    executeWithRetry,
    handleError,
    isRetrying,
    isLoading
  };
};