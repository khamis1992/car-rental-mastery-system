// أنواع جديدة للنظام المحسن لدليل الحسابات

export interface ChartOfAccountsSettings {
  id: string;
  tenant_id: string;
  max_account_levels: number;
  account_code_format: {
    pattern: 'hierarchical' | 'sequential' | 'custom';
    separator: string;
    length_per_level: number[];
  };
  auto_code_generation: boolean;
  require_parent_for_level: {
    level_1: boolean;
    level_2: boolean;
    level_3: boolean;
    level_4: boolean;
    level_5: boolean;
  };
  level_naming: {
    level_1: string;
    level_2: string;
    level_3: string;
    level_4: string;
    level_5: string;
  };
  allow_posting_levels: {
    level_1: boolean;
    level_2: boolean;
    level_3: boolean;
    level_4: boolean;
    level_5: boolean;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AccountTemplate {
  id: string;
  template_name: string;
  template_name_en?: string;
  business_type: 'rental' | 'trading' | 'service' | 'manufacturing' | 'general';
  template_structure: {
    accounts: AccountTemplateItem[];
  };
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountTemplateItem {
  code: string;
  name: string;
  name_en?: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  category?: string;
  level: number;
  parent_code?: string;
  allow_posting?: boolean;
  is_active?: boolean;
  children?: AccountTemplateItem[];
}

export interface ChartOfAccountNode {
  id: string;
  account_code: string;
  account_name: string;
  account_name_en?: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_category: string;
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
  tenant_id: string;
  
  // خصائص إضافية للعرض الشجري
  children?: ChartOfAccountNode[];
  parent?: ChartOfAccountNode;
  isExpanded?: boolean;
  hasChildren?: boolean;
  path?: string;
}

export interface AccountValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface AccountFormData {
  account_code?: string;
  account_name: string;
  account_name_en?: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_category: string;
  parent_account_id?: string;
  allow_posting: boolean;
  opening_balance: number;
  notes?: string;
}

export interface SmartAccountSuggestion {
  suggested_code: string;
  suggested_name: string;
  suggested_category: string;
  confidence_score: number;
  reasoning: string;
  similar_accounts: string[];
}

export interface AccountAnalytics {
  account_id: string;
  transaction_count: number;
  total_debits: number;
  total_credits: number;
  average_transaction_amount: number;
  last_transaction_date?: string;
  trending_direction: 'up' | 'down' | 'stable';
  month_over_month_change: number;
  is_inactive_account: boolean;
  suggested_action?: string;
}

export interface BulkAccountOperation {
  operation_type: 'create' | 'update' | 'activate' | 'deactivate' | 'merge';
  accounts: (AccountFormData | string)[];
  validation_results?: AccountValidationResult[];
  success_count?: number;
  error_count?: number;
  errors?: { account: string; error: string }[];
}

export interface AccountSearchFilters {
  search_term?: string;
  account_type?: string;
  account_category?: string;
  level?: number;
  is_active?: boolean;
  allow_posting?: boolean;
  parent_account_id?: string;
  has_balance?: boolean;
  balance_range?: {
    min?: number;
    max?: number;
  };
  created_date_range?: {
    start?: string;
    end?: string;
  };
}

export interface AccountTreeViewConfig {
  show_balances: boolean;
  show_codes: boolean;
  show_inactive: boolean;
  expand_all: boolean;
  group_by_type: boolean;
  color_code_by_type: boolean;
  show_level_indicators: boolean;
  highlight_posting_accounts: boolean;
}