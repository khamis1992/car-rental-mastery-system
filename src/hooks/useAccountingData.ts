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
      
      // Get accounting summary for the current month
      const summary = await accountingIntegrationService.getAccountingEntriesSummary({
        date_from: monthStart.toISOString().split('T')[0],
        date_to: monthEnd.toISOString().split('T')[0]
      });

      // Get revenue accounts (4xxx)
      const { data: revenueAccounts, error: revenueError } = await supabase
        .from('chart_of_accounts')
        .select('current_balance')
        .eq('account_type', 'revenue');

      if (revenueError) throw revenueError;

      // Get expense accounts (5xxx)
      const { data: expenseAccounts, error: expenseError } = await supabase
        .from('chart_of_accounts')
        .select('current_balance')
        .eq('account_type', 'expense');

      if (expenseError) throw expenseError;

      // Get pending invoices
      const { data: pendingInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('outstanding_amount')
        .in('status', ['sent', 'overdue']);

      if (invoicesError) throw invoicesError;

      const monthlyRevenue = (revenueAccounts || []).reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
      const totalExpenses = (expenseAccounts || []).reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
      const pendingPayments = (pendingInvoices || []).reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0);
      const netProfit = monthlyRevenue - totalExpenses;

      return {
        monthlyRevenue,
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
  }, []);

  return {
    financialStats,
    recentTransactions,
    loading,
    error,
    refetch: loadData
  };
};