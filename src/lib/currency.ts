import { useSettings } from '@/contexts/SettingsContext';

// Hook for using currency formatting with settings context
export const useCurrencyFormatter = () => {
  const { systemSettings } = useSettings();
  
  const formatCurrency = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  return { formatCurrency };
};

// Direct utility function for use outside of React components
export const formatCurrencyKWD = (amount: number) => {
  return `د.ك ${amount.toFixed(3)}`;
};