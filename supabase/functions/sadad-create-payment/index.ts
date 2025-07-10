import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SadadCreatePaymentRequest {
  payment_id: string;
  amount: number;
  currency: string;
  description?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  return_url: string;
  cancel_url: string;
  expires_in_minutes?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // التحقق من المصادقة
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Unauthorized");
    }

    // قراءة بيانات الطلب
    const requestData: SadadCreatePaymentRequest = await req.json();
    
    // التحقق من البيانات المطلوبة
    if (!requestData.payment_id || !requestData.amount || !requestData.return_url || !requestData.cancel_url) {
      throw new Error("Missing required fields");
    }

    // الحصول على إعدادات SADAD
    const { data: settings, error: settingsError } = await supabase
      .from('sadad_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError || !settings) {
      throw new Error("SADAD settings not found or not configured");
    }

    // الحصول على معلومات الدفعة من قاعدة البيانات
    const { data: payment, error: paymentError } = await supabase
      .from('sadad_payments')
      .select('*')
      .eq('id', requestData.payment_id)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }

    // إعداد بيانات الطلب لـ SADAD
    const sadadPayload = {
      merchant_id: settings.merchant_id,
      amount: requestData.amount,
      currency: requestData.currency || 'KWD',
      description: requestData.description || `Payment for ${requestData.payment_id}`,
      customer_info: {
        name: requestData.customer_name,
        email: requestData.customer_email,
        phone: requestData.customer_phone
      },
      return_url: requestData.return_url,
      cancel_url: requestData.cancel_url,
      webhook_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/sadad-webhook`,
      expires_in_minutes: requestData.expires_in_minutes || 60,
      reference: requestData.payment_id
    };

    // توقيع الطلب
    const signature = await generateSignature(sadadPayload, settings.merchant_key);
    
    // إضافة التوقيع للطلب
    const finalPayload = {
      ...sadadPayload,
      signature
    };

    // تسجيل الطلب في سجل المعاملات
    await supabase
      .from('sadad_transaction_log')
      .insert({
        payment_id: requestData.payment_id,
        action: 'create_payment',
        request_data: finalPayload,
        status: 'pending'
      });

    // إرسال الطلب إلى SADAD
    const sadadResponse = await fetch(`${settings.api_url}/api/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0'
      },
      body: JSON.stringify(finalPayload)
    });

    const responseData = await sadadResponse.json();

    // تسجيل الاستجابة
    await supabase
      .from('sadad_transaction_log')
      .insert({
        payment_id: requestData.payment_id,
        action: 'create_payment_response',
        response_data: responseData,
        status: sadadResponse.ok ? 'success' : 'error',
        error_message: sadadResponse.ok ? null : responseData.message || 'API request failed'
      });

    if (!sadadResponse.ok) {
      throw new Error(`SADAD API error: ${responseData.message || 'Unknown error'}`);
    }

    // تحديث الدفعة في قاعدة البيانات
    const updateData: any = {
      sadad_transaction_id: responseData.transaction_id,
      sadad_reference_number: responseData.reference_number,
      payment_url: responseData.payment_url,
      sadad_response: responseData,
      sadad_status: 'processing'
    };

    if (responseData.expires_at) {
      updateData.expires_at = responseData.expires_at;
    }

    await supabase
      .from('sadad_payments')
      .update(updateData)
      .eq('id', requestData.payment_id);

    return new Response(JSON.stringify({
      success: true,
      transaction_id: responseData.transaction_id,
      reference_number: responseData.reference_number,
      payment_url: responseData.payment_url,
      expires_at: responseData.expires_at
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('SADAD create payment error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

// دالة توليد التوقيع
async function generateSignature(payload: any, merchantKey: string): Promise<string> {
  // إنشاء string للتوقيع من البيانات المهمة
  const signatureString = [
    payload.merchant_id,
    payload.amount,
    payload.currency,
    payload.reference,
    merchantKey
  ].join('|');

  // تشفير SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // تحويل إلى hex
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}