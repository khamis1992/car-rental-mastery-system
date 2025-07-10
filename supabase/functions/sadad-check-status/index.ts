import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// إعدادات إعادة المحاولة
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  timeoutMs: 30000,
};

// إعدادات التحقق من الأمان
const SECURITY_CONFIG = {
  maxTransactionIdLength: 100,
  allowedStatuses: ['pending', 'processing', 'paid', 'failed', 'expired', 'cancelled'],
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

    // التحقق من صحة البيانات وتحليل الطلب
    const requestData = await validateStatusRequest(req);

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

    // إرسال الطلب إلى SADAD مع إعادة المحاولة
    const { response: sadadResponse, data: responseData } = await retryApiCall(
      () => callSadadStatusAPI(`${settings.api_url}/api/v1/payments/${requestData.transaction_id}/status`, finalPayload),
      RETRY_CONFIG
    );

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

// دالة توليد التوقيع لفحص الحالة المحسّنة
async function generateSignature(payload: any, merchantKey: string): Promise<string> {
  try {
    // التحقق من وجود البيانات المطلوبة
    if (!payload.merchant_id || !payload.transaction_id || !merchantKey) {
      throw new Error("Missing required data for signature generation");
    }

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
  } catch (error) {
    console.error('Signature generation error:', error);
    throw new Error('Failed to generate secure signature');
  }
}

// دالة التحقق من صحة طلب فحص الحالة
async function validateStatusRequest(req: Request): Promise<SadadStatusRequest> {
  try {
    const requestData = await req.json();
    
    // التحقق من وجود معرف المعاملة
    if (!requestData.transaction_id || typeof requestData.transaction_id !== 'string') {
      throw new Error("transaction_id is required and must be a string");
    }

    // التحقق من طول معرف المعاملة
    if (requestData.transaction_id.length > SECURITY_CONFIG.maxTransactionIdLength) {
      throw new Error(`transaction_id cannot exceed ${SECURITY_CONFIG.maxTransactionIdLength} characters`);
    }

    // التحقق من تنسيق معرف المعاملة (أرقام وأحرف فقط)
    const validTransactionIdFormat = /^[a-zA-Z0-9\-_]+$/;
    if (!validTransactionIdFormat.test(requestData.transaction_id)) {
      throw new Error("Invalid transaction_id format. Only alphanumeric characters, hyphens, and underscores are allowed");
    }

    return {
      transaction_id: requestData.transaction_id.trim()
    };
  } catch (error) {
    console.error('Status request validation error:', error);
    throw new Error(`Invalid request data: ${error.message}`);
  }
}

// دالة استدعاء API مع إعادة المحاولة
async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  config: typeof RETRY_CONFIG
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await Promise.race([
        apiCall(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), config.timeoutMs)
        )
      ]);
    } catch (error) {
      lastError = error as Error;
      console.warn(`API call attempt ${attempt} failed:`, error);
      
      if (attempt < config.maxRetries) {
        // زيادة زمن الانتظار تدريجياً
        await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt));
      }
    }
  }
  
  throw new Error(`API call failed after ${config.maxRetries} attempts: ${lastError.message}`);
}

// دالة استدعاء SADAD API لفحص الحالة
async function callSadadStatusAPI(url: string, payload: any): Promise<{ response: Response, data: any }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Supabase-Edge-Function/2.0',
      'X-Request-ID': crypto.randomUUID(),
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  
  // التحقق من صحة الاستجابة
  if (data.status && !SECURITY_CONFIG.allowedStatuses.includes(data.status)) {
    console.warn(`Unexpected status received: ${data.status}`);
  }

  return { response, data };
}