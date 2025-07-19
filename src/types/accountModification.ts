
export interface AccountModificationRequest {
  id: string;
  account_id: string;
  requester_id: string;
  approver_id?: string;
  tenant_id: string;
  request_type: 'update_code' | 'update_name' | 'update_type' | 'update_category' | 'deactivate' | 'other';
  current_values: Record<string, any>;
  proposed_values: Record<string, any>;
  justification: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requested_at: string;
  reviewed_at?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface AccountAuditLog {
  id: string;
  account_id: string;
  user_id: string;
  tenant_id: string;
  action_type: 'created' | 'updated' | 'locked' | 'unlocked' | 'approved_modification' | 'rejected_modification';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  modification_request_id?: string;
  ip_address?: string;
  user_agent?: string;
  notes?: string;
  created_at: string;
}

export interface CanModifyAccountResult {
  can_modify: boolean;
  reason: string;
  requires_approval: boolean;
  has_transactions?: boolean;
}

export interface ModificationRequestFormData {
  request_type: 'update_code' | 'update_name' | 'update_type' | 'update_category' | 'deactivate' | 'other';
  proposed_values: Record<string, any>;
  justification: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}
