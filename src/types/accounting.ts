// مشتركة الواجهات المحاسبية الأساسية
export interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_name_en?: string;
  account_type: string;
  account_category: string;
  parent_account_id?: string;
  level: number;
  is_active: boolean;
  allow_posting: boolean;
  opening_balance: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  tenant_id?: string;
  notes?: string;
  legal_reference?: string;
  regulatory_code?: string;
  ministry_commerce_code?: string;
  ksaap_compliant?: boolean;
  zakat_applicable?: boolean;
  consolidation_account_id?: string;
  report_position?: number;
  required_documentation?: string[];
  auto_reconcile?: boolean;
  is_locked?: boolean;
  locked_at?: string;
  locked_by?: string;
  first_transaction_date?: string;
  modification_requires_approval?: boolean;
}

// واجهات القيود المحاسبية
export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  reference_number?: string;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  status: 'draft' | 'approved' | 'posted';
  total_debit: number;
  total_credit: number;
  tenant_id?: string;
  approved_by?: string;
  approved_at?: string;
  posted_by?: string;
  posted_at?: string;
  notes?: string;
  lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  account_code?: string;
  account_name?: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  line_number: number;
  created_at: string;
  updated_at?: string;
  cost_center_id?: string;
  reference_id?: string;
  reference_type?: string;
  account?: ChartOfAccount;
  cost_center?: CostCenter;
}

// واجهات مراكز التكلفة
export interface CostCenter {
  id: string;
  cost_center_code: string;
  cost_center_name: string;
  cost_center_name_en?: string;
  description?: string;
  budget_amount?: number;
  actual_spent?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  tenant_id: string;
  parent_cost_center_id?: string;
  level: number;
  manager_id?: string;
}

// واجهات الفروع
export interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  branch_name_en?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  tenant_id: string;
}

// واجهات الفترات المالية
export interface FinancialPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  fiscal_year: number;
  is_closed: boolean;
  is_locked: boolean;
  closed_by?: string;
  closed_at?: string;
  reopened_by?: string;
  reopened_at?: string;
  closing_reason?: string;
  reopening_reason?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  tenant_id: string;
}

// واجهات التقارير المالية
export interface TrialBalance {
  account_id?: string;
  account_code: string;
  account_name: string;
  account_type?: string;
  debit_balance: number;
  credit_balance: number;
  period_start_date?: string;
  period_end_date?: string;
}

export interface IncomeStatement {
  account_id?: string;
  account_code?: string;
  account_name?: string;
  account_type?: string;
  amount?: number;
  revenue?: {
    operating_revenue: number;
    other_revenue: number;
    total_revenue: number;
  };
  expenses?: {
    operating_expense: number;
    other_expense: number;
    total_expense: number;
  };
  net_income?: number;
  period_start_date?: string;
  period_end_date?: string;
}

export interface BalanceSheet {
  account_id?: string;
  account_code?: string;
  account_name?: string;
  account_type?: string;
  account_category?: string;
  amount?: number;
  assets?: {
    current_assets: number;
    fixed_assets: number;
    total_assets: number;
  };
  liabilities?: {
    current_liabilities: number;
    long_term_liabilities: number;
    total_liabilities: number;
  };
  equity?: {
    capital: number;
    retained_earnings: number;
    total_equity: number;
  };
  as_of_date?: string;
}

// واجهات الأصول الثابتة
export interface FixedAsset {
  id: string;
  asset_code: string;
  asset_name: string;
  asset_name_en?: string;
  asset_category?: string;
  description?: string;
  category_id?: string;
  purchase_date: string;
  purchase_cost: number;
  accumulated_depreciation: number;
  current_value?: number;
  book_value?: number;
  residual_value: number;
  useful_life_years: number;
  depreciation_method: string;
  location?: string;
  employee_id?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  tenant_id?: string;
  [key: string]: any; // للسماح بخصائص إضافية
}

export interface AssetDepreciation {
  id: string;
  asset_id: string;
  depreciation_date: string;
  depreciation_amount: number;
  accumulated_depreciation: number;
  remaining_value?: number;
  journal_entry_id?: string;
  created_at: string;
  created_by?: string;
  tenant_id?: string;
  [key: string]: any; // للسماح بخصائص إضافية
}

export interface AssetCategory {
  id: string;
  category_name: string;
  description?: string;
  default_useful_life: number;
  default_residual_rate: number;
  default_depreciation_method: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// واجهات المعاملات البنكية
export interface BankTransaction {
  id: string;
  bank_account_id: string;
  transaction_date: string;
  description: string;
  debit_amount?: number;
  credit_amount?: number;
  balance?: number;
  reference_number?: string;
  transaction_type: string;
  is_reconciled?: boolean;
  journal_entry_id?: string;
  created_at: string;
  created_by?: string;
  tenant_id?: string;
  [key: string]: any; // للسماح بخصائص إضافية
}

// واجهات الميزانية
export interface Budget {
  id: string;
  budget_name: string;
  budget_year: number;
  budget_period?: string;
  start_date: string;
  end_date: string;
  total_budget?: number;
  total_revenue_budget?: number;
  total_expense_budget?: number;
  actual_amount?: number;
  variance_amount?: number;
  variance_percentage?: number;
  status: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  tenant_id?: string;
  [key: string]: any; // للسماح بخصائص إضافية
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  account_id: string;
  budgeted_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_percentage: number;
  quarter_1_budget?: number;
  quarter_2_budget?: number;
  quarter_3_budget?: number;
  quarter_4_budget?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// واجهات تخصيص مراكز التكلفة
export interface CostCenterAllocation {
  id: string;
  reference_id: string;
  reference_type: string;
  cost_center_id: string;
  allocation_percentage: number;
  allocation_amount: number;
  allocation_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// واجهات المؤشرات المتقدمة
export interface AdvancedKPI {
  id: string;
  kpi_code: string;
  kpi_name?: string;
  kpi_name_ar?: string;
  kpi_name_en?: string;
  description?: string;
  category: string;
  target_value?: number;
  current_value?: number;
  previous_value?: number;
  calculation_formula?: string;
  calculation_period?: string;
  unit_of_measure?: string;
  frequency?: string;
  is_active?: boolean;
  last_calculated_at?: string;
  created_at?: string;
  updated_at?: string;
  tenant_id?: string;
  [key: string]: any; // للسماح بخصائص إضافية
}

// واجهات الرؤى الذكية
export interface AIInsight {
  id: string;
  insight_type: string;
  insight_title: string;
  insight_description: string;
  priority_level: string;
  insight_data?: any;
  affected_accounts?: string[];
  recommended_actions?: string[];
  is_dismissed: boolean;
  dismissed_by?: string;
  dismissed_at?: string;
  created_at: string;
  created_by?: string;
}

// واجهات بيانات التدفق النقدي
export interface CashFlowStatement {
  category: string;
  subcategory?: string;
  account_id: string;
  account_code: string;
  account_name: string;
  amount: number;
  period_start_date: string;
  period_end_date: string;
}

// واجهات نسب السيولة
export interface LiquidityRatios {
  current_assets: number;
  current_liabilities: number;
  quick_assets: number;
  cash_and_equivalents: number;
  inventory: number;
  current_ratio: number;
  quick_ratio: number;
  cash_ratio: number;
  calculated_at: string;
}

// واجهات الملخص المالي
export interface FinancialSummary {
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  financial_position?: {
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
  };
  income_statement?: {
    total_revenue: number;
    total_expenses: number;
    net_income: number;
    profit_margin_pct?: number;
  };
  period_start_date: string;
  period_end_date: string;
  calculated_at: string;
}