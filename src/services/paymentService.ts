import { supabase } from '@/integrations/supabase/client';
import { Payment, PaymentFormData } from '@/types/invoice';
import { AccountingIntegrationService } from './BusinessServices/AccountingIntegrationService';

export const paymentService = {
  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Payment[];
  },

  async createPayment(paymentData: PaymentFormData): Promise<Payment> {
    const accountingService = new AccountingIntegrationService();
    
    // Generate payment number
    const { data: paymentNumber, error: numberError } = await supabase
      .rpc('generate_payment_number');

    if (numberError) throw numberError;

    // Get invoice to get contract and customer IDs
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('contract_id, customer_id, invoice_number, customers(name)')
      .eq('id', paymentData.invoice_id)
      .single();

    if (invoiceError) throw invoiceError;

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

    // Create accounting entry
    if (invoice.customers?.name) {
      await accountingService.createPaymentAccountingEntry(payment.id, {
        customer_name: invoice.customers.name,
        invoice_number: invoice.invoice_number,
        payment_amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        payment_date: paymentData.payment_date,
      });
    }

    return payment as Payment;
  },

  async updatePaymentStatus(id: string, status: Payment['status']): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  },

  async deletePayment(id: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

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
  },

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
  },
};