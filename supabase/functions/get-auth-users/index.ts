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

    const { userIds } = await req.json()

    if (!userIds || !Array.isArray(userIds)) {
      return new Response(
        JSON.stringify({ error: 'userIds array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // جلب بيانات المستخدمين من auth.users
    const users = []
    
    for (const userId of userIds) {
      try {
        const { data: user, error } = await supabaseClient.auth.admin.getUserById(userId)
        
        if (!error && user) {
          users.push({
            id: user.user.id,
            email: user.user.email,
            created_at: user.user.created_at,
            last_sign_in_at: user.user.last_sign_in_at,
            email_confirmed_at: user.user.email_confirmed_at,
            user_metadata: user.user.user_metadata
          })
        } else {
          // إضافة مستخدم مع بيانات افتراضية إذا لم نجده
          users.push({
            id: userId,
            email: 'غير متاح',
            created_at: new Date().toISOString(),
            last_sign_in_at: null,
            email_confirmed_at: null,
            user_metadata: {}
          })
        }
      } catch (userError) {
        console.error(`Error fetching user ${userId}:`, userError)
        // إضافة مستخدم مع بيانات افتراضية
        users.push({
          id: userId,
          email: 'خطأ في التحميل',
          created_at: new Date().toISOString(),
          last_sign_in_at: null,
          email_confirmed_at: null,
          user_metadata: {}
        })
      }
    }

    return new Response(
      JSON.stringify(users),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-auth-users function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})