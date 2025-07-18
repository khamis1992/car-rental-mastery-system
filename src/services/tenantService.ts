import { supabase } from '@/integrations/supabase/client';
import { 
  Tenant, 
  TenantUser, 
  TenantOnboardingData, 
  TenantWithCounts, 
  CreateTenantResponse,
  TenantInvitation 
} from '@/types/tenant';

export class TenantService {
  async getAllTenants(): Promise<TenantWithCounts[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        tenant_users!inner(id, role, status)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // حساب عدد المستخدمين الفعلي لكل مؤسسة
    const tenantsWithCounts = await Promise.all(
      (data || []).map(async (tenant) => {
        // عدد المستخدمين الفعليين
        const { count: usersCount } = await supabase
          .from('tenant_users')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('status', 'active');

        // عدد المركبات الفعلية
        const { count: vehiclesCount } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);

        return {
          ...tenant,
          status: tenant.status as Tenant['status'],
          actual_users: usersCount || 0,
          actual_vehicles: vehiclesCount || 0,
        } as TenantWithCounts;
      })
    );

    return tenantsWithCounts;
  }

  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    const { data, error } = await supabase
      .from('tenant_users')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Get user profiles separately to avoid relation issues
    const enrichedUsers = await Promise.all(
      (data || []).map(async (user) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.user_id)
          .maybeSingle();
        
        return {
          ...user,
          role: user.role as TenantUser['role'],
          status: user.status as TenantUser['status'],
          profiles: profile ? { full_name: profile.full_name } : undefined
        };
      })
    );
    
    return enrichedUsers;
  }

  // تحديث دالة إنشاء المؤسسة لضمان الربط الصحيح
  async createTenant(data: TenantOnboardingData): Promise<CreateTenantResponse> {
    try {
      console.log('بدء عملية إنشاء المؤسسة:', data);
      
      // استدعاء دالة إنشاء المؤسسة مع المدير من قاعدة البيانات
      const { data: result, error } = await supabase.rpc('create_tenant_with_admin_user', {
        tenant_data: {
          name: data.name,
          slug: data.slug,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country,
          timezone: data.timezone,
          currency: data.currency,
          subscription_plan: data.subscription_plan,
          max_users: data.max_users || 25,
          max_vehicles: data.max_vehicles || 100,
          max_contracts: data.max_contracts || 250,
          status: 'active'
        },
        admin_email: data.admin_user.email,
        admin_password: data.admin_user.password,
        admin_full_name: data.admin_user.full_name
      });

      console.log('نتيجة إنشاء المؤسسة:', result);

      if (error) {
        console.error('خطأ في إنشاء المؤسسة:', error);
        throw new Error(error.message);
      }

      // Type assertion for the result
      const typedResult = result as any;
      
      if (!typedResult || !typedResult.success) {
        const errorMessage = typedResult?.error || 'فشل في إنشاء المؤسسة لسبب غير معروف';
        console.error('فشل في إنشاء المؤسسة:', errorMessage);
        throw new Error(errorMessage);
      }

      // تسجيل النجاح
      console.log('تم إنشاء المؤسسة بنجاح:', {
        tenant_id: typedResult.tenant_id,
        user_id: typedResult.user_id,
        employee_id: typedResult.employee_id
      });

      return {
        success: true,
        tenant_id: typedResult.tenant_id,
        message: typedResult.message
      };

    } catch (error: any) {
      console.error('خطأ في خدمة إنشاء المؤسسة:', error);
      throw new Error(error.message || 'حدث خطأ أثناء إنشاء المؤسسة');
    }
  }

  // دالة للتحقق من حالة المؤسسة بعد الإنشاء
  async verifyTenantCreation(tenantId: string): Promise<{
    tenant: Tenant | null;
    users: TenantUser[];
    hasAdmin: boolean;
  }> {
    try {
      // جلب بيانات المؤسسة
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (tenantError) {
        console.error('خطأ في جلب بيانات المؤسسة:', tenantError);
        throw tenantError;
      }

      // جلب المستخدمين المرتبطين بالمؤسسة
      const users = await this.getTenantUsers(tenantId);
      
      // التحقق من وجود مدير
      const hasAdmin = users.some(user => 
        user.role === 'tenant_admin' && user.status === 'active'
      );

      console.log('تحقق من حالة المؤسسة:', {
        tenantId,
        tenantName: tenant?.name,
        usersCount: users.length,
        hasAdmin,
        users: users.map(u => ({ role: u.role, status: u.status }))
      });

      return {
        tenant: tenant as Tenant,
        users,
        hasAdmin
      };

    } catch (error: any) {
      console.error('خطأ في التحقق من حالة المؤسسة:', error);
      throw error;
    }
  }

  // دالة للتحقق من توفر الرمز
  async isSlugAvailable(slug: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        console.error('خطأ في التحقق من توفر الرمز:', error);
        return false;
      }

      return !data; // true if no data found (slug is available)
    } catch (error: any) {
      console.error('خطأ في التحقق من توفر الرمز:', error);
      return false;
    }
  }

  // دالة لدعوة مستخدم جديد
  async inviteUser(invitation: TenantInvitation): Promise<void> {
    try {
      // This would typically involve creating an invitation record
      // and sending an email. For now, we'll just log it.
      console.log('Inviting user:', invitation);
      
      // TODO: Implement actual invitation logic
      // This might involve:
      // 1. Creating an invitation record in the database
      // 2. Sending an email with invitation link
      // 3. Setting up temporary access tokens
      
      throw new Error('User invitation functionality not yet implemented');
    } catch (error: any) {
      console.error('خطأ في دعوة المستخدم:', error);
      throw error;
    }
  }
}
