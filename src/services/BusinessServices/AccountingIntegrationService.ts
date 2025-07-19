import { supabase } from '@/integrations/supabase/client';

/**
 * خدمة التكامل المحاسبي الشاملة
 * تدير إنشاء القيود المحاسبية لجميع المعاملات المالية
 */
export class AccountingIntegrationService {
  
  /**
   * إنشاء قيد محاسبي للعقد مع نظام محاسبة العملاء المتطور
   */
  async createContractAccountingEntry(contractId: string, contractData: {
    customer_id: string;
    customer_name: string;
    vehicle_info: string;
    contract_number: string;
    total_amount: number;
    security_deposit?: number;
    insurance_amount?: number;
    tax_amount?: number;
    discount_amount?: number;
  }): Promise<string | null> {
    try {
      console.log(`🔄 Creating customer-integrated contract entry for contract ${contractId} with amount ${contractData.total_amount}`);
      
      // Validate input data
      if (!contractData.total_amount || contractData.total_amount <= 0) {
        console.error('❌ Invalid contract amount:', contractData.total_amount);
        throw new Error('مبلغ العقد يجب أن يكون أكبر من صفر');
      }

      if (!contractData.customer_id) {
        console.error('❌ Customer ID is required for contract accounting');
        throw new Error('معرف العميل مطلوب للمحاسبة');
      }

      const { data, error } = await supabase.rpc('create_contract_customer_accounting_entry' as any, {
        contract_id_param: contractId,
        customer_id_param: contractData.customer_id,
        contract_data: {
          customer_name: contractData.customer_name,
          vehicle_info: contractData.vehicle_info,
          contract_number: contractData.contract_number,
          total_amount: contractData.total_amount,
          security_deposit: contractData.security_deposit || 0,
          insurance_amount: contractData.insurance_amount || 0,
          tax_amount: contractData.tax_amount || 0,
          discount_amount: contractData.discount_amount || 0
        }
      });

      if (error) {
        console.error('❌ Failed to create contract customer accounting entry:', error);
        throw new Error(`فشل في إنشاء قيد محاسبة العقد والعميل: ${error.message}`);
      }

      if (!data) {
        console.error('❌ No journal entry ID returned from contract customer accounting function');
        throw new Error('لم يتم إرجاع معرف قيد محاسبة العقد');
      }

      console.log(`✅ Contract customer accounting entry created successfully: ${data}`);
      return data as string;
    } catch (error) {
      console.error('❌ Contract customer accounting integration error:', error);
      throw error; // Re-throw to let business service handle it
    }
  }

  /**
   * إنشاء قيد محاسبي للفاتورة مع نظام محاسبة العملاء المتطور
   */
  async createInvoiceAccountingEntry(invoiceId: string, invoiceData: {
    customer_id: string;
    customer_name: string;
    invoice_number: string;
    total_amount: number;
    tax_amount?: number;
    discount_amount?: number;
  }): Promise<string | null> {
    try {
      console.log(`🔄 Creating customer-integrated invoice entry for invoice ${invoiceData.invoice_number} with amount ${invoiceData.total_amount}`);
      
      // Validate input data
      if (!invoiceData.total_amount || invoiceData.total_amount <= 0) {
        console.error('❌ Invalid invoice amount:', invoiceData.total_amount);
        throw new Error('مبلغ الفاتورة يجب أن يكون أكبر من صفر');
      }

      if (!invoiceData.customer_id) {
        console.error('❌ Customer ID is required for invoice accounting');
        throw new Error('معرف العميل مطلوب للمحاسبة');
      }

      const { data, error } = await supabase.rpc('create_invoice_customer_accounting_entry' as any, {
        invoice_id_param: invoiceId,
        customer_id_param: invoiceData.customer_id,
        invoice_data: {
          customer_name: invoiceData.customer_name,
          invoice_number: invoiceData.invoice_number,
          total_amount: invoiceData.total_amount,
          tax_amount: invoiceData.tax_amount || 0,
          discount_amount: invoiceData.discount_amount || 0
        }
      });

      if (error) {
        console.error('❌ Failed to create invoice customer accounting entry:', error);
        throw new Error(`فشل في إنشاء قيد محاسبة الفاتورة والعميل: ${error.message}`);
      }

      if (!data) {
        console.error('❌ No journal entry ID returned from invoice customer accounting function');
        throw new Error('لم يتم إرجاع معرف قيد محاسبة الفاتورة');
      }

      console.log(`✅ Invoice customer accounting entry created successfully: ${data}`);
      return data as string;
    } catch (error) {
      console.error('❌ Invoice customer accounting integration error:', error);
      throw error; // Re-throw to let business service handle it
    }
  }

  /**
   * إنشاء قيد محاسبي للدفعة مع نظام محاسبة العملاء المتطور
   */
  async createPaymentAccountingEntry(paymentId: string, paymentData: {
    customer_id: string;
    customer_name: string;
    invoice_id: string;
    invoice_number: string;
    payment_amount: number;
    payment_method: string;
    payment_date: string;
  }): Promise<string | null> {
    try {
      console.log(`🔄 Creating customer-integrated payment entry for payment ${paymentData.invoice_number} with amount ${paymentData.payment_amount}`);
      
      // Validate input data
      if (!paymentData.payment_amount || paymentData.payment_amount <= 0) {
        console.error('❌ Invalid payment amount:', paymentData.payment_amount);
        throw new Error('مبلغ الدفعة يجب أن يكون أكبر من صفر');
      }

      if (!paymentData.customer_id) {
        console.error('❌ Customer ID is required for payment accounting');
        throw new Error('معرف العميل مطلوب للمحاسبة');
      }

      const { data, error } = await supabase.rpc('create_payment_customer_accounting_entry' as any, {
        payment_id_param: paymentId,
        customer_id_param: paymentData.customer_id,
        invoice_id_param: paymentData.invoice_id,
        payment_data: {
          customer_name: paymentData.customer_name,
          invoice_number: paymentData.invoice_number,
          payment_amount: paymentData.payment_amount,
          payment_method: paymentData.payment_method,
          payment_date: paymentData.payment_date
        }
      });

      if (error) {
        console.error('❌ Failed to create payment customer accounting entry:', error);
        throw new Error(`فشل في إنشاء قيد محاسبة الدفعة والعميل: ${error.message}`);
      }

      if (!data) {
        console.error('❌ No journal entry ID returned from payment customer accounting function');
        throw new Error('لم يتم إرجاع معرف قيد محاسبة الدفعة');
      }

      console.log(`✅ Payment customer accounting entry created successfully: ${data}`);
      return data as string;
    } catch (error) {
      console.error('❌ Payment customer accounting integration error:', error);
      throw error; // Re-throw to let business service handle it
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

  /**
   * تصحيح قيود العقود الموجودة لتستخدم الإيرادات المؤجلة
   */
  async fixExistingContractAccounting(): Promise<{
    fixed_count: number;
    error_count: number;
    total_processed: number;
    results: any[];
  }> {
    try {
      console.log('🔄 Fixing existing contract accounting entries...');
      
      const { data, error } = await supabase.rpc('fix_existing_contract_accounting' as any);

      if (error) {
        console.error('❌ Failed to fix existing contract accounting:', error);
        throw error;
      }

      const result = (data as any) || {
        fixed_count: 0,
        error_count: 0,
        total_processed: 0,
        results: []
      };

      console.log(`✅ Contract accounting fix completed:`, result);
      return result;
    } catch (error) {
      console.error('❌ Failed to fix existing contract accounting:', error);
      return {
        fixed_count: 0,
        error_count: 0,
        total_processed: 0,
        results: []
      };
    }
  }
}