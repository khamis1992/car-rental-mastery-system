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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    console.log(`Computing financial performance for ${currentYear}-${currentMonth}`)

    // حساب الأداء المالي الشهري
    const { data: performanceData, error: performanceError } = await supabase
      .rpc('calculate_monthly_performance', {
        target_year: currentYear,
        target_month: currentMonth
      })

    if (performanceError) {
      console.error('Error calculating monthly performance:', performanceError)
      throw performanceError
    }

    // حساب المؤشرات المالية
    const { data: kpisData, error: kpisError } = await supabase
      .rpc('calculate_financial_kpis', {
        for_date: currentDate.toISOString().split('T')[0]
      })

    if (kpisError) {
      console.error('Error calculating KPIs:', kpisError)
      throw kpisError
    }

    // حساب قيود الاستهلاك الشهري
    const { data: depreciationData, error: depreciationError } = await supabase
      .rpc('create_depreciation_entries')

    if (depreciationError) {
      console.error('Error creating depreciation entries:', depreciationError)
      throw depreciationError
    }

    const result = {
      success: true,
      message: 'Financial calculations completed successfully',
      data: {
        performance_id: performanceData,
        kpis_created: kpisData,
        depreciation_entries: depreciationData,
        calculated_at: new Date().toISOString()
      }
    }

    console.log('Financial calculations completed:', result)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in financial calculations:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to calculate financial metrics'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})