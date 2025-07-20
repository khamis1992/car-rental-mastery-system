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
  async getCurrentTenantId(): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('لا يوجد مستخدم مسجل');
      }

      const { data: tenantUser, error } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('خطأ في جلب معرف المؤسسة:', error);
        throw new Error('فشل في جلب معرف المؤسسة');
      }

      if (!tenantUser?.tenant_id) {
        throw new Error('لم يتم العثور على مؤسسة للمستخدم');
      }

      return tenantUser.tenant_id;
    } catch (error) {
      console.error('خطأ في getCurrentTenantId:', error);
      throw error;
    }
  }

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
      console.log('🔍 Getting ledger entries for:', { accountId, startDate, endDate });

      // Simplified query with better error handling
      const { data: journalEntryLines, error } = await supabase
        .from('journal_entry_lines')
        .select(`
          id,
          debit_amount,
          credit_amount,
          description,
          created_at,
          journal_entries!inner (
            id,
            entry_number,
            entry_date,
            description,
            reference_id,
            reference_type
          )
        `)
        .eq('account_id', accountId)
        .gte('journal_entries.entry_date', startDate)
        .lte('journal_entries.entry_date', endDate)
        .eq('journal_entries.status', 'posted')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ General ledger query error:', error);
        throw new Error(`فشل في تحميل بيانات دفتر الأستاذ: ${error.message}`);
      }

      console.log('✅ Raw ledger data received:', journalEntryLines?.length || 0, 'entries');

      if (!journalEntryLines || journalEntryLines.length === 0) {
        console.log('📝 No journal entries found for the specified criteria');
        return [];
      }

      // Process entries and calculate running balance
      let runningBalance = 0;
      const entries: GeneralLedgerEntry[] = journalEntryLines.map((line: any) => {
        const debitAmount = Number(line.debit_amount) || 0;
        const creditAmount = Number(line.credit_amount) || 0;
        runningBalance += (debitAmount - creditAmount);

        const journalEntry = line.journal_entries;

        return {
          id: line.id,
          entry_date: journalEntry.entry_date,
          entry_number: journalEntry.entry_number,
          description: line.description || journalEntry.description || 'قيد محاسبي',
          debit_amount: debitAmount,
          credit_amount: creditAmount,
          running_balance: runningBalance,
          reference_id: journalEntry.reference_id || undefined,
          reference_type: journalEntry.reference_type || undefined
        };
      });

      console.log('✅ Processed entries successfully:', entries.length);
      return entries;

    } catch (error) {
      console.error('❌ Error in getGeneralLedgerEntries:', error);
      const result = handleError(error, 'getGeneralLedgerEntries');
      
      if (result.shouldLog) {
        console.error('General ledger fetch error details:', {
          accountId,
          startDate,
          endDate,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      throw new Error('فشل في تحميل بيانات دفتر الأستاذ العام');
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

  async getChartOfAccounts() {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_code');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching chart of accounts:', error);
      throw error;
    }
  }

  async createAccount(accountData: any) {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .insert(accountData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  async updateAccount(id: string, accountData: any) {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .update(accountData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  }

  async deleteAccount(id: string) {
    try {
      const { error } = await supabase
        .from('chart_of_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  async getJournalEntries() {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      throw error;
    }
  }

  async createJournalEntry(entryData: any) {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert(entryData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  }

  async updateJournalEntry(id: string, entryData: any) {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .update(entryData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw error;
    }
  }

  async createJournalEntryLine(lineData: any) {
    try {
      const { data, error } = await supabase
        .from('journal_entry_lines')
        .insert(lineData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating journal entry line:', error);
      throw error;
    }
  }

  async postJournalEntry(id: string) {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .update({ status: 'posted' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error posting journal entry:', error);
      throw error;
    }
  }

  async reverseJournalEntry(id: string) {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .update({ status: 'reversed' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error reversing journal entry:', error);
      throw error;
    }
  }

  async getAdvancedKPIs() {
    try {
      const { data, error } = await supabase
        .from('advanced_kpis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching advanced KPIs:', error);
      return [];
    }
  }

  async calculateAllKPIs() {
    try {
      // This would trigger KPI calculations
      return { success: true };
    } catch (error) {
      console.error('Error calculating KPIs:', error);
      throw error;
    }
  }

  async getAIInsights() {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      return [];
    }
  }

  async dismissAIInsight(id: string) {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_dismissed: true })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error dismissing AI insight:', error);
      throw error;
    }
  }

  async getFinancialSummary() {
    try {
      // Return mock financial summary data
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        equity: 0
      };
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      return null;
    }
  }

  async getLiquidityRatios() {
    try {
      // Return mock liquidity ratios
      return {
        currentRatio: 0,
        quickRatio: 0,
        cashRatio: 0
      };
    } catch (error) {
      console.error('Error fetching liquidity ratios:', error);
      return null;
    }
  }

  async getFixedAssets() {
    try {
      // Return mock fixed assets data
      return [];
    } catch (error) {
      console.error('Error fetching fixed assets:', error);
      return [];
    }
  }

  async getBudgets() {
    try {
      // Return mock budgets data
      return [];
    } catch (error) {
      console.error('Error fetching budgets:', error);
      return [];
    }
  }

  async getIncomeStatement() {
    try {
      // Return mock income statement data
      return {
        revenue: [],
        expenses: [],
        netIncome: 0
      };
    } catch (error) {
      console.error('Error fetching income statement:', error);
      return null;
    }
  }

  async getBalanceSheet() {
    try {
      // Return mock balance sheet data
      return {
        assets: [],
        liabilities: [],
        equity: []
      };
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
      return null;
    }
  }

  async runDiagnostics() {
    try {
      // Return mock diagnostics data
      return {
        issues: [],
        status: 'healthy'
      };
    } catch (error) {
      console.error('Error running diagnostics:', error);
      return null;
    }
  }
}

export const accountingService = new AccountingService();
