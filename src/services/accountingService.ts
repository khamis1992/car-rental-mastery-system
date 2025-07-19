
import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/utils/errorHandling';

export interface TrialBalanceItem {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  debit_balance: number;
  credit_balance: number;
}

export interface GeneralLedgerEntry {
  id: string;
  entry_date: string;
  entry_number: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
  reference_id?: string;
  reference_type?: string;
}

class AccountingService {
  async getTrialBalance(): Promise<TrialBalanceItem[]> {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select(`
          id,
          account_code,
          account_name,
          account_type,
          current_balance
        `)
        .eq('is_active', true)
        .order('account_code');

      if (error) {
        console.error('Trial balance query error:', error);
        throw new Error(`فشل في تحميل ميزان المراجعة: ${error.message}`);
      }

      // Convert to trial balance format
      return (data || []).map(account => ({
        account_id: account.id,
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: account.account_type,
        debit_balance: account.current_balance > 0 ? account.current_balance : 0,
        credit_balance: account.current_balance < 0 ? Math.abs(account.current_balance) : 0
      }));

    } catch (error) {
      const result = handleError(error, 'getTrialBalance');
      if (result.handled) {
        throw error;
      }
      throw new Error('خطأ غير متوقع في تحميل ميزان المراجعة');
    }
  }

  async getGeneralLedgerEntries(
    accountId: string, 
    startDate: string, 
    endDate: string
  ): Promise<GeneralLedgerEntry[]> {
    try {
      console.log('Getting ledger entries for:', { accountId, startDate, endDate });

      const { data, error } = await supabase
        .from('journal_entry_lines')
        .select(`
          id,
          debit_amount,
          credit_amount,
          description,
          reference_id,
          reference_type,
          created_at,
          journal_entries!inner (
            id,
            entry_number,
            entry_date,
            description
          )
        `)
        .eq('account_id', accountId)
        .gte('journal_entries.entry_date', startDate)
        .lte('journal_entries.entry_date', endDate)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('General ledger query error:', error);
        throw new Error(`فشل في تحميل بيانات دفتر الأستاذ: ${error.message}`);
      }

      console.log('Raw ledger data received:', data?.length || 0, 'entries');

      // Process entries and calculate running balance
      let runningBalance = 0;
      const entries: GeneralLedgerEntry[] = (data || []).map((entry: any) => {
        const debitAmount = entry.debit_amount || 0;
        const creditAmount = entry.credit_amount || 0;
        runningBalance += (debitAmount - creditAmount);

        return {
          id: entry.id,
          entry_date: entry.journal_entries.entry_date,
          entry_number: entry.journal_entries.entry_number,
          description: entry.description || entry.journal_entries.description,
          debit_amount: debitAmount,
          credit_amount: creditAmount,
          running_balance: runningBalance,
          reference_id: entry.reference_id,
          reference_type: entry.reference_type
        };
      });

      console.log('Processed entries:', entries.length);
      return entries;

    } catch (error) {
      const result = handleError(error, 'getGeneralLedgerEntries');
      if (result.handled) {
        throw error;
      }
      throw new Error('خطأ غير متوقع في تحميل دفتر الأستاذ');
    }
  }

  async getActiveAccounts() {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name, account_type, current_balance')
        .eq('is_active', true)
        .eq('allow_posting', true)
        .order('account_code');

      if (error) {
        console.error('Active accounts query error:', error);
        throw new Error(`فشل في تحميل الحسابات: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      const result = handleError(error, 'getActiveAccounts');
      if (result.handled) {
        throw error;
      }
      throw new Error('خطأ غير متوقع في تحميل الحسابات');
    }
  }
}

export const accountingService = new AccountingService();
