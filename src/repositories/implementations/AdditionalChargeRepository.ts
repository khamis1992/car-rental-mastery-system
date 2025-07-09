import { supabase } from '@/integrations/supabase/client';
import { BaseRepository } from '../base/BaseRepository';
import { IAdditionalChargeRepository } from '../interfaces/IAdditionalChargeRepository';
import { AdditionalCharge } from '@/types/invoice';

export class AdditionalChargeRepository extends BaseRepository<AdditionalCharge> implements IAdditionalChargeRepository {
  protected tableName = 'additional_charges' as const;

  async getChargesByContract(contractId: string): Promise<AdditionalCharge[]> {
    const tenantId = await this.getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('additional_charges')
      .select('*')
      .eq('contract_id', contractId)
      .eq('tenant_id', tenantId || '')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AdditionalCharge[];
  }

  async getPendingCharges(): Promise<AdditionalCharge[]> {
    const tenantId = await this.getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('additional_charges')
      .select(`
        *,
        contracts(contract_number),
        customers(name, phone)
      `)
      .eq('status', 'pending')
      .eq('tenant_id', tenantId || '')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AdditionalCharge[];
  }

  async createCharge(chargeData: Omit<AdditionalCharge, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'tenant_id'>): Promise<AdditionalCharge> {
    return this.create(chargeData as any);
  }

  async updateChargeStatus(id: string, status: AdditionalCharge['status'], invoiceId?: string): Promise<void> {
    const updates: any = { status };
    if (invoiceId) {
      updates.invoice_id = invoiceId;
    }

    const { error } = await supabase
      .from('additional_charges')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  async deleteCharge(id: string): Promise<void> {
    const { error } = await supabase
      .from('additional_charges')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getChargeStats() {
    const tenantId = await this.getCurrentTenantId() || '';

    const { data: totalCount, error: totalError } = await supabase
      .from('additional_charges')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const { data: pendingCount, error: pendingError } = await supabase
      .from('additional_charges')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('tenant_id', tenantId);

    const { data: totalValue, error: valueError } = await supabase
      .from('additional_charges')
      .select('amount')
      .eq('tenant_id', tenantId);

    if (totalError || pendingError || valueError) {
      throw totalError || pendingError || valueError;
    }

    const totalAmount = totalValue?.reduce((sum, charge) => sum + (charge.amount || 0), 0) || 0;

    return {
      total: totalCount?.length || 0,
      pending: pendingCount?.length || 0,
      totalAmount,
    };
  }
}