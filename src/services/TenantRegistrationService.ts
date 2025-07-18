import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

interface TenantRegistrationData {
  // بيانات الشركة
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  
  // بيانات المدير
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  
  // الخطة
  selectedPlan: string;
}

interface RegistrationResult {
  success: boolean;
  tenantId?: string;
  userId?: string;
  employeeId?: string;
  message: string;
  error?: string;
}

export class TenantRegistrationService {
  
  /**
   * تسجيل مؤسسة جديدة مع إنشاء المستخدم الإداري وملف الموظف تلقائياً
   */
  async registerTenantWithAdmin(data: TenantRegistrationData): Promise<RegistrationResult> {
    try {
      // بدء المعاملة
      const { data: tenantData, error: tenantError } = await this.createTenant(data);
      
      if (tenantError || !tenantData) {
        return {
          success: false,
          message: 'فشل في إنشاء المؤسسة',
          error: tenantError?.message
        };
      }

      // إنشاء المستخدم الإداري
      const { data: userData, error: userError } = await this.createAdminUser(
        data, 
        tenantData.id
      );
      
      if (userError || !userData) {
        // محاولة حذف المؤسسة في حالة فشل إنشاء المستخدم
        await this.cleanupTenant(tenantData.id);
        return {
          success: false,
          message: 'فشل في إنشاء المستخدم الإداري',
          error: userError?.message
        };
      }

      // إنشاء ملف الموظف للمدير
      const { data: employeeData, error: employeeError } = await this.createEmployeeProfile(
        data,
        tenantData.id,
        userData.user.id
      );

      return {
        success: true,
        tenantId: tenantData.id,
        userId: userData.user.id,
        employeeId: employeeData?.id,
        message: 'تم إنشاء المؤسسة والمستخدم وملف الموظف بنجاح',
        error: employeeError ? `تحذير: لم يتم إنشاء ملف الموظف - ${employeeError.message}` : undefined
      };

    } catch (error) {
      console.error('خطأ في تسجيل المؤسسة:', error);
      return {
        success: false,
        message: 'حدث خطأ غير متوقع أثناء التسجيل',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      };
    }
  }

  /**
   * إنشاء سجل المؤسسة
   */
  private async createTenant(data: TenantRegistrationData) {
    return await supabase
      .from('tenants')
      .insert({
        name: data.companyName,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone,
        address: data.address,
        city: data.city,
        subscription_plan: data.selectedPlan,
        is_active: true,
        settings: {
          language: 'ar',
          timezone: 'Asia/Riyadh',
          currency: 'SAR',
          date_format: 'dd/mm/yyyy'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
  }

  /**
   * إنشاء المستخدم الإداري
   */
  private async createAdminUser(data: TenantRegistrationData, tenantId: string) {
    // إنشاء حساب المصادقة
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.adminEmail,
      password: data.adminPassword,
      options: {
        data: {
          full_name: data.adminName,
          tenant_id: tenantId,
          role: 'tenant_admin'
        }
      }
    });

    if (authError) {
      throw authError;
    }

    // إنشاء سجل المستخدم في قاعدة البيانات
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: data.adminEmail,
          full_name: data.adminName,
          tenant_id: tenantId,
          role: 'tenant_admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        throw profileError;
      }
    }

    return authData;
  }

  /**
   * إنشاء ملف الموظف للمدير
   */
  private async createEmployeeProfile(
    data: TenantRegistrationData, 
    tenantId: string, 
    userId: string
  ) {
    return await supabase
      .from('employees')
      .insert({
        tenant_id: tenantId,
        user_id: userId, // ربط الموظف بالمستخدم
        employee_number: 'ADM-001', // رقم موظف تلقائي للمدير
        name: data.adminName,
        email: data.adminEmail,
        phone: data.contactPhone,
        position: 'مدير عام', // منصب افتراضي
        department: 'الإدارة العامة',
        hire_date: new Date().toISOString().split('T')[0],
        employment_type: 'دوام كامل',
        salary: 0, // يمكن تحديثه لاحقاً
        is_active: true,
        notes: 'تم إنشاء هذا الملف تلقائياً عند تسجيل المؤسسة',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
  }

  /**
   * إنشاء ملف الموظف للمدير (إذا لم يكن موجوداً)
   */
  async createAdminEmployeeProfile(userId: string): Promise<RegistrationResult> {
    try {
      // الحصول على بيانات المستخدم
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) {
        return {
          success: false,
          message: 'لم يتم العثور على ملف المستخدم'
        };
      }

      // التحقق من وجود ملف موظف مسبقاً
      const { data: existingEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingEmployee) {
        return {
          success: false,
          message: 'ملف الموظف موجود مسبقاً',
          employeeId: existingEmployee.id
        };
      }

      // إنشاء ملف الموظف
      const { data: employeeData, error } = await supabase
        .from('employees')
        .insert({
          tenant_id: profile.tenant_id,
          user_id: userId,
          employee_number: await this.generateEmployeeNumber(profile.tenant_id),
          name: profile.full_name || 'مدير عام',
          email: profile.email,
          position: 'مدير عام',
          department: 'الإدارة العامة',
          hire_date: new Date().toISOString().split('T')[0],
          employment_type: 'دوام كامل',
          salary: 0,
          is_active: true,
          notes: 'تم إنشاء هذا الملف للمدير بعد التسجيل',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        employeeId: employeeData.id,
        message: 'تم إنشاء ملف الموظف بنجاح'
      };

    } catch (error) {
      console.error('خطأ في إنشاء ملف الموظف:', error);
      return {
        success: false,
        message: 'فشل في إنشاء ملف الموظف',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      };
    }
  }

  /**
   * توليد رقم موظف تلقائي
   */
  private async generateEmployeeNumber(tenantId: string): Promise<string> {
    const { count } = await supabase
      .from('employees')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId);

    const nextNumber = (count || 0) + 1;
    return `EMP-${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * تنظيف المؤسسة في حالة فشل التسجيل
   */
  private async cleanupTenant(tenantId: string) {
    try {
      await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);
    } catch (error) {
      console.error('فشل في تنظيف بيانات المؤسسة:', error);
    }
  }

  /**
   * فحص حالة التسجيل
   */
  async checkRegistrationStatus(email: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        *,
        tenant:tenants(*),
        employee:employees(*)
      `)
      .eq('email', email)
      .single();

    return {
      hasUser: !!profile,
      hasTenant: !!profile?.tenant,
      hasEmployee: !!profile?.employee,
      profile
    };
  }
}

export default TenantRegistrationService; 