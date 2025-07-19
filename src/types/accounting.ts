export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_name_en?: string;
  account_type: AccountType;
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

// CostCenter interface moved to the end of file with enhanced fields

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

export interface FixedAsset {
  id: string;
  tenant_id: string;
  asset_code: string;
  asset_name: string;
  asset_category: string;
  description?: string;
  purchase_date: string;
  purchase_cost: number;
  useful_life_years: number;
  residual_value: number;
  depreciation_method: 'straight_line' | 'declining_balance';
  accumulated_depreciation: number;
  book_value: number;
  location?: string;
  supplier_name?: string;
  invoice_number?: string;
  serial_number?: string;
  warranty_expiry?: string;
  status: 'active' | 'disposed' | 'under_maintenance';
  disposal_date?: string;
  disposal_amount?: number;
  disposal_reason?: string;
  account_id?: string;
  accumulated_depreciation_account_id?: string;
  depreciation_expense_account_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AssetDepreciation {
  id: string;
  tenant_id: string;
  asset_id: string;
  depreciation_date: string;
  depreciation_amount: number;
  accumulated_depreciation: number;
  book_value: number;
  method_used: string;
  period_months: number;
  journal_entry_id?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
  asset?: FixedAsset;
}

export interface AssetCategory {
  id: string;
  category_name: string;
  default_useful_life: number;
  default_depreciation_method: string;
  default_residual_rate: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// واجهات جديدة للميزات المتقدمة

export interface BankTransaction {
  id: string;
  tenant_id: string;
  bank_account_id: string;
  transaction_date: string;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'interest';
  debit_amount?: number;
  credit_amount?: number;
  balance_after?: number;
  description: string;
  reference_number?: string;
  journal_entry_id?: string;
  status: 'pending' | 'processed' | 'cancelled';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface BudgetItem {
  id: string;
  tenant_id: string;
  budget_id: string;
  account_id: string;
  item_type: 'revenue' | 'expense';
  budgeted_amount: number;
  actual_amount?: number;
  variance_amount?: number;
  variance_percentage?: number;
  q1_amount?: number;
  q2_amount?: number;
  q3_amount?: number;
  q4_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  account?: ChartOfAccount;
}

export interface Budget {
  id: string;
  tenant_id: string;
  budget_name: string;
  budget_period: string;
  budget_year: number;
  start_date: string;
  end_date: string;
  total_revenue_budget?: number;
  total_expense_budget?: number;
  status: 'draft' | 'approved' | 'active' | 'closed';
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  items?: BudgetItem[];
}

export interface CostCenterAllocation {
  id: string;
  cost_center_id: string;
  reference_type: 'contract' | 'invoice' | 'expense' | 'payroll';
  reference_id: string;
  allocation_percentage?: number;
  allocation_amount?: number;
  allocation_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  cost_center?: CostCenter;
}

export interface AdvancedKPI {
  id: string;
  kpi_code: string;
  kpi_name_ar: string;
  kpi_name_en?: string;
  category: 'profitability' | 'liquidity' | 'efficiency' | 'growth' | 'risk';
  calculation_formula: string;
  calculation_period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  target_value?: number;
  current_value?: number;
  previous_value?: number;
  alert_threshold_low?: number;
  alert_threshold_high?: number;
  is_automated?: boolean;
  department_id?: string;
  last_calculated_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AIClassification {
  id: string;
  transaction_type: 'expense' | 'revenue' | 'asset' | 'liability';
  transaction_id: string;
  suggested_category: string;
  suggested_account_id?: string;
  confidence_score?: number;
  ai_reasoning?: string;
  is_approved?: boolean;
  approved_by?: string;
  approved_at?: string;
  model_version?: string;
  created_at: string;
  created_by?: string;
  suggested_account?: ChartOfAccount;
}

export interface AIInsight {
  id: string;
  insight_type: 'anomaly' | 'trend' | 'recommendation' | 'warning' | 'opportunity';
  insight_title: string;
  insight_description: string;
  priority_level: 'low' | 'medium' | 'high' | 'critical';
  affected_accounts?: string[];
  recommended_actions?: string[];
  insight_data?: any;
  is_dismissed?: boolean;
  dismissed_by?: string;
  dismissed_at?: string;
  created_at: string;
  created_by?: string;
}

export interface AccountingWorkflow {
  id: string;
  workflow_name: string;
  workflow_type: 'approval' | 'processing' | 'notification' | 'reconciliation';
  trigger_event: string;
  conditions?: any;
  actions?: any;
  is_active: boolean;
  execution_order?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AccountingEventMonitor {
  id: string;
  event_type: string;
  entity_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_duration_ms?: number;
  error_message?: string;
  retry_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AccountingAuditTrail {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_values?: any;
  new_values?: any;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// التقارير المالية المتقدمة
export interface CashFlowStatement {
  period_start: string;
  period_end: string;
  operating_cash_flow: number;
  investing_cash_flow: number;
  financing_cash_flow: number;
  net_cash_flow: number;
  calculated_at: string;
}

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

export interface FinancialSummary {
  as_of_date: string;
  financial_position: {
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
    assets_liabilities_equity_total: number;
  };
  income_statement: {
    total_revenue: number;
    total_expenses: number;
    net_income: number;
    profit_margin_pct: number;
  };
  liquidity_analysis: LiquidityRatios;
  trial_balance_check: {
    total_debits: number;
    total_credits: number;
    difference: number;
    is_balanced: boolean;
    validation_date: string;
  };
  generated_at: string;
}

// إعادة تعريف CostCenter مع الحقول الجديدة
export interface CostCenter {
  id: string;
  tenant_id: string;
  cost_center_code: string;
  cost_center_name: string;
  cost_center_type?: 'department' | 'project' | 'location' | 'activity';
  description?: string;
  parent_id?: string;
  level?: number;
  hierarchy_path?: string;
  manager_id?: string;
  department_id?: string;
  budget_amount?: number;
  actual_spent?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  allocations?: CostCenterAllocation[];
}