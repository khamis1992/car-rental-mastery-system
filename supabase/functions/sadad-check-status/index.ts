import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SadadStatusRequest {
  transaction_id: string;
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
    const requestData: SadadStatusRequest = await req.json();
    
    if (!requestData.transaction_id) {
      throw new Error("Transaction ID is required");
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

    // البحث عن الدفعة في قاعدة البيانات
    const { data: payment, error: paymentError } = await supabase
      .from('sadad_payments')
      .select('*')
      .eq('sadad_transaction_id', requestData.transaction_id)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }

    // إعداد بيانات الطلب لفحص الحالة
    const statusPayload = {
      merchant_id: settings.merchant_id,
      transaction_id: requestData.transaction_id
    };

    // توقيع الطلب
    const signature = await generateSignature(statusPayload, settings.merchant_key);
    const finalPayload = {
      ...statusPayload,
      signature
    };

    // تسجيل الطلب
    await supabase
      .from('sadad_transaction_log')
      .insert({
        payment_id: payment.id,
        action: 'check_status',
        request_data: finalPayload,
        status: 'pending'
      });

    // إرسال الطلب إلى SADAD
    const sadadResponse = await fetch(`${settings.api_url}/api/v1/payments/${requestData.transaction_id}/status`, {
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
        payment_id: payment.id,
        action: 'check_status_response',
        response_data: responseData,
        status: sadadResponse.ok ? 'success' : 'error',
        error_message: sadadResponse.ok ? null : responseData.message || 'Status check failed'
      });

    if (!sadadResponse.ok) {
      throw new Error(`SADAD API error: ${responseData.message || 'Unknown error'}`);
    }

    // تحديث حالة الدفعة إذا تغيرت
    if (responseData.status && responseData.status !== payment.sadad_status) {
      const updateData: any = {
        sadad_status: responseData.status,
        sadad_response: responseData,
        updated_at: new Date().toISOString()
      };

      if (responseData.status === 'paid' && responseData.paid_at) {
        updateData.paid_at = responseData.paid_at;
      }

      await supabase
        .from('sadad_payments')
        .update(updateData)
        .eq('id', payment.id);

      console.log(`Updated payment ${payment.id} status from ${payment.sadad_status} to ${responseData.status}`);
    }

    return new Response(JSON.stringify({
      success: true,
      transaction_id: responseData.transaction_id,
      status: responseData.status,
      amount: responseData.amount,
      currency: responseData.currency,
      paid_at: responseData.paid_at,
      reference_number: responseData.reference_number
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('SADAD status check error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

// دالة توليد التوقيع لفحص الحالة
async function generateSignature(payload: any, merchantKey: string): Promise<string> {
  const signatureString = [
    payload.merchant_id,
    payload.transaction_id,
    merchantKey
  ].join('|');

  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}