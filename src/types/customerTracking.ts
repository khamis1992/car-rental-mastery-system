// أنواع البيانات لنظام تتبع العملاء المحاسبي

export interface CustomerSubsidiaryLedger {
  id: string;
  customer_id: string;
  journal_entry_id: string;
  transaction_date: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
  reference_type: 'invoice' | 'payment' | 'adjustment' | 'refund';
  reference_id?: string;
  created_at: string;
  created_by?: string;
  tenant_id: string;
}

export interface CustomerStatement {
  id: string;
  customer_id: string;
  statement_date: string;
  from_date: string;
  to_date: string;
  opening_balance: number;
  closing_balance: number;
  total_debits: number;
  total_credits: number;
  statement_data: any;
  generated_by?: string;
  generated_at: string;
  status: 'generated' | 'sent' | 'viewed';
  tenant_id: string;
}

export interface CustomerAgingAnalysis {
  id: string;
  customer_id: string;
  analysis_date: string;
  current_amount: number; // 0-30 days
  days_30_60: number;     // 31-60 days
  days_61_90: number;     // 61-90 days
  days_91_120: number;    // 91-120 days
  over_120_days: number;  // Over 120 days
  total_outstanding: number;
  oldest_invoice_date?: string;
  created_at: string;
  created_by?: string;
  tenant_id: string;
}

export interface CustomerTransactionLog {
  id: string;
  customer_id: string;
  transaction_type: 'invoice_created' | 'payment_received' | 'credit_applied' | 'adjustment' | 'debit_entry' | 'credit_entry';
  transaction_date: string;
  amount: number;
  description: string;
  reference_type?: 'invoice' | 'payment' | 'credit_note' | 'adjustment';
  reference_id?: string;
  journal_entry_id?: string;
  balance_before: number;
  balance_after: number;
  created_by?: string;
  tenant_id: string;
  metadata?: any;
}

export interface CustomerTrackingSettings {
  id: string;
  tenant_id: string;
  auto_generate_statements: boolean;
  statement_frequency: 'weekly' | 'monthly' | 'quarterly';
  aging_analysis_frequency: 'daily' | 'weekly' | 'monthly';
  credit_limit_alerts: boolean;
  overdue_payment_alerts: boolean;
  aging_thresholds: {
    current: number;
    warning: number;
    overdue: number;
    critical: number;
  };
  auto_send_statements: boolean;
  statement_email_template?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// واجهات النماذج
export interface CustomerStatementFormData {
  customer_id: string;
  from_date: string;
  to_date: string;
  include_payments: boolean;
  include_adjustments: boolean;
  email_to_customer: boolean;
}

export interface AgingAnalysisFormData {
  analysis_date: string;
  customer_ids?: string[];
  include_zero_balances: boolean;
  group_by_customer_type: boolean;
}

export interface CustomerLedgerFormData {
  customer_id: string;
  from_date?: string;
  to_date?: string;
  reference_type?: 'invoice' | 'payment' | 'adjustment' | 'refund' | 'all';
}

// إحصائيات تتبع العملاء
export interface CustomerTrackingStats {
  total_customers_with_balance: number;
  total_outstanding: number;
  current_period_amount: number;
  overdue_amount: number;
  critical_customers: number;
  avg_days_outstanding: number;
  largest_outstanding_amount: number;
  most_overdue_customer: {
    customer_id: string;
    customer_name: string;
    amount: number;
    days_overdue: number;
  } | null;
}

// تفاصيل العميل مع الرصيد
export interface CustomerWithBalance {
  id: string;
  name: string;
  customer_type: string;
  current_balance: number;
  last_transaction_date?: string;
  overdue_amount: number;
  days_outstanding: number;
  credit_limit?: number;
  payment_terms?: number;
}

// خيارات الفلترة
export interface CustomerTrackingFilters {
  customer_type?: 'individual' | 'company';
  balance_status?: 'all' | 'with_balance' | 'overdue' | 'credit';
  date_range?: {
    from_date: string;
    to_date: string;
  };
  amount_range?: {
    min_amount: number;
    max_amount: number;
  };
}