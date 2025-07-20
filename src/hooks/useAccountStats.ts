
import { useState, useEffect, useCallback } from 'react';
import { accountingService } from '@/services/accountingService';
import { handleError } from '@/utils/errorHandling';

interface AccountStats {
  assets: number;
  liabilities: number;
  equity: number;
  revenues: number;
  expenses: number;
  total: number;
}

interface UseAccountStatsReturn {
  stats: AccountStats | null;
  loading: boolean;
  error: Error | string | null;
  refetch: () => Promise<void>;
}

export const useAccountStats = (): UseAccountStatsReturn => {
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading account statistics...');
      
      const accounts = await accountingService.getChartOfAccounts();
      console.log('📊 Raw accounts for stats:', accounts.length);
      
      if (!Array.isArray(accounts)) {
        throw new Error('Invalid accounts data format');
      }
      
      const accountStats = accounts.reduce((acc, account) => {
        if (!account || !account.account_type || !account.is_active) {
          return acc;
        }
        
        switch (account.account_type) {
          case 'asset':
            acc.assets++;
            break;
          case 'liability':
            acc.liabilities++;
            break;
          case 'equity':
            acc.equity++;
            break;
          case 'revenue':
            acc.revenues++;
            break;
          case 'expense':
            acc.expenses++;
            break;
          default:
            console.warn('Unknown account type:', account.account_type);
        }
        
        acc.total++;
        return acc;
      }, {
        assets: 0,
        liabilities: 0,
        equity: 0,
        revenues: 0,
        expenses: 0,
        total: 0
      });
      
      setStats(accountStats);
      console.log('✅ Account statistics loaded:', accountStats);
      
    } catch (error) {
      console.error('❌ Error loading account statistics:', error);
      const errorInstance = error instanceof Error ? error : new Error('فشل في تحميل إحصائيات الحسابات');
      setError(errorInstance);
      
      const result = handleError(errorInstance, 'fetchAccountStats');
      if (result.shouldLog) {
        console.error('Account stats error details:', errorInstance);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch
  };
};
