export interface Employee {
  id: string;
  employee_number: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  national_id?: string;
  position: string;
  department: string;
  department_id?: string;
  hire_date: string;
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  manager_id?: string;
  work_location_id?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  bank_account_number?: string;
  bank_name?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface WorkLocation {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  radius_meters: number;
  is_active: boolean;
  working_hours_start?: string;
  working_hours_end?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  total_hours?: number;
  overtime_hours: number;
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'sick' | 'vacation';
  location_latitude?: number;
  location_longitude?: number;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'maternity' | 'emergency' | 'unpaid';
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Payroll {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  basic_salary: number;
  overtime_amount: number;
  allowances: number;
  bonuses: number;
  deductions: number;
  tax_deduction: number;
  social_insurance: number;
  gross_salary: number;
  net_salary: number;
  total_working_days?: number;
  actual_working_days?: number;
  overtime_hours: number;
  status: 'draft' | 'calculated' | 'approved' | 'paid';
  approved_by?: string;
  approved_at?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollItem {
  id: string;
  payroll_id: string;
  item_type: 'allowance' | 'bonus' | 'deduction';
  item_name: string;
  amount: number;
  description?: string;
  created_at: string;
}