import { supabase } from '@/integrations/supabase/client';

export interface PaymentReconciliationResult {
  processed_count: number;
  error_count: number;
  total_processed: number;
  results: Array<{
    payment_id: string;
    invoice_number: string;
    amount: number;
    status: 'success' | 'error';
    error_message?: string;
  }>;
}

export interface AccountingIntegrityCheck {
  payments_without_entries: number;
  invoices_without_entries: number;
  unbalanced_entries: number;
  missing_required_accounts: number;
  overall_status: 'healthy' | 'needs_attention';
  checked_at: string;
}

/**
 * خدمة تسوية المدفوعات المحاسبية
 * تدير إعادة معالجة المدفوعات المفقودة والتحقق من سلامة البيانات
 */
export class PaymentReconciliationService {
  
  /**
   * إعادة معالجة المدفوعات التي تفتقر للقيود المحاسبية
   */
  async reprocessMissingPaymentEntries(): Promise<PaymentReconciliationResult> {
    try {
      const { data, error } = await supabase.rpc('reprocess_missing_payment_entries');
      
      if (error) {
        console.error('Error reprocessing missing payment entries:', error);
        throw new Error(`فشل في إعادة معالجة المدفوعات: ${error.message}`);
      }
      
      return data as unknown as PaymentReconciliationResult;
    } catch (error) {
      console.error('Error in reprocessMissingPaymentEntries:', error);
      throw error;
    }
  }
  
  /**
   * التحقق من سلامة البيانات المحاسبية
   */
  async validateAccountingIntegrity(): Promise<AccountingIntegrityCheck> {
    try {
      const { data, error } = await supabase.rpc('validate_accounting_integrity');
      
      if (error) {
        console.error('Error validating accounting integrity:', error);
        throw new Error(`فشل في التحقق من سلامة البيانات: ${error.message}`);
      }
      
      return data as unknown as AccountingIntegrityCheck;
    } catch (error) {
      console.error('Error in validateAccountingIntegrity:', error);
      throw error;
    }
  }
  
  /**
   * الحصول على المدفوعات المفقودة (بدون قيود محاسبية)
   */
  async getMissingPaymentEntries(): Promise<Array<{
    id: string;
    payment_number: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    invoice_number: string;
    customer_name: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          payment_number,
          amount,
          payment_date,
          payment_method,
          invoices!inner(
            invoice_number,
            customers!inner(name)
          )
        `)
        .is('journal_entry_id', null)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(payment => ({
        id: payment.id,
        payment_number: payment.payment_number,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        invoice_number: payment.invoices.invoice_number,
        customer_name: payment.invoices.customers.name
      }));
    } catch (error) {
      console.error('Error getting missing payment entries:', error);
      throw new Error(`فشل في جلب المدفوعات المفقودة: ${error.message}`);
    }
  }
  
  /**
   * إعادة معالجة دفعة واحدة محددة
   */
  async reprocessSinglePayment(paymentId: string): Promise<boolean> {
    try {
      // جلب بيانات المدفوعة
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_date,
          payment_method,
          invoices!inner(
            invoice_number,
            customers!inner(name)
          )
        `)
        .eq('id', paymentId)
        .single();
      
      if (paymentError) throw paymentError;
      
      if (!payment) {
        throw new Error('المدفوعة غير موجودة');
      }
      
      // إنشاء القيد المحاسبي
      const { error } = await supabase.rpc('create_payment_accounting_entry', {
        payment_id: paymentId,
        payment_data: {
          customer_name: payment.invoices.customers.name,
          invoice_number: payment.invoices.invoice_number,
          payment_amount: payment.amount,
          payment_method: payment.payment_method,
          payment_date: payment.payment_date
        }
      });
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error reprocessing single payment:', error);
      throw new Error(`فشل في إعادة معالجة المدفوعة: ${error.message}`);
    }
  }
}