export interface ViolationType {
  id: string;
  violation_code: string;
  violation_name_ar: string;
  violation_name_en?: string;
  description?: string;
  base_fine_amount: number;
  points: number;
  is_active: boolean;
  category: 'speed' | 'parking' | 'traffic_light' | 'general';
  severity_level: 'minor' | 'moderate' | 'major' | 'severe';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TrafficViolation {
  id: string;
  violation_number: string;
  violation_type_id: string;
  violation_date: string;
  violation_time?: string;
  location?: string;
  description?: string;
  vehicle_id: string;
  contract_id?: string;
  customer_id: string;
  official_violation_number?: string;
  issuing_authority?: string;
  officer_name?: string;
  fine_amount: number;
  processing_fee: number;
  total_amount: number;
  liability_determination: 'pending' | 'customer' | 'company' | 'shared';
  liability_percentage: number;
  liability_reason?: string;
  liability_determined_by?: string;
  liability_determined_at?: string;
  status: 'pending' | 'notified' | 'paid' | 'disputed' | 'closed';
  payment_status: 'unpaid' | 'paid' | 'partial';
  payment_due_date?: string;
  paid_amount: number;
  evidence_photos?: string[];
  documents?: string[];
  notes?: string;
  customer_notified_at?: string;
  follow_up_date?: string;
  closed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ViolationPayment {
  id: string;
  payment_number: string;
  violation_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'check';
  transaction_reference?: string;
  bank_name?: string;
  check_number?: string;
  receipt_url?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ViolationHistory {
  id: string;
  violation_id: string;
  action_type: 'created' | 'notified' | 'liability_determined' | 'payment_received' | 'status_changed';
  description: string;
  old_value?: string;
  new_value?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface ViolationWithDetails extends TrafficViolation {
  violation_types?: ViolationType;
  customers?: {
    name: string;
    phone: string;
    customer_number: string;
  };
  vehicles?: {
    license_plate: string;
    make: string;
    model: string;
    vehicle_number: string;
  };
  contracts?: {
    contract_number: string;
  };
}

export interface ViolationStats {
  total_violations: number;
  pending_violations: number;
  paid_violations: number;
  disputed_violations: number;
  total_fines_amount: number;
  total_paid_amount: number;
  total_outstanding_amount: number;
  customer_liability_violations: number;
  company_liability_violations: number;
}

export interface ViolationReport {
  id: string;
  report_name: string;
  report_type: 'summary' | 'detailed' | 'analysis' | 'comparison';
  description: string;
  filters: {
    date_from?: string;
    date_to?: string;
    status?: string;
    liability_determination?: string;
    customer_id?: string;
    vehicle_id?: string;
    violation_type_id?: string;
  };
  data: any;
  generated_at: string;
  generated_by: string;
}

export interface ViolationReportData {
  total_violations: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  violations_by_status: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
  violations_by_type: Array<{
    type_name: string;
    count: number;
    amount: number;
  }>;
  violations_by_liability: Array<{
    liability: string;
    count: number;
    amount: number;
  }>;
  monthly_trend: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
}