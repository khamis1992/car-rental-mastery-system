import { supabase } from '@/integrations/supabase/client';
import { ChartOfAccount } from '@/types/accounting';

export interface AccountEditData {
  account_name: string;
  account_name_en?: string;
  account_type: string;
  account_category: string;
  notes?: string;
}

export interface AccountDetails extends ChartOfAccount {
  parent_account?: any;
  sub_accounts?: any[];
  recent_transactions?: any[];
}

export const accountService = {
  // Get account details with full information
  getAccountDetails: async (accountId: string): Promise<AccountDetails | null> => {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (error) throw error;

      // Get parent account separately if exists
      let parent_account = null;
      if (data.parent_account_id) {
        const { data: parentData } = await supabase
          .from('chart_of_accounts')
          .select('id, account_name, account_code, account_type, account_category')
          .eq('id', data.parent_account_id)
          .single();
        parent_account = parentData;
      }

      // Get sub accounts
      const { data: subAccountsData } = await supabase
        .from('chart_of_accounts')
        .select('id, account_name, account_code, account_type, current_balance, account_category')
        .eq('parent_account_id', accountId);

      const sub_accounts = subAccountsData || [];

      // Get recent transactions for this account
      const { data: transactions } = await supabase
        .from('journal_entry_lines')
        .select(`
          id,
          debit_amount,
          credit_amount,
          description,
          created_at,
          journal_entries!inner(
            id,
            entry_number,
            entry_date,
            description
          )
        `)
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        ...data,
        parent_account,
        sub_accounts,
        recent_transactions: transactions || []
      } as AccountDetails;
    } catch (error) {
      console.error('Error fetching account details:', error);
      throw error;
    }
  },

  // Update account information
  updateAccount: async (accountId: string, updates: AccountEditData): Promise<void> => {
    try {
      const { error } = await supabase
        .from('chart_of_accounts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  },

  // Delete account (only if no transactions and no sub-accounts)
  deleteAccount: async (accountId: string): Promise<void> => {
    try {
      // Check if account has transactions
      const { count: transactionCount } = await supabase
        .from('journal_entry_lines')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', accountId);

      if (transactionCount && transactionCount > 0) {
        throw new Error('لا يمكن حذف الحساب لأنه يحتوي على معاملات مالية');
      }

      // Check if account has sub-accounts
      const { count: subAccountsCount } = await supabase
        .from('chart_of_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('parent_account_id', accountId);

      if (subAccountsCount && subAccountsCount > 0) {
        throw new Error('لا يمكن حذف الحساب لأنه يحتوي على حسابات فرعية');
      }

      const { error } = await supabase
        .from('chart_of_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  // Check if account can be deleted
  canDeleteAccount: async (accountId: string): Promise<{ canDelete: boolean; reason?: string }> => {
    try {
      // Check for transactions
      const { count: transactionCount } = await supabase
        .from('journal_entry_lines')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', accountId);

      if (transactionCount && transactionCount > 0) {
        return { 
          canDelete: false, 
          reason: `يحتوي الحساب على ${transactionCount} معاملة مالية` 
        };
      }

      // Check for sub-accounts
      const { count: subAccountsCount } = await supabase
        .from('chart_of_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('parent_account_id', accountId);

      if (subAccountsCount && subAccountsCount > 0) {
        return { 
          canDelete: false, 
          reason: `يحتوي الحساب على ${subAccountsCount} حساب فرعي` 
        };
      }

      return { canDelete: true };
    } catch (error) {
      console.error('Error checking account deletion eligibility:', error);
      return { canDelete: false, reason: 'خطأ في التحقق من إمكانية الحذف' };
    }
  }
};