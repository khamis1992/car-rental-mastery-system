import { supabase } from '@/integrations/supabase/client';
import { accountingService } from './accountingService';
import { JournalEntry, JournalEntryLine } from '@/types/accounting';

export interface PayrollAccountingEntry {
  id: string;
  payroll_id: string;
  journal_entry_id: string;
  entry_type: string;
  amount: number;
  created_at: string;
  created_by?: string;
  notes?: string;
}

export interface PayrollAccountingData {
  payroll_id: string;
  employee_name: string;
  employee_number: string;
  pay_period: string;
  basic_salary: number;
  overtime_amount: number;
  allowances: number;
  bonuses: number;
  deductions: number;
  tax_deduction: number;
  social_insurance: number;
  gross_salary: number;
  net_salary: number;
}

export const payrollAccountingService = {
  // إنشاء القيود المحاسبية للرواتب
  async createPayrollAccountingEntry(payrollData: PayrollAccountingData): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('create_payroll_accounting_entry', {
        payroll_id: payrollData.payroll_id,
        payroll_data: {
          basic_salary: payrollData.basic_salary,
          overtime_amount: payrollData.overtime_amount,
          allowances: payrollData.allowances,
          bonuses: payrollData.bonuses,
          deductions: payrollData.deductions,
          tax_deduction: payrollData.tax_deduction,
          social_insurance: payrollData.social_insurance,
          net_salary: payrollData.net_salary,
          employee_name: payrollData.employee_name,
          pay_period: payrollData.pay_period
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('خطأ في إنشاء القيد المحاسبي للراتب:', error);
      throw error;
    }
  },

  // جلب القيود المحاسبية المرتبطة بالراتب
  async getPayrollAccountingEntries(payrollId: string): Promise<PayrollAccountingEntry[]> {
    const { data, error } = await supabase
      .from('payroll_accounting_entries')
      .select('*')
      .eq('payroll_id', payrollId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // جلب القيد المحاسبي مع تفاصيله للراتب
  async getPayrollJournalEntry(payrollId: string): Promise<any> {
    const { data, error } = await supabase
      .from('payroll')
      .select(`
        journal_entry_id,
        journal_entries!journal_entry_id (
          *,
          lines:journal_entry_lines (
            *,
            account:chart_of_accounts (*)
          )
        )
      `)
      .eq('id', payrollId)
      .single();

    if (error) throw error;
    return data?.journal_entries || null;
  },

  // إنشاء قيد دفع الراتب
  async createPayrollPaymentEntry(payrollId: string, paymentData: {
    employee_name: string;
    net_salary: number;
    payment_method: 'cash' | 'bank_transfer' | 'check';
    payment_date?: string;
    bank_account_id?: string;
    reference_number?: string;
  }): Promise<string> {
    try {
      const paymentDate = paymentData.payment_date || new Date().toISOString().split('T')[0];
      
      // إنشاء القيد المحاسبي لدفع الراتب
      const journalEntry = await accountingService.createJournalEntry({
        entry_date: paymentDate,
        description: `دفع راتب - ${paymentData.employee_name}`,
        reference_type: 'payment',
        reference_id: payrollId,
        total_debit: paymentData.net_salary,
        total_credit: paymentData.net_salary,
        status: 'posted'
      });

      // الحصول على معرفات الحسابات
      const accounts = await accountingService.getChartOfAccounts();
      const salaryPayableAccount = accounts.find(acc => acc.account_code === '2110')?.id;
      
      let cashAccount;
      if (paymentData.payment_method === 'bank_transfer' && paymentData.bank_account_id) {
        // استخدام حساب البنك المحدد
        const bankAccounts = await supabase
          .from('bank_accounts')
          .select('account_id')
          .eq('id', paymentData.bank_account_id)
          .single();
        cashAccount = bankAccounts.data?.account_id;
      } else {
        // استخدام حساب النقدية العام
        cashAccount = accounts.find(acc => 
          acc.account_type === 'asset' && 
          acc.account_category === 'current_asset' &&
          (acc.account_name.includes('نقدية') || acc.account_name.includes('صندوق'))
        )?.id;
      }

      if (!salaryPayableAccount || !cashAccount) {
        throw new Error('لا يمكن العثور على الحسابات المحاسبية المطلوبة');
      }

      // إنشاء سطور القيد
      await accountingService.createJournalEntryLine({
        journal_entry_id: journalEntry.id,
        account_id: salaryPayableAccount,
        description: `دفع راتب مستحق - ${paymentData.employee_name}`,
        debit_amount: paymentData.net_salary,
        credit_amount: 0,
        line_number: 1
      });

      await accountingService.createJournalEntryLine({
        journal_entry_id: journalEntry.id,
        account_id: cashAccount,
        description: `نقدية مدفوعة للراتب - ${paymentData.employee_name}`,
        debit_amount: 0,
        credit_amount: paymentData.net_salary,
        line_number: 2
      });

      // ربط القيد بالراتب
      const { error: linkError } = await supabase
        .from('payroll_accounting_entries')
        .insert({
          payroll_id: payrollId,
          journal_entry_id: journalEntry.id,
          entry_type: 'salary',
          amount: paymentData.net_salary,
          notes: `دفع راتب - ${paymentData.payment_method}`
        });

      if (linkError) throw linkError;

      return journalEntry.id;
    } catch (error) {
      console.error('خطأ في إنشاء قيد دفع الراتب:', error);
      throw error;
    }
  },

  // جلب تقرير محاسبي للرواتب
  async getPayrollAccountingReport(filters: {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    department?: string;
  }) {
    try {
      let query = supabase
        .from('payroll')
        .select(`
          *,
          employees!employee_id (
            employee_number,
            first_name,
            last_name,
            department
          ),
          journal_entries!journal_entry_id (
            id,
            entry_number,
            entry_date,
            total_debit,
            total_credit,
            status
          ),
          payroll_accounting_entries!payroll_id (
            id,
            entry_type,
            amount,
            journal_entry_id
          )
        `)
        .not('journal_entry_id', 'is', null)
        .order('pay_period_start', { ascending: false });

      if (filters.startDate) {
        query = query.gte('pay_period_start', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('pay_period_end', filters.endDate);
      }
      if (filters.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // فلترة حسب القسم إذا لزم الأمر
      let results = data || [];
      if (filters.department) {
        results = results.filter((payroll: any) => 
          payroll.employees?.department === filters.department
        );
      }

      return results.map((payroll: any) => ({
        payroll_id: payroll.id,
        employee_name: `${payroll.employees?.first_name || ''} ${payroll.employees?.last_name || ''}`,
        employee_number: payroll.employees?.employee_number || '',
        department: payroll.employees?.department || '',
        pay_period: `${payroll.pay_period_start} - ${payroll.pay_period_end}`,
        gross_salary: payroll.gross_salary,
        net_salary: payroll.net_salary,
        journal_entry: payroll.journal_entries,
        accounting_entries: payroll.payroll_accounting_entries,
        status: payroll.status
      }));
    } catch (error) {
      console.error('خطأ في جلب تقرير محاسبة الرواتب:', error);
      throw error;
    }
  },

  // جلب ملخص محاسبي للرواتب
  async getPayrollAccountingSummary(period: { year: number; month?: number }) {
    try {
      const startDate = period.month 
        ? `${period.year}-${period.month.toString().padStart(2, '0')}-01`
        : `${period.year}-01-01`;
      
      const endDate = period.month
        ? `${period.year}-${period.month.toString().padStart(2, '0')}-31`
        : `${period.year}-12-31`;

      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .gte('pay_period_start', startDate)
        .lte('pay_period_end', endDate)
        .not('journal_entry_id', 'is', null);

      if (error) throw error;

      const payrolls = data || [];
      
      return {
        total_payrolls: payrolls.length,
        total_gross_salary: payrolls.reduce((sum, p) => sum + (p.gross_salary || 0), 0),
        total_net_salary: payrolls.reduce((sum, p) => sum + (p.net_salary || 0), 0),
        total_deductions: payrolls.reduce((sum, p) => 
          sum + (p.deductions || 0) + (p.tax_deduction || 0) + (p.social_insurance || 0), 0),
        total_basic_salary: payrolls.reduce((sum, p) => sum + (p.basic_salary || 0), 0),
        total_overtime: payrolls.reduce((sum, p) => sum + (p.overtime_amount || 0), 0),
        total_allowances: payrolls.reduce((sum, p) => sum + (p.allowances || 0), 0),
        processed_count: payrolls.filter(p => p.status === 'paid').length,
        pending_count: payrolls.filter(p => p.status !== 'paid').length
      };
    } catch (error) {
      console.error('خطأ في جلب ملخص محاسبة الرواتب:', error);
      throw error;
    }
  },

  // التحقق من وجود قيود محاسبية للراتب
  async hasAccountingEntries(payrollId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('payroll_accounting_entries')
      .select('id')
      .eq('payroll_id', payrollId)
      .limit(1);

    if (error) throw error;
    return (data || []).length > 0;
  },

  // حذف القيود المحاسبية للراتب (للتراجع)
  async deletePayrollAccountingEntries(payrollId: string): Promise<void> {
    try {
      // جلب معرف القيد المحاسبي
      const { data: payroll } = await supabase
        .from('payroll')
        .select('journal_entry_id')
        .eq('id', payrollId)
        .single();

      if (payroll?.journal_entry_id) {
        // حذف القيد المحاسبي (سيحذف تلقائياً من جدول الربط)
        await accountingService.reverseJournalEntry(
          payroll.journal_entry_id, 
          'إلغاء راتب'
        );

        // إزالة الربط من جدول الرواتب
        await supabase
          .from('payroll')
          .update({ journal_entry_id: null })
          .eq('id', payrollId);
      }
    } catch (error) {
      console.error('خطأ في حذف القيود المحاسبية للراتب:', error);
      throw error;
    }
  }
};