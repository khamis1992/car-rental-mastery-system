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
      description, 
      amount, 
      transaction_type, 
      transaction_id,
      transaction_date 
    } = await req.json()

    if (!description || !amount || !transaction_type || !transaction_id) {
      throw new Error('Missing required fields: description, amount, transaction_type, transaction_id')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Classifying transaction: ${description} - ${amount}`)

    // الحصول على دليل الحسابات
    const { data: accounts, error: accountsError } = await supabase
      .from('chart_of_accounts')
      .select('id, account_code, account_name, account_type, account_category')
      .eq('allow_posting', true)

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError)
      throw accountsError
    }

    // إنشاء نص الطلب للذكاء الاصطناعي
    const prompt = `
أنت محاسب خبير في تصنيف المعاملات المالية. قم بتحليل المعاملة التالية وقترح التصنيف المناسب:

المعاملة:
- الوصف: ${description}
- المبلغ: ${amount} دينار كويتي
- النوع: ${transaction_type}
- التاريخ: ${transaction_date || 'اليوم'}

دليل الحسابات المتاح:
${accounts.map(acc => `${acc.account_code} - ${acc.account_name} (${acc.account_type} - ${acc.account_category})`).join('\n')}

قم بالرد بصيغة JSON فقط مع الحقول التالية:
{
  "suggested_account_id": "معرف الحساب المقترح",
  "suggested_category": "التصنيف المقترح",
  "confidence_score": "نسبة الثقة من 0 إلى 1",
  "reasoning": "سبب الاختيار"
}

اختر الحساب الأنسب بناءً على الوصف ونوع المعاملة.`;

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
            content: 'أنت محاسب خبير متخصص في تصنيف المعاملات المالية. قم بالرد بصيغة JSON صحيحة فقط.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const aiResponse = await response.json()
    const aiContent = aiResponse.choices[0].message.content

    console.log('AI Response:', aiContent)

    // تحليل الرد من الذكاء الاصطناعي
    let classificationResult;
    try {
      classificationResult = JSON.parse(aiContent)
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      throw new Error('Invalid AI response format')
    }

    // التحقق من صحة معرف الحساب
    const suggestedAccount = accounts.find(acc => acc.id === classificationResult.suggested_account_id)
    if (!suggestedAccount) {
      console.error('Invalid account ID suggested by AI')
      // استخدام الحساب الأول كبديل
      classificationResult.suggested_account_id = accounts[0]?.id
      classificationResult.confidence_score = Math.min(classificationResult.confidence_score * 0.5, 0.5)
      classificationResult.reasoning += ' (تم تعديل الحساب لعدم صحة الاقتراح الأصلي)'
    }

    // حفظ التصنيف في قاعدة البيانات
    const { data: classification, error: saveError } = await supabase
      .from('ai_classifications')
      .insert({
        transaction_type,
        transaction_id,
        suggested_category: classificationResult.suggested_category,
        suggested_account_id: classificationResult.suggested_account_id,
        confidence_score: classificationResult.confidence_score,
        ai_reasoning: classificationResult.reasoning,
        model_version: '1.0'
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving classification:', saveError)
      throw saveError
    }

    const result = {
      success: true,
      classification: {
        ...classification,
        suggested_account: suggestedAccount
      },
      message: 'تم تصنيف المعاملة بنجاح'
    }

    console.log('Classification completed successfully')

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in AI classification:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to classify transaction'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})