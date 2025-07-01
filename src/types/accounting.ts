export interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_name_en?: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_category: 'current_asset' | 'fixed_asset' | 'current_liability' | 'long_term_liability' | 'capital' | 'operating_revenue' | 'other_revenue' | 'operating_expense' | 'other_expense';
  parent_account_id?: string;
  level: number;
  is_active: boolean;
  allow_posting: boolean;
  opening_balance: number;
  current_balance: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  reference_type?: 'manual' | 'contract' | 'invoice' | 'payment' | 'adjustment';
  reference_id?: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: 'draft' | 'posted' | 'reversed';
  branch_id?: string;
  financial_period_id?: string;
  posted_at?: string;
  posted_by?: string;
  reversed_at?: string;
  reversed_by?: string;
  reversal_reason?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  cost_center_id?: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  line_number: number;
  created_at: string;
  account?: ChartOfAccount;
  cost_center?: CostCenter;
}

export interface CostCenter {
  id: string;
  cost_center_code: string;
  cost_center_name: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  address?: string;
  phone?: string;
  manager_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface FinancialPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  fiscal_year: number;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TrialBalance {
  account_code: string;
  account_name: string;
  debit_balance: number;
  credit_balance: number;
}

export interface IncomeStatement {
  revenue: {
    operating_revenue: number;
    other_revenue: number;
    total_revenue: number;
  };
  expenses: {
    operating_expense: number;
    other_expense: number;
    total_expense: number;
  };
  net_income: number;
}

export interface BalanceSheet {
  assets: {
    current_assets: number;
    fixed_assets: number;
    total_assets: number;
  };
  liabilities: {
    current_liabilities: number;
    long_term_liabilities: number;
    total_liabilities: number;
  };
  equity: {
    capital: number;
    retained_earnings: number;
    total_equity: number;
  };
}