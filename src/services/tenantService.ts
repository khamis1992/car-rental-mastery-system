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

    return (data || []) as any;
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

    return data as any;
  }

  async createTenant(tenantData: TenantOnboardingData): Promise<Tenant> {
    const { admin_user, ...tenantInfo } = tenantData;
    
    const { data, error } = await supabase
      .from('tenants')
      .insert([{
        ...tenantInfo,
        status: 'active' // Set default status
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create tenant: ${error.message}`);
    }

    // TODO: Create admin user for the tenant
    // This would involve creating the user and linking to the tenant
    // For now, we just return the tenant data

    return data as any;
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

    return data as any;
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

  async isSlugAvailable(slug: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (error && error.code === 'PGRST116') {
      return true; // No data found, slug is available
    }

    return false; // Found a tenant with this slug
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
