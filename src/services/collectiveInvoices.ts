import { supabase } from "@/integrations/supabase/client";
import type { 
  CollectiveInvoice, 
  CollectiveInvoiceFormData,
  AutoBillingSettings
} from "@/types/invoice";

export class CollectiveInvoiceService {
  async getCollectiveInvoices() {
    const { data, error } = await supabase
      .from('collective_invoices')
      .select(`
        *,
        items:collective_invoice_items(
          *,
          contract:contracts(*),
          customer:customers(*)
        ),
        payments:collective_invoice_payments(
          *,
          payment:payments(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CollectiveInvoice[];
  }

  async getCollectiveInvoiceById(id: string) {
    const { data, error } = await supabase
      .from('collective_invoices')
      .select(`
        *,
        items:collective_invoice_items(
          *,
          contract:contracts(*),
          customer:customers(*)
        ),
        payments:collective_invoice_payments(
          *,
          payment:payments(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as CollectiveInvoice;
  }

  async generateCollectiveInvoice(formData: CollectiveInvoiceFormData) {
    const { data, error } = await supabase.rpc('generate_collective_invoice', {
      period_start: formData.billing_period_start,
      period_end: formData.billing_period_end,
      due_days: formData.due_days || 30
    });

    if (error) throw error;
    return data;
  }

  async updateCollectiveInvoice(id: string, updates: Partial<CollectiveInvoice>) {
    const { data, error } = await supabase
      .from('collective_invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCollectiveInvoice(id: string) {
    const { error } = await supabase
      .from('collective_invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Auto Billing Settings
  async getAutoBillingSettings() {
    const { data, error } = await supabase
      .from('auto_billing_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as AutoBillingSettings | null;
  }

  async updateAutoBillingSettings(settings: Partial<AutoBillingSettings>) {
    const { data, error } = await supabase
      .from('auto_billing_settings')
      .upsert(settings)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAutoBillingLogs() {
    const { data, error } = await supabase
      .from('auto_billing_log')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}

export const collectiveInvoiceService = new CollectiveInvoiceService();