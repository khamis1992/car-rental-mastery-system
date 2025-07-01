import { supabase } from '@/integrations/supabase/client';

export interface QuotationWithDetails {
  id: string;
  quotation_number: string;
  customer_name: string;
  customer_phone: string;
  vehicle_info: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  daily_rate: number;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  status: string;
  valid_until: string;
  special_conditions?: string;
  terms_and_conditions?: string;
  created_at: string;
  customer_id: string;
  vehicle_id: string;
}

export const quotationService = {
  async getQuotationsWithDetails(): Promise<QuotationWithDetails[]> {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        customers!inner(name, phone),
        vehicles!inner(make, model, vehicle_number)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((quotation: any) => ({
      id: quotation.id,
      quotation_number: quotation.quotation_number,
      customer_name: quotation.customers.name,
      customer_phone: quotation.customers.phone,
      vehicle_info: `${quotation.vehicles.make} ${quotation.vehicles.model} - ${quotation.vehicles.vehicle_number}`,
      start_date: quotation.start_date,
      end_date: quotation.end_date,
      rental_days: quotation.rental_days,
      daily_rate: quotation.daily_rate,
      total_amount: quotation.total_amount,
      discount_amount: quotation.discount_amount || 0,
      tax_amount: quotation.tax_amount || 0,
      final_amount: quotation.final_amount,
      status: quotation.status,
      valid_until: quotation.valid_until,
      special_conditions: quotation.special_conditions,
      terms_and_conditions: quotation.terms_and_conditions,
      created_at: quotation.created_at,
      customer_id: quotation.customer_id,
      vehicle_id: quotation.vehicle_id,
    }));
  },

  async getQuotationById(id: string) {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        customers(name, phone, email, address),
        vehicles(make, model, year, license_plate, vehicle_number)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateQuotationStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('quotations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return data;
  },

  async deleteQuotation(id: string) {
    const { error } = await supabase
      .from('quotations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getActiveQuotations() {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        customers(name),
        vehicles(make, model, vehicle_number)
      `)
      .in('status', ['draft', 'sent', 'accepted'])
      .gte('valid_until', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((quotation: any) => ({
      id: quotation.id,
      quotation_number: quotation.quotation_number,
      customer_id: quotation.customer_id,
      vehicle_id: quotation.vehicle_id,
      final_amount: quotation.final_amount,
      customer_name: quotation.customers?.name,
      vehicle_info: quotation.vehicles ? `${quotation.vehicles.make} ${quotation.vehicles.model}` : '',
    }));
  },

  async getQuotationStats() {
    const { data: totalCount, error: totalError } = await supabase
      .from('quotations')
      .select('*', { count: 'exact', head: true });

    const { data: activeCount, error: activeError } = await supabase
      .from('quotations')
      .select('*', { count: 'exact', head: true })
      .in('status', ['sent', 'accepted'])
      .gte('valid_until', new Date().toISOString().split('T')[0]);

    const { data: expiredCount, error: expiredError } = await supabase
      .from('quotations')
      .select('*', { count: 'exact', head: true })
      .lt('valid_until', new Date().toISOString().split('T')[0])
      .neq('status', 'converted');

    const { data: totalValue, error: valueError } = await supabase
      .from('quotations')
      .select('final_amount')
      .in('status', ['sent', 'accepted']);

    if (totalError || activeError || expiredError || valueError) {
      throw totalError || activeError || expiredError || valueError;
    }

    const totalRevenue = totalValue?.reduce((sum, q) => sum + (q.final_amount || 0), 0) || 0;

    return {
      total: totalCount?.length || 0,
      active: activeCount?.length || 0,
      expired: expiredCount?.length || 0,
      totalValue: totalRevenue,
    };
  },
};