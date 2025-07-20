
import { useState, useEffect, useMemo } from 'react';
import { smartSuggestionsService } from '@/services/smartSuggestionsService';
import { supabase } from '@/integrations/supabase/client';

interface UseSmartSuggestionsProps {
  accounts: any[];
  currentDescription?: string;
  currentAmount?: number;
  transactionType?: 'debit' | 'credit';
  counterAccountId?: string;
}

export const useSmartSuggestions = ({
  accounts,
  currentDescription = '',
  currentAmount = 0,
  transactionType,
  counterAccountId
}: UseSmartSuggestionsProps) => {
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [recentAccounts, setRecentAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // جلب القيود الحديثة لتحليل الأنماط
  useEffect(() => {
    const fetchRecentEntries = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // جلب آخر 100 قيد للتحليل
        const { data: entries, error } = await supabase
          .from('journal_entry_lines')
          .select(`
            *,
            journal_entries!inner(
              entry_date,
              description,
              status
            )
          `)
          .eq('tenant_id', user.id)
          .eq('journal_entries.status', 'posted')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Error fetching recent entries:', error);
          return;
        }

        const processedEntries = entries?.map(entry => ({
          account_id: entry.account_id,
          description: entry.journal_entries?.description || entry.description,
          amount: entry.debit_amount || entry.credit_amount,
          entry_date: entry.journal_entries?.entry_date,
          transaction_type: entry.debit_amount > 0 ? 'debit' : 'credit'
        })) || [];

        setRecentEntries(processedEntries);

        // استخراج الحسابات المستخدمة مؤخراً
        const accountUsage = smartSuggestionsService.getAccountUsageStats(processedEntries);
        const sortedAccounts = Array.from(accountUsage.entries())
          .sort(([, a], [, b]) => b - a)
          .map(([accountId]) => accountId)
          .slice(0, 10);

        setRecentAccounts(sortedAccounts);

      } catch (error) {
        console.error('Error in fetchRecentEntries:', error);
      } finally {
        setLoading(false);
      }
    };

    if (accounts.length > 0) {
      fetchRecentEntries();
    }
  }, [accounts.length]);

  // توليد الاقتراحات الذكية
  const suggestedAccounts = useMemo(() => {
    if (!currentDescription || currentDescription.length < 3) {
      return [];
    }

    const context = {
      description: currentDescription,
      amount: currentAmount,
      transactionType: transactionType || 'debit',
      counterAccountId,
      previousEntries: recentEntries
    };

    return smartSuggestionsService.generateSuggestions(
      context,
      accounts,
      recentEntries
    );
  }, [currentDescription, currentAmount, transactionType, counterAccountId, accounts, recentEntries]);

  // تعلم من الاختيارات الجديدة
  const learnFromSelection = (accountId: string, description: string, amount: number) => {
    smartSuggestionsService.learnFromEntry(description, accountId, amount);
  };

  // الحصول على الحسابات الأكثر استخداماً لنوع معين من المعاملات
  const getFrequentAccountsForType = (accountType: string) => {
    return recentAccounts
      .map(accountId => accounts.find(acc => acc.id === accountId))
      .filter(account => account && account.account_type === accountType)
      .slice(0, 5);
  };

  // اقتراحات سريعة للحسابات الشائعة
  const quickSuggestions = useMemo(() => {
    const commonAccounts = [
      { type: 'cash', codes: ['11101', '11102'], label: 'نقدية' },
      { type: 'suppliers', codes: ['21101'], label: 'موردين' },
      { type: 'customers', codes: ['11301'], label: 'عملاء' },
      { type: 'salaries', codes: ['51101'], label: 'رواتب' },
      { type: 'rent', codes: ['52101'], label: 'إيجار' }
    ];

    return commonAccounts.map(({ type, codes, label }) => {
      const account = accounts.find(acc => codes.includes(acc.account_code));
      return account ? { ...account, quickLabel: label } : null;
    }).filter(Boolean);
  }, [accounts]);

  return {
    suggestedAccounts,
    recentAccounts,
    quickSuggestions,
    loading,
    learnFromSelection,
    getFrequentAccountsForType
  };
};
