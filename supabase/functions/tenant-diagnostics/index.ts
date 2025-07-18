import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TenantDiagnosticResult {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { tenant_id, tenant_name } = await req.json()

    // تشخيص شامل للمستأجر
    const diagnosticResult = await performTenantDiagnostic(supabaseClient, tenant_id, tenant_name)

    return new Response(
      JSON.stringify(diagnosticResult),
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

async function performTenantDiagnostic(supabase: any, tenantId?: string, tenantName?: string): Promise<TenantDiagnosticResult> {
  const result: TenantDiagnosticResult = {
    tenant_id: '',
    tenant_name: '',
    status: 'healthy',
    issues: [],
    user_count: 0,
    employee_count: 0,
    admin_users: [],
    missing_relationships: [],
    recommendations: []
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
      result.issues.push(`خطأ في البحث عن المستأجر: ${tenantError.message}`)
      result.status = 'critical'
      return result
    }

    if (!tenants || tenants.length === 0) {
      result.issues.push('لم يتم العثور على المستأجر')
      result.status = 'critical'
      return result
    }

    const tenant = tenants[0]
    result.tenant_id = tenant.id
    result.tenant_name = tenant.name

    // التحقق من وجود المستخدمين المرتبطين
    const { data: tenantUsers, error: userError } = await supabase
      .from('tenant_users')
      .select(`
        user_id,
        role,
        users!inner(email, user_metadata)
      `)
      .eq('tenant_id', tenant.id)

    if (userError) {
      result.issues.push(`خطأ في جلب المستخدمين: ${userError.message}`)
      result.status = 'critical'
    } else {
      result.user_count = tenantUsers?.length || 0
      
      // التحقق من وجود مديرين
      const admins = tenantUsers?.filter(u => u.role === 'admin') || []
      result.admin_users = admins.map(a => a.users.email)

      if (admins.length === 0) {
        result.issues.push('لا يوجد مديرين للمستأجر')
        result.status = 'critical'
      }
    }

    // التحقق من وجود ملفات الموظفين
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('tenant_id', tenant.id)

    if (employeeError) {
      result.issues.push(`خطأ في جلب الموظفين: ${employeeError.message}`)
      result.status = 'critical'
    } else {
      result.employee_count = employees?.length || 0
    }

    // التحقق من العلاقات المفقودة
    const missingRelationships = await checkMissingRelationships(supabase, tenant.id, tenantUsers, employees)
    result.missing_relationships = missingRelationships

    if (missingRelationships.length > 0) {
      result.status = result.status === 'critical' ? 'critical' : 'warning'
    }

    // إنشاء التوصيات
    result.recommendations = generateRecommendations(result)

    return result

  } catch (error) {
    result.issues.push(`خطأ عام في التشخيص: ${error.message}`)
    result.status = 'critical'
    return result
  }
}

async function checkMissingRelationships(supabase: any, tenantId: string, tenantUsers: any[], employees: any[]): Promise<string[]> {
  const missing: string[] = []

  // التحقق من وجود ملفات موظفين للمديرين
  for (const user of tenantUsers || []) {
    if (user.role === 'admin') {
      const hasEmployeeProfile = employees?.some(emp => emp.user_id === user.user_id)
      if (!hasEmployeeProfile) {
        missing.push(`المدير ${user.users.email} لا يملك ملف موظف`)
      }
    }
  }

  // التحقق من وجود حسابات مستخدمين للموظفين
  for (const employee of employees || []) {
    if (employee.user_id) {
      const hasUserAccount = tenantUsers?.some(u => u.user_id === employee.user_id)
      if (!hasUserAccount) {
        missing.push(`الموظف ${employee.first_name} ${employee.last_name} لا يملك حساب مستخدم`)
      }
    }
  }

  return missing
}

function generateRecommendations(result: TenantDiagnosticResult): string[] {
  const recommendations: string[] = []

  if (result.admin_users.length === 0) {
    recommendations.push('إنشاء حساب مدير للمستأجر')
  }

  if (result.missing_relationships.length > 0) {
    recommendations.push('إصلاح العلاقات المفقودة بين المستخدمين والموظفين')
  }

  if (result.user_count === 0) {
    recommendations.push('إضافة مستخدمين للمستأجر')
  }

  if (result.employee_count === 0) {
    recommendations.push('إنشاء ملفات موظفين')
  }

  return recommendations
} 