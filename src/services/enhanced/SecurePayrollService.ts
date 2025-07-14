import { supabase } from '@/integrations/supabase/client';
import { Payroll } from '@/types/hr';
import { DataSecurityService } from './DataSecurityService';
import { payrollAccountingService } from '../payrollAccountingService';

export interface SecurePayrollData extends Omit<Payroll, 'id' | 'created_at' | 'updated_at'> {
  // إضافة خصائص أمنية إضافية إذا لزم الأمر
}

export interface PayrollFilters {
  status?: string;
  employeeId?: string;
  department?: string;
  month?: number;
  year?: number;
  searchTerm?: string;
}

export class SecurePayrollService {
  private securityService: DataSecurityService;

  constructor() {
    this.securityService = new DataSecurityService('payroll');
  }

  // جلب جميع سجلات الرواتب مع التفاصيل والأمان
  async getAllPayroll(filters?: PayrollFilters): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      await this.securityService.validateTenantAccess();
      
      const tenantId = await this.securityService.getCurrentTenantId();
      
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
            department,
            tenant_id
          )
        `)
        .eq('employees.tenant_id', tenantId) // ضمان عزل البيانات على مستوى الموظفين
        .order('created_at', { ascending: false });

      // تطبيق الفلاتر
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.employeeId) {
        // التحقق من صحة معرف الموظف
        const isValidEmployee = await this.securityService.validateEmployeeAccess(filters.employeeId);
        if (!isValidEmployee) {
          throw new Error('غير مصرح للوصول إلى بيانات هذا الموظف');
        }
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

      // تسجيل العملية للمراقبة
      await this.securityService.logDataOperation('SELECT', 'payroll', {
        operation: 'get_all_payroll',
        records_count: results.length,
        filters: filters
      });

      return { data: results, error: null };
    } catch (error) {
      console.error('خطأ في جلب سجلات الرواتب الآمنة:', error);
      await this.securityService.logSecurityEvent('payroll_access_failed', {
        filters: filters,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { data: null, error: error as Error };
    }
  }

  // إنشاء سجل راتب جديد مع الأمان والقيود المحاسبية
  async createPayroll(payrollData: SecurePayrollData): Promise<{ data: Payroll | null; error: Error | null }> {
    try {
      await this.securityService.validateTenantAccess();
      
      // التحقق من صحة معرف الموظف
      const isValidEmployee = await this.securityService.validateEmployeeAccess(payrollData.employee_id);
      if (!isValidEmployee) {
        throw new Error('غير مصرح للوصول إلى بيانات هذا الموظف');
      }

      // الحصول على معرف المستخدم الحالي كموظف
      const currentEmployeeId = await this.securityService.getCurrentEmployeeId();
      
      const { data, error } = await supabase
        .from('payroll')
        .insert({
          ...payrollData,
          created_by: currentEmployeeId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating payroll record:', error);
        throw new Error(`فشل في إنشاء سجل الراتب: ${error.message}`);
      }

      // إنشاء القيود المحاسبية للراتب تلقائياً إذا كان الراتب معتمد
      if (payrollData.status === 'approved' || payrollData.status === 'paid') {
        try {
          // جلب بيانات الموظف
          const { data: employee } = await supabase
            .from('employees')
            .select('first_name, last_name, employee_number, tenant_id')
            .eq('id', payrollData.employee_id)
            .single();

          if (employee) {
            await payrollAccountingService.createPayrollAccountingEntry({
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
          }
        } catch (accountingError) {
          console.error('خطأ في إنشاء القيود المحاسبية:', accountingError);
          // لا نريد أن يفشل إنشاء الراتب بسبب خطأ محاسبي
        }
      }

      // تسجيل العملية للمراقبة
      await this.securityService.logDataOperation('INSERT', 'payroll', {
        payroll_id: data.id,
        employee_id: payrollData.employee_id,
        operation: 'create_payroll'
      });

      return { data: data as Payroll, error: null };
    } catch (error) {
      console.error('Error creating payroll record:', error);
      await this.securityService.logSecurityEvent('payroll_creation_failed', {
        employee_id: payrollData.employee_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { data: null, error: error as Error };
    }
  }

  // تحديث سجل راتب مع فحص الأمان
  async updatePayroll(id: string, updates: Partial<Payroll>): Promise<{ data: Payroll | null; error: Error | null }> {
    try {
      await this.securityService.validateTenantAccess();
      
      // التحقق من أن سجل الراتب ينتمي للمؤسسة الحالية
      const tenantId = await this.securityService.getCurrentTenantId();
      const { data: payrollRecord } = await supabase
        .from('payroll')
        .select(`
          employee_id,
          employees!employee_id (tenant_id)
        `)
        .eq('id', id)
        .single();

      if (!payrollRecord || payrollRecord.employees?.tenant_id !== tenantId) {
        throw new Error('سجل الراتب غير موجود أو غير مصرح بالوصول إليه');
      }

      const isValidEmployee = await this.securityService.validateEmployeeAccess(payrollRecord.employee_id);
      if (!isValidEmployee) {
        throw new Error('غير مصرح للوصول إلى بيانات هذا الموظف');
      }

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

      // تسجيل العملية للمراقبة
      await this.securityService.logDataOperation('UPDATE', 'payroll', {
        payroll_id: id,
        employee_id: payrollRecord.employee_id,
        operation: 'update_payroll',
        updated_fields: Object.keys(updates)
      });

      return { data: data as Payroll, error: null };
    } catch (error) {
      console.error('خطأ في تحديث سجل الراتب الآمن:', error);
      await this.securityService.logSecurityEvent('payroll_update_failed', {
        payroll_id: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { data: null, error: error as Error };
    }
  }

  // حذف سجل راتب مع فحص الأمان
  async deletePayroll(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      await this.securityService.validateTenantAccess();
      
      // التحقق من أن سجل الراتب ينتمي للمؤسسة الحالية
      const tenantId = await this.securityService.getCurrentTenantId();
      const { data: payrollRecord } = await supabase
        .from('payroll')
        .select(`
          employee_id,
          employees!employee_id (tenant_id)
        `)
        .eq('id', id)
        .single();

      if (!payrollRecord || payrollRecord.employees?.tenant_id !== tenantId) {
        throw new Error('سجل الراتب غير موجود أو غير مصرح بالوصول إليه');
      }

      const isValidEmployee = await this.securityService.validateEmployeeAccess(payrollRecord.employee_id);
      if (!isValidEmployee) {
        throw new Error('غير مصرح للوصول إلى بيانات هذا الموظف');
      }

      const { error } = await supabase
        .from('payroll')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // تسجيل العملية للمراقبة
      await this.securityService.logDataOperation('DELETE', 'payroll', {
        payroll_id: id,
        employee_id: payrollRecord.employee_id,
        operation: 'delete_payroll'
      });

      return { success: true, error: null };
    } catch (error) {
      console.error('خطأ في حذف سجل الراتب الآمن:', error);
      await this.securityService.logSecurityEvent('payroll_deletion_failed', {
        payroll_id: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: error as Error };
    }
  }

  // موافقة على الراتب مع الأمان وإنشاء القيود المحاسبية
  async approvePayroll(id: string): Promise<{ data: Payroll | null; error: Error | null }> {
    try {
      await this.securityService.validateTenantAccess();
      
      const updateResult = await this.updatePayroll(id, {
        status: 'approved',
        approved_at: new Date().toISOString()
      });

      if (updateResult.error || !updateResult.data) {
        return updateResult;
      }

      const updatedPayroll = updateResult.data;

      // إنشاء القيود المحاسبية عند الموافقة
      try {
        // التحقق من عدم وجود قيود محاسبية مسبقاً
        const hasEntries = await payrollAccountingService.hasAccountingEntries(id);
        
        if (!hasEntries) {
          // جلب بيانات الموظف
          const { data: employee } = await supabase
            .from('employees')
            .select('first_name, last_name, employee_number, tenant_id')
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

      // تسجيل العملية للمراقبة
      await this.securityService.logDataOperation('UPDATE', 'payroll', {
        payroll_id: id,
        employee_id: updatedPayroll.employee_id,
        operation: 'approve_payroll'
      });

      return { data: updatedPayroll, error: null };
    } catch (error) {
      console.error('خطأ في موافقة الراتب الآمن:', error);
      await this.securityService.logSecurityEvent('payroll_approval_failed', {
        payroll_id: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { data: null, error: error as Error };
    }
  }

  // جلب إحصائيات الرواتب للمؤسسة مع فحص الأمان
  async getPayrollStatistics(month?: number, year?: number): Promise<{ data: any | null; error: Error | null }> {
    try {
      await this.securityService.validateTenantAccess();
      
      const tenantId = await this.securityService.getCurrentTenantId();
      
      let query = supabase
        .from('payroll')
        .select(`
          *,
          employees!employee_id (tenant_id)
        `)
        .eq('employees.tenant_id', tenantId);
      
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

      const statistics = {
        totalGross,
        totalNet,
        totalDeductions,
        paidCount,
        totalCount,
        pendingCount: totalCount - paidCount
      };

      // تسجيل العملية للمراقبة
      await this.securityService.logDataOperation('SELECT', 'payroll', {
        operation: 'get_statistics',
        records_count: totalCount,
        period: { month, year }
      });

      return { data: statistics, error: null };
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الرواتب:', error);
      await this.securityService.logSecurityEvent('payroll_statistics_failed', {
        period: { month, year },
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { data: null, error: error as Error };
    }
  }
}