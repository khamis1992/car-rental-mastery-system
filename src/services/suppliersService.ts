import { supabase } from "@/integrations/supabase/client";
import type { 
  Supplier, 
  CreateSupplierRequest,
  SupplierInvoice,
  CreateSupplierInvoiceRequest,
  SupplierPayment,
  CreateSupplierPaymentRequest,
  SupplierSubsidiaryLedger,
  SupplierAgingAnalysis
} from "@/types/suppliers";

export class SuppliersService {
  // إدارة الموردين
  static async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('supplier_name');

    if (error) throw error;
    return data || [];
  }

  static async getSupplier(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createSupplier(supplierData: CreateSupplierRequest): Promise<Supplier> {
    // توليد رقم المورد
    const { data: codeData } = await supabase
      .rpc('generate_supplier_code');
    
    const supplierCode = codeData || `SUP${Date.now()}`;

    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        supplier_code: supplierCode,
        ...supplierData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSupplier(id: string, updates: Partial<CreateSupplierRequest>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteSupplier(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  // إدارة فواتير الموردين
  static async getSupplierInvoices(): Promise<SupplierInvoice[]> {
    const { data, error } = await supabase
      .from('supplier_invoices')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getSupplierInvoice(id: string): Promise<SupplierInvoice | null> {
    const { data, error } = await supabase
      .from('supplier_invoices')
      .select(`
        *,
        supplier:suppliers(*),
        items:supplier_invoice_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createSupplierInvoice(invoiceData: CreateSupplierInvoiceRequest): Promise<SupplierInvoice> {
    // توليد رقم الفاتورة
    const { data: invoiceNumber } = await supabase
      .rpc('generate_supplier_invoice_number');

    const { items, ...invoiceFields } = invoiceData;

    // إنشاء الفاتورة
    const { data: invoice, error: invoiceError } = await supabase
      .from('supplier_invoices')
      .insert({
        invoice_number: invoiceNumber,
        ...invoiceFields
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // إضافة بنود الفاتورة
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        supplier_invoice_id: invoice.id,
        total_price: item.quantity * item.unit_price,
        ...item
      }));

      const { error: itemsError } = await supabase
        .from('supplier_invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return invoice;
  }

  static async updateSupplierInvoice(id: string, updates: Partial<SupplierInvoice>): Promise<SupplierInvoice> {
    const { data, error } = await supabase
      .from('supplier_invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async approveSupplierInvoice(id: string): Promise<SupplierInvoice> {
    const { data, error } = await supabase
      .from('supplier_invoices')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // إدارة مدفوعات الموردين
  static async getSupplierPayments(): Promise<SupplierPayment[]> {
    const { data, error } = await supabase
      .from('supplier_payments')
      .select(`
        *,
        supplier:suppliers(*),
        supplier_invoice:supplier_invoices(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createSupplierPayment(paymentData: CreateSupplierPaymentRequest): Promise<SupplierPayment> {
    // توليد رقم الدفعة
    const { data: paymentNumber } = await supabase
      .rpc('generate_supplier_payment_number');

    const { data, error } = await supabase
      .from('supplier_payments')
      .insert({
        payment_number: paymentNumber,
        ...paymentData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // التقارير والتحليلات
  static async getSupplierLedger(supplierId: string, fromDate?: string, toDate?: string): Promise<SupplierSubsidiaryLedger[]> {
    let query = supabase
      .from('supplier_subsidiary_ledger')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('transaction_date', { ascending: false });

    if (fromDate) {
      query = query.gte('transaction_date', fromDate);
    }
    if (toDate) {
      query = query.lte('transaction_date', toDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
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

  static async getSupplierAgingAnalysis(): Promise<SupplierAgingAnalysis[]> {
    const { data, error } = await supabase
      .from('supplier_aging_analysis')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .order('total_outstanding', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async generateSupplierStatement(supplierId: string, fromDate: string, toDate: string) {
    const { data, error } = await supabase
      .rpc('generate_supplier_statement', {
        supplier_id_param: supplierId,
        from_date_param: fromDate,
        to_date_param: toDate
      });

    if (error) throw error;
    return data;
  }

  // إحصائيات سريعة
  static async getSupplierStats() {
    const [
      { count: totalSuppliers },
      { count: activeInvoices },
      { data: totalPayables }
    ] = await Promise.all([
      supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('supplier_invoices').select('*', { count: 'exact', head: true }).neq('status', 'paid'),
      supabase.from('suppliers').select('current_balance')
    ]);

    const totalPayablesAmount = totalPayables?.reduce((sum, supplier) => sum + (supplier.current_balance || 0), 0) || 0;

    return {
      totalSuppliers: totalSuppliers || 0,
      activeInvoices: activeInvoices || 0,
      totalPayables: totalPayablesAmount
    };
  }
}