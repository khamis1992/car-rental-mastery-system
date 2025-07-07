import { useState, useEffect } from 'react';
import { AccountingIntegrationService } from '@/services/BusinessServices/AccountingIntegrationService';
import { accountingService } from '@/services/accountingService';
import { supabase } from '@/integrations/supabase/client';

interface FinancialStats {
  monthlyRevenue: number;
  pendingPayments: number;
  totalExpenses: number;
  netProfit: number;
}

interface FinancialMetrics {
  monthly_revenue: number;
  actual_revenue: number;
  total_expenses: number;
  pending_payments: number;
  cash_balance: number;
  net_profit: number;
  calculation_period: {
    start_date: string;
    end_date: string;
  };
  calculated_at: string;
}

interface RecentTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: string;
  status: string;
}

export const useAccountingData = () => {
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    monthlyRevenue: 0,
    pendingPayments: 0,
    totalExpenses: 0,
    netProfit: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const accountingIntegrationService = new AccountingIntegrationService();

  const fetchFinancialStats = async (): Promise<FinancialStats> => {
    try {
      // Get current month start and end dates
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Use the new calculate_financial_metrics function
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('calculate_financial_metrics', {
          start_date: monthStart.toISOString().split('T')[0],
          end_date: monthEnd.toISOString().split('T')[0]
        });

      if (metricsError) throw metricsError;

      // Handle the metrics data properly
      let metrics: FinancialMetrics;
      try {
        metrics = (metricsData as unknown as FinancialMetrics) || {
          monthly_revenue: 0,
          actual_revenue: 0,
          total_expenses: 0,
          pending_payments: 0,
          cash_balance: 0,
          net_profit: 0,
          calculation_period: { start_date: '', end_date: '' },
          calculated_at: ''
        };
      } catch {
        metrics = {
          monthly_revenue: 0,
          actual_revenue: 0,
          total_expenses: 0,
          pending_payments: 0,
          cash_balance: 0,
          net_profit: 0,
          calculation_period: { start_date: '', end_date: '' },
          calculated_at: ''
        };
      }
      
      // Update account balances first
      await supabase.rpc('update_account_balances');

      // Get updated revenue accounts (4xxx) - correct calculation for revenue accounts
      const { data: revenueAccounts, error: revenueError } = await supabase
        .from('chart_of_accounts')
        .select('current_balance')
        .eq('account_type', 'revenue')
        .eq('is_active', true);

      if (revenueError) throw revenueError;

      // Get expense accounts (5xxx) - correct calculation for expense accounts
      const { data: expenseAccounts, error: expenseError } = await supabase
        .from('chart_of_accounts')
        .select('current_balance')
        .eq('account_type', 'expense')
        .eq('is_active', true);

      if (expenseError) throw expenseError;

      // Get pending invoices
      const { data: pendingInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('outstanding_amount')
        .in('status', ['sent', 'overdue']);

      if (invoicesError) throw invoicesError;

      // Get cash balances from asset accounts
      const { data: cashAccounts, error: cashError } = await supabase
        .from('chart_of_accounts')
        .select('current_balance')
        .eq('account_type', 'asset')
        .eq('account_category', 'current_asset')
        .eq('is_active', true)
        .or('account_name.ilike.%نقدية%,account_name.ilike.%صندوق%,account_name.ilike.%cash%');

      if (cashError) throw cashError;

      // Calculate totals with proper accounting logic
      const monthlyRevenue = Math.abs((revenueAccounts || []).reduce((sum, acc) => sum + (acc.current_balance || 0), 0));
      const totalExpenses = Math.abs((expenseAccounts || []).reduce((sum, acc) => sum + (acc.current_balance || 0), 0));
      const pendingPayments = (pendingInvoices || []).reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0);
      const cashBalance = (cashAccounts || []).reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
      
      // Use actual revenue from payments if available, otherwise use account balances
      const actualRevenue = metrics.actual_revenue || 0;
      const finalRevenue = actualRevenue > 0 ? actualRevenue : monthlyRevenue;
      
      const netProfit = finalRevenue - totalExpenses;

      return {
        monthlyRevenue: finalRevenue,
        pendingPayments,
        totalExpenses,
        netProfit
      };
    } catch (error) {
      console.error('Error fetching financial stats:', error);
      return {
        monthlyRevenue: 0,
        pendingPayments: 0,
        totalExpenses: 0,
        netProfit: 0
      };
    }
  };

  const fetchRecentTransactions = async (): Promise<RecentTransaction[]> => {
    try {
      // Get recent journal entries
      const { data: journalEntries, error } = await supabase
        .from('journal_entries')
        .select(`
          id,
          entry_number,
          description,
          total_debit,
          total_credit,
          entry_date,
          reference_type,
          status
        `)
        .eq('status', 'posted')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Format transactions
      return (journalEntries || []).map(entry => ({
        id: entry.entry_number,
        description: entry.description,
        amount: entry.total_debit || entry.total_credit,
        date: new Date(entry.entry_date).toLocaleDateString('ar-KW'),
        type: entry.total_debit > 0 ? 'مصروف' : 'إيراد',
        status: 'مكتمل'
      }));
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return [];
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [stats, transactions] = await Promise.all([
        fetchFinancialStats(),
        fetchRecentTransactions()
      ]);

      setFinancialStats(stats);
      setRecentTransactions(transactions);
    } catch (error) {
      console.error('Error loading accounting data:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ في تحميل البيانات المحاسبية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Listen for accounting data updates
    const handleAccountingUpdate = () => {
      loadData();
    };
    
    window.addEventListener('accounting-data-updated', handleAccountingUpdate);
    
    return () => {
      window.removeEventListener('accounting-data-updated', handleAccountingUpdate);
    };
  }, []);

  return {
    financialStats,
    recentTransactions,
    loading,
    error,
    refetch: loadData
  };
};