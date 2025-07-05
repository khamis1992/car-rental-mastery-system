import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceWithDetails, InvoiceFormData, InvoiceItem } from '@/types/invoice';
import { AccountingIntegrationService } from './BusinessServices/AccountingIntegrationService';

export const invoiceService = {
  async getInvoicesWithDetails(): Promise<InvoiceWithDetails[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers!inner(name, phone),
        contracts!inner(contract_number, vehicles!inner(make, model, vehicle_number))
      `)
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
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers(name, phone, email, address, national_id),
        contracts(contract_number, daily_rate, start_date, end_date, vehicles(make, model, year, license_plate, vehicle_number, color)),
        invoice_items(*),
        payments(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Invoice;
  },

  async createInvoice(invoiceData: InvoiceFormData): Promise<Invoice> {
    const accountingService = new AccountingIntegrationService();
    
    // Generate invoice number
    const { data: invoiceNumber, error: numberError } = await supabase
      .rpc('generate_invoice_number');

    if (numberError) throw numberError;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        contract_id: invoiceData.contract_id,
        customer_id: invoiceData.customer_id,
        due_date: invoiceData.due_date,
        invoice_type: invoiceData.invoice_type,
        tax_amount: invoiceData.tax_amount || 0,
        discount_amount: invoiceData.discount_amount || 0,
        payment_terms: invoiceData.payment_terms,
        notes: invoiceData.notes,
        terms_and_conditions: invoiceData.terms_and_conditions,
        created_by: (await supabase.auth.getUser()).data.user?.id,
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

    // Get customer info for accounting entry
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('name')
      .eq('id', invoiceData.customer_id)
      .single();

    if (!customerError && customer) {
      // Create accounting entry
      await accountingService.createInvoiceAccountingEntry(invoice.id, {
        customer_name: customer.name,
        invoice_number: invoiceNumber,
        total_amount: invoice.total_amount || 0,
        tax_amount: invoice.tax_amount || 0,
        discount_amount: invoice.discount_amount || 0,
      });
    }

    return invoice as Invoice;
  },

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Invoice;
  },

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
  },

  async deleteInvoice(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

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
  },

  async getInvoiceStats() {
    const { data: totalCount, error: totalError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    const { data: paidCount, error: paidError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'paid');

    const { data: overdueCount, error: overdueError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue');

    const { data: totalValue, error: valueError } = await supabase
      .from('invoices')
      .select('total_amount, outstanding_amount');

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
  },

  async getOverdueInvoices() {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers(name, phone),
        contracts(contract_number)
      `)
      .eq('status', 'overdue')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data;
  },
};