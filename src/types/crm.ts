// أنواع بيانات CRM والخدمات المتقدمة
export interface Customer {
  id: string;
  customer_code: string;
  customer_number: string;
  name: string;
  email: string | null;
  phone: string;
  type: 'individual' | 'corporate';
  company_name?: string | null;
  lifecycle_stage: 'prospect' | 'lead' | 'customer' | 'loyal_customer' | 'vip_customer' | 'churned' | 'inactive';
  segments: string[];
  tags: string[];
  source: string | null;
  assigned_to: string | null;
  secondary_phone: string | null;
  identification: any;
  financial_info: any;
  preferences: any;
  address: string | null;
  city: string | null;
  country: string | null;
  rating: number | null;
  status: 'active' | 'inactive' | 'blocked';
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessEvent {
  id: string;
  event_type: string;
  source_service: string;
  source_id: string | null;
  aggregate_id: string | null;
  aggregate_type: string | null;
  event_data: any;
  metadata: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  retry_count: number;
  max_retries: number;
  scheduled_at: string;
  processed: boolean;
  processed_at: string | null;
  processing_time_ms: number | null;
  error: string | null;
  failed_at: string | null;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerActivity {
  id: string;
  customer_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  date: string;
  performed_by: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  metadata: any;
  tenant_id: string;
  created_at: string;
}

export interface SalesOpportunity {
  id: string;
  customer_id: string;
  opportunity_name: string;
  description: string | null;
  stage: 'prospecting' | 'qualification' | 'needs_analysis' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'on_hold';
  probability: number;
  value: number;
  currency: string;
  expected_close_date: string | null;
  actual_close_date: string | null;
  source: string | null;
  assigned_to: string | null;
  products_services: any;
  competitors: string[];
  notes: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  type: string;
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
  target_audience: string[];
  start_date: string | null;
  end_date: string | null;
  budget: number;
  spent: number;
  channels: string[];
  message: string | null;
  metrics: any;
  created_by: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  customer_id: string;
  ticket_number: string;
  subject: string;
  description: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'escalated' | 'resolved' | 'closed' | 'cancelled';
  assigned_to: string | null;
  created_by: string | null;
  resolution: string | null;
  satisfaction_score: number | null;
  tags: string[];
  attachments: string[];
  resolved_at: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  tenant_id: string | null;
  token: string;
  refresh_token: string | null;
  device_fingerprint: string | null;
  ip_address: string | null;
  user_agent: string | null;
  location: any;
  created_at: string;
  last_activity: string;
  expires_at: string;
  is_active: boolean;
  is_trusted_device: boolean;
  mfa_verified: boolean;
  session_data: any;
}

export interface TrustedDevice {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string | null;
  device_type: string | null;
  os_info: string | null;
  browser_info: string | null;
  trusted_at: string;
  expires_at: string | null;
  last_used: string;
  created_at: string;
}

export interface SecurityLog {
  id: string;
  user_id: string | null;
  tenant_id: string | null;
  event_type: string;
  event_description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  location: any;
  risk_score: number;
  timestamp: string;
  additional_data: any;
}

export interface UnifiedDataEntity {
  id: string;
  entity_type: string;
  entity_id: string;
  data: any;
  version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  tenant_id: string;
  source_system: string | null;
  checksum: string | null;
  metadata: any;
}

export interface DataAuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  field_name: string | null;
  old_value: any;
  new_value: any;
  changed_by: string | null;
  change_reason: string | null;
  timestamp: string;
  ip_address: string | null;
  user_agent: string | null;
  tenant_id: string;
}

export interface SyncResult {
  id: string;
  sync_id: string;
  entity_type: string;
  status: 'success' | 'partial' | 'failed';
  total_records: number | null;
  processed_records: number | null;
  failed_records: number | null;
  conflicts: any[];
  errors: any[];
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  tenant_id: string;
  created_at: string;
}

// أنواع بيانات لأجهزة الدفع والفوترة
export interface APIRequest {
  id: string;
  request_id: string;
  method: string;
  path: string;
  client_id: string;
  user_id: string | null;
  tenant_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_headers: any;
  request_body: any;
  response_status: number | null;
  response_headers: any;
  response_body: any;
  response_size: number | null;
  processing_time_ms: number | null;
  cache_hit: boolean;
  error_message: string | null;
  timestamp: string;
}

export interface APICache {
  id: string;
  cache_key: string;
  response_data: any;
  expires_at: string;
  tags: string[];
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceHealth {
  id: string;
  service_name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time: number | null;
  error_rate: number | null;
  last_check: string;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

// أنواع بيانات خاصة بالمؤسسة
export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan_type: string;
  plan_name: string;
  price_per_month: number;
  billing_cycle: string;
  status: string;
  starts_at: string;
  expires_at: string;
  auto_renew: boolean;
  payment_method: string;
  discount_amount: number;
  created_at: string;
  updated_at: string;
}

export interface TenantResource {
  id: string;
  tenant_id: string;
  resource_type: string;
  allocated_amount: number;
  used_amount: number;
  unit_type: string;
  cost_per_unit: number;
  billing_period: string;
  last_calculated: string;
  created_at: string;
  updated_at: string;
}

export interface TenantUsageMetric {
  id: string;
  tenant_id: string;
  metric_type: string;
  metric_value: number;
  metric_unit: string;
  recorded_at: string;
  metadata: any;
  created_at: string;
}

// أنواع بيانات خاصة بالذكاء الاصطناعي
export interface AIInsight {
  id: string;
  insight_type: string;
  insight_title: string;
  insight_description: string;
  insight_data: any;
  priority_level: string;
  affected_accounts: string[];
  recommended_actions: string[];
  is_dismissed: boolean;
  dismissed_at: string | null;
  dismissed_by: string | null;
  created_at: string;
  created_by: string | null;
}

export interface AIClassification {
  id: string;
  transaction_id: string;
  transaction_type: string;
  suggested_category: string;
  suggested_account_id: string | null;
  confidence_score: number;
  ai_reasoning: string | null;
  model_version: string | null;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  created_by: string | null;
}

// أنواع بيانات خاصة بالموازنة والتنبؤ
export interface Budget {
  id: string;
  budget_name: string;
  budget_year: number;
  budget_period: string;
  start_date: string;
  end_date: string;
  total_revenue_budget: number;
  total_expense_budget: number;
  status: string;
  approved_at: string | null;
  approved_by: string | null;
  notes: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  account_id: string;
  item_type: string;
  budgeted_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_percentage: number;
  q1_amount: number;
  q2_amount: number;
  q3_amount: number;
  q4_amount: number;
  notes: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
} 