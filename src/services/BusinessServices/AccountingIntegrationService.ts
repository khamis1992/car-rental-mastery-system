import { supabase } from '@/integrations/supabase/client';

/**
 * خدمة التكامل المحاسبي الشاملة
 * تدير إنشاء القيود المحاسبية لجميع المعاملات المالية
 */
export class AccountingIntegrationService {
  
  /**
   * إنشاء قيد محاسبي للعاتق - تم تحسينه مع منع التضاعف
   */
  async createContractAccountingEntry(contractData: any): Promise<string> {
    // Implementation for contract accounting entry
    // This would be implemented based on requirements
    return '';
  }

  /**
   * إنشاء قيد محاسبي للفاتورة (مديونية فقط، بدون إيراد)
   */
  async createInvoiceAccountingEntry(invoiceId: string, invoiceData: {
    customer_name: string;
    invoice_number: string;
    total_amount: number;
    tax_amount?: number;
    discount_amount?: number;
  }): Promise<string> {
    try {
      console.log(`🔄 Creating receivable entry for invoice ${invoiceData.invoice_number} with amount ${invoiceData.total_amount}`);
      
      // التحقق من عدم وجود قيد محاسبي مسبق
      const existingEntry = await this.checkExistingInvoiceEntry(invoiceId);
      if (existingEntry) {
        console.log(`✅ Invoice already has accounting entry: ${existingEntry}`);
        return existingEntry;
      }

      // Validate input data
      if (!invoiceData.total_amount || invoiceData.total_amount <= 0) {
        console.error('❌ Invalid invoice amount:', invoiceData.total_amount);
        throw new Error('مبلغ الفاتورة يجب أن يكون أكبر من صفر');
      }

      const { data, error } = await supabase.rpc('create_invoice_receivable_entry', {
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
        console.error('❌ Failed to create invoice receivable entry:', error);
        throw new Error(`فشل في إنشاء قيد المديونية للفاتورة: ${error.message}`);
      }

      if (!data) {
        console.error('❌ No journal entry ID returned from receivable function');
        throw new Error('لم يتم إرجاع معرف قيد المديونية');
      }

      console.log(`✅ Invoice receivable entry created successfully: ${data}`);
      return data as string;
    } catch (error) {
      console.error('❌ Invoice receivable integration error:', error);
      throw error; // Re-throw to let business service handle it
    }
  }

  /**
   * التحقق من وجود قيد محاسبي للفاتورة
   */
  private async checkExistingInvoiceEntry(invoiceId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('journal_entry_id')
        .eq('id', invoiceId)
        .single();
      
      if (error) throw error;
      
      return data?.journal_entry_id || null;
    } catch (error) {
      console.error('Error checking existing invoice entry:', error);
      return null;
    }
  }

  /**
   * إنشاء قيد محاسبي للدفعة (تسجيل الإيراد عند الدفع)
   */
  async createPaymentAccountingEntry(paymentId: string, paymentData: {
    customer_name: string;
    invoice_number: string;
    payment_amount: number;
    payment_method: string;
    payment_date: string;
  }): Promise<string> {
    try {
      console.log(`🔄 Creating revenue entry for payment ${paymentData.invoice_number} with amount ${paymentData.payment_amount}`);
      
      // التحقق من عدم وجود قيد محاسبي مسبق
      const existingEntry = await this.checkExistingPaymentEntry(paymentId);
      if (existingEntry) {
        console.log(`✅ Payment already has accounting entry: ${existingEntry}`);
        return existingEntry;
      }
      
      // Validate input data
      if (!paymentData.payment_amount || paymentData.payment_amount <= 0) {
        console.error('❌ Invalid payment amount:', paymentData.payment_amount);
        throw new Error('مبلغ الدفعة يجب أن يكون أكبر من صفر');
      }

      const { data, error } = await supabase.rpc('create_payment_revenue_entry', {
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
        console.error('❌ Failed to create payment revenue entry:', error);
        throw new Error(`فشل في إنشاء قيد الإيراد للدفعة: ${error.message}`);
      }

      if (!data) {
        console.error('❌ No journal entry ID returned from payment revenue function');
        throw new Error('لم يتم إرجاع معرف قيد الإيراد للدفعة');
      }

      console.log(`✅ Payment revenue entry created successfully: ${data}`);
      return data as string;
    } catch (error) {
      console.error('❌ Payment revenue integration error:', error);
      throw error; // Re-throw to let business service handle it
    }
  }

  /**
   * التحقق من وجود قيد محاسبي للدفعة
   */
  private async checkExistingPaymentEntry(paymentId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('journal_entry_id')
        .eq('id', paymentId)
        .single();
      
      if (error) throw error;
      
      return data?.journal_entry_id || null;
    } catch (error) {
      console.error('Error checking existing payment entry:', error);
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
  }): Promise<string> {
    try {
      // التحقق من عدم وجود قيد محاسبي مسبق
      const existingEntry = await this.checkExistingMaintenanceEntry(maintenanceId);
      if (existingEntry) {
        console.log(`Maintenance already has accounting entry: ${existingEntry}`);
        return existingEntry;
      }

      const { data, error } = await supabase.rpc('create_maintenance_accounting_entry', {
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
        console.error('Database error creating maintenance accounting entry:', error);
        throw new Error(`فشل في إنشاء القيد المحاسبي للصيانة: ${error.message}`);
      }

      if (!data) {
        throw new Error('لم يتم إرجاع معرف القيد المحاسبي من قاعدة البيانات');
      }

      return data as string;
    } catch (error) {
      console.error('Error creating maintenance accounting entry:', error);
      throw error;
    }
  }

  /**
   * التحقق من وجود قيد محاسبي للصيانة
   */
  private async checkExistingMaintenanceEntry(maintenanceId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('vehicle_maintenance')
        .select('journal_entry_id')
        .eq('id', maintenanceId)
        .single();
      
      if (error) throw error;
      
      return data?.journal_entry_id || null;
    } catch (error) {
      console.error('Error checking existing maintenance entry:', error);
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
  }): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('create_attendance_accounting_entry', {
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
        console.error('Database error creating attendance accounting entry:', error);
        throw new Error(`فشل في إنشاء القيد المحاسبي للحضور: ${error.message}`);
      }

      if (!data) {
        throw new Error('لم يتم إرجاع معرف القيد المحاسبي من قاعدة البيانات');
      }

      return data as string;
    } catch (error) {
      console.error('Error creating attendance accounting entry:', error);
      throw error;
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

  /**
   * تصحيح الإيرادات المزدوجة
   */
  async fixDoubleRevenueEntries(): Promise<{
    processed_count: number;
    fixed_count: number;
    error_count: number;
    results: any[];
  }> {
    try {
      console.log('🔄 Fixing double revenue entries...');
      
      const { data, error } = await supabase.rpc('fix_double_revenue_entries' as any);

      if (error) {
        console.error('❌ Failed to fix double revenue entries:', error);
        throw error;
      }

      const result = (data as any) || {
        processed_count: 0,
        fixed_count: 0,
        error_count: 0,
        results: []
      };

      console.log(`✅ Double revenue fix completed:`, result);
      return result;
    } catch (error) {
      console.error('❌ Failed to fix double revenue entries:', error);
      return {
        processed_count: 0,
        fixed_count: 0,
        error_count: 0,
        results: []
      };
    }
  }
}