
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

  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.single();

    if (error && error.code === 'PGRST116') {
      return true; // No data found, slug is available
    }

    return false; // Found a tenant with this slug
  }

  async validateTenantData(data: Partial<Tenant>, excludeId?: string): Promise<string[]> {
    const errors: string[] = [];

    // Check slug availability
    if (data.slug) {
      const isAvailable = await this.isSlugAvailable(data.slug, excludeId);
      if (!isAvailable) {
        errors.push('هذا المعرف مستخدم بالفعل');
      }
    }

    // Validate subscription plan limits
    if (data.subscription_plan) {
      const limits = this.getPlanLimits(data.subscription_plan);
      
      if (data.max_users && data.max_users > limits.maxUsers) {
        errors.push(`عدد المستخدمين لا يمكن أن يتجاوز ${limits.maxUsers} للخطة المحددة`);
      }
      
      if (data.max_vehicles && data.max_vehicles > limits.maxVehicles) {
        errors.push(`عدد المركبات لا يمكن أن يتجاوز ${limits.maxVehicles} للخطة المحددة`);
      }
      
      if (data.max_contracts && data.max_contracts > limits.maxContracts) {
        errors.push(`عدد العقود لا يمكن أن يتجاوز ${limits.maxContracts} للخطة المحددة`);
      }
    }

    return errors;
  }

  private getPlanLimits(plan: string): { maxUsers: number; maxVehicles: number; maxContracts: number } {
    switch (plan) {
      case 'basic':
        return { maxUsers: 5, maxVehicles: 10, maxContracts: 50 };
      case 'standard':
        return { maxUsers: 25, maxVehicles: 50, maxContracts: 250 };
      case 'premium':
        return { maxUsers: 100, maxVehicles: 200, maxContracts: 1000 };
      case 'enterprise':
        return { maxUsers: 1000, maxVehicles: 1000, maxContracts: 10000 };
      default:
        return { maxUsers: 5, maxVehicles: 10, maxContracts: 50 };
    }
  }

  private getMaxUsersByPlan(plan: string): number {
    return this.getPlanLimits(plan).maxUsers;
  }

  private getMaxVehiclesByPlan(plan: string): number {
    return this.getPlanLimits(plan).maxVehicles;
  }

  private getMaxContractsByPlan(plan: string): number {
    return this.getPlanLimits(plan).maxContracts;
  }
}
