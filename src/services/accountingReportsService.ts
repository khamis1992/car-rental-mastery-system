import { supabase } from '@/integrations/supabase/client';

// Types for accounting reports
export interface CustomerAnalytics {
  id: string;
  customer_id?: string;
  customer_name?: string;
  name: string;
  total_contracts: number;
  contracts_count?: number;
  total_revenue: number;
  total_payments?: number;
  total_invoices?: number;
  current_balance?: number;
  outstanding_balance?: number;
  average_contract_value: number;
  average_rental_days?: number;
  payment_score: number;
  collection_rate?: number;
  total_penalties?: number;
  paid_penalties?: number;
  last_contract_date: string;
  first_contract_date?: string;
  last_activity_date?: string;
  most_rented_vehicle?: string;
  most_used_branch?: string;
}

export interface CustomerTransaction {
  id: string;
  date: string;
  transaction_date?: string;
  transaction_type?: string;
  type: 'contract' | 'payment' | 'refund';
  amount: number;
  balance?: number;
  description: string;
  contract_number?: string;
  vehicle_plate?: string;
  branch_name?: string;
  user_name?: string;
  status: string;
}

export interface CustomerOverview {
  id: string;
  customer_id?: string;
  name: string;
  customer_name?: string;
  customer_code?: string;
  phone: string;
  email: string;
  status?: string;
  total_contracts: number;
  contracts_count?: number;
  total_amount: number;
  total_invoices?: number;
  total_payments?: number;
  current_balance?: number;
  outstanding_balance: number;
  collection_rate?: number;
  penalties_count?: number;
  days_overdue?: number;
  last_payment_date?: string;
  payment_status: 'good' | 'warning' | 'overdue';
}

export interface FixedAsset {
  id: string;
  name: string;
  asset_code?: string;
  category: string;
  model?: string;
  vehicle_type?: string;
  plate_number?: string;
  status?: string;
  year?: number; // Changed to number since we're using numbers
  purchase_date: string;
  purchase_cost: number;
  purchase_value?: number;
  accumulated_depreciation: number;
  book_value: number;
  depreciation_method: string;
  depreciation_rate?: number;
  useful_life: number;
  monthly_depreciation?: number;
}

class AccountingReportsService {
  /**
   * Get customer analytics data with support for single customer filter
   */
  async getCustomerAnalytics(customerId?: string): Promise<CustomerAnalytics[]> {
    try {
      let query = supabase
        .from('customers')
        .select(`
          id,
          name,
          contracts(count),
          contracts!inner(total_amount)
        `);

      if (customerId) {
        query = query.eq('id', customerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process the data to calculate analytics
      return (data || []).map(customer => ({
        id: customer.id,
        customer_id: customer.id,
        customer_name: customer.name,
        name: customer.name,
        total_contracts: customer.contracts?.length || 0,
        contracts_count: customer.contracts?.length || 0,
        total_revenue: customer.contracts?.reduce((sum: number, contract: any) => sum + (contract.total_amount || 0), 0) || 0,
        total_invoices: 0, // Mock data
        total_payments: 0, // Mock data
        current_balance: 0, // Mock data
        outstanding_balance: 0, // Mock data
        average_contract_value: 0, // Calculate based on contracts
        average_rental_days: 30, // Mock data
        payment_score: 85, // Mock score
        collection_rate: 95, // Mock rate
        total_penalties: 0, // Mock data
        paid_penalties: 0, // Mock data
        last_contract_date: new Date().toISOString(),
        first_contract_date: new Date().toISOString(),
        last_activity_date: new Date().toISOString(),
        most_rented_vehicle: 'N/A', // Mock data
        most_used_branch: 'N/A' // Mock data
      }));
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      return [];
    }
  }

  /**
   * Get customer transactions
   */
  async getCustomerTransactions(customerId: string): Promise<CustomerTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(contract => ({
        id: contract.id,
        date: contract.created_at,
        type: 'contract' as const,
        amount: contract.total_amount,
        description: `Contract ${contract.contract_number}`,
        status: contract.status
      }));
    } catch (error) {
      console.error('Error fetching customer transactions:', error);
      return [];
    }
  }

