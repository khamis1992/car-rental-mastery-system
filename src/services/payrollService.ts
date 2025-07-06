import { supabase } from '@/integrations/supabase/client';
import { Payroll, PayrollItem } from '@/types/hr';
import { attendanceDeductionsService } from './attendanceDeductionsService';
import { payrollAccountingService } from './payrollAccountingService';

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
  // إعدادات خصومات الحضور
  enable_late_deduction: boolean;
  enable_absence_deduction: boolean;
  working_hours_per_month: number;
  grace_period_minutes: number;
  late_deduction_multiplier: number;
  official_work_start_time: string;
  official_work_end_time: string;
}

// No mock data - using real database

const defaultSettings: PayrollSettings = {
  tax_rate: 5.0,
  social_insurance_rate: 6.0,
  overtime_multiplier: 1.5,
  working_hours_per_day: 8,
  working_days_per_month: 22,
  tax_threshold: 0,
  max_social_insurance: 2000,
  // إعدادات خصومات الحضور
  enable_late_deduction: true,
  enable_absence_deduction: true,
  working_hours_per_month: 240,
  grace_period_minutes: 15,
  late_deduction_multiplier: 1,
  official_work_start_time: '08:00',
  official_work_end_time: '17:00'
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

  // إنشاء سجل راتب جديد مع القيود المحاسبية
  async createPayroll(payrollData: Omit<Payroll, 'id' | 'created_at' | 'updated_at'>): Promise<Payroll> {
    try {
      // إنشاء سجل الراتب
      const { data, error } = await supabase
        .from('payroll')
        .insert(payrollData)
        .select()
        .single();

      if (error) throw error;

      // إنشاء القيد المحاسبي - إجباري
      try {
        const { data: employee } = await supabase
          .from('employees')
          .select('first_name, last_name, employee_number')
          .eq('id', payrollData.employee_id)
          .single();

        if (!employee) {
          throw new Error('بيانات الموظف غير موجودة');
        }

        const journalEntryId = await payrollAccountingService.createPayrollAccountingEntry({
          payroll_id: data.id,
          employee_name: `${employee.first_name} ${employee.last_name}`,
          employee_number: employee.employee_number,
          pay_period: `${payrollData.pay_period_start} - ${payrollData.pay_period_end}`,
          basic_salary: payrollData.basic_salary,
          overtime_amount: payrollData.overtime_amount,
          allowances: payrollData.allowances,
          bonuses: payrollData.bonuses,
          deductions: payrollData.deductions,
          tax_deduction: payrollData.tax_deduction,
          social_insurance: payrollData.social_insurance,
          gross_salary: payrollData.gross_salary,
          net_salary: payrollData.net_salary
        });

        if (!journalEntryId) {
          throw new Error('فشل في إنشاء القيد المحاسبي للراتب');
        }

        // تحديث سجل الراتب بمعرف القيد
        await this.updatePayrollWithJournalEntry(data.id, journalEntryId);

      } catch (accountingError) {
        // حذف سجل الراتب إذا فشل إنشاء القيد المحاسبي
        try {
          await supabase.from('payroll').delete().eq('id', data.id);
        } catch (deleteError) {
          console.error('Failed to rollback payroll after accounting error:', deleteError);
        }
        
        throw new Error(`فشل في إنشاء القيد المحاسبي: ${accountingError.message}`);
      }

      return data as Payroll;
    } catch (error) {
      console.error('Error creating payroll:', error);
      throw new Error(`فشل في إنشاء سجل الراتب: ${error.message}`);
    }
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
    
    // حساب خصومات التأخير والغياب
    let attendanceDeductions = 0;
    if (settings.enable_late_deduction || settings.enable_absence_deduction) {
      const deductionCalculation = await attendanceDeductionsService.calculateEmployeeDeductions(
        employeeId,
        basicSalary,
        periodStart,
        periodEnd
      );
      attendanceDeductions = deductionCalculation.totalDeduction;
    }
    
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
      deductions: Math.round(attendanceDeductions * 1000) / 1000,
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

  // موافقة على الراتب مع إنشاء القيود المحاسبية
  async approvePayroll(id: string): Promise<Payroll> {
    const updatedPayroll = await this.updatePayroll(id, {
      status: 'approved',
      approved_at: new Date().toISOString()
    });

    // إنشاء القيود المحاسبية عند الموافقة
    try {
      // التحقق من عدم وجود قيود محاسبية مسبقاً
      const hasEntries = await payrollAccountingService.hasAccountingEntries(id);
      
      if (!hasEntries) {
        // جلب بيانات الموظف
        const { data: employee } = await supabase
          .from('employees')
          .select('first_name, last_name, employee_number')
          .eq('id', updatedPayroll.employee_id)
          .single();

        if (employee) {
          await payrollAccountingService.createPayrollAccountingEntry({
            payroll_id: id,
            employee_name: `${employee.first_name} ${employee.last_name}`,
            employee_number: employee.employee_number,
            pay_period: `${updatedPayroll.pay_period_start} - ${updatedPayroll.pay_period_end}`,
            basic_salary: updatedPayroll.basic_salary,
            overtime_amount: updatedPayroll.overtime_amount,
            allowances: updatedPayroll.allowances,
            bonuses: updatedPayroll.bonuses,
            deductions: updatedPayroll.deductions,
            tax_deduction: updatedPayroll.tax_deduction,
            social_insurance: updatedPayroll.social_insurance,
            gross_salary: updatedPayroll.gross_salary,
            net_salary: updatedPayroll.net_salary
          });
        }
      }
    } catch (accountingError) {
      console.error('خطأ في إنشاء القيود المحاسبية:', accountingError);
    }

    return updatedPayroll;
  },

  // تسجيل دفع الراتب مع القيود المحاسبية
  async markPayrollAsPaid(id: string, paymentData?: {
    payment_method?: 'cash' | 'bank_transfer' | 'check';
    bank_account_id?: string;
    reference_number?: string;
  }): Promise<Payroll> {
    const updatedPayroll = await this.updatePayroll(id, {
      status: 'paid',
      paid_at: new Date().toISOString()
    });

    // إنشاء قيد دفع الراتب
    if (paymentData?.payment_method) {
      try {
        // جلب بيانات الموظف
        const { data: employee } = await supabase
          .from('employees')
          .select('first_name, last_name')
          .eq('id', updatedPayroll.employee_id)
          .single();

        if (employee) {
          await payrollAccountingService.createPayrollPaymentEntry(id, {
            employee_name: `${employee.first_name} ${employee.last_name}`,
            net_salary: updatedPayroll.net_salary,
            payment_method: paymentData.payment_method,
            bank_account_id: paymentData.bank_account_id,
            reference_number: paymentData.reference_number
          });
        }
      } catch (paymentError) {
        console.error('خطأ في إنشاء قيد دفع الراتب:', paymentError);
      }
    }

    return updatedPayroll;
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
  },

  // تقرير تفصيلي لخصومات الحضور والغياب
  async getAttendanceDeductionReport(employeeId: string, periodStart: string, periodEnd: string) {
    return await attendanceDeductionsService.generateDeductionReport(employeeId, periodStart, periodEnd);
  },

  // تحديث إعدادات خصومات الحضور
  async updateAttendanceDeductionSettings(settings: {
    enable_late_deduction: boolean;
    enable_absence_deduction: boolean;
    working_hours_per_month: number;
    grace_period_minutes: number;
    late_deduction_multiplier: number;
    official_work_start_time: string;
    official_work_end_time: string;
  }) {
    // تحديث الإعدادات المحلية
    Object.assign(defaultSettings, settings);
    
    // تحديث إعدادات خدمة خصومات الحضور
    await attendanceDeductionsService.updateDeductionSettings({
      enableLateDeduction: settings.enable_late_deduction,
      enableAbsenceDeduction: settings.enable_absence_deduction,
      workingHoursPerMonth: settings.working_hours_per_month,
      gracePeriodMinutes: settings.grace_period_minutes,
      lateDeductionMultiplier: settings.late_deduction_multiplier,
      officialWorkStartTime: settings.official_work_start_time,
      officialWorkEndTime: settings.official_work_end_time
    });
    
    return defaultSettings;
  },

  // جلب التقرير المحاسبي للرواتب
  async getPayrollAccountingReport(filters?: {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    department?: string;
  }) {
    return await payrollAccountingService.getPayrollAccountingReport(filters || {});
  },

  // جلب ملخص محاسبي للرواتب
  async getPayrollAccountingSummary(period: { year: number; month?: number }) {
    return await payrollAccountingService.getPayrollAccountingSummary(period);
  },

  // التحقق من وجود قيود محاسبية للراتب
  async hasAccountingEntries(payrollId: string): Promise<boolean> {
    return await payrollAccountingService.hasAccountingEntries(payrollId);
  },

  // حذف القيود المحاسبية للراتب
  async deleteAccountingEntries(payrollId: string): Promise<void> {
    return await payrollAccountingService.deletePayrollAccountingEntries(payrollId);
  },

  // تحديث سجل الراتب بمعرف القيد
  async updatePayrollWithJournalEntry(payrollId: string, journalEntryId: string): Promise<void> {
    await supabase
      .from('payroll')
      .update({
        journal_entry_id: journalEntryId
      })
      .eq('id', payrollId);
  }
};