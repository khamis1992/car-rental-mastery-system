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

// إعدادات الأداء والـ caching
const PERFORMANCE_CONFIG = {
  settingsCacheTTL: 5 * 60 * 1000, // 5 دقائق
  maxConcurrentRequests: 10,
  queryTimeout: 15000, // 15 ثانية
};

// إعدادات Rate Limiting
const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 60, // طلبات فحص الحالة أكثر تكراراً
  maxRequestsPerHour: 1000,
  maxRequestsPerDay: 5000,
};

// ذاكرة تخزين مؤقت للإعدادات والحالات
const settingsCache = new Map<string, { data: any; timestamp: number }>();
const statusCache = new Map<string, { data: any; timestamp: number }>();
const requestCounters = new Map<string, { count: number; resetTime: number }>();

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

    // التحقق من Rate Limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        success: false,
        error: `Rate limit exceeded. ${rateLimitResult.message}`,
        retry_after: rateLimitResult.retryAfter
      }), {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": rateLimitResult.retryAfter?.toString() || "60"
        },
        status: 429,
      });
    }

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

    // الحصول على إعدادات SADAD مع الـ caching
    const settings = await getCachedSadadSettings(supabase);

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

// دالة التحقق من Rate Limiting
function checkRateLimit(clientIP: string): { allowed: boolean; message?: string; retryAfter?: number } {
  const now = Date.now();
  const minuteKey = `${clientIP}:minute:${Math.floor(now / (60 * 1000))}`;
  const hourKey = `${clientIP}:hour:${Math.floor(now / (60 * 60 * 1000))}`;
  const dayKey = `${clientIP}:day:${Math.floor(now / (24 * 60 * 60 * 1000))}`;

  // تنظيف الطلبات المنتهية الصلاحية
  cleanupExpiredCounters();

  const minuteCount = getOrCreateCounter(minuteKey, 60 * 1000);
  const hourCount = getOrCreateCounter(hourKey, 60 * 60 * 1000);
  const dayCount = getOrCreateCounter(dayKey, 24 * 60 * 60 * 1000);

  // التحقق من حدود الدقيقة
  if (minuteCount.count >= RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
    return {
      allowed: false,
      message: `Too many requests per minute. Limit: ${RATE_LIMIT_CONFIG.maxRequestsPerMinute}`,
      retryAfter: 60
    };
  }

  // التحقق من حدود الساعة
  if (hourCount.count >= RATE_LIMIT_CONFIG.maxRequestsPerHour) {
    return {
      allowed: false,
      message: `Too many requests per hour. Limit: ${RATE_LIMIT_CONFIG.maxRequestsPerHour}`,
      retryAfter: 3600
    };
  }

  // التحقق من حدود اليوم
  if (dayCount.count >= RATE_LIMIT_CONFIG.maxRequestsPerDay) {
    return {
      allowed: false,
      message: `Too many requests per day. Limit: ${RATE_LIMIT_CONFIG.maxRequestsPerDay}`,
      retryAfter: 24 * 3600
    };
  }

  // زيادة العدادات
  minuteCount.count++;
  hourCount.count++;
  dayCount.count++;

  return { allowed: true };
}

// دالة إنشاء أو الحصول على عداد
function getOrCreateCounter(key: string, ttl: number) {
  const existing = requestCounters.get(key);
  const now = Date.now();

  if (existing && existing.resetTime > now) {
    return existing;
  }

  const newCounter = { count: 0, resetTime: now + ttl };
  requestCounters.set(key, newCounter);
  return newCounter;
}

// دالة تنظيف العدادات المنتهية الصلاحية
function cleanupExpiredCounters() {
  const now = Date.now();
  for (const [key, counter] of requestCounters.entries()) {
    if (counter.resetTime <= now) {
      requestCounters.delete(key);
    }
  }
}

// دالة الحصول على إعدادات SADAD مع الـ caching
async function getCachedSadadSettings(supabase: any): Promise<any> {
  const cacheKey = 'sadad_settings';
  const cached = settingsCache.get(cacheKey);
  const now = Date.now();

  // التحقق من وجود الإعدادات في الذاكرة المؤقتة وأنها لم تنته صلاحيتها
  if (cached && (now - cached.timestamp) < PERFORMANCE_CONFIG.settingsCacheTTL) {
    console.log('Using cached SADAD settings');
    return cached.data;
  }

  console.log('Fetching fresh SADAD settings');
  
  // تحديد مهلة زمنية للاستعلام
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Database query timeout')), PERFORMANCE_CONFIG.queryTimeout);
  });

  try {
    const queryPromise = supabase
      .from('sadad_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    const { data: settings, error: settingsError } = await Promise.race([queryPromise, timeoutPromise]);

    if (settingsError || !settings) {
      // إذا كان هناك إعدادات مخزنة مؤقتاً، استخدمها كـ fallback
      if (cached) {
        console.warn('Using expired cached settings as fallback');
        return cached.data;
      }
      throw new Error("SADAD settings not found or not configured");
    }

    // تخزين الإعدادات في الذاكرة المؤقتة
    settingsCache.set(cacheKey, {
      data: settings,
      timestamp: now
    });

    return settings;
  } catch (error) {
    // التحقق من إمكانية استخدام إعدادات مخزنة مؤقتاً كـ fallback
    if (cached) {
      console.warn('Database error, using cached settings as fallback:', error);
      return cached.data;
    }
    
    console.error('Failed to fetch SADAD settings:', error);
    throw error;
  }
}