export interface Checkbook {
  id: string;
  tenant_id: string;
  bank_account_id: string;
  checkbook_number: string;
  start_check_number: number;
  end_check_number: number;
  total_checks: number;
  used_checks: number;
  remaining_checks: number;
  issue_date: string;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  bank_account?: {
    id: string;
    account_name: string;
    bank_name: string;
  };
}

export interface ReceivedCheck {
  id: string;
  tenant_id: string;
  check_number: string;
  drawer_name: string;
  drawer_account?: string;
  amount: number;
  check_date: string;
  received_date: string;
  due_date?: string;
  bank_name: string;
  status: 'received' | 'deposited' | 'cleared' | 'bounced' | 'cancelled';
  deposit_bank_account_id?: string;
  deposited_at?: string;
  cleared_at?: string;
  bounced_at?: string;
  bounce_reason?: string;
  reference_type?: string;
  reference_id?: string;
  journal_entry_id?: string;
  memo?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  deposit_bank_account?: {
    id: string;
    account_name: string;
    bank_name: string;
  };
}

export interface CheckFormData {
  checkbook_id?: string;
  check_number: string;
  payee_name: string;
  amount: number;
  check_date: string;
  memo?: string;
  reference_type?: string;
  reference_id?: string;
}

export interface CheckbookFormData {
  bank_account_id: string;
  checkbook_number: string;
  start_check_number: number;
  end_check_number: number;
  issue_date: string;
  notes?: string;
}

export interface ReceivedCheckFormData {
  check_number: string;
  drawer_name: string;
  drawer_account?: string;
  amount: number;
  check_date: string;
  received_date: string;
  due_date?: string;
  bank_name: string;
  memo?: string;
  reference_type?: string;
  reference_id?: string;
}

export interface CheckSummary {
  total_paid_checks: number;
  total_paid_amount: number;
  total_received_checks: number;
  total_received_amount: number;
  pending_received_checks: number;
  pending_received_amount: number;
  bounced_checks: number;
  bounced_amount: number;
}