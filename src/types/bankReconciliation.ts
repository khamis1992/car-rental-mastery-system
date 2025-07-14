export interface BankReconciliationImport {
  id: string;
  bank_account_id: string;
  import_date: string;
  file_name?: string;
  file_size?: number;
  total_transactions: number;
  matched_transactions: number;
  unmatched_transactions: number;
  import_status: 'pending' | 'processing' | 'completed' | 'failed';
  imported_by?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface ImportedBankTransaction {
  id: string;
  import_id: string;
  bank_account_id: string;
  transaction_date: string;
  description: string;
  reference_number?: string;
  debit_amount: number;
  credit_amount: number;
  balance_after?: number;
  bank_reference?: string;
  check_number?: string;
  matched_journal_entry_id?: string;
  match_confidence: number;
  match_type?: 'manual' | 'automatic' | 'suggested';
  matched_at?: string;
  matched_by?: string;
  tenant_id: string;
  created_at: string;
  is_matched: boolean;
  match_notes?: string;
}

export interface BankReconciliationMatch {
  id: string;
  imported_transaction_id: string;
  journal_entry_id: string;
  match_amount: number;
  match_confidence: number;
  match_type: 'manual' | 'automatic' | 'suggested';
  match_reason?: string;
  matched_by: string;
  matched_at: string;
  tenant_id: string;
  created_at: string;
  is_confirmed: boolean;
  notes?: string;
}

export interface BankReconciliationReport {
  id: string;
  bank_account_id: string;
  reconciliation_date: string;
  opening_balance: number;
  closing_balance: number;
  book_balance: number;
  total_deposits: number;
  total_withdrawals: number;
  outstanding_deposits: number;
  outstanding_withdrawals: number;
  bank_charges: number;
  interest_earned: number;
  reconciled_balance: number;
  variance_amount: number;
  reconciliation_status: 'draft' | 'in_progress' | 'completed' | 'approved';
  prepared_by: string;
  approved_by?: string;
  approved_at?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface BankReconciliationFormData {
  bank_account_id: string;
  reconciliation_date: string;
  import_file?: File;
}

export interface ImportFileData {
  transactions: {
    date: string;
    description: string;
    reference?: string;
    debit: number;
    credit: number;
    balance?: number;
  }[];
}

export interface MatchSuggestion {
  imported_transaction: ImportedBankTransaction;
  suggested_matches: {
    journal_entry_id: string;
    confidence: number;
    reasons: string[];
  }[];
}

export interface ReconciliationStatistics {
  total_imported: number;
  total_matched: number;
  total_unmatched: number;
  matching_percentage: number;
  total_variance: number;
  last_reconciliation_date?: string;
}