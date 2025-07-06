import { supabase } from '@/integrations/supabase/client';
import { BaseRepository } from '../base/BaseRepository';
import { IPaymentRepository } from '../interfaces/IPaymentRepository';
import { Payment, PaymentFormData } from '@/types/invoice';

export class PaymentRepository extends BaseRepository<Payment> implements IPaymentRepository {
  protected tableName = 'payments' as const;

  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Payment[];
  }

  async createPayment(paymentData: PaymentFormData): Promise<Payment> {
    try {
      // Generate payment number
      const { data: paymentNumber, error: numberError } = await supabase
        .rpc('generate_payment_number');

      if (numberError) throw numberError;

      // Get invoice with customer data for validation
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          contract_id, 
          customer_id, 
          invoice_number,
          total_amount,
          outstanding_amount,
          customers(name)
        `)
        .eq('id', paymentData.invoice_id)
        .single();

      if (invoiceError) throw invoiceError;

      // Validate payment amount
      const outstandingAmount = invoice.outstanding_amount || invoice.total_amount;
      if (paymentData.amount > outstandingAmount) {
        throw new Error(`Payment amount (${paymentData.amount}) cannot exceed outstanding amount (${outstandingAmount})`);
      }

      // Create payment
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          payment_number: paymentNumber,
          invoice_id: paymentData.invoice_id,
          contract_id: invoice.contract_id,
          customer_id: invoice.customer_id,
          amount: paymentData.amount,
          payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method,
          transaction_reference: paymentData.transaction_reference,
          bank_name: paymentData.bank_name,
          check_number: paymentData.check_number,
          notes: paymentData.notes,
          status: 'completed',
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;
      return payment as Payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error(`فشل في إنشاء الدفعة: ${error.message}`);
    }
  }

  async updatePaymentStatus(id: string, status: Payment['status']): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  }

  async updatePaymentJournalEntry(paymentId: string, journalEntryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ journal_entry_id: journalEntryId })
        .eq('id', paymentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating payment journal entry:', error);
      throw new Error(`فشل في تحديث معرف القيد المحاسبي: ${error.message}`);
    }
  }

  async deletePayment(id: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getPaymentStats() {
    const { data: totalCount, error: totalError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    const { data: totalValue, error: valueError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed');

    // Get this month's payments
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyValue, error: monthlyError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('payment_date', startOfMonth.toISOString().split('T')[0]);

    if (totalError || valueError || monthlyError) {
      throw totalError || valueError || monthlyError;
    }

    const totalAmount = totalValue?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const monthlyAmount = monthlyValue?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

    return {
      totalCount: totalCount?.length || 0,
      totalAmount,
      monthlyAmount,
    };
  }

  async getRecentPayments(limit: number = 10) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoices(invoice_number),
        customers(name)
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}