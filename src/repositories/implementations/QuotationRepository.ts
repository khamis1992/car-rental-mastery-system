import { supabase } from '@/integrations/supabase/client';
import { BaseRepository } from '../base/BaseRepository';
import { IQuotationRepository } from '../interfaces/IQuotationRepository';
import { QuotationWithDetails } from '@/services/quotationService';

export class QuotationRepository extends BaseRepository<QuotationWithDetails> implements IQuotationRepository {
  protected tableName = 'quotations' as const;

  async getQuotationsWithDetails(): Promise<QuotationWithDetails[]> {
    const tenantId = await this.getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        customers!inner(name, phone),
        vehicles!inner(make, model, vehicle_number)
      `)
      .eq('tenant_id', tenantId || '')
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
  }

  async getQuotationById(id: string) {
    const tenantId = await this.getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        customers(name, phone, email, address),
        vehicles(make, model, year, license_plate, vehicle_number)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId || '')
      .single();

    if (error) throw error;
    return data;
  }

  async updateQuotationStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('quotations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return data;
  }

  async deleteQuotation(id: string): Promise<void> {
    const { error } = await supabase
      .from('quotations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getActiveQuotations() {
    const tenantId = await this.getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        customers(name),
        vehicles(make, model, vehicle_number)
      `)
      .in('status', ['draft', 'sent', 'accepted'])
      .gte('valid_until', new Date().toISOString().split('T')[0])
      .eq('tenant_id', tenantId || '')
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
  }

  async getQuotationStats() {
    const tenantId = await this.getCurrentTenantId() || '';

    const { data: totalCount, error: totalError } = await supabase
      .from('quotations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const { data: activeCount, error: activeError } = await supabase
      .from('quotations')
      .select('*', { count: 'exact', head: true })
      .in('status', ['sent', 'accepted'])
      .gte('valid_until', new Date().toISOString().split('T')[0])
      .eq('tenant_id', tenantId);

    const { data: expiredCount, error: expiredError } = await supabase
      .from('quotations')
      .select('*', { count: 'exact', head: true })
      .lt('valid_until', new Date().toISOString().split('T')[0])
      .neq('status', 'converted')
      .eq('tenant_id', tenantId);

    const { data: totalValue, error: valueError } = await supabase
      .from('quotations')
      .select('final_amount')
      .in('status', ['sent', 'accepted'])
      .eq('tenant_id', tenantId);

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
  }
}