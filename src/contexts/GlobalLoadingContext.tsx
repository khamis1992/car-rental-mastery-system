
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface LoadingState {
  [key: string]: {
    isLoading: boolean;
    error?: string | null;
    lastUpdated?: Date;
    retryCount?: number;
  };
}

interface GlobalLoadingContextType {
  loadingStates: LoadingState;
  setLoading: (key: string, loading: boolean, error?: string | null) => void;
  isAnyLoading: boolean;
  retryOperation: (key: string, operation: () => Promise<void>) => Promise<void>;
  clearError: (key: string) => void;
  getLoadingState: (key: string) => LoadingState[string] | null;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export const useGlobalLoading = () => {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider');
  }
  return context;
};

export const GlobalLoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const setLoading = useCallback((key: string, loading: boolean, error?: string | null) => {
    // Clear existing timeout
    const existingTimeout = timeoutsRef.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutsRef.current.delete(key);
    }

    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading: loading,
        error: error || null,
        lastUpdated: new Date(),
        retryCount: error ? (prev[key]?.retryCount || 0) + 1 : 0
      }
    }));

    // Set timeout for loading states (auto-clear after 30 seconds)
    if (loading) {
      const timeout = setTimeout(() => {
        setLoadingStates(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            isLoading: false,
            error: 'انتهت مهلة التحميل'
          }
        }));
        toast.error(`انتهت مهلة التحميل: ${key}`);
      }, 30000);
      
      timeoutsRef.current.set(key, timeout);
    }

    // Show error toast
    if (error && !loading) {
      toast.error(`خطأ في ${key}: ${error}`);
    }
  }, []);

  const retryOperation = useCallback(async (key: string, operation: () => Promise<void>) => {
    const currentState = loadingStates[key];
    const maxRetries = 3;
    
    if (currentState?.retryCount && currentState.retryCount >= maxRetries) {
      toast.error(`فشل في العملية بعد ${maxRetries} محاولات`);
      return;
    }

    setLoading(key, true);
    
    try {
      await operation();
      setLoading(key, false);
      toast.success(`تمت العملية بنجاح: ${key}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'حدث خطأ غير متوقع';
      setLoading(key, false, errorMessage);
    }
  }, [loadingStates, setLoading]);

  const clearError = useCallback((key: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        error: null
      }
    }));
  }, []);

  const getLoadingState = useCallback((key: string) => {
    return loadingStates[key] || null;
  }, [loadingStates]);

  const isAnyLoading = Object.values(loadingStates).some(state => state.isLoading);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  return (
    <GlobalLoadingContext.Provider value={{
      loadingStates,
      setLoading,
      isAnyLoading,
      retryOperation,
      clearError,
      getLoadingState
    }}>
      {children}
    </GlobalLoadingContext.Provider>
  );
};
