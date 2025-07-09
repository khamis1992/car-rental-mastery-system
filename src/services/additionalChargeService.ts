import { supabase } from '@/integrations/supabase/client';
import { UserHelperService } from './BusinessServices/UserHelperService';
import { AdditionalCharge } from '@/types/invoice';

export const additionalChargeService = {
  async getChargesByContract(contractId: string): Promise<AdditionalCharge[]> {
    const { data, error } = await supabase
      .from('additional_charges')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AdditionalCharge[];
  },

  async getPendingCharges(): Promise<AdditionalCharge[]> {
    const { data, error } = await supabase
      .from('additional_charges')
      .select(`
        *,
        contracts(contract_number),
        customers(name, phone)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AdditionalCharge[];
  },

  async createCharge(chargeData: Omit<AdditionalCharge, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'tenant_id'>): Promise<AdditionalCharge> {
    try {
      // Get current user's employee ID
      const employeeId = await UserHelperService.getCurrentUserEmployeeId();
      
      // Get tenant_id from user's tenant_users relationship
      const { data: { user } } = await supabase.auth.getUser();
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user?.id)
        .single();
      
      const { data: charge, error } = await supabase
        .from('additional_charges')
        .insert({
          ...chargeData,
          created_by: employeeId,
          tenant_id: tenantUser?.tenant_id || ''
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating additional charge:', error);
        throw new Error(`فشل في إنشاء الرسم الإضافي: ${error.message}`);
      }

      return charge as AdditionalCharge;
    } catch (error) {
      console.error('Error creating additional charge:', error);
      throw new Error(`فشل في إنشاء الرسم الإضافي: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  },

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
  },

  async deleteCharge(id: string): Promise<void> {
    const { error } = await supabase
      .from('additional_charges')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getChargeStats() {
    const { data: totalCount, error: totalError } = await supabase
      .from('additional_charges')
      .select('*', { count: 'exact', head: true });

    const { data: pendingCount, error: pendingError } = await supabase
      .from('additional_charges')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { data: totalValue, error: valueError } = await supabase
      .from('additional_charges')
      .select('amount');

    if (totalError || pendingError || valueError) {
      throw totalError || pendingError || valueError;
    }

    const totalAmount = totalValue?.reduce((sum, charge) => sum + (charge.amount || 0), 0) || 0;

    return {
      total: totalCount?.length || 0,
      pending: pendingCount?.length || 0,
      totalAmount,
    };
  },
};