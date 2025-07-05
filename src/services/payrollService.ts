import { supabase } from '@/integrations/supabase/client';
import { Payroll, PayrollItem } from '@/types/hr';

export interface PayrollWithDetails extends Payroll {
  employee_name?: string;
  employee_number?: string;
}

export interface PayrollFilters {
  status?: string;
  employeeId?: string;
  department?: string;
  month?: number;
  year?: number;
  searchTerm?: string;
}

export interface PayrollSettings {
  id?: string;
  tax_rate: number;
  social_insurance_rate: number;
  overtime_multiplier: number;
  working_hours_per_day: number;
  working_days_per_month: number;
  tax_threshold: number;
  max_social_insurance: number;
}

// Mock data for demonstration - will be replaced with real database calls when tables are ready
const mockPayrollData: PayrollWithDetails[] = [
  {
    id: '1',
    employee_id: 'emp1',
    employee_name: 'أحمد علي محمد',
    employee_number: 'EMP001',
    pay_period_start: '2024-01-01',
    pay_period_end: '2024-01-31',
    basic_salary: 1000,
    overtime_amount: 150,
    allowances: 200,
    bonuses: 100,
    deductions: 50,
    tax_deduction: 75,
    social_insurance: 60,
    gross_salary: 1450,
    net_salary: 1265,
    total_working_days: 22,
    actual_working_days: 20,
    overtime_hours: 8,
    status: 'paid',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    employee_id: 'emp2',
    employee_name: 'فاطمة حسن',
    employee_number: 'EMP002',
    pay_period_start: '2024-01-01',
    pay_period_end: '2024-01-31',
    basic_salary: 800,
    overtime_amount: 0,
    allowances: 150,
    bonuses: 0,
    deductions: 0,
    tax_deduction: 40,
    social_insurance: 48,
    gross_salary: 950,
    net_salary: 862,
    total_working_days: 22,
    actual_working_days: 22,
    overtime_hours: 0,
    status: 'approved',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    employee_id: 'emp3',
    employee_name: 'محمد السعيد',
    employee_number: 'EMP003',
    pay_period_start: '2024-01-01',
    pay_period_end: '2024-01-31',
    basic_salary: 1200,
    overtime_amount: 200,
    allowances: 300,
    bonuses: 150,
    deductions: 100,
    tax_deduction: 90,
    social_insurance: 72,
    gross_salary: 1850,
    net_salary: 1588,
    total_working_days: 22,
    actual_working_days: 21,
    overtime_hours: 12,
    status: 'calculated',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const defaultSettings: PayrollSettings = {
  tax_rate: 5.0,
  social_insurance_rate: 6.0,
  overtime_multiplier: 1.5,
  working_hours_per_day: 8,
  working_days_per_month: 22,
  tax_threshold: 0,
  max_social_insurance: 2000
};

export const payrollService = {
  // جلب جميع سجلات الرواتب مع التفاصيل
  async getAllPayroll(filters?: PayrollFilters): Promise<PayrollWithDetails[]> {
    // محاكاة استدعاء قاعدة البيانات
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let results = [...mockPayrollData];

    // تطبيق الفلاتر
    if (filters?.status && filters.status !== 'all') {
      results = results.filter(payroll => payroll.status === filters.status);
    }

    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      results = results.filter(payroll => 
        payroll.employee_name?.toLowerCase().includes(searchLower) ||
        payroll.employee_number?.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.month && filters?.year) {
      const targetDate = `${filters.year}-${filters.month.toString().padStart(2, '0')}`;
      results = results.filter(payroll => 
        payroll.pay_period_start.startsWith(targetDate)
      );
    }

    return results;
  },

  // إنشاء سجل راتب جديد
  async createPayroll(payrollData: Omit<Payroll, 'id' | 'created_at' | 'updated_at'>): Promise<Payroll> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newPayroll: Payroll = {
      ...payrollData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return newPayroll;
  },

  // تحديث سجل راتب
  async updatePayroll(id: string, updates: Partial<Payroll>): Promise<Payroll> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockPayrollData.findIndex(p => p.id === id);
    if (index !== -1) {
      mockPayrollData[index] = {
        ...mockPayrollData[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      return mockPayrollData[index];
    }
    
    throw new Error('سجل الراتب غير موجود');
  },

  // حذف سجل راتب
  async deletePayroll(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockPayrollData.findIndex(p => p.id === id);
    if (index !== -1) {
      mockPayrollData.splice(index, 1);
    }
  },

  // حساب الراتب تلقائياً بناءً على الحضور
  async calculatePayroll(employeeId: string, periodStart: string, periodEnd: string): Promise<Partial<Payroll>> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // محاكاة حساب الراتب بناءً على الحضور
    const settings = await this.getPayrollSettings();
    
    // قيم تجريبية للحساب
    const basicSalary = 1000;
    const workingDays = 20;
    const overtimeHours = 5;
    const hourlyRate = basicSalary / (settings.working_days_per_month * settings.working_hours_per_day);
    const overtimeAmount = overtimeHours * hourlyRate * settings.overtime_multiplier;
    const grossSalary = basicSalary + overtimeAmount;
    const taxDeduction = grossSalary * (settings.tax_rate / 100);
    const socialInsurance = Math.min(grossSalary * (settings.social_insurance_rate / 100), settings.max_social_insurance);

    return {
      employee_id: employeeId,
      pay_period_start: periodStart,
      pay_period_end: periodEnd,
      basic_salary: Math.round(basicSalary * 1000) / 1000,
      overtime_amount: Math.round(overtimeAmount * 1000) / 1000,
      allowances: 0,
      bonuses: 0,
      deductions: 0,
      tax_deduction: Math.round(taxDeduction * 1000) / 1000,
      social_insurance: Math.round(socialInsurance * 1000) / 1000,
      total_working_days: settings.working_days_per_month,
      actual_working_days: workingDays,
      overtime_hours: overtimeHours,
      status: 'calculated' as const
    };
  },

  // جلب إعدادات الرواتب
  async getPayrollSettings(): Promise<PayrollSettings> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return defaultSettings;
  },

  // تحديث إعدادات الرواتب
  async updatePayrollSettings(settings: Omit<PayrollSettings, 'id'>): Promise<PayrollSettings> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    Object.assign(defaultSettings, settings);
    return defaultSettings;
  },

  // حساب رواتب متعددة للشهر
  async calculateMonthlyPayroll(year: number, month: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // محاكاة حساب رواتب متعددة
    return Math.floor(Math.random() * 10) + 5; // إرجاع رقم عشوائي بين 5-15
  },

  // موافقة على الراتب
  async approvePayroll(id: string): Promise<Payroll> {
    return this.updatePayroll(id, {
      status: 'approved',
      approved_at: new Date().toISOString()
    });
  },

  // تسجيل دفع الراتب
  async markPayrollAsPaid(id: string): Promise<Payroll> {
    return this.updatePayroll(id, {
      status: 'paid',
      paid_at: new Date().toISOString()
    });
  },

  // إحصائيات الرواتب
  async getPayrollStats(month?: number, year?: number) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let data = mockPayrollData;
    
    if (month && year) {
      const targetDate = `${year}-${month.toString().padStart(2, '0')}`;
      data = data.filter(payroll => 
        payroll.pay_period_start.startsWith(targetDate)
      );
    }

    const totalGross = data.reduce((sum, p) => sum + p.gross_salary, 0);
    const totalNet = data.reduce((sum, p) => sum + p.net_salary, 0);
    const totalDeductions = data.reduce((sum, p) => 
      sum + p.deductions + p.tax_deduction + p.social_insurance, 0);
    const paidCount = data.filter(p => p.status === 'paid').length;
    const totalCount = data.length;

    return {
      totalGross,
      totalNet,
      totalDeductions,
      paidCount,
      totalCount,
      pendingCount: totalCount - paidCount
    };
  },

  // جلب الموظفين للفلترة
  async getEmployeesForFilter() {
    const { data, error } = await supabase
      .from('employees')
      .select('id, employee_number, first_name, last_name, department')
      .eq('status', 'active')
      .order('first_name');
    
    if (error) throw error;
    return data || [];
  },

  // جلب الأقسام للفلترة
  async getDepartmentsForFilter() {
    const { data, error } = await supabase
      .from('departments')
      .select('department_name')
      .eq('is_active', true)
      .order('department_name');
    
    if (error) throw error;
    return data?.map(dept => dept.department_name) || [];
  }
};