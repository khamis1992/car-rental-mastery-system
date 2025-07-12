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
    return (data || []).map(tenant => ({
      ...tenant,
      status: tenant.status as Tenant['status'],
      subscription_plan: tenant.subscription_plan as Tenant['subscription_plan'],
      subscription_status: tenant.subscription_status as Tenant['subscription_status'],
      settings: (tenant.settings as Record<string, any>) || {}
    }));
  }

  // Create new tenant (onboarding)
  async createTenant(tenantData: TenantOnboardingData): Promise<Tenant> {
    try {
      console.log('Creating tenant with data:', tenantData);
      
      // استخدام الدالة المحسنة لإنشاء المؤسسة
      const { data: result, error } = await supabase.rpc('create_tenant_with_admin', {
        tenant_data: {
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
        }
      });

      if (error) {
        console.error('Error calling create_tenant_with_admin:', error);
        throw new Error(`خطأ في إنشاء المؤسسة: ${error.message}`);
      }

      const typedResult = result as { success: boolean; tenant_id?: string; error?: string; debug_info?: any };
      
      if (!typedResult?.success) {
        console.error('Tenant creation failed:', result);
        throw new Error(`فشل في إنشاء المؤسسة: ${typedResult?.error || 'خطأ غير معروف'}`);
      }

      console.log('Tenant created successfully via function:', result);

      // الحصول على بيانات المؤسسة المنشأة
      const { data: tenant, error: fetchError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', typedResult.tenant_id!)
        .single();

      if (fetchError || !tenant) {
        console.error('Error fetching created tenant:', fetchError);
        throw new Error('تم إنشاء المؤسسة ولكن لم يتم العثور عليها');
      }

      // Create admin user account if provided
      if (tenantData.admin_user) {
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
          console.warn('Failed to create admin user:', authError);
          // Don't throw here as tenant was created successfully
        } else if (authUser.user) {
          // Link new user to tenant as admin
          await supabase
            .from('tenant_users')
            .insert({
              tenant_id: tenant.id,
              user_id: authUser.user.id,
              role: 'tenant_admin',
              status: 'active'
            });
        }
      }

      return {
        ...tenant,
        status: tenant.status as Tenant['status'],
        subscription_plan: tenant.subscription_plan as Tenant['subscription_plan'],
        subscription_status: tenant.subscription_status as Tenant['subscription_status'],
        settings: (tenant.settings as Record<string, any>) || {}
      };
    } catch (error) {
      console.error('Error in createTenant:', error);
      
      // محاولة بديلة إذا فشلت الدالة المحسنة
      console.log('Attempting fallback tenant creation...');
      try {
        const { data: debugInfo } = await supabase.rpc('debug_user_context');
        console.log('Debug info:', debugInfo);
        
        const { data: tenant, error: fallbackError } = await supabase
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

        if (fallbackError) {
          console.error('Fallback creation also failed:', fallbackError);
          throw new Error(`خطأ في إنشاء المؤسسة (محاولة بديلة): ${fallbackError.message}. معلومات التشخيص: ${JSON.stringify(debugInfo)}`);
        }

        console.log('Fallback tenant creation successful:', tenant);
        return {
          ...tenant,
          status: tenant.status as Tenant['status'],
          subscription_plan: tenant.subscription_plan as Tenant['subscription_plan'],
          subscription_status: tenant.subscription_status as Tenant['subscription_status'],
          settings: (tenant.settings as Record<string, any>) || {}
        };
      } catch (fallbackError) {
        console.error('Both creation methods failed:', fallbackError);
        throw error; // رمي الخطأ الأصلي
      }
    }
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
    return {
      ...data,
      status: data.status as Tenant['status'],
      subscription_plan: data.subscription_plan as Tenant['subscription_plan'],
      subscription_status: data.subscription_status as Tenant['subscription_status'],
      settings: (data.settings as Record<string, any>) || {}
    };
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
    return (data || []).map(user => ({
      ...user,
      role: user.role as TenantUser['role'],
      status: user.status as TenantUser['status']
    }));
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
    return (data || []).map(history => ({
      ...history,
      billing_period: history.billing_period as SubscriptionHistory['billing_period']
    }));
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

  // Delete tenant (soft delete)
  async deleteTenant(tenantId: string, reason?: string): Promise<void> {
    const { data, error } = await supabase.rpc('safe_delete_tenant', {
      tenant_id_param: tenantId,
      deletion_reason: reason || 'Deleted by super admin'
    });

    if (error) {
      console.error('Error deleting tenant:', error);
      throw new Error(`فشل في حذف المؤسسة: ${error.message}`);
    }

    const result = data as { success?: boolean; tenant_name?: string } | null;
    if (!result?.success) {
      throw new Error('فشل في حذف المؤسسة');
    }

    console.log('Tenant deleted successfully:', result.tenant_name);
  }
}