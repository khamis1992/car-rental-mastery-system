import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

export interface TenantDiagnosticResult {
  tenant_id: string
  tenant_name: string
  status: 'healthy' | 'warning' | 'critical'
  issues: string[]
  user_count: number
  employee_count: number
  admin_users: string[]
  missing_relationships: string[]
  recommendations: string[]
}

export interface TenantRepairResult {
  success: boolean
  tenant_id: string
  tenant_name: string
  repairs_made: string[]
  errors: string[]
  warnings: string[]
}

export interface TenantRegistrationData {
  name: string
  domain?: string
  admin_email: string
  admin_password: string
  admin_full_name: string
  subscription_plan?: string
  settings?: any
}

export interface TenantInfo {
  id: string
  name: string
  domain?: string
  status: 'active' | 'suspended' | 'trial'
  created_at: string
  subscription_plan?: string
  user_count: number
  employee_count: number
  last_activity?: string
}

export class EnhancedTenantService {
  /**
   * تشخيص شامل لمستأجر معين
   */
  static async diagnoseTenant(tenantId?: string, tenantName?: string): Promise<TenantDiagnosticResult> {
    try {
      const { data, error } = await supabase.functions.invoke('tenant-diagnostics', {
        body: { tenant_id: tenantId, tenant_name: tenantName }
      })

      if (error) {
        throw new Error(`خطأ في التشخيص: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Tenant diagnostic error:', error)
      throw error
    }
  }

  /**
   * إصلاح تلقائي لمشاكل المستأجر
   */
  static async repairTenant(
    tenantId: string, 
    repairOptions: any = {}
  ): Promise<TenantRepairResult> {
    try {
      const { data, error } = await supabase.functions.invoke('tenant-repair', {
        body: {
          tenant_id: tenantId,
          repair_options: {
            fix_missing_relationships: true,
            create_admin_employee_profiles: true,
            fix_user_accounts: true,
            apply_default_chart_of_accounts: true,
            ...repairOptions
          }
        }
      })

      if (error) {
        throw new Error(`خطأ في الإصلاح: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Tenant repair error:', error)
      throw error
    }
  }

  /**
   * إنشاء مستأجر جديد مع جميع العلاقات المطلوبة
   */
  static async createTenantWithRelationships(tenantData: TenantRegistrationData): Promise<{ tenant: any, admin: any }> {
    try {
      // بدء المعاملة
      const { data: transaction, error: transactionError } = await supabase.rpc('begin_transaction')
      
      if (transactionError) {
        throw new Error(`خطأ في بدء المعاملة: ${transactionError.message}`)
      }

      try {
        // إنشاء المستأجر
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            name: tenantData.name,
            domain: tenantData.domain,
            status: 'active',
            subscription_plan: tenantData.subscription_plan || 'basic',
            settings: tenantData.settings || {}
          })
          .select()
          .single()

        if (tenantError) {
          throw new Error(`خطأ في إنشاء المستأجر: ${tenantError.message}`)
        }

        // إنشاء حساب المدير
        const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
          email: tenantData.admin_email,
          password: tenantData.admin_password,
          email_confirm: true,
          user_metadata: {
            full_name: tenantData.admin_full_name,
            role: 'admin'
          }
        })

        if (adminError) {
          throw new Error(`خطأ في إنشاء حساب المدير: ${adminError.message}`)
        }

        // ربط المدير بالمستأجر
        const { error: tenantUserError } = await supabase
          .from('tenant_users')
          .insert({
            tenant_id: tenant.id,
            user_id: adminUser.user.id,
            role: 'admin',
            created_at: new Date().toISOString()
          })

        if (tenantUserError) {
          throw new Error(`خطأ في ربط المدير بالمستأجر: ${tenantUserError.message}`)
        }

        // إنشاء ملف موظف للمدير
        const { error: employeeError } = await supabase
          .from('employees')
          .insert({
            tenant_id: tenant.id,
            user_id: adminUser.user.id,
            first_name: tenantData.admin_full_name.split(' ')[0],
            last_name: tenantData.admin_full_name.split(' ').slice(1).join(' '),
            email: tenantData.admin_email,
            position: 'مدير النظام',
            department: 'الإدارة',
            hire_date: new Date().toISOString(),
            status: 'active',
            employee_number: `EMP${Date.now()}${Math.random().toString(36).substr(2, 5)}`
          })

        if (employeeError) {
          throw new Error(`خطأ في إنشاء ملف موظف للمدير: ${employeeError.message}`)
        }

        // تطبيق دليل الحسابات الافتراضي
        await this.applyDefaultChartOfAccounts(tenant.id)

        // تأكيد المعاملة
        const { error: commitError } = await supabase.rpc('commit_transaction')
        
        if (commitError) {
          throw new Error(`خطأ في تأكيد المعاملة: ${commitError.message}`)
        }

        return { tenant, admin: adminUser.user }

      } catch (error) {
        await supabase.rpc('rollback_transaction')
        throw error
      }

    } catch (error) {
      console.error('Tenant creation error:', error)
      throw error
    }
  }

  /**
   * جلب قائمة المستأجرين مع الإحصائيات
   */
  static async getTenantsList(): Promise<TenantInfo[]> {
    try {
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select(`
          id,
          name,
          domain,
          status,
          created_at,
          subscription_plan,
          settings
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`خطأ في جلب المستأجرين: ${error.message}`)
      }

      // إضافة الإحصائيات لكل مستأجر
      const tenantsWithStats = await Promise.all(
        tenants.map(async (tenant) => {
          const [userCount, employeeCount] = await Promise.all([
            this.getTenantUserCount(tenant.id),
            this.getTenantEmployeeCount(tenant.id)
          ])

          return {
            ...tenant,
            user_count: userCount,
            employee_count: employeeCount
          }
        })
      )

      return tenantsWithStats
    } catch (error) {
      console.error('Get tenants error:', error)
      throw error
    }
  }

  /**
   * جلب عدد المستخدمين في مستأجر معين
   */
  static async getTenantUserCount(tenantId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('tenant_users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

      if (error) {
        console.error('Error getting user count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Get user count error:', error)
      return 0
    }
  }

  /**
   * جلب عدد الموظفين في مستأجر معين
   */
  static async getTenantEmployeeCount(tenantId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

      if (error) {
        console.error('Error getting employee count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Get employee count error:', error)
      return 0
    }
  }

  /**
   * تطبيق دليل الحسابات الافتراضي
   */
  static async applyDefaultChartOfAccounts(tenantId: string): Promise<void> {
    try {
      // التحقق من وجود دليل حسابات
      const { data: existingAccounts, error: checkError } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('tenant_id', tenantId)
        .limit(1)

      if (checkError) {
        throw new Error(`خطأ في التحقق من دليل الحسابات: ${checkError.message}`)
      }

      if (existingAccounts && existingAccounts.length > 0) {
        return // دليل الحسابات موجود بالفعل
      }

      // إنشاء دليل حسابات افتراضي
      const defaultAccounts = [
        { code: '1000', name: 'الأصول المتداولة', type: 'asset', parent_id: null },
        { code: '1100', name: 'النقد وما في حكمه', type: 'asset', parent_id: null },
        { code: '1200', name: 'الذمم المدينة', type: 'asset', parent_id: null },
        { code: '2000', name: 'الخصوم المتداولة', type: 'liability', parent_id: null },
        { code: '2100', name: 'الذمم الدائنة', type: 'liability', parent_id: null },
        { code: '3000', name: 'حقوق الملكية', type: 'equity', parent_id: null },
        { code: '4000', name: 'الإيرادات', type: 'revenue', parent_id: null },
        { code: '5000', name: 'المصروفات', type: 'expense', parent_id: null }
      ]

      for (const account of defaultAccounts) {
        const { error: insertError } = await supabase
          .from('chart_of_accounts')
          .insert({
            tenant_id: tenantId,
            code: account.code,
            name: account.name,
            type: account.type,
            parent_id: account.parent_id,
            is_active: true
          })

        if (insertError) {
          console.error(`خطأ في إنشاء حساب ${account.name}:`, insertError)
        }
      }
    } catch (error) {
      console.error('Apply chart of accounts error:', error)
      throw error
    }
  }

  /**
   * إنشاء ملف موظف للمدير
   */
  static async createAdminEmployeeProfile(tenantId: string, userId: string, adminData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('employees')
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          first_name: adminData.first_name || 'مدير',
          last_name: adminData.last_name || 'النظام',
          email: adminData.email,
          position: adminData.position || 'مدير النظام',
          department: adminData.department || 'الإدارة',
          hire_date: new Date().toISOString(),
          status: 'active',
          employee_number: `EMP${Date.now()}${Math.random().toString(36).substr(2, 5)}`
        })

      if (error) {
        throw new Error(`خطأ في إنشاء ملف موظف للمدير: ${error.message}`)
      }
    } catch (error) {
      console.error('Create admin employee profile error:', error)
      throw error
    }
  }

  /**
   * حذف مستأجر مع جميع البيانات المرتبطة
   */
  static async deleteTenant(tenantId: string): Promise<void> {
    try {
      // بدء المعاملة
      const { data: transaction, error: transactionError } = await supabase.rpc('begin_transaction')
      
      if (transactionError) {
        throw new Error(`خطأ في بدء المعاملة: ${transactionError.message}`)
      }

      try {
        // حذف جميع البيانات المرتبطة بالمستأجر
        const tablesToDelete = [
          'employees',
          'tenant_users',
          'chart_of_accounts',
          'contracts',
          'vehicles',
          'customers',
          'invoices',
          'payments',
          'attendance',
          'payroll',
          'expenses',
          'departments',
          'cost_centers'
        ]

        for (const table of tablesToDelete) {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('tenant_id', tenantId)

          if (error) {
            console.error(`خطأ في حذف جدول ${table}:`, error)
          }
        }

        // حذف المستأجر نفسه
        const { error: tenantDeleteError } = await supabase
          .from('tenants')
          .delete()
          .eq('id', tenantId)

        if (tenantDeleteError) {
          throw new Error(`خطأ في حذف المستأجر: ${tenantDeleteError.message}`)
        }

        // تأكيد المعاملة
        const { error: commitError } = await supabase.rpc('commit_transaction')
        
        if (commitError) {
          throw new Error(`خطأ في تأكيد المعاملة: ${commitError.message}`)
        }

      } catch (error) {
        await supabase.rpc('rollback_transaction')
        throw error
      }

    } catch (error) {
      console.error('Delete tenant error:', error)
      throw error
    }
  }

  /**
   * تحديث إعدادات المستأجر
   */
  static async updateTenantSettings(tenantId: string, settings: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ settings })
        .eq('id', tenantId)

      if (error) {
        throw new Error(`خطأ في تحديث إعدادات المستأجر: ${error.message}`)
      }
    } catch (error) {
      console.error('Update tenant settings error:', error)
      throw error
    }
  }

  /**
   * تعليق أو إعادة تفعيل مستأجر
   */
  static async updateTenantStatus(tenantId: string, status: 'active' | 'suspended'): Promise<void> {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status })
        .eq('id', tenantId)

      if (error) {
        throw new Error(`خطأ في تحديث حالة المستأجر: ${error.message}`)
      }
    } catch (error) {
      console.error('Update tenant status error:', error)
      throw error
    }
  }
} 