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
    const { analysis_type = 'comprehensive' } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Starting advanced financial analysis: ${analysis_type}`)

    // جمع البيانات المطلوبة للتحليل
    const [
      { data: accounts, error: accountsError },
      { data: journalEntries, error: entriesError },
      { data: performance, error: performanceError },
      { data: kpis, error: kpisError },
      { data: budgets, error: budgetsError }
    ] = await Promise.all([
      supabase.from('chart_of_accounts').select('*').order('current_balance', { ascending: false }),
      supabase.from('journal_entries').select('*, lines:journal_entry_lines(*)').order('created_at', { ascending: false }).limit(100),
      supabase.from('financial_performance').select('*').order('calculated_at', { ascending: false }).limit(12),
      supabase.from('financial_kpis').select('*').order('period_date', { ascending: false }).limit(50),
      supabase.from('budget_items').select('*, budget:budgets(*)').order('variance_percentage', { ascending: false }).limit(20)
    ])

    if (accountsError || entriesError || performanceError || kpisError || budgetsError) {
      const errors = [accountsError, entriesError, performanceError, kpisError, budgetsError].filter(Boolean)
      console.error('Error fetching data:', errors)
      throw new Error('Failed to fetch financial data')
    }

    // تحليل الشذوذ في المعاملات
    const anomalies = []
    const avgTransactionAmount = journalEntries.reduce((sum, entry) => sum + entry.total_debit, 0) / journalEntries.length

    journalEntries.forEach(entry => {
      if (entry.total_debit > avgTransactionAmount * 5) {
        anomalies.push({
          type: 'large_transaction',
          entry_id: entry.id,
          amount: entry.total_debit,
          description: entry.description,
          severity: 'medium'
        })
      }
    })

    // تحليل عدم التوازن في الحسابات
    const accountImbalances = accounts.filter(acc => {
      if (acc.account_type === 'asset' || acc.account_type === 'expense') {
        return acc.current_balance < 0
      } else {
        return acc.current_balance < 0
      }
    })

    // تحضير البيانات للذكاء الاصطناعي
    const analysisPrompt = `
أنت خبير تحليل مالي متقدم. قم بتحليل البيانات المالية التالية واكتشف الأنماط والمشاكل والفرص:

معلومات الحسابات (أعلى 10 حسابات):
${accounts.slice(0, 10).map(acc => `
${acc.account_code} - ${acc.account_name}
النوع: ${acc.account_type} | الفئة: ${acc.account_category}
الرصيد: ${acc.current_balance} د.ك
`).join('\n')}

الأداء المالي الأخير (آخر 3 فترات):
${performance.slice(0, 3).map(p => `
التاريخ: ${p.period_year}-${p.period_month || p.period_quarter}
الإيرادات: ${p.total_revenue} د.ك
المصروفات: ${p.total_expenses} د.ك
الربح الصافي: ${p.net_profit} د.ك
هامش الربح: ${p.profit_margin}%
نمو الإيرادات: ${p.revenue_growth}%
`).join('\n')}

المؤشرات المالية الحديثة:
${kpis.slice(0, 8).map(k => `${k.kpi_name}: ${k.kpi_value} (${k.period_date})`).join('\n')}

انحرافات الميزانية (أكبر 5 انحرافات):
${budgets.slice(0, 5).map(b => `
المبلغ المخطط: ${b.budgeted_amount} د.ك
المبلغ الفعلي: ${b.actual_amount} د.ك
الانحراف: ${b.variance_percentage}%
`).join('\n')}

الشذوذ المكتشف:
${anomalies.map(a => `${a.type}: ${a.description} - ${a.amount} د.ك`).join('\n')}

عدم التوازن في الحسابات:
${accountImbalances.map(acc => `${acc.account_name}: ${acc.current_balance} د.ك`).join('\n')}

قم بتحليل شامل وتقديم:
1. اكتشاف الأنماط المالية
2. تحديد المخاطر المحتملة
3. اكتشاف الفرص للتحسين
4. توصيات عملية
5. تقييم الصحة المالية العامة

قم بالرد بصيغة JSON:
{
  "overall_health": "ممتاز/جيد/متوسط/ضعيف",
  "health_score": تقييم من 1 إلى 100,
  "insights": [
    {
      "type": "trend_analysis/anomaly_detection/recommendation",
      "title": "عنوان الرؤية",
      "description": "وصف مفصل",
      "priority": "low/medium/high/critical",
      "affected_accounts": ["معرف الحساب"],
      "recommended_actions": ["إجراء 1", "إجراء 2"]
    }
  ],
  "risk_factors": [
    {
      "risk": "وصف المخاطرة",
      "probability": "low/medium/high",
      "impact": "low/medium/high",
      "mitigation": "طريقة التخفيف"
    }
  ],
  "opportunities": [
    {
      "opportunity": "وصف الفرصة",
      "potential_impact": "التأثير المحتمل",
      "action_required": "الإجراء المطلوب"
    }
  ]
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
            content: 'أنت خبير تحليل مالي متقدم متخصص في اكتشاف الأنماط والمخاطر والفرص في البيانات المالية. قم بالرد بصيغة JSON صحيحة فقط.' 
          },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const aiResponse = await response.json()
    const aiContent = aiResponse.choices[0].message.content

    console.log('AI Analysis Response:', aiContent)

    // تحليل الرد من الذكاء الاصطناعي
    let analysisResult;
    try {
      analysisResult = JSON.parse(aiContent)
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      throw new Error('Invalid AI response format')
    }

    // حفظ الرؤى في قاعدة البيانات
    const savedInsights = []
    for (const insight of analysisResult.insights) {
      const { data: savedInsight, error: saveError } = await supabase
        .from('ai_insights')
        .insert({
          insight_type: insight.type,
          insight_title: insight.title,
          insight_description: insight.description,
          insight_data: {
            analysis_type,
            overall_health: analysisResult.overall_health,
            health_score: analysisResult.health_score,
            anomalies_detected: anomalies.length,
            imbalances_detected: accountImbalances.length
          },
          priority_level: insight.priority,
          affected_accounts: insight.affected_accounts || [],
          recommended_actions: insight.recommended_actions || []
        })
        .select()
        .single()

      if (saveError) {
        console.error('Error saving insight:', saveError)
        continue // لا نوقف العملية لخطأ في رؤية واحدة
      }

      savedInsights.push(savedInsight)
    }

    const result = {
      success: true,
      analysis: {
        overall_health: analysisResult.overall_health,
        health_score: analysisResult.health_score,
        insights: savedInsights,
        risk_factors: analysisResult.risk_factors,
        opportunities: analysisResult.opportunities,
        anomalies_detected: anomalies,
        account_imbalances: accountImbalances
      },
      statistics: {
        total_accounts: accounts.length,
        total_entries: journalEntries.length,
        anomalies_found: anomalies.length,
        imbalances_found: accountImbalances.length,
        insights_generated: savedInsights.length
      },
      message: 'تم إنجاز التحليل المالي المتقدم بنجاح'
    }

    console.log('Advanced financial analysis completed successfully')

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in advanced analysis:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to perform advanced financial analysis'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})