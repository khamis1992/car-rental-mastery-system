
import { useState, useCallback } from 'react';

export interface UseFormStateOptions {
  onFormChange?: (hasChanges: boolean) => void;
}

export const useFormState = (options?: UseFormStateOptions) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialFormData, setInitialFormData] = useState<any>(null);

  const markAsChanged = useCallback(() => {
    if (!hasUnsavedChanges) {
      setHasUnsavedChanges(true);
      options?.onFormChange?.(true);
    }
  }, [hasUnsavedChanges, options]);

  const markAsSaved = useCallback(() => {
    if (hasUnsavedChanges) {
      setHasUnsavedChanges(false);
      options?.onFormChange?.(false);
    }
  }, [hasUnsavedChanges, options]);

  const resetFormState = useCallback(() => {
    setHasUnsavedChanges(false);
    setInitialFormData(null);
    options?.onFormChange?.(false);
  }, [options]);

  const setInitialData = useCallback((data: any) => {
    setInitialFormData(data);
    setHasUnsavedChanges(false);
    options?.onFormChange?.(false);
  }, [options]);

  const compareWithInitial = useCallback((currentData: any) => {
    if (!initialFormData) return false;
    
    const hasChanges = JSON.stringify(currentData) !== JSON.stringify(initialFormData);
    if (hasChanges !== hasUnsavedChanges) {
      setHasUnsavedChanges(hasChanges);
      options?.onFormChange?.(hasChanges);
    }
    return hasChanges;
  }, [initialFormData, hasUnsavedChanges, options]);

  return {
    hasUnsavedChanges,
    markAsChanged,
    markAsSaved,
    resetFormState,
    setInitialData,
    compareWithInitial
  };
};
