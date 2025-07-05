import { supabase } from '@/integrations/supabase/client';

/**
 * خدمة التكامل المحاسبي الشاملة
 * تدير إنشاء القيود المحاسبية لجميع المعاملات المالية
 */
export class AccountingIntegrationService {
  
  /**
   * إنشاء قيد محاسبي للفاتورة
   */
  async createInvoiceAccountingEntry(invoiceId: string, invoiceData: {
    customer_name: string;
    invoice_number: string;
    total_amount: number;
    tax_amount?: number;
    discount_amount?: number;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_invoice_accounting_entry' as any, {
        invoice_id: invoiceId,
        invoice_data: {
          customer_name: invoiceData.customer_name,
          invoice_number: invoiceData.invoice_number,
          total_amount: invoiceData.total_amount,
          tax_amount: invoiceData.tax_amount || 0,
          discount_amount: invoiceData.discount_amount || 0
        }
      });

      if (error) {
        console.warn('Failed to create invoice accounting entry:', error);
        return null;
      }

      return data as string;
    } catch (error) {
      console.warn('Failed to create invoice accounting entry:', error);
      return null;
    }
  }

  /**
   * إنشاء قيد محاسبي للدفعة
   */
  async createPaymentAccountingEntry(paymentId: string, paymentData: {
    customer_name: string;
    invoice_number: string;
    payment_amount: number;
    payment_method: string;
    payment_date: string;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_payment_accounting_entry' as any, {
        payment_id: paymentId,
        payment_data: {
          customer_name: paymentData.customer_name,
          invoice_number: paymentData.invoice_number,
          payment_amount: paymentData.payment_amount,
          payment_method: paymentData.payment_method,
          payment_date: paymentData.payment_date
        }
      });

      if (error) {
        console.warn('Failed to create payment accounting entry:', error);
        return null;
      }

      return data as string;
    } catch (error) {
      console.warn('Failed to create payment accounting entry:', error);
      return null;
    }
  }

  /**
   * إنشاء قيد محاسبي لمصروفات الصيانة
   */
  async createMaintenanceAccountingEntry(maintenanceId: string, maintenanceData: {
    vehicle_info: string;
    maintenance_type: string;
    cost: number;
    maintenance_date: string;
    vendor_name?: string;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_maintenance_accounting_entry' as any, {
        maintenance_id: maintenanceId,
        maintenance_data: {
          vehicle_info: maintenanceData.vehicle_info,
          maintenance_type: maintenanceData.maintenance_type,
          cost: maintenanceData.cost,
          maintenance_date: maintenanceData.maintenance_date,
          vendor_name: maintenanceData.vendor_name || 'غير محدد'
        }
      });

      if (error) {
        console.warn('Failed to create maintenance accounting entry:', error);
        return null;
      }

      return data as string;
    } catch (error) {
      console.warn('Failed to create maintenance accounting entry:', error);
      return null;
    }
  }

  /**
   * إنشاء قيد محاسبي لتكاليف العمالة (الحضور)
   */
  async createAttendanceAccountingEntry(attendanceData: {
    employee_name: string;
    date: string;
    regular_hours: number;
    overtime_hours: number;
    hourly_rate: number;
    overtime_rate: number;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_attendance_accounting_entry' as any, {
        attendance_data: {
          employee_name: attendanceData.employee_name,
          date: attendanceData.date,
          regular_hours: attendanceData.regular_hours,
          overtime_hours: attendanceData.overtime_hours,
          hourly_rate: attendanceData.hourly_rate,
          overtime_rate: attendanceData.overtime_rate,
          total_cost: (attendanceData.regular_hours * attendanceData.hourly_rate) + 
                     (attendanceData.overtime_hours * attendanceData.overtime_rate)
        }
      });

      if (error) {
        console.warn('Failed to create attendance accounting entry:', error);
        return null;
      }

      return data as string;
    } catch (error) {
      console.warn('Failed to create attendance accounting entry:', error);
      return null;
    }
  }

  /**
   * الحصول على ملخص القيود المحاسبية للفترة المحددة
   */
  async getAccountingEntriesSummary(filters: {
    date_from?: string;
    date_to?: string;
    entry_type?: string;
  }): Promise<{
    total_entries: number;
    total_debit: number;
    total_credit: number;
    by_type: Array<{
      entry_type: string;
      count: number;
      total_amount: number;
    }>;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_accounting_entries_summary' as any, {
        filters: filters
      });

      if (error) throw error;

      return (data as any) || {
        total_entries: 0,
        total_debit: 0,
        total_credit: 0,
        by_type: []
      };
    } catch (error) {
      console.error('Failed to get accounting entries summary:', error);
      return {
        total_entries: 0,
        total_debit: 0,
        total_credit: 0,
        by_type: []
      };
    }
  }

  /**
   * التحقق من توازن القيود المحاسبية
   */
  async validateAccountingBalance(journalEntryId: string): Promise<{
    is_balanced: boolean;
    total_debit: number;
    total_credit: number;
    difference: number;
  }> {
    try {
      const { data, error } = await supabase.rpc('validate_accounting_balance' as any, {
        journal_entry_id: journalEntryId
      });

      if (error) throw error;

      return (data as any) || {
        is_balanced: false,
        total_debit: 0,
        total_credit: 0,
        difference: 0
      };
    } catch (error) {
      console.error('Failed to validate accounting balance:', error);
      return {
        is_balanced: false,
        total_debit: 0,
        total_credit: 0,
        difference: 0
      };
    }
  }

  /**
   * تصحيح القيود المحاسبية غير المتوازنة
   */
  async fixUnbalancedEntries(): Promise<{
    fixed_entries: number;
    remaining_unbalanced: number;
  }> {
    try {
      const { data, error } = await supabase.rpc('fix_unbalanced_accounting_entries' as any);

      if (error) throw error;

      return (data as any) || {
        fixed_entries: 0,
        remaining_unbalanced: 0
      };
    } catch (error) {
      console.error('Failed to fix unbalanced entries:', error);
      return {
        fixed_entries: 0,
        remaining_unbalanced: 0
      };
    }
  }
}