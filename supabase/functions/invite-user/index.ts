import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email, role, tenantId } = await req.json()

    if (!email || !role || !tenantId) {
      return new Response(
        JSON.stringify({ error: 'email, role, and tenantId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // إنشاء المستخدم في Auth
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: {
        invited: true,
        role: role,
        tenant_id: tenantId
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // إضافة المستخدم لجدول tenant_users
    const { error: tenantUserError } = await supabaseClient
      .from('tenant_users')
      .insert({
        user_id: authData.user.id,
        tenant_id: tenantId,
        role: role,
        status: 'active',
        invited_at: new Date().toISOString(),
        joined_at: new Date().toISOString()
      })

    if (tenantUserError) {
      console.error('Error creating tenant user:', tenantUserError)
      // إذا فشل إنشاء tenant_user، احذف المستخدم من Auth
      await supabaseClient.auth.admin.deleteUser(authData.user.id)
      
      return new Response(
        JSON.stringify({ error: tenantUserError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // إرسال إيميل دعوة (يمكن إضافة هذا لاحقاً)
    // يمكن استخدام خدمة إيميل خارجية أو Supabase Edge Functions

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: role,
          tenant_id: tenantId
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in invite-user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})