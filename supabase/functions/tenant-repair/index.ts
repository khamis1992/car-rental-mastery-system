import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RepairResult {
  success: boolean
  tenant_id: string
  tenant_name: string
  repairs_made: string[]
  errors: string[]
  warnings: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { tenant_id, tenant_name, repair_options } = await req.json()

    // إصلاح شامل للمستأجر
    const repairResult = await performTenantRepair(supabaseClient, tenant_id, tenant_name, repair_options)

    return new Response(
      JSON.stringify(repairResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function performTenantRepair(
  supabase: any, 
  tenantId?: string, 
  tenantName?: string,
  repairOptions: any = {}
): Promise<RepairResult> {
  const result: RepairResult = {
    success: false,
    tenant_id: '',
    tenant_name: '',
    repairs_made: [],
    errors: [],
    warnings: []
  }

  try {
    // البحث عن المستأجر
    let tenantQuery = supabase.from('tenants').select('*')
    if (tenantId) {
      tenantQuery = tenantQuery.eq('id', tenantId)
    } else if (tenantName) {
      tenantQuery = tenantQuery.ilike('name', `%${tenantName}%`)
    }

    const { data: tenants, error: tenantError } = await tenantQuery

    if (tenantError) {
      result.errors.push(`خطأ في البحث عن المستأجر: ${tenantError.message}`)
      return result
    }

    if (!tenants || tenants.length === 0) {
      result.errors.push('لم يتم العثور على المستأجر')
      return result
    }

    const tenant = tenants[0]
    result.tenant_id = tenant.id
    result.tenant_name = tenant.name

    // بدء المعاملة
    const { data: transaction, error: transactionError } = await supabase.rpc('begin_transaction')
    
    if (transactionError) {
      result.errors.push(`خطأ في بدء المعاملة: ${transactionError.message}`)
      return result
    }

    try {
      // إصلاح العلاقات المفقودة
      if (repairOptions.fix_missing_relationships !== false) {
        await fixMissingRelationships(supabase, tenant.id, result)
      }

      // إنشاء ملفات موظفين للمديرين
      if (repairOptions.create_admin_employee_profiles !== false) {
        await createAdminEmployeeProfiles(supabase, tenant.id, result)
      }

      // إصلاح حسابات المستخدمين
      if (repairOptions.fix_user_accounts !== false) {
        await fixUserAccounts(supabase, tenant.id, result)
      }

      // تطبيق دليل الحسابات الافتراضي
      if (repairOptions.apply_default_chart_of_accounts !== false) {
        await applyDefaultChartOfAccounts(supabase, tenant.id, result)
      }

      // تأكيد المعاملة
      const { error: commitError } = await supabase.rpc('commit_transaction')
      
      if (commitError) {
        result.errors.push(`خطأ في تأكيد المعاملة: ${commitError.message}`)
        await supabase.rpc('rollback_transaction')
        return result
      }

      result.success = true
      return result

    } catch (error) {
      await supabase.rpc('rollback_transaction')
      result.errors.push(`خطأ في الإصلاح: ${error.message}`)
      return result
    }

  } catch (error) {
    result.errors.push(`خطأ عام في الإصلاح: ${error.message}`)
    return result
  }
}

async function fixMissingRelationships(supabase: any, tenantId: string, result: RepairResult) {
  try {
    // البحث عن المستخدمين بدون علاقات
    const { data: orphanedUsers, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .not('id', 'in', `(select user_id from tenant_users where tenant_id = '${tenantId}')`)

    if (userError) {
      result.warnings.push(`خطأ في البحث عن المستخدمين اليتامى: ${userError.message}`)
      return
    }

    // إنشاء علاقات للمستخدمين اليتامى
    for (const user of orphanedUsers || []) {
      const { error: insertError } = await supabase
        .from('tenant_users')
        .insert({
          tenant_id: tenantId,
          user_id: user.id,
          role: 'user',
          created_at: new Date().toISOString()
        })

      if (insertError) {
        result.warnings.push(`خطأ في إنشاء علاقة للمستخدم ${user.email}: ${insertError.message}`)
      } else {
        result.repairs_made.push(`تم إنشاء علاقة للمستخدم ${user.email}`)
      }
    }

  } catch (error) {
    result.warnings.push(`خطأ في إصلاح العلاقات المفقودة: ${error.message}`)
  }
}

async function createAdminEmployeeProfiles(supabase: any, tenantId: string, result: RepairResult) {
  try {
    // البحث عن المديرين بدون ملفات موظفين
    const { data: adminUsers, error: adminError } = await supabase
      .from('tenant_users')
      .select(`
        user_id,
        users!inner(email, user_metadata)
      `)
      .eq('tenant_id', tenantId)
      .eq('role', 'admin')

    if (adminError) {
      result.warnings.push(`خطأ في البحث عن المديرين: ${adminError.message}`)
      return
    }

    for (const admin of adminUsers || []) {
      // التحقق من وجود ملف موظف
      const { data: existingEmployee, error: checkError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', admin.user_id)
        .eq('tenant_id', tenantId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        result.warnings.push(`خطأ في التحقق من ملف الموظف: ${checkError.message}`)
        continue
      }

      if (!existingEmployee) {
        // إنشاء ملف موظف للمدير
        const { error: insertError } = await supabase
          .from('employees')
          .insert({
            tenant_id: tenantId,
            user_id: admin.user_id,
            first_name: admin.users.user_metadata?.full_name?.split(' ')[0] || 'مدير',
            last_name: admin.users.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'النظام',
            email: admin.users.email,
            position: 'مدير النظام',
            department: 'الإدارة',
            hire_date: new Date().toISOString(),
            status: 'active',
            employee_number: `EMP${Date.now()}${Math.random().toString(36).substr(2, 5)}`
          })

        if (insertError) {
          result.warnings.push(`خطأ في إنشاء ملف موظف للمدير ${admin.users.email}: ${insertError.message}`)
        } else {
          result.repairs_made.push(`تم إنشاء ملف موظف للمدير ${admin.users.email}`)
        }
      }
    }

  } catch (error) {
    result.warnings.push(`خطأ في إنشاء ملفات موظفين للمديرين: ${error.message}`)
  }
}

async function fixUserAccounts(supabase: any, tenantId: string, result: RepairResult) {
  try {
    // البحث عن الموظفين بدون حسابات مستخدمين
    const { data: employeesWithoutUsers, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('user_id', null)

    if (employeeError) {
      result.warnings.push(`خطأ في البحث عن الموظفين بدون حسابات: ${employeeError.message}`)
      return
    }

    for (const employee of employeesWithoutUsers || []) {
      // إنشاء حساب مستخدم للموظف
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: employee.email,
        password: generateTemporaryPassword(),
        email_confirm: true,
        user_metadata: {
          full_name: `${employee.first_name} ${employee.last_name}`,
          role: 'employee'
        }
      })

      if (createUserError) {
        result.warnings.push(`خطأ في إنشاء حساب مستخدم للموظف ${employee.email}: ${createUserError.message}`)
        continue
      }

      // ربط المستخدم بالمستأجر
      const { error: tenantUserError } = await supabase
        .from('tenant_users')
        .insert({
          tenant_id: tenantId,
          user_id: newUser.user.id,
          role: 'employee',
          created_at: new Date().toISOString()
        })

      if (tenantUserError) {
        result.warnings.push(`خطأ في ربط المستخدم بالمستأجر: ${tenantUserError.message}`)
        continue
      }

      // تحديث ملف الموظف
      const { error: updateEmployeeError } = await supabase
        .from('employees')
        .update({ user_id: newUser.user.id })
        .eq('id', employee.id)

      if (updateEmployeeError) {
        result.warnings.push(`خطأ في تحديث ملف الموظف: ${updateEmployeeError.message}`)
      } else {
        result.repairs_made.push(`تم إنشاء حساب مستخدم للموظف ${employee.email}`)
      }
    }

  } catch (error) {
    result.warnings.push(`خطأ في إصلاح حسابات المستخدمين: ${error.message}`)
  }
}

async function applyDefaultChartOfAccounts(supabase: any, tenantId: string, result: RepairResult) {
  try {
    // التحقق من وجود دليل حسابات
    const { data: existingAccounts, error: checkError } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1)

    if (checkError) {
      result.warnings.push(`خطأ في التحقق من دليل الحسابات: ${checkError.message}`)
      return
    }

    if (existingAccounts && existingAccounts.length > 0) {
      result.repairs_made.push('دليل الحسابات موجود بالفعل')
      return
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
        result.warnings.push(`خطأ في إنشاء حساب ${account.name}: ${insertError.message}`)
      }
    }

    result.repairs_made.push('تم إنشاء دليل حسابات افتراضي')

  } catch (error) {
    result.warnings.push(`خطأ في تطبيق دليل الحسابات: ${error.message}`)
  }
}

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
} 