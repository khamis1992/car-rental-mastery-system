import { supabase } from '@/integrations/supabase/client';
import { Supplier, SupplierFormData, SupplierInvoice, SupplierInvoiceFormData, SupplierPayment, SupplierPaymentFormData } from '@/integrations/supabase/types/suppliers';

export class SupplierService {
  static async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getSupplier(id: string): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createSupplier(supplierData: SupplierFormData): Promise<Supplier> {
    // Generate supplier code
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_supplier_code');

    if (codeError) throw codeError;

    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        ...supplierData,
        supplier_code: codeData,
        current_balance: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSupplier(id: string, supplierData: Partial<SupplierFormData>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .update(supplierData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteSupplier(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getSupplierInvoices(supplierId?: string): Promise<SupplierInvoice[]> {
    let query = supabase
      .from('supplier_invoices')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .order('created_at', { ascending: false });

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async createSupplierInvoice(invoiceData: SupplierInvoiceFormData): Promise<SupplierInvoice> {
    // Generate invoice number
    const { data: numberData, error: numberError } = await supabase
      .rpc('generate_supplier_invoice_number');

    if (numberError) throw numberError;

    const { data, error } = await supabase
      .from('supplier_invoices')
      .insert({
        ...invoiceData,
        invoice_number: numberData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getSupplierPayments(supplierId?: string): Promise<SupplierPayment[]> {
    let query = supabase
      .from('supplier_payments')
      .select(`
        *,
        supplier:suppliers(*),
        supplier_invoice:supplier_invoices(*)
      `)
      .order('created_at', { ascending: false });

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async createSupplierPayment(paymentData: SupplierPaymentFormData): Promise<SupplierPayment> {
    // Generate payment number
    const { data: numberData, error: numberError } = await supabase
      .rpc('generate_supplier_payment_number');

    if (numberError) throw numberError;

    const { data, error } = await supabase
      .from('supplier_payments')
      .insert({
        ...paymentData,
        payment_number: numberData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getSupplierBalance(supplierId: string): Promise<number> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('current_balance')
      .eq('id', supplierId)
      .single();

    if (error) throw error;
    return data?.current_balance || 0;
  }

  static async getSupplierStatistics() {
    const { data: totalSuppliers, error: totalError } = await supabase
      .from('suppliers')
      .select('id', { count: 'exact', head: true });

    const { data: activeSuppliers, error: activeError } = await supabase
      .from('suppliers')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    const { data: pendingInvoices, error: invoicesError } = await supabase
      .from('supplier_invoices')
      .select('total_amount')
      .eq('status', 'pending');

    const { data: overdueInvoices, error: overdueError } = await supabase
      .from('supplier_invoices')
      .select('total_amount')
      .eq('status', 'overdue');

    if (totalError || activeError || invoicesError || overdueError) {
      throw totalError || activeError || invoicesError || overdueError;
    }

    const totalPendingAmount = pendingInvoices?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0;
    const totalOverdueAmount = overdueInvoices?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0;

    return {
      totalSuppliers: totalSuppliers || 0,
      activeSuppliers: activeSuppliers || 0,
      totalPendingAmount,
      totalOverdueAmount,
      pendingInvoicesCount: pendingInvoices?.length || 0,
      overdueInvoicesCount: overdueInvoices?.length || 0
    };
  }
}