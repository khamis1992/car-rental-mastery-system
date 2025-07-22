
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: boolean;
  key?: string;
  successMessage?: string;
  errorMessage?: string;
}

export const useRetry = () => {
  const [isRetrying, setIsRetrying] = useState(false);
  const { setLoading } = useGlobalLoading();

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> => {
    const {
      maxRetries = 3,
      delay = 1000,
      backoff = true,
      key = 'retry-operation',
      successMessage,
      errorMessage
    } = options;

    let lastError: Error;
    setIsRetrying(true);
    
    if (key) {
      setLoading(key, true);
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        setIsRetrying(false);
        if (key) {
          setLoading(key, false);
        }
        
        if (successMessage && attempt > 1) {
          toast.success(`${successMessage} (المحاولة ${attempt})`);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with optional exponential backoff
        const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        
        console.warn(`المحاولة ${attempt} فشلت، إعادة المحاولة خلال ${currentDelay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, currentDelay));
      }
    }

    // All retries failed
    setIsRetrying(false);
    if (key) {
      setLoading(key, false, lastError!.message);
    }
    
    const finalErrorMessage = errorMessage || `فشلت العملية بعد ${maxRetries} محاولات`;
    toast.error(finalErrorMessage);
    
    throw lastError!;
  }, [setLoading]);

  return {
    executeWithRetry,
    isRetrying
  };
};
