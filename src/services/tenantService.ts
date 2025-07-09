import { supabase } from '@/integrations/supabase/client';
import { Tenant, TenantUser, TenantInvitation, TenantOnboardingData, SubscriptionHistory } from '@/types/tenant';

export class TenantService {
  // Get current user's tenant
  async getCurrentTenant(): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenant_users')
      .select(`
        tenant:tenants(*)
      `)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('status', 'active')
      .single();

    if (error || !data?.tenant) return null;
    return data.tenant as Tenant;
  }

  // Get all tenants for super admin
  async getAllTenants(): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Create new tenant (onboarding)
  async createTenant(tenantData: TenantOnboardingData): Promise<Tenant> {
    // First, create the tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
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
        status: 'trial'
      })
      .select()
      .single();

    if (tenantError) throw tenantError;

    // Create admin user account
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: tenantData.admin_user.email,
      password: tenantData.admin_user.password,
      options: {
        data: {
          full_name: tenantData.admin_user.full_name
        }
      }
    });

    if (authError) {
      // Cleanup: delete the tenant if user creation failed
      await supabase.from('tenants').delete().eq('id', tenant.id);
      throw authError;
    }

    // Link user to tenant as admin
    if (authUser.user) {
      const { error: linkError } = await supabase
        .from('tenant_users')
        .insert({
          tenant_id: tenant.id,
          user_id: authUser.user.id,
          role: 'tenant_admin',
          status: 'active'
        });

      if (linkError) {
        // Cleanup on failure
        await supabase.from('tenants').delete().eq('id', tenant.id);
        throw linkError;
      }
    }

    return tenant;
  }

  // Update tenant settings
  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get tenant users
  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    const { data, error } = await supabase
      .from('tenant_users')
      .select(`
        *,
        profiles:user_id(*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Invite user to tenant
  async inviteUser(invitation: TenantInvitation): Promise<void> {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', invitation.tenant_id)
      .eq('user_id', invitation.email)
      .single();

    if (existingUser) {
      throw new Error('User already exists in this tenant');
    }

    // For now, we'll use a simple email-based invitation
    // In a real implementation, you'd send an email with a sign-up link
    const { error } = await supabase.auth.signUp({
      email: invitation.email,
      password: 'temp-password-' + Math.random().toString(36),
      options: {
        data: {
          tenant_id: invitation.tenant_id,
          role: invitation.role,
          invitation: true
        }
      }
    });

    if (error) throw error;
  }

  // Update user role in tenant
  async updateUserRole(tenantUserId: string, role: TenantUser['role']): Promise<void> {
    const { error } = await supabase
      .from('tenant_users')
      .update({ role })
      .eq('id', tenantUserId);

    if (error) throw error;
  }

  // Remove user from tenant
  async removeUser(tenantUserId: string): Promise<void> {
    const { error } = await supabase
      .from('tenant_users')
      .update({ status: 'inactive' })
      .eq('id', tenantUserId);

    if (error) throw error;
  }

  // Get subscription history
  async getSubscriptionHistory(tenantId: string): Promise<SubscriptionHistory[]> {
    const { data, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Check tenant limits
  async checkTenantLimits(tenantId: string): Promise<{
    users: { current: number; max: number; exceeded: boolean };
    vehicles: { current: number; max: number; exceeded: boolean };
    contracts: { current: number; max: number; exceeded: boolean };
  }> {
    const [tenant, userCount, vehicleCount, contractCount] = await Promise.all([
      supabase.from('tenants').select('max_users, max_vehicles, max_contracts').eq('id', tenantId).single(),
      supabase.from('tenant_users').select('id', { count: 'exact' }).eq('tenant_id', tenantId).eq('status', 'active'),
      supabase.from('vehicles').select('id', { count: 'exact' }).eq('tenant_id', tenantId),
      supabase.from('contracts').select('id', { count: 'exact' }).eq('tenant_id', tenantId)
    ]);

    if (tenant.error) throw tenant.error;

    return {
      users: {
        current: userCount.count || 0,
        max: tenant.data.max_users,
        exceeded: (userCount.count || 0) >= tenant.data.max_users
      },
      vehicles: {
        current: vehicleCount.count || 0,
        max: tenant.data.max_vehicles,
        exceeded: (vehicleCount.count || 0) >= tenant.data.max_vehicles
      },
      contracts: {
        current: contractCount.count || 0,
        max: tenant.data.max_contracts,
        exceeded: (contractCount.count || 0) >= tenant.data.max_contracts
      }
    };
  }

  // Validate tenant slug availability
  async isSlugAvailable(slug: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    return !data && !error;
  }
}