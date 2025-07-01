import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { budget_id } = await req.json()

    if (!budget_id) {
      throw new Error('Budget ID is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Calculating budget variance for budget: ${budget_id}`)

    // حساب التباين في الميزانية
    const { error } = await supabase
      .rpc('calculate_budget_variance', {
        budget_id: budget_id
      })

    if (error) {
      console.error('Error calculating budget variance:', error)
      throw error
    }

    // الحصول على بيانات الميزانية المحدثة
    const { data: budgetData, error: budgetError } = await supabase
      .from('budget_items')
      .select(`
        *,
        account:chart_of_accounts(account_code, account_name)
      `)
      .eq('budget_id', budget_id)

    if (budgetError) {
      console.error('Error fetching updated budget data:', budgetError)
      throw budgetError
    }

    const result = {
      success: true,
      message: 'Budget variance calculated successfully',
      data: {
        budget_id,
        items: budgetData,
        calculated_at: new Date().toISOString()
      }
    }

    console.log('Budget variance calculation completed')

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in budget variance calculation:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to calculate budget variance'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})