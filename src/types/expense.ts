// أنواع TypeScript لنظام إدارة المصروفات

export interface ExpenseCategory {
  id: string;
  tenant_id: string;
  category_code: string;
  category_name_ar: string;
  category_name_en?: string;
  parent_category_id?: string;
  account_id?: string;
  is_active: boolean;
  requires_approval: boolean;
  approval_limit: number;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // العلاقات
  parent_category?: {
    id: string;
    category_name_ar: string;
    category_name_en?: string;
  };
  sub_categories?: {
    id: string;
    category_name_ar: string;
    category_name_en?: string;
    category_code: string;
  }[];
  account?: {
    id: string;
    account_name: string;
    account_code: string;
  };
}

export interface ExpenseVoucher {
  id: string;
  tenant_id: string;
  voucher_number: string;
  voucher_date: string;
  beneficiary_name: string;
  beneficiary_type: 'supplier' | 'employee' | 'other';
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  net_amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'check';
  bank_account_id?: string;
  check_number?: string;
  reference_number?: string;
  description?: string;
  notes?: string;
  attachments?: string[];
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  cost_center_id?: string;
  journal_entry_id?: string;
  approved_by?: string;
  approved_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // العلاقات
  voucher_items?: ExpenseVoucherItem[];
  approvals?: ExpenseApproval[];
  cost_center?: any;
  bank_account?: any;
  journal_entry?: any;
}

export interface ExpenseVoucherItem {
  id: string;
  expense_voucher_id: string;
  expense_category_id: string;
  account_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  tax_rate: number;
  tax_amount: number;
  cost_center_id?: string;
  project_code?: string;
  notes?: string;
  created_at: string;
  
  // العلاقات
  expense_category?: ExpenseCategory;
  account?: any;
  cost_center?: any;
}

export interface ExpenseApproval {
  id: string;
  expense_voucher_id: string;
  approver_id: string;
  approval_level: number;
  required_amount_limit: number;
  status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  comments?: string;
  created_at: string;
  
  // العلاقات
  approver?: any; // من employees
  expense_voucher?: ExpenseVoucher;
}

export interface ExpenseTemplate {
  id: string;
  tenant_id: string;
  template_name: string;
  template_description?: string;
  default_beneficiary_type: 'supplier' | 'employee' | 'other';
  default_payment_method: 'cash' | 'bank_transfer' | 'check';
  default_cost_center_id?: string;
  template_items: ExpenseTemplateItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // العلاقات
  cost_center?: any;
}

export interface ExpenseTemplateItem {
  expense_category_id: string;
  account_id: string;
  description: string;
  default_quantity?: number;
  default_unit_price?: number;
  tax_rate?: number;
  cost_center_id?: string;
  notes?: string;
}

// أنواع للتقارير والإحصائيات
export interface ExpenseReport {
  period_start: string;
  period_end: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  by_category: ExpenseCategoryReport[];
  by_cost_center: ExpenseCostCenterReport[];
  by_month: ExpenseMonthlyReport[];
}

export interface ExpenseCategoryReport {
  category_id: string;
  category_name: string;
  total_amount: number;
  voucher_count: number;
  percentage: number;
}

export interface ExpenseCostCenterReport {
  cost_center_id: string;
  cost_center_name: string;
  total_amount: number;
  voucher_count: number;
  budget_amount?: number;
  variance?: number;
}

export interface ExpenseMonthlyReport {
  year: number;
  month: number;
  month_name: string;
  total_amount: number;
  voucher_count: number;
  growth_percentage?: number;
}

// أنواع للنماذج
export interface CreateExpenseVoucherForm {
  voucher_date: string;
  beneficiary_name: string;
  beneficiary_type: 'supplier' | 'employee' | 'other';
  payment_method: 'cash' | 'bank_transfer' | 'check';
  bank_account_id?: string;
  check_number?: string;
  reference_number?: string;
  description?: string;
  notes?: string;
  cost_center_id?: string;
  discount_amount?: number;
  items: CreateExpenseVoucherItemForm[];
}

export interface CreateExpenseVoucherItemForm {
  expense_category_id: string;
  account_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  cost_center_id?: string;
  project_code?: string;
  notes?: string;
}

export interface CreateExpenseCategoryForm {
  category_code: string;
  category_name_ar: string;
  category_name_en?: string;
  parent_category_id?: string;
  account_id?: string;
  requires_approval: boolean;
  approval_limit?: number;
  description?: string;
}

// أنواع للفلاتر والبحث
export interface ExpenseVoucherFilters {
  search?: string;
  status?: string[];
  beneficiary_type?: string[];
  payment_method?: string[];
  date_from?: string;
  date_to?: string;
  amount_from?: number;
  amount_to?: number;
  cost_center_id?: string;
  category_id?: string;
  created_by?: string;
}

export interface ExpenseAnalytics {
  total_expenses: number;
  monthly_expenses: number;
  pending_approvals: number;
  overdue_payments: number;
  top_categories: ExpenseCategoryReport[];
  recent_vouchers: ExpenseVoucher[];
  expense_trends: ExpenseMonthlyReport[];
}