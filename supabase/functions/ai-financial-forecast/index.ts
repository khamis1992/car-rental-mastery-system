import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      forecast_type, 
      period_type, 
      periods_ahead = 1 
    } = await req.json()

    if (!forecast_type || !period_type) {
      throw new Error('Missing required fields: forecast_type, period_type')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Generating financial forecast: ${forecast_type} for ${periods_ahead} ${period_type}(s)`)

    // الحصول على البيانات التاريخية
    const { data: historicalData, error: historyError } = await supabase
      .from('financial_performance')
      .select('*')
      .eq('period_type', period_type)
      .order('period_year', { ascending: true })
      .order('period_month', { ascending: true })
      .limit(24) // آخر 24 فترة

    if (historyError) {
      console.error('Error fetching historical data:', historyError)
      throw historyError
    }

    // الحصول على المؤشرات المالية الحالية
    const { data: kpis, error: kpisError } = await supabase
      .from('financial_kpis')
      .select('*')
      .gte('period_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // آخر 90 يوم
      .order('period_date', { ascending: false })

    if (kpisError) {
      console.error('Error fetching KPIs:', kpisError)
      throw kpisError
    }

    // تحضير البيانات للذكاء الاصطناعي
    const prompt = `
أنت خبير تحليل مالي متخصص في التنبؤ المالي. قم بتحليل البيانات التاريخية التالية وتوقع القيم المستقبلية:

نوع التنبؤ: ${forecast_type}
نوع الفترة: ${period_type}
عدد الفترات للتنبؤ: ${periods_ahead}

البيانات التاريخية (آخر ${historicalData.length} فترة):
${historicalData.map(d => `
التاريخ: ${d.period_year}-${d.period_month || 'Q' + d.period_quarter || ''}
الإيرادات: ${d.total_revenue} د.ك
المصروفات: ${d.total_expenses} د.ك
الربح الصافي: ${d.net_profit} د.ك
هامش الربح: ${d.profit_margin}%
نمو الإيرادات: ${d.revenue_growth}%
`).join('\n')}

المؤشرات المالية الحديثة:
${kpis.slice(0, 10).map(k => `${k.kpi_name}: ${k.kpi_value} (${k.period_date})`).join('\n')}

قم بتحليل الاتجاهات والأنماط وتوقع القيم للفترات القادمة. 
احسب أيضاً فترة الثقة (أعلى وأقل قيمة محتملة).

اعتبر العوامل التالية:
- الاتجاهات الموسمية
- معدل النمو التاريخي
- التقلبات في السوق
- المؤشرات الاقتصادية

قم بالرد بصيغة JSON فقط:
{
  "forecasts": [
    {
      "period": "2025-02",
      "predicted_value": قيمة متوقعة,
      "confidence_low": أقل قيمة محتملة,
      "confidence_high": أعلى قيمة محتملة,
      "accuracy_estimate": تقدير الدقة من 0 إلى 1
    }
  ],
  "analysis": "تحليل مفصل للاتجاهات والعوامل المؤثرة",
  "recommendations": ["توصية 1", "توصية 2"],
  "risk_factors": ["عامل خطر 1", "عامل خطر 2"]
}`;

    // استدعاء OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'أنت خبير تحليل مالي متخصص في التنبؤات المالية والتحليل الإحصائي. قم بالرد بصيغة JSON صحيحة فقط.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const aiResponse = await response.json()
    const aiContent = aiResponse.choices[0].message.content

    console.log('AI Forecast Response:', aiContent)

    // تحليل الرد من الذكاء الاصطناعي
    let forecastResult;
    try {
      forecastResult = JSON.parse(aiContent)
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      throw new Error('Invalid AI response format')
    }

    // حفظ التنبؤات في قاعدة البيانات
    const savedForecasts = []
    for (const forecast of forecastResult.forecasts) {
      const { data: savedForecast, error: saveError } = await supabase
        .from('financial_forecasts')
        .insert({
          forecast_type,
          period_type,
          forecast_period: forecast.period + '-01', // تحويل إلى تاريخ صحيح
          predicted_value: forecast.predicted_value,
          confidence_interval_low: forecast.confidence_low,
          confidence_interval_high: forecast.confidence_high,
          accuracy_score: forecast.accuracy_estimate,
          model_used: 'gpt-4o-mini',
          input_features: {
            historical_periods: historicalData.length,
            analysis: forecastResult.analysis,
            recommendations: forecastResult.recommendations,
            risk_factors: forecastResult.risk_factors
          }
        })
        .select()
        .single()

      if (saveError) {
        console.error('Error saving forecast:', saveError)
        throw saveError
      }

      savedForecasts.push(savedForecast)
    }

    // إنشاء رؤى ذكية بناءً على التنبؤات
    if (forecastResult.recommendations && forecastResult.recommendations.length > 0) {
      await supabase
        .from('ai_insights')
        .insert({
          insight_type: 'recommendation',
          insight_title: `توصيات مالية - ${forecast_type}`,
          insight_description: forecastResult.analysis,
          insight_data: {
            forecast_type,
            recommendations: forecastResult.recommendations,
            risk_factors: forecastResult.risk_factors
          },
          priority_level: 'medium',
          recommended_actions: forecastResult.recommendations
        })
    }

    const result = {
      success: true,
      forecasts: savedForecasts,
      analysis: forecastResult.analysis,
      recommendations: forecastResult.recommendations,
      risk_factors: forecastResult.risk_factors,
      message: 'تم إنشاء التنبؤ المالي بنجاح'
    }

    console.log('Financial forecast completed successfully')

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in financial forecasting:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate financial forecast'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})