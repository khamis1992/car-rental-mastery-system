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

      // Get current user and tenant info
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get tenant_id from user's tenant_users relationship
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user?.id)
        .single();

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
          created_by: user?.id,
          tenant_id: tenantUser?.tenant_id || ''
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

  async deletePayment(id: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getPaymentStats() {
    // Get current user's tenant ID
    const { data: { user } } = await supabase.auth.getUser();
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user?.id)
      .eq('status', 'active')
      .single();

    const tenantId = tenantUser?.tenant_id || '';

    const { data: totalCount, error: totalError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .eq('tenant_id', tenantId);

    const { data: totalValue, error: valueError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .eq('tenant_id', tenantId);

    // Get this month's payments
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyValue, error: monthlyError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .eq('tenant_id', tenantId)
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

  async generatePaymentNumber(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_payment_number');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating payment number:', error);
      throw new Error(`فشل في توليد رقم الدفعة: ${error.message}`);
    }
  }

  async getPaymentsByContract(contractId: string): Promise<Payment[]> {
    try {
      // Get current user's tenant ID
      const { data: { user } } = await supabase.auth.getUser();
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('contract_id', contractId)
        .eq('tenant_id', tenantUser?.tenant_id || '')
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    } catch (error) {
      console.error('Error fetching payments by contract:', error);
      throw new Error(`فشل في جلب دفعات العقد: ${error.message}`);
    }
  }

  async getRecentPayments(limit: number = 10) {
    // Get current user's tenant ID
    const { data: { user } } = await supabase.auth.getUser();
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user?.id)
      .eq('status', 'active')
      .single();

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoices(invoice_number),
        customers(name)
      `)
      .eq('status', 'completed')
      .eq('tenant_id', tenantUser?.tenant_id || '')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}