import { supabase } from "@/integrations/supabase/client";
import { 
  ChartOfAccount, 
  JournalEntry, 
  JournalEntryLine, 
  CostCenter, 
  Branch, 
  FinancialPeriod, 
  TrialBalance, 
  IncomeStatement, 
  BalanceSheet,
  FixedAsset,
  AssetDepreciation,
  AssetCategory,
  BankTransaction,
  Budget,
  BudgetItem,
  CostCenterAllocation,
  AdvancedKPI,
  AIInsight,
  CashFlowStatement,
  LiquidityRatios,
  FinancialSummary
} from "@/types/accounting";

export const accountingService = {
  // Helper method to get current tenant ID
  async getCurrentTenantId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error || !data) throw new Error('No active tenant found for user');
    return data.tenant_id;
  },

  // Chart of Accounts
  async getChartOfAccounts(): Promise<ChartOfAccount[]> {
    const tenantId = await this.getCurrentTenantId();
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('account_code');
    
    if (error) throw error;
    return (data || []) as ChartOfAccount[];
  },

  async createAccount(account: Omit<ChartOfAccount, 'id' | 'created_at' | 'updated_at'>): Promise<ChartOfAccount> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .insert(account as any)
      .select()
      .single();
    
    if (error) throw error;
    return data as ChartOfAccount;
  },

  async updateAccount(id: string, account: Partial<ChartOfAccount>): Promise<ChartOfAccount> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .update(account as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as ChartOfAccount;
  },

  async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase
      .from('chart_of_accounts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Journal Entries
  async getJournalEntries(): Promise<JournalEntry[]> {
    const tenantId = await this.getCurrentTenantId();
    const { data, error } = await supabase
      .from('journal_entries')
      .select(`
        *,
        lines:journal_entry_lines(
          *,
          account:chart_of_accounts(*),
          cost_center:cost_centers(*)
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as JournalEntry[];
  },

  async createJournalEntry(entry: Omit<JournalEntry, 'id' | 'entry_number' | 'created_at' | 'updated_at' | 'lines'>): Promise<JournalEntry> {
    // Generate entry number
    const { data: entryNumber } = await supabase.rpc('generate_journal_entry_number');
    
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        ...entry,
        entry_number: entryNumber
      } as any)
      .select()
      .single();
    
    if (error) throw error;
    return data as JournalEntry;
  },

  async updateJournalEntry(id: string, entry: Partial<JournalEntry>): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .update(entry as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as JournalEntry;
  },

  async postJournalEntry(id: string): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .update({
        status: 'posted',
        posted_at: new Date().toISOString(),
        posted_by: (await supabase.auth.getUser()).data.user?.id
      } as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as JournalEntry;
  },

  async reverseJournalEntry(id: string, reason: string): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .update({
        status: 'reversed',
        reversed_at: new Date().toISOString(),
        reversed_by: (await supabase.auth.getUser()).data.user?.id,
        reversal_reason: reason
      } as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as JournalEntry;
  },

  // Journal Entry Lines
  async createJournalEntryLine(line: Omit<JournalEntryLine, 'id' | 'created_at' | 'account' | 'cost_center'>): Promise<JournalEntryLine> {
    const { data, error } = await supabase
      .from('journal_entry_lines')
      .insert(line as any)
      .select()
      .single();
    
    if (error) throw error;
    return data as JournalEntryLine;
  },

  async updateJournalEntryLine(id: string, line: Partial<JournalEntryLine>): Promise<JournalEntryLine> {
    const { data, error } = await supabase
      .from('journal_entry_lines')
      .update(line as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as JournalEntryLine;
  },

  async deleteJournalEntryLine(id: string): Promise<void> {
    const { error } = await supabase
      .from('journal_entry_lines')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Cost Centers
  async getCostCenters(): Promise<CostCenter[]> {
    const tenantId = await this.getCurrentTenantId();
    const { data, error } = await supabase
      .from('cost_centers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('cost_center_code');
    
    if (error) throw error;
    return (data || []) as CostCenter[];
  },

  async createCostCenter(costCenter: Omit<CostCenter, 'id' | 'cost_center_code' | 'created_at' | 'updated_at'>): Promise<CostCenter> {
    const { data: costCenterCode } = await supabase.rpc('generate_cost_center_code');
    
    const { data, error } = await supabase
      .from('cost_centers')
      .insert({
        ...costCenter,
        cost_center_code: costCenterCode
      } as any)
      .select()
      .single();
    
    if (error) throw error;
    return data as CostCenter;
  },

  // Branches
  async getBranches(): Promise<Branch[]> {
    const tenantId = await this.getCurrentTenantId();
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('branch_code');
    
    if (error) throw error;
    return (data || []) as Branch[];
  },

  async createBranch(branch: Omit<Branch, 'id' | 'branch_code' | 'created_at' | 'updated_at'>): Promise<Branch> {
    const { data: branchCode } = await supabase.rpc('generate_branch_code');
    
    const { data, error } = await supabase
      .from('branches')
      .insert({
        ...branch,
        branch_code: branchCode
      } as any)
      .select()
      .single();
    
    if (error) throw error;
    return data as Branch;
  },

  // Financial Periods
  async getFinancialPeriods(): Promise<FinancialPeriod[]> {
    const { data, error } = await supabase
      .from('financial_periods')
      .select('*')
      .order('fiscal_year', { ascending: false });
    
    if (error) throw error;
    return (data || []) as FinancialPeriod[];
  },

  // Reports
  async getTrialBalance(periodId?: string): Promise<TrialBalance[]> {
    const tenantId = await this.getCurrentTenantId();
    let query = supabase
      .from('chart_of_accounts')
      .select('account_code, account_name, current_balance, account_type')
      .eq('tenant_id', tenantId)
      .eq('allow_posting', true)
      .neq('current_balance', 0);

    const { data, error } = await query;
    
    if (error) throw error;
    
    return (data || []).map(account => ({
      account_code: account.account_code,
      account_name: account.account_name,
      debit_balance: ['asset', 'expense'].includes(account.account_type) && account.current_balance > 0 
        ? account.current_balance : 0,
      credit_balance: ['liability', 'equity', 'revenue'].includes(account.account_type) && account.current_balance > 0 
        ? account.current_balance : 0
    }));
  },

  async getIncomeStatement(startDate: string, endDate: string): Promise<IncomeStatement> {
    const tenantId = await this.getCurrentTenantId();
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('account_type, account_category, current_balance')
      .eq('tenant_id', tenantId)
      .in('account_type', ['revenue', 'expense']);
    
    if (error) throw error;
    
    const accounts = data || [];
    
    const operating_revenue = accounts
      .filter(a => a.account_category === 'operating_revenue')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    const other_revenue = accounts
      .filter(a => a.account_category === 'other_revenue')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    const operating_expense = accounts
      .filter(a => a.account_category === 'operating_expense')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    const other_expense = accounts
      .filter(a => a.account_category === 'other_expense')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    const total_revenue = operating_revenue + other_revenue;
    const total_expense = operating_expense + other_expense;
    
    return {
      revenue: {
        operating_revenue,
        other_revenue,
        total_revenue
      },
      expenses: {
        operating_expense,
        other_expense,
        total_expense
      },
      net_income: total_revenue - total_expense
    };
  },

  async getBalanceSheet(): Promise<BalanceSheet> {
    const tenantId = await this.getCurrentTenantId();
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('account_type, account_category, current_balance')
      .eq('tenant_id', tenantId)
      .in('account_type', ['asset', 'liability', 'equity']);
    
    if (error) throw error;
    
    const accounts = data || [];
    
    const current_assets = accounts
      .filter(a => a.account_category === 'current_asset')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    const fixed_assets = accounts
      .filter(a => a.account_category === 'fixed_asset')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    const current_liabilities = accounts
      .filter(a => a.account_category === 'current_liability')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    const long_term_liabilities = accounts
      .filter(a => a.account_category === 'long_term_liability')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    const capital = accounts
      .filter(a => a.account_category === 'capital')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    return {
      assets: {
        current_assets,
        fixed_assets,
        total_assets: current_assets + fixed_assets
      },
      liabilities: {
        current_liabilities,
        long_term_liabilities,
        total_liabilities: current_liabilities + long_term_liabilities
      },
      equity: {
        capital,
        retained_earnings: 0, // This would be calculated from retained earnings
        total_equity: capital
      }
    };
  },

  // ================== الميزات المتقدمة الجديدة ==================

  // إدارة الأصول الثابتة
  async getFixedAssets(): Promise<FixedAsset[]> {
    const tenantId = await this.getCurrentTenantId();
    const { data, error } = await supabase
      .from('fixed_assets')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('asset_code');
    
    if (error) throw error;
    return (data || []) as FixedAsset[];
  },

  async createFixedAsset(asset: Omit<FixedAsset, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>): Promise<FixedAsset> {
    const tenantId = await this.getCurrentTenantId();
    const { data, error } = await supabase
      .from('fixed_assets')
      .insert({
        ...asset,
        tenant_id: tenantId
      } as any)
      .select()
      .single();
    
    if (error) throw error;
    return data as FixedAsset;
  },

  async updateFixedAsset(id: string, asset: Partial<FixedAsset>): Promise<FixedAsset> {
    const { data, error } = await supabase
      .from('fixed_assets')
      .update(asset as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as FixedAsset;
  },

  async deleteFixedAsset(id: string): Promise<void> {
    const { error } = await supabase
      .from('fixed_assets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // إدارة إهلاك الأصول
  async getAssetDepreciation(assetId?: string): Promise<AssetDepreciation[]> {
    const tenantId = await this.getCurrentTenantId();
    let query = supabase
      .from('asset_depreciation')
      .select(`
        *,
        asset:fixed_assets(*)
      `)
      .eq('tenant_id', tenantId)
      .order('depreciation_date', { ascending: false });

    if (assetId) {
      query = query.eq('asset_id', assetId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []) as AssetDepreciation[];
  },

  async createAssetDepreciation(depreciation: Omit<AssetDepreciation, 'id' | 'created_at' | 'tenant_id'>): Promise<AssetDepreciation> {
    const tenantId = await this.getCurrentTenantId();
    const { data, error } = await supabase
      .from('asset_depreciation')
      .insert({
        ...depreciation,
        tenant_id: tenantId
      } as any)
      .select()
      .single();
    
    if (error) throw error;
    return data as AssetDepreciation;
  },

  // إدارة فئات الأصول
  async getAssetCategories(): Promise<AssetCategory[]> {
    const { data, error } = await supabase
      .from('asset_categories')
      .select('*')
      .eq('is_active', true)
      .order('category_name');
    
    if (error) throw error;
    return (data || []) as AssetCategory[];
  },

  // إدارة المعاملات البنكية
  async getBankTransactions(bankAccountId?: string): Promise<BankTransaction[]> {
    const tenantId = await this.getCurrentTenantId();
    let query = supabase
      .from('bank_transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('transaction_date', { ascending: false });

    if (bankAccountId) {
      query = query.eq('bank_account_id', bankAccountId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []) as BankTransaction[];
  },

  async createBankTransaction(transaction: Omit<BankTransaction, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>): Promise<BankTransaction> {
    const tenantId = await this.getCurrentTenantId();
    const { data, error } = await supabase
      .from('bank_transactions')
      .insert({
        ...transaction,
        tenant_id: tenantId
      } as any)
      .select()
      .single();
    
    if (error) throw error;
    return data as BankTransaction;
  },

  // إدارة الميزانيات
  async getBudgets(): Promise<Budget[]> {
    const tenantId = await this.getCurrentTenantId();
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        *,
        items:budget_items(
          *,
          account:chart_of_accounts(*)
        )
      `)
      .eq('tenant_id', tenantId)
      .order('budget_year', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Budget[];
  },

  async createBudget(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>): Promise<Budget> {
    const tenantId = await this.getCurrentTenantId();
    const { data, error } = await supabase
      .from('budgets')
      .insert({
        ...budget,
        tenant_id: tenantId
      } as any)
      .select()
      .single();
    
    if (error) throw error;
    return data as Budget;
  },

  async updateBudget(id: string, budget: Partial<Budget>): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .update(budget as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Budget;
  },

  // إدارة بنود الميزانية
  async getBudgetItems(budgetId: string): Promise<BudgetItem[]> {
    const { data, error } = await supabase
      .from('budget_items')
      .select(`
        *,
        account:chart_of_accounts(*)
      `)
      .eq('budget_id', budgetId);
    
    if (error) throw error;
    return (data || []) as BudgetItem[];
  },

  async createBudgetItem(item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>): Promise<BudgetItem> {
    const tenantId = await this.getCurrentTenantId();
    const { data, error } = await supabase
      .from('budget_items')
      .insert({
        ...item,
        tenant_id: tenantId
      } as any)
      .select()
      .single();
    
    if (error) throw error;
    return data as BudgetItem;
  },

  // حساب انحرافات الميزانية
  async calculateBudgetVariance(budgetId: string): Promise<void> {
    const { error } = await supabase.rpc('calculate_budget_variance', {
      budget_id: budgetId
    });
    
    if (error) throw error;
  },

  // المؤشرات المتقدمة
  async getAdvancedKPIs(): Promise<AdvancedKPI[]> {
    const { data, error } = await supabase
      .from('advanced_kpis')
      .select('*')
      .order('category', { ascending: true });
    
    if (error) throw error;
    return (data || []) as AdvancedKPI[];
  },

  async calculateAllKPIs(): Promise<any> {
    const { data, error } = await supabase.rpc('calculate_all_kpis');
    
    if (error) throw error;
    return data;
  },

  async calculateSpecificKPI(kpiCode: string): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_advanced_kpi', {
      kpi_code_param: kpiCode
    });
    
    if (error) throw error;
    return data || 0;
  },

  // رؤى الذكاء الاصطناعي
  async getAIInsights(): Promise<AIInsight[]> {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('is_dismissed', false)
      .order('priority_level', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as AIInsight[];
  },

  async dismissAIInsight(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('ai_insights')
      .update({
        is_dismissed: true,
        dismissed_by: user?.id,
        dismissed_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  // التقارير المتقدمة
  async getCashFlowStatement(startDate: string, endDate: string): Promise<CashFlowStatement> {
    const { data, error } = await supabase.rpc('calculate_cash_flow', {
      start_date: startDate,
      end_date: endDate
    });
    
    if (error) throw error;
    return (data as unknown) as CashFlowStatement;
  },

  async getLiquidityRatios(): Promise<LiquidityRatios> {
    const { data, error } = await supabase.rpc('calculate_liquidity_ratios');
    
    if (error) throw error;
    return (data as unknown) as LiquidityRatios;
  },

  async getFinancialSummary(asOfDate?: string): Promise<FinancialSummary> {
    const { data, error } = await supabase.rpc('generate_financial_summary', {
      as_of_date: asOfDate || new Date().toISOString().split('T')[0]
    });
    
    if (error) throw error;
    return (data as unknown) as FinancialSummary;
  },

  async validateTrialBalance(): Promise<any> {
    const { data, error } = await supabase.rpc('validate_trial_balance');
    
    if (error) throw error;
    return data;
  },

  async auditOrphanedEntries(): Promise<any> {
    const { data, error } = await supabase.rpc('audit_orphaned_entries');
    
    if (error) throw error;
    return data;
  },

  async performPeriodicMaintenance(): Promise<any> {
    const { data, error } = await supabase.rpc('periodic_accounting_maintenance');
    
    if (error) throw error;
    return data;
  },

  // مراكز التكلفة المحسنة  
  async getCostCenterAllocations(costCenterId?: string): Promise<CostCenterAllocation[]> {
    let query = supabase
      .from('cost_center_allocations')
      .select(`
        *,
        cost_center:cost_centers(*)
      `)
      .order('allocation_date', { ascending: false });

    if (costCenterId) {
      query = query.eq('cost_center_id', costCenterId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []) as CostCenterAllocation[];
  },

  async createCostCenterAllocation(allocation: Omit<CostCenterAllocation, 'id' | 'created_at' | 'updated_at'>): Promise<CostCenterAllocation> {
    const { data, error } = await supabase
      .from('cost_center_allocations')
      .insert(allocation as any)
      .select()
      .single();
    
    if (error) throw error;
    return data as CostCenterAllocation;
  }
};