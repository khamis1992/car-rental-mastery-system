import { supabase } from '@/integrations/supabase/client';
import { Tenant, TenantUser, TenantInvitation, TenantOnboardingData, SubscriptionHistory } from '@/types/tenant';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanCode } from '@/types/subscription-plans';

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
    
    const tenant = data.tenant as Tenant;
    
    // التحقق من صلاحية المؤسسة
    if (!this.isOrganizationValid(tenant)) {
      return null;
    }
    
    return tenant;
  }

  // دالة مساعدة للتحقق من صلاحية المؤسسة
  private isOrganizationValid(tenant: Tenant): boolean {
    if (tenant.status === 'active') {
      return true;
    }
    
    if (tenant.status === 'trial') {
      if (tenant.trial_ends_at) {
        const trialEndDate = new Date(tenant.trial_ends_at);
        const now = new Date();
        return now <= trialEndDate;
      }
      return true; // فترة تجريبية بدون تاريخ انتهاء
    }
    
    return false; // suspended أو cancelled
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

  // التحقق من صحة خطة الاشتراك وحصول على الحدود
  private validateAndGetPlanLimits(subscriptionPlan: SubscriptionPlanCode) {
    const plan = SUBSCRIPTION_PLANS[subscriptionPlan];
    if (!plan) {
      throw new Error(`خطة الاشتراك غير صالحة: ${subscriptionPlan}`);
    }
    return {
      max_users: plan.limits.max_users_per_tenant,
      max_vehicles: plan.limits.max_vehicles,
      max_contracts: plan.limits.max_contracts,
      monthly_price: plan.price_monthly,
      yearly_price: plan.price_yearly
    };
  }

  // Create new tenant (onboarding) - محدث للتكامل مع SaaS
  async createTenant(tenantData: TenantOnboardingData): Promise<Tenant> {
    try {
      console.log('Creating tenant with integrated SaaS system:', tenantData);
      
      // التحقق من صحة خطة الاشتراك
      const subscriptionPlan = tenantData.subscription_plan as SubscriptionPlanCode;
      this.validateAndGetPlanLimits(subscriptionPlan);

      if (tenantData.admin_user) {
        // استخدام الدالة الجديدة المتكاملة
        const { data: result, error } = await supabase.rpc('create_tenant_with_admin_user_v2', {
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
            subscription_plan: subscriptionPlan
          },
          admin_email: tenantData.admin_user.email,
          admin_password: tenantData.admin_user.password,
          admin_full_name: tenantData.admin_user.full_name
        });

        if (error) {
          console.error('Error calling create_tenant_with_admin_user_v2:', error);
          
          // محاولة استخدام الدالة القديمة كـ fallback
          console.log('Attempting fallback with old function...');
          return await this.createTenantFallback(tenantData);
        }

        const typedResult = result as { 
          success: boolean; 
          tenant_id?: string; 
          user_id?: string; 
          subscription_id?: string;
          plan_code?: string;
          limits?: any;
          trial_ends_at?: string;
          error?: string; 
        };
        
        if (!typedResult?.success) {
          console.error('Tenant creation failed:', result);
          throw new Error(`فشل في إنشاء المؤسسة: ${typedResult?.error || 'خطأ غير معروف'}`);
        }

        console.log('Tenant, admin, and SaaS subscription created successfully:', result);

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

        return {
          ...tenant,
          status: tenant.status as Tenant['status'],
          subscription_plan: tenant.subscription_plan as Tenant['subscription_plan'],
          subscription_status: tenant.subscription_status as Tenant['subscription_status'],
          settings: (tenant.settings as Record<string, any>) || {}
        };
      } else {
        // في حالة عدم وجود بيانات مدير، استخدم النهج التقليدي
        return await this.createTenantFallback(tenantData);
      }

    } catch (error) {
      console.error('Error in createTenant:', error);
      throw error;
    }
  }

  // دالة احتياطية لإنشاء المؤسسة بالنهج التقليدي
  private async createTenantFallback(tenantData: TenantOnboardingData): Promise<Tenant> {
    console.log('Using fallback tenant creation method...');
    
    try {
      // الحصول على حدود الخطة
      const subscriptionPlan = tenantData.subscription_plan as SubscriptionPlanCode;
      const planLimits = this.validateAndGetPlanLimits(subscriptionPlan);

      // إنشاء المؤسسة بالحدود الصحيحة
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: tenantData.name,
          slug: tenantData.slug,
          contact_email: tenantData.contact_email,
          contact_phone: tenantData.contact_phone,
          address: tenantData.address,
          city: tenantData.city,
          country: tenantData.country || 'Kuwait',
          timezone: tenantData.timezone || 'Asia/Kuwait',
          currency: tenantData.currency || 'KWD',
          subscription_plan: subscriptionPlan,
          status: 'trial',
          max_users: planLimits.max_users,
          max_vehicles: planLimits.max_vehicles,
          max_contracts: planLimits.max_contracts,
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days
        })
        .select()
        .single();

      if (tenantError) {
        console.error('Fallback tenant creation failed:', tenantError);
        throw new Error(`خطأ في إنشاء المؤسسة (محاولة بديلة): ${tenantError.message}`);
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
      console.error('Fallback creation also failed:', fallbackError);
      throw fallbackError;
    }
  }

  // دالة جديدة لتحديث خطة اشتراك المؤسسة
  async updateTenantSubscriptionPlan(tenantId: string, newPlanCode: SubscriptionPlanCode): Promise<{ success: boolean; message: string }> {
    try {
      // التحقق من صحة الخطة الجديدة
      this.validateAndGetPlanLimits(newPlanCode);

      // استخدام دالة قاعدة البيانات لتحديث الحدود
      const { data: result, error } = await supabase.rpc('update_tenant_limits_from_plan', {
        tenant_id_param: tenantId,
        new_plan_code: newPlanCode
      });

      if (error) {
        throw new Error(`خطأ في تحديث خطة الاشتراك: ${error.message}`);
      }

      const typedResult = result as { success: boolean; tenant_id: string; new_plan: string; new_limits: any };
      
      if (!typedResult?.success) {
        throw new Error('فشل في تحديث خطة الاشتراك');
      }

      return {
        success: true,
        message: `تم تحديث خطة الاشتراك إلى ${newPlanCode} بنجاح`
      };
    } catch (error: any) {
      console.error('Error updating subscription plan:', error);
      return {
        success: false,
        message: error.message || 'خطأ في تحديث خطة الاشتراك'
      };
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

  // Check tenant limits - محدث للتكامل مع النظام الجديد
  async checkTenantLimits(tenantId: string): Promise<{
    users: { current: number; max: number; exceeded: boolean };
    vehicles: { current: number; max: number; exceeded: boolean };
    contracts: { current: number; max: number; exceeded: boolean };
    plan_info?: any;
  }> {
    const [tenant, userCount, vehicleCount, contractCount] = await Promise.all([
      supabase.from('tenants').select('max_users, max_vehicles, max_contracts, subscription_plan').eq('id', tenantId).single(),
      supabase.from('tenant_users').select('id', { count: 'exact' }).eq('tenant_id', tenantId).eq('status', 'active'),
      supabase.from('vehicles').select('id', { count: 'exact' }).eq('tenant_id', tenantId),
      supabase.from('contracts').select('id', { count: 'exact' }).eq('tenant_id', tenantId)
    ]);

    if (tenant.error) throw tenant.error;

    // الحصول على معلومات الخطة من النظام الموحد
    const planInfo = tenant.data.subscription_plan ? 
      SUBSCRIPTION_PLANS[tenant.data.subscription_plan as SubscriptionPlanCode] : null;

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
      },
      plan_info: planInfo
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

  // Delete tenant (soft delete or hard delete)
  async deleteTenant(tenantId: string, reason?: string, hardDelete: boolean = false): Promise<any> {
    const functionName = hardDelete ? 'hard_delete_tenant' : 'safe_delete_tenant';
    const { data, error } = await supabase.rpc(functionName, {
      tenant_id_param: tenantId,
      deletion_reason: reason || (hardDelete ? 'حذف نهائي من قبل مدير النظام' : 'إلغاء من قبل مدير النظام')
    });

    if (error) {
      console.error('Error deleting tenant:', error);
      throw new Error(`فشل في ${hardDelete ? 'الحذف النهائي للمؤسسة' : 'إلغاء المؤسسة'}: ${error.message}`);
    }

    const result = data as { success?: boolean; tenant_name?: string; message?: string } | null;
    if (!result?.success) {
      throw new Error(`فشل في ${hardDelete ? 'الحذف النهائي للمؤسسة' : 'إلغاء المؤسسة'}`);
    }

    console.log('Tenant action completed successfully:', result.tenant_name, result.message);
    return result;
  }

  // Restore cancelled tenant
  async restoreTenant(tenantId: string, reason?: string): Promise<any> {
    const { data, error } = await supabase.rpc('restore_cancelled_tenant', {
      tenant_id_param: tenantId,
      restore_reason: reason || 'استعادة من قبل مدير النظام'
    });

    if (error) {
      console.error('Error restoring tenant:', error);
      throw new Error(`فشل في استعادة المؤسسة: ${error.message}`);
    }

    const result = data as { success?: boolean; tenant_name?: string; message?: string } | null;
    if (!result?.success) {
      throw new Error('فشل في استعادة المؤسسة');
    }

    console.log('Tenant restored successfully:', result.tenant_name, result.message);
    return result;
  }
}