
import { supabase } from '@/integrations/supabase/client';

/**
 * خدمة للحصول على معرف المؤسسة الحالية بشكل آمن
 */
export class TenantService {
  /**
   * الحصول على معرف المؤسسة الحالية للمستخدم المسجل
   */
  static async getCurrentTenantId(): Promise<string | null> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.warn('⚠️ لا يوجد مستخدم مسجل الدخول');
        return null;
      }

      // تجاهل المستخدم الخاص بـ SaaS admin
      if (user.email === 'admin@admin.com') {
        console.log('🔧 SaaS Admin - تم تجاهل تحديد المؤسسة');
        return null;
      }

      // البحث عن المؤسسة النشطة للمستخدم
      const { data: tenantUser, error: tenantError } = await supabase
        .from('tenant_users')
        .select(`
          tenant_id,
          tenant:tenants(
            id,
            name,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (tenantError) {
        console.error('❌ خطأ في الحصول على بيانات المؤسسة:', tenantError);
        return null;
      }

      if (!tenantUser || !tenantUser.tenant) {
        console.warn('⚠️ لم يتم العثور على مؤسسة نشطة للمستخدم');
        return null;
      }

      const tenant = tenantUser.tenant as any;
      
      // التحقق من حالة المؤسسة
      if (tenant.status !== 'active' && tenant.status !== 'trial') {
        console.warn('⚠️ المؤسسة غير نشطة:', tenant.status);
        return null;
      }

      console.log('✅ تم العثور على المؤسسة:', tenant.name, '- ID:', tenant.id);
      return tenant.id;
      
    } catch (error) {
      console.error('❌ خطأ في الحصول على معرف المؤسسة:', error);
      return null;
    }
  }

  /**
   * التحقق من وجود مؤسسة حالية صالحة
   */
  static async validateCurrentTenant(): Promise<boolean> {
    const tenantId = await this.getCurrentTenantId();
    return tenantId !== null;
  }
}
