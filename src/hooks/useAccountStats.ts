import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AccountStats {
  assets: number;
  liabilities: number;
  equity: number;
  revenues: number;
  expenses: number;
  total: number;
}

export const useAccountStats = () => {
  const [stats, setStats] = useState<AccountStats>({
    assets: 0,
    liabilities: 0,
    equity: 0,
    revenues: 0,
    expenses: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // جلب إحصائيات الحسابات النشطة حسب النوع
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('account_type')
        .eq('is_active', true);

      if (error) throw error;

      // حساب الإحصائيات
      const statsCount = {
        assets: 0,
        liabilities: 0,
        equity: 0,
        revenues: 0,
        expenses: 0,
        total: data?.length || 0
      };

      data?.forEach((account) => {
        switch (account.account_type) {
          case 'asset':
            statsCount.assets++;
            break;
          case 'liability':
            statsCount.liabilities++;
            break;
          case 'equity':
            statsCount.equity++;
            break;
          case 'revenue':
            statsCount.revenues++;
            break;
          case 'expense':
            statsCount.expenses++;
            break;
        }
      });

      setStats(statsCount);
    } catch (err: any) {
      console.error('خطأ في جلب إحصائيات الحسابات:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};