  /**
   * Get customers overview
   */
  async getCustomersOverview(): Promise<CustomerOverview[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          phone,
          email,
          contracts(count, total_amount)
        `);

      if (error) throw error;

      return (data || []).map(customer => ({
        id: customer.id,
        name: customer.name,
        customer_name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        status: 'active',
        total_contracts: customer.contracts?.length || 0,
        contracts_count: customer.contracts?.length || 0,
        total_amount: customer.contracts?.reduce((sum: number, contract: any) => sum + (contract.total_amount || 0), 0) || 0,
        total_invoices: 0, // Mock data
        total_payments: 0, // Mock data
        current_balance: 0, // Mock data
        outstanding_balance: 0, // Calculate based on payments
        collection_rate: 95, // Mock rate
        penalties_count: 0, // Mock data
        days_overdue: 0, // Mock data
        last_payment_date: new Date().toISOString(),
        payment_status: 'good' as const
      }));
    } catch (error) {
      console.error('Error fetching customers overview:', error);
      return [];
    }
  }

  /**
   * Get fixed assets report
   */
  async getFixedAssetsReport(): Promise<FixedAsset[]> {
    try {
      const { data, error } = await supabase
        .from('fixed_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(asset => ({
        id: asset.id,
        name: asset.asset_name,
        asset_code: asset.asset_code,
        category: asset.asset_category,
        model: 'Unknown', // Default since field doesn't exist
        status: 'active', // Default status
        year: 2020, // Default year as number
        purchase_date: asset.purchase_date,
        purchase_cost: asset.purchase_cost,
        purchase_value: asset.purchase_cost,
        accumulated_depreciation: asset.accumulated_depreciation || 0,
        book_value: asset.book_value || 0,
        depreciation_method: asset.depreciation_method,
        depreciation_rate: 10, // Mock rate
        useful_life: asset.useful_life_years,
        monthly_depreciation: asset.purchase_cost / (asset.useful_life_years * 12) || 0
      }));
    } catch (error) {
      console.error('Error fetching fixed assets:', error);
      return [];
    }
  }

  /**
   * Get trial balance
   */
  async getTrialBalance(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_code');

      if (error) throw error;

      return (data || []).map(account => ({
        account_code: account.account_code,
        account_name: account.account_name,
        debit_balance: account.account_type === 'asset' || account.account_type === 'expense' ? account.current_balance : 0,
        credit_balance: account.account_type === 'liability' || account.account_type === 'equity' || account.account_type === 'revenue' ? account.current_balance : 0
      }));
    } catch (error) {
      console.error('Error fetching trial balance:', error);
      return [];
    }
  }

  /**
   * Get income statement
   */
  async getIncomeStatement(startDate: string, endDate: string): Promise<any> {
    try {
      // Get revenue accounts
      const { data: revenueAccounts, error: revenueError } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('account_type', 'revenue')
        .eq('is_active', true);

      if (revenueError) throw revenueError;

      // Get expense accounts
      const { data: expenseAccounts, error: expenseError } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('account_type', 'expense')
        .eq('is_active', true);

      if (expenseError) throw expenseError;

      const totalRevenue = (revenueAccounts || []).reduce((sum, account) => sum + (account.current_balance || 0), 0);
      const totalExpenses = (expenseAccounts || []).reduce((sum, account) => sum + (account.current_balance || 0), 0);

      return {
        revenue: revenueAccounts || [],
        expenses: expenseAccounts || [],
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_income: totalRevenue - totalExpenses
      };
    } catch (error) {
      console.error('Error fetching income statement:', error);
      return {
        revenue: [],
        expenses: [],
        total_revenue: 0,
        total_expenses: 0,
        net_income: 0
      };
    }
  }

  /**
   * Get balance sheet
   */
  async getBalanceSheet(): Promise<any> {
    try {
      // Get asset accounts
      const { data: assetAccounts, error: assetError } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('account_type', 'asset')
        .eq('is_active', true);

      if (assetError) throw assetError;

      // Get liability accounts
      const { data: liabilityAccounts, error: liabilityError } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('account_type', 'liability')
        .eq('is_active', true);

      if (liabilityError) throw liabilityError;

      // Get equity accounts
      const { data: equityAccounts, error: equityError } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('account_type', 'equity')
        .eq('is_active', true);

      if (equityError) throw equityError;

      const totalAssets = (assetAccounts || []).reduce((sum, account) => sum + (account.current_balance || 0), 0);
      const totalLiabilities = (liabilityAccounts || []).reduce((sum, account) => sum + (account.current_balance || 0), 0);
      const totalEquity = (equityAccounts || []).reduce((sum, account) => sum + (account.current_balance || 0), 0);

      return {
        assets: assetAccounts || [],
        liabilities: liabilityAccounts || [],
        equity: equityAccounts || [],
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        total_equity: totalEquity
      };
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
      return {
        assets: [],
        liabilities: [],
        equity: [],
        total_assets: 0,
        total_liabilities: 0,
        total_equity: 0
      };
    }
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(): Promise<any> {
    try {
      const [trialBalance, incomeStatement, balanceSheet] = await Promise.all([
        this.getTrialBalance(),
        this.getIncomeStatement('2024-01-01', '2024-12-31'),
        this.getBalanceSheet()
      ]);

      return {
        trial_balance: trialBalance,
        income_statement: incomeStatement,
        balance_sheet: balanceSheet,
        summary: {
          total_assets: balanceSheet.total_assets,
          total_liabilities: balanceSheet.total_liabilities,
          net_income: incomeStatement.net_income
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      return {
        trial_balance: [],
        income_statement: { revenue: [], expenses: [], total_revenue: 0, total_expenses: 0, net_income: 0 },
        balance_sheet: { assets: [], liabilities: [], equity: [], total_assets: 0, total_liabilities: 0, total_equity: 0 },
        summary: { total_assets: 0, total_liabilities: 0, net_income: 0 }
      };
    }
  }

  /**
   * Get customer statement
   */
  async getCustomerStatement(customerId: string, dateRange?: { startDate: string; endDate: string }): Promise<CustomerTransaction[]> {
    return this.getCustomerTransactions(customerId);
  }

  /**
   * Process monthly depreciation (placeholder)
   */
  async processMonthlyDepreciation(): Promise<void> {
    console.log('Processing monthly depreciation...');
    // Implementation would go here
  }
}

// Export singleton instance
export const accountingReportsService = new AccountingReportsService();