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

// No mock data - using real database

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
    let query = supabase
      .from('payroll')
      .select(`
        *,
        employees!employee_id(
          id,
          employee_number,
          first_name,
          last_name,
          position,
          department
        )
      `)
      .order('created_at', { ascending: false });

    // تطبيق الفلاتر
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }

    if (filters?.month && filters?.year) {
      const startDate = `${filters.year}-${filters.month.toString().padStart(2, '0')}-01`;
      const endDate = `${filters.year}-${filters.month.toString().padStart(2, '0')}-31`;
      query = query.gte('pay_period_start', startDate).lte('pay_period_end', endDate);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    let results = (data || []).map(payroll => ({
      ...payroll,
      employee_name: payroll.employees ? `${payroll.employees.first_name} ${payroll.employees.last_name}` : '',
      employee_number: payroll.employees?.employee_number || ''
    }));

    // فلترة البحث النصي
    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      results = results.filter(payroll => 
        payroll.employee_name.toLowerCase().includes(searchLower) ||
        payroll.employee_number.toLowerCase().includes(searchLower)
      );
    }

    // فلترة القسم
    if (filters?.department) {
      results = results.filter(payroll => 
        payroll.employees?.department === filters.department
      );
    }

    return results as PayrollWithDetails[];
  },

  // إنشاء سجل راتب جديد
  async createPayroll(payrollData: Omit<Payroll, 'id' | 'created_at' | 'updated_at'>): Promise<Payroll> {
    const { data, error } = await supabase
      .from('payroll')
      .insert({
        ...payrollData,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as Payroll;
  },

  // تحديث سجل راتب
  async updatePayroll(id: string, updates: Partial<Payroll>): Promise<Payroll> {
    const { data, error } = await supabase
      .from('payroll')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Payroll;
  },

  // حذف سجل راتب
  async deletePayroll(id: string): Promise<void> {
    const { error } = await supabase
      .from('payroll')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // حساب الراتب تلقائياً بناءً على بيانات الموظف والحضور
  async calculatePayroll(employeeId: string, periodStart: string, periodEnd: string): Promise<Partial<Payroll>> {
    // جلب بيانات الموظف
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (employeeError || !employee) {
      throw new Error('لم يتم العثور على بيانات الموظف');
    }

    // حساب الحضور للفترة المحددة
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('date', periodStart)
      .lte('date', periodEnd);

    const settings = await this.getPayrollSettings();
    
    // استخدام راتب الموظف الفعلي
    const basicSalary = employee.salary;
    const actualAttendanceDays = attendanceData?.length || settings.working_days_per_month;
    const totalOvertimeHours = attendanceData?.reduce((sum, record) => sum + (record.overtime_hours || 0), 0) || 0;
    
    const hourlyRate = basicSalary / (settings.working_days_per_month * settings.working_hours_per_day);
    const overtimeAmount = totalOvertimeHours * hourlyRate * settings.overtime_multiplier;
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
      actual_working_days: actualAttendanceDays,
      overtime_hours: totalOvertimeHours,
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
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    // جلب جميع الموظفين النشطين
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, salary')
      .eq('status', 'active');

    if (employeesError) throw employeesError;
    
    let calculatedCount = 0;
    
    for (const employee of employees || []) {
      // التحقق من وجود سجل راتب للفترة المحددة
      const { data: existingPayroll } = await supabase
        .from('payroll')
        .select('id')
        .eq('employee_id', employee.id)
        .eq('pay_period_start', startDate)
        .eq('pay_period_end', endDate)
        .single();

      if (!existingPayroll) {
        // حساب الراتب للموظف
        const payrollData = await this.calculatePayroll(employee.id, startDate, endDate);
        
        // إنشاء سجل الراتب
        await this.createPayroll({
          ...payrollData,
          gross_salary: payrollData.basic_salary! + payrollData.overtime_amount! + payrollData.allowances! + payrollData.bonuses!,
          net_salary: payrollData.basic_salary! + payrollData.overtime_amount! + payrollData.allowances! + payrollData.bonuses! - payrollData.deductions! - payrollData.tax_deduction! - payrollData.social_insurance!
        } as Omit<Payroll, 'id' | 'created_at' | 'updated_at'>);
        
        calculatedCount++;
      }
    }
    
    return calculatedCount;
  },

  // إنشاء سجل راتب تلقائياً للموظف الجديد
  async createPayrollForNewEmployee(employeeId: string): Promise<void> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`;
    
    // التحقق من عدم وجود سجل راتب للشهر الحالي
    const { data: existingPayroll } = await supabase
      .from('payroll')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('pay_period_start', startDate)
      .eq('pay_period_end', endDate)
      .single();

    if (!existingPayroll) {
      const payrollData = await this.calculatePayroll(employeeId, startDate, endDate);
      
      await this.createPayroll({
        ...payrollData,
        gross_salary: payrollData.basic_salary! + payrollData.overtime_amount! + payrollData.allowances! + payrollData.bonuses!,
        net_salary: payrollData.basic_salary! + payrollData.overtime_amount! + payrollData.allowances! + payrollData.bonuses! - payrollData.deductions! - payrollData.tax_deduction! - payrollData.social_insurance!
      } as Omit<Payroll, 'id' | 'created_at' | 'updated_at'>);
    }
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
    let query = supabase.from('payroll').select('*');
    
    if (month && year) {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
      query = query.gte('pay_period_start', startDate).lte('pay_period_end', endDate);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    const payrollData = data || [];
    const totalGross = payrollData.reduce((sum, p) => sum + (p.gross_salary || 0), 0);
    const totalNet = payrollData.reduce((sum, p) => sum + (p.net_salary || 0), 0);
    const totalDeductions = payrollData.reduce((sum, p) => 
      sum + (p.deductions || 0) + (p.tax_deduction || 0) + (p.social_insurance || 0), 0);
    const paidCount = payrollData.filter(p => p.status === 'paid').length;
    const totalCount = payrollData.length;

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