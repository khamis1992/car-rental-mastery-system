import { supabase } from '@/integrations/supabase/client';
import { Tenant, TenantOnboardingData } from '@/types/tenant';

export class TenantService {
  async getTenants(): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tenants: ${error.message}`);
    }

    return data || [];
  }

  // Keep the old method name for backward compatibility
  async getAllTenants(): Promise<Tenant[]> {
    return this.getTenants();
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No data found
      }
      throw new Error(`Failed to fetch tenant: ${error.message}`);
    }

    return data;
  }

  async createTenant(tenantData: TenantOnboardingData): Promise<Tenant> {
    const { data, error } = await supabase
      .from('tenants')
      .insert([{
        name: tenantData.name,
        slug: tenantData.slug,
        contact_email: tenantData.contact_email,
        contact_phone: tenantData.contact_phone,
        address: tenantData.address,
        city: tenantData.city,
        country: tenantData.country,
        timezone: tenantData.timezone,
        currency: tenantData.currency,
        subscription_plan: tenantData.subscription_plan,
        status: 'active',
        max_users: this.getMaxUsersByPlan(tenantData.subscription_plan),
        max_vehicles: this.getMaxVehiclesByPlan(tenantData.subscription_plan),
        max_contracts: this.getMaxContractsByPlan(tenantData.subscription_plan),
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create tenant: ${error.message}`);
    }

    return data;
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update tenant: ${error.message}`);
    }

    return data;
  }

  async deleteTenant(id: string): Promise<void> {
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }
  }

  private getMaxUsersByPlan(plan: string): number {
    switch (plan) {
      case 'basic': return 5;
      case 'standard': return 25;
      case 'premium': return 100;
      case 'enterprise': return 1000;
      default: return 5;
    }
  }

  private getMaxVehiclesByPlan(plan: string): number {
    switch (plan) {
      case 'basic': return 10;
      case 'standard': return 50;
      case 'premium': return 200;
      case 'enterprise': return 1000;
      default: return 10;
    }
  }

  private getMaxContractsByPlan(plan: string): number {
    switch (plan) {
      case 'basic': return 50;
      case 'standard': return 250;
      case 'premium': return 1000;
      case 'enterprise': return 10000;
      default: return 50;
    }
  }
}
