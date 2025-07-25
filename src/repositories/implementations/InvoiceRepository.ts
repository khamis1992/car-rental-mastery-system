import { supabase } from '@/integrations/supabase/client';
import { BaseRepository } from '../base/BaseRepository';
import { IInvoiceRepository } from '../interfaces/IInvoiceRepository';
import { Invoice, InvoiceWithDetails, InvoiceFormData } from '@/types/invoice';
import { calculateInvoiceTotals } from '@/utils/invoiceCalculations';

export class InvoiceRepository extends BaseRepository<Invoice> implements IInvoiceRepository {
  protected tableName = 'invoices' as const;

  async getInvoicesWithDetails(): Promise<InvoiceWithDetails[]> {
    // Get current user's tenant ID
    const { data: { user } } = await supabase.auth.getUser();
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user?.id)
      .eq('status', 'active')
      .single();

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers!inner(name, phone),
        contracts!inner(
          contract_number,
          vehicles(make, model, vehicle_number)
        )
      `)
      .eq('tenant_id', tenantUser?.tenant_id || '')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((invoice: any) => ({
      ...invoice,
      customer_name: invoice.customers.name,
      customer_phone: invoice.customers.phone,
      contract_number: invoice.contracts.contract_number,
      vehicle_info: invoice.contracts.vehicles 
        ? `${invoice.contracts.vehicles.make} ${invoice.contracts.vehicles.model} - ${invoice.contracts.vehicles.vehicle_number}`
        : '',
    }));
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    // Get current user's tenant ID
    const { data: { user } } = await supabase.auth.getUser();
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user?.id)
      .eq('status', 'active')
      .single();

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers(name, phone, email, address, national_id),
        contracts(
          contract_number, 
          daily_rate, 
          start_date, 
          end_date,
          vehicles(make, model, year, license_plate, vehicle_number, color)
        ),
        invoice_items(*),
        payments(*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantUser?.tenant_id || '')
      .single();

    if (error) throw error;
    return data as Invoice;
  }

  async createInvoice(invoiceData: InvoiceFormData): Promise<Invoice> {
    try {
      // Generate invoice number
      const { data: invoiceNumber, error: numberError } = await supabase
        .rpc('generate_invoice_number');

      if (numberError) throw numberError;

      // Calculate totals using the utility function
      const { subtotal, taxAmount, discountAmount, totalAmount } = calculateInvoiceTotals(
        invoiceData.items,
        invoiceData.tax_amount || 0,
        invoiceData.discount_amount || 0
      );

      // Get current user and tenant info
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get tenant_id from user's tenant_users relationship
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user?.id)
        .single();

      // Create invoice with proper calculations
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          contract_id: invoiceData.contract_id,
          customer_id: invoiceData.customer_id,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: invoiceData.due_date,
          issue_date: new Date().toISOString().split('T')[0],
          invoice_type: invoiceData.invoice_type,
          subtotal: subtotal,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          paid_amount: 0,
          outstanding_amount: totalAmount,
          payment_terms: invoiceData.payment_terms,
          notes: invoiceData.notes,
          terms_and_conditions: invoiceData.terms_and_conditions,
          created_by: user?.id,
          tenant_id: tenantUser?.tenant_id || ''
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const itemsData = invoiceData.items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        item_type: item.item_type,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        start_date: item.start_date,
        end_date: item.end_date,
        daily_rate: item.daily_rate,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsData);

      if (itemsError) throw itemsError;

      return invoice as Invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error(`فشل في إنشاء الفاتورة: ${error.message}`);
    }
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Invoice;
  }

  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<void> {
    const updates: any = { status };
    
    if (status === 'sent') {
      updates.sent_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  async deleteInvoice(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async generateRentalInvoice(contractId: string): Promise<Invoice> {
    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        customers(id, name),
        vehicles(make, model, daily_rate)
      `)
      .eq('id', contractId)
      .single();

    if (contractError) throw contractError;

    // Calculate rental amount
    const rentalDays = contract.rental_days;
    const dailyRate = contract.daily_rate;
    const rentalAmount = rentalDays * dailyRate;

    // Create invoice
    const invoiceData: InvoiceFormData = {
      contract_id: contractId,
      customer_id: contract.customer_id,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      invoice_type: 'rental',
      tax_amount: contract.tax_amount || 0,
      discount_amount: contract.discount_amount || 0,
      payment_terms: 'استحقاق خلال 30 يوم',
      terms_and_conditions: 'شروط وأحكام الإيجار وفقاً للعقد',
      items: [{
        description: `إيجار ${contract.vehicles.make} ${contract.vehicles.model} لمدة ${rentalDays} يوم`,
        item_type: 'rental',
        quantity: rentalDays,
        unit_price: dailyRate,
        start_date: contract.start_date,
        end_date: contract.end_date,
        daily_rate: dailyRate,
      }]
    };

    return await this.createInvoice(invoiceData);
  }

  async getInvoiceStats() {
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
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const { data: paidCount, error: paidError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'paid')
      .eq('tenant_id', tenantId);

    const { data: overdueCount, error: overdueError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue')
      .eq('tenant_id', tenantId);

    const { data: totalValue, error: valueError } = await supabase
      .from('invoices')
      .select('total_amount, outstanding_amount')
      .eq('tenant_id', tenantId);

    if (totalError || paidError || overdueError || valueError) {
      throw totalError || paidError || overdueError || valueError;
    }

    const totalRevenue = totalValue?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
    const outstandingRevenue = totalValue?.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0) || 0;

    return {
      total: totalCount?.length || 0,
      paid: paidCount?.length || 0,
      overdue: overdueCount?.length || 0,
      totalRevenue,
      outstandingRevenue,
    };
  }

  async generateInvoiceNumber(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_invoice_number');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      throw new Error(`فشل في توليد رقم الفاتورة: ${error.message}`);
    }
  }

  async getInvoicesByContract(contractId: string): Promise<Invoice[]> {
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
        .from('invoices')
        .select('*')
        .eq('contract_id', contractId)
        .eq('tenant_id', tenantUser?.tenant_id || '')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    } catch (error) {
      console.error('Error fetching invoices by contract:', error);
      throw new Error(`فشل في جلب فواتير العقد: ${error.message}`);
    }
  }

  async getOverdueInvoices() {
    // Get current user's tenant ID
    const { data: { user } } = await supabase.auth.getUser();
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user?.id)
      .eq('status', 'active')
      .single();

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers(name, phone),
        contracts(contract_number)
      `)
      .eq('status', 'overdue')
      .eq('tenant_id', tenantUser?.tenant_id || '')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data;
  }
}