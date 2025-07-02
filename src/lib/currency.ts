import { useSettings } from '@/contexts/SettingsContext';

// Hook for using currency formatting with settings context
export const useCurrencyFormatter = () => {
  const { systemSettings } = useSettings();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: systemSettings.defaultCurrency || 'KWD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
  };

  return { formatCurrency };
};

// Direct utility function for use outside of React components
export const formatCurrencyKWD = (amount: number) => {
  return new Intl.NumberFormat('ar-KW', {
    style: 'currency',
    currency: 'KWD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount);
};