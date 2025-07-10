import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// إعدادات إعادة المحاولة
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // ميلي ثانية
  timeoutMs: 30000, // 30 ثانية
};

// إعدادات التحقق من صحة البيانات
const VALIDATION_CONFIG = {
  minAmount: 0.001, // الحد الأدنى للمبلغ
  maxAmount: 999999.999, // الحد الأقصى للمبلغ
  maxDescriptionLength: 500,
  maxExpiryMinutes: 10080, // أسبوع واحد
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

    // قراءة بيانات الطلب مع التحقق من صحة البيانات
    const requestData: SadadCreatePaymentRequest = await validateAndParseRequest(req);
    
    // تنظيف وتطهير البيانات
    const sanitizedData = sanitizeRequestData(requestData);

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

    // إرسال الطلب إلى SADAD مع إعادة المحاولة
    const { response: sadadResponse, data: responseData } = await retryApiCall(
      () => callSadadAPI(`${settings.api_url}/api/v1/payments`, finalPayload),
      RETRY_CONFIG
    );

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

// دالة توليد التوقيع المحسّنة
async function generateSignature(payload: any, merchantKey: string): Promise<string> {
  try {
    // التحقق من وجود البيانات المطلوبة
    if (!payload.merchant_id || !payload.amount || !payload.currency || !payload.reference || !merchantKey) {
      throw new Error("Missing required data for signature generation");
    }

    // إنشاء string للتوقيع من البيانات المهمة مع ترتيب محدد
    const signatureString = [
      payload.merchant_id,
      payload.amount.toString(),
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
  } catch (error) {
    console.error('Signature generation error:', error);
    throw new Error('Failed to generate secure signature');
  }
}

// دالة التحقق من صحة البيانات وتحليل الطلب
async function validateAndParseRequest(req: Request): Promise<SadadCreatePaymentRequest> {
  try {
    const requestData = await req.json();
    
    // التحقق من البيانات المطلوبة
    if (!requestData.payment_id || typeof requestData.payment_id !== 'string') {
      throw new Error("payment_id is required and must be a string");
    }
    
    if (!requestData.amount || typeof requestData.amount !== 'number') {
      throw new Error("amount is required and must be a number");
    }
    
    if (!requestData.return_url || typeof requestData.return_url !== 'string') {
      throw new Error("return_url is required and must be a string");
    }
    
    if (!requestData.cancel_url || typeof requestData.cancel_url !== 'string') {
      throw new Error("cancel_url is required and must be a string");
    }

    // التحقق من صحة المبلغ
    if (requestData.amount < VALIDATION_CONFIG.minAmount || requestData.amount > VALIDATION_CONFIG.maxAmount) {
      throw new Error(`Amount must be between ${VALIDATION_CONFIG.minAmount} and ${VALIDATION_CONFIG.maxAmount}`);
    }

    // التحقق من صحة العملة
    const validCurrencies = ['KWD', 'USD', 'EUR'];
    if (requestData.currency && !validCurrencies.includes(requestData.currency)) {
      throw new Error(`Currency must be one of: ${validCurrencies.join(', ')}`);
    }

    // التحقق من طول الوصف
    if (requestData.description && requestData.description.length > VALIDATION_CONFIG.maxDescriptionLength) {
      throw new Error(`Description cannot exceed ${VALIDATION_CONFIG.maxDescriptionLength} characters`);
    }

    // التحقق من مدة انتهاء الصلاحية
    if (requestData.expires_in_minutes && (requestData.expires_in_minutes < 1 || requestData.expires_in_minutes > VALIDATION_CONFIG.maxExpiryMinutes)) {
      throw new Error(`Expiry time must be between 1 and ${VALIDATION_CONFIG.maxExpiryMinutes} minutes`);
    }

    // التحقق من صحة URLs
    try {
      new URL(requestData.return_url);
      new URL(requestData.cancel_url);
    } catch {
      throw new Error("Invalid URL format for return_url or cancel_url");
    }

    // التحقق من صحة البريد الإلكتروني
    if (requestData.customer_email && !isValidEmail(requestData.customer_email)) {
      throw new Error("Invalid email format");
    }

    return requestData as SadadCreatePaymentRequest;
  } catch (error) {
    console.error('Request validation error:', error);
    throw new Error(`Invalid request data: ${error.message}`);
  }
}

// دالة تنظيف وتطهير البيانات
function sanitizeRequestData(data: SadadCreatePaymentRequest): SadadCreatePaymentRequest {
  return {
    ...data,
    payment_id: data.payment_id.trim(),
    currency: data.currency?.toUpperCase() || 'KWD',
    description: data.description?.trim().substring(0, VALIDATION_CONFIG.maxDescriptionLength),
    customer_name: data.customer_name?.trim(),
    customer_email: data.customer_email?.trim().toLowerCase(),
    customer_phone: data.customer_phone?.trim(),
    return_url: data.return_url.trim(),
    cancel_url: data.cancel_url.trim(),
    expires_in_minutes: Math.min(data.expires_in_minutes || 60, VALIDATION_CONFIG.maxExpiryMinutes)
  };
}

// دالة التحقق من صحة البريد الإلكتروني
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
        await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt));
      }
    }
  }
  
  throw new Error(`API call failed after ${config.maxRetries} attempts: ${lastError.message}`);
}

// دالة استدعاء SADAD API
async function callSadadAPI(url: string, payload: any): Promise<{ response: Response, data: any }> {
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
  return { response, data };
}