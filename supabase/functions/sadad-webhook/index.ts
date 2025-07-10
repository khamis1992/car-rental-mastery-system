import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// إعدادات الأمان والموثوقية
const SECURITY_CONFIG = {
  maxWebhookSize: 1024 * 1024, // 1MB
  allowedEventTypes: ['payment.completed', 'payment.failed', 'payment.expired', 'payment.cancelled'],
  maxTransactionIdLength: 100,
  maxAmountValue: 999999.999,
  signatureHashLength: 64,
};

// إعدادات الوقت والتوقيت
const TIMING_CONFIG = {
  maxEventAge: 30 * 60 * 1000, // 30 دقيقة بالميلي ثانية
  duplicateEventWindow: 5 * 60 * 1000, // 5 دقائق للأحداث المكررة
};

// إعدادات الأداء والـ caching
const PERFORMANCE_CONFIG = {
  settingsCacheTTL: 5 * 60 * 1000, // 5 دقائق
  maxConcurrentRequests: 15,
  queryTimeout: 10000, // 10 ثواني للـ webhooks
  duplicateDetectionTTL: 10 * 60 * 1000, // 10 دقائق
};

// إعدادات Rate Limiting للـ webhooks
const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 100, // webhooks أكثر تكراراً
  maxRequestsPerHour: 2000,
  maxRequestsPerDay: 10000,
};

// ذاكرة تخزين مؤقت
const settingsCache = new Map<string, { data: any; timestamp: number }>();
const duplicateCache = new Map<string, number>(); // للكشف عن الأحداث المكررة
const requestCounters = new Map<string, { count: number; resetTime: number }>();

interface SadadWebhookPayload {
  event_type: 'payment.completed' | 'payment.failed' | 'payment.expired' | 'payment.cancelled';
  transaction_id: string;
  reference_number?: string;
  reference?: string; // payment_id
  status: string;
  amount?: number;
  currency?: string;
  paid_at?: string;
  customer_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  signature: string;
  timestamp: string;
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
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'sadad-webhook';
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

    // التحقق من حجم الطلب
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > SECURITY_CONFIG.maxWebhookSize) {
      throw new Error("Webhook payload too large");
    }

    // قراءة وتحليل بيانات webhook مع التحقق من صحتها
    const webhookData = await validateWebhookData(req);
    
    console.log('Received SADAD webhook:', JSON.stringify(webhookData, null, 2));

    // التحقق من الأحداث المكررة
    const duplicateCheck = checkForDuplicate(webhookData);
    if (duplicateCheck.isDuplicate) {
      console.log('Duplicate webhook event detected, returning success without processing');
      return new Response(JSON.stringify({
        success: true,
        message: "Duplicate event, already processed"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // التحقق من عمر الحدث
    await validateEventTiming(webhookData);

    // الحصول على إعدادات SADAD للتحقق من التوقيع مع الـ caching
    const settings = await getCachedSadadSettings(supabase);

    // التحقق من التوقيع
    const isValidSignature = await verifySignature(webhookData, settings.merchant_key);
    if (!isValidSignature) {
      throw new Error("Invalid webhook signature");
    }

    // البحث عن الدفعة في قاعدة البيانات
    const { data: payment, error: paymentError } = await supabase
      .from('sadad_payments')
      .select('*')
      .eq('sadad_transaction_id', webhookData.transaction_id)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found for transaction_id:', webhookData.transaction_id);
      // حفظ webhook event حتى لو لم نجد الدفعة
      await supabase
        .from('sadad_webhook_events')
        .insert({
          event_type: webhookData.event_type,
          sadad_transaction_id: webhookData.transaction_id,
          event_data: webhookData,
          processed: false
        });
      
      return new Response(JSON.stringify({
        success: false,
        error: "Payment not found"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // تسجيل webhook event
    const { data: webhookEvent } = await supabase
      .from('sadad_webhook_events')
      .insert({
        event_type: webhookData.event_type,
        sadad_transaction_id: webhookData.transaction_id,
        payment_id: payment.id,
        event_data: webhookData,
        processed: false
      })
      .select()
      .single();

    // تحديث حالة الدفعة بناءً على نوع الحدث
    let newStatus: string;
    let additionalData: any = {};

    switch (webhookData.event_type) {
      case 'payment.completed':
        newStatus = 'paid';
        additionalData.paid_at = webhookData.paid_at || new Date().toISOString();
        break;
      case 'payment.failed':
        newStatus = 'failed';
        break;
      case 'payment.expired':
        newStatus = 'expired';
        break;
      case 'payment.cancelled':
        newStatus = 'cancelled';
        break;
      default:
        throw new Error(`Unknown event type: ${webhookData.event_type}`);
    }

    // تحديث الدفعة
    await supabase
      .from('sadad_payments')
      .update({
        sadad_status: newStatus,
        sadad_response: webhookData,
        updated_at: new Date().toISOString(),
        ...additionalData
      })
      .eq('id', payment.id);

    // تسجيل في سجل المعاملات
    await supabase
      .from('sadad_transaction_log')
      .insert({
        payment_id: payment.id,
        action: `webhook_${webhookData.event_type}`,
        response_data: webhookData,
        status: 'success'
      });

    // إذا كانت الدفعة مكتملة، نحديث الفاتورة أو الاشتراك المرتبط
    if (newStatus === 'paid') {
      await handlePaymentSuccess(supabase, payment, webhookData);
    }

    // تمييز webhook event كمعالج
    if (webhookEvent) {
      await supabase
        .from('sadad_webhook_events')
        .update({ processed: true })
        .eq('id', webhookEvent.id);
    }

    console.log(`Successfully processed webhook for payment ${payment.id}, status: ${newStatus}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Webhook processed successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('SADAD webhook error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

// دالة التحقق من صحة بيانات الـ webhook
async function validateWebhookData(req: Request): Promise<SadadWebhookPayload> {
  try {
    const webhookData = await req.json();

    // التحقق من نوع الحدث
    if (!webhookData.event_type || !SECURITY_CONFIG.allowedEventTypes.includes(webhookData.event_type)) {
      throw new Error(`Invalid or missing event_type. Allowed types: ${SECURITY_CONFIG.allowedEventTypes.join(', ')}`);
    }

    // التحقق من معرف المعاملة
    if (!webhookData.transaction_id || typeof webhookData.transaction_id !== 'string') {
      throw new Error("Missing or invalid transaction_id");
    }

    if (webhookData.transaction_id.length > SECURITY_CONFIG.maxTransactionIdLength) {
      throw new Error(`transaction_id too long. Max length: ${SECURITY_CONFIG.maxTransactionIdLength}`);
    }

    // التحقق من التوقيع
    if (!webhookData.signature || typeof webhookData.signature !== 'string') {
      throw new Error("Missing or invalid signature");
    }

    if (webhookData.signature.length !== SECURITY_CONFIG.signatureHashLength) {
      throw new Error(`Invalid signature format. Expected length: ${SECURITY_CONFIG.signatureHashLength}`);
    }

    // التحقق من التوقيت
    if (!webhookData.timestamp || typeof webhookData.timestamp !== 'string') {
      throw new Error("Missing or invalid timestamp");
    }

    // التحقق من المبلغ إذا كان موجوداً
    if (webhookData.amount !== undefined) {
      if (typeof webhookData.amount !== 'number' || webhookData.amount < 0 || webhookData.amount > SECURITY_CONFIG.maxAmountValue) {
        throw new Error(`Invalid amount. Must be between 0 and ${SECURITY_CONFIG.maxAmountValue}`);
      }
    }

    // التحقق من الحالة
    if (!webhookData.status || typeof webhookData.status !== 'string') {
      throw new Error("Missing or invalid status");
    }

    // تنظيف البيانات
    return {
      event_type: webhookData.event_type,
      transaction_id: webhookData.transaction_id.trim(),
      reference_number: webhookData.reference_number?.trim(),
      reference: webhookData.reference?.trim(),
      status: webhookData.status.trim(),
      amount: webhookData.amount,
      currency: webhookData.currency?.trim().toUpperCase(),
      paid_at: webhookData.paid_at?.trim(),
      customer_info: webhookData.customer_info,
      signature: webhookData.signature.trim().toLowerCase(),
      timestamp: webhookData.timestamp.trim()
    };
  } catch (error) {
    console.error('Webhook data validation error:', error);
    throw new Error(`Invalid webhook data: ${error.message}`);
  }
}

// دالة التحقق من عمر الحدث
async function validateEventTiming(webhookData: SadadWebhookPayload): Promise<void> {
  try {
    const eventTime = new Date(webhookData.timestamp).getTime();
    const currentTime = Date.now();
    const eventAge = currentTime - eventTime;

    // التحقق من أن الحدث ليس قديماً جداً
    if (eventAge > TIMING_CONFIG.maxEventAge) {
      throw new Error(`Event too old. Age: ${Math.floor(eventAge / 1000)} seconds, Max allowed: ${Math.floor(TIMING_CONFIG.maxEventAge / 1000)} seconds`);
    }

    // التحقق من أن الحدث ليس في المستقبل
    if (eventAge < -60000) { // تسامح لدقيقة واحدة للفروق في التوقيت
      throw new Error("Event timestamp is in the future");
    }
  } catch (error) {
    console.error('Event timing validation error:', error);
    throw new Error(`Invalid event timing: ${error.message}`);
  }
}

// دالة التحقق من التوقيع المحسّنة
async function verifySignature(payload: SadadWebhookPayload, merchantKey: string): Promise<boolean> {
  try {
    // التحقق من وجود البيانات المطلوبة
    if (!payload.transaction_id || !payload.status || !payload.timestamp || !merchantKey) {
      console.error('Missing required data for signature verification');
      return false;
    }

    // إنشاء string للتحقق من التوقيع
    const signatureString = [
      payload.transaction_id,
      payload.status,
      payload.amount?.toString() || '',
      payload.timestamp,
      merchantKey
    ].join('|');

    // تشفير SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // تحويل إلى hex
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // مقارنة آمنة للتوقيعات
    const providedSignature = payload.signature.toLowerCase();
    const computedSignatureLower = computedSignature.toLowerCase();
    
    if (providedSignature.length !== computedSignatureLower.length) {
      return false;
    }

    // مقارنة constant-time لمنع timing attacks
    let result = 0;
    for (let i = 0; i < providedSignature.length; i++) {
      result |= providedSignature.charCodeAt(i) ^ computedSignatureLower.charCodeAt(i);
    }
    
    return result === 0;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// دالة معالجة نجاح الدفعة
async function handlePaymentSuccess(supabase: any, payment: any, webhookData: SadadWebhookPayload) {
  try {
    // إذا كانت الدفعة مرتبطة بفاتورة SaaS
    if (payment.saas_invoice_id) {
      await supabase
        .from('saas_invoices')
        .update({
          status: 'paid',
          paid_at: webhookData.paid_at || new Date().toISOString()
        })
        .eq('id', payment.saas_invoice_id);

      console.log(`Updated SaaS invoice ${payment.saas_invoice_id} status to paid`);
    }

    // إذا كانت الدفعة مرتبطة باشتراك
    if (payment.subscription_id) {
      // تحديث حالة الاشتراك إلى نشط
      await supabase
        .from('saas_subscriptions')
        .update({
          status: 'active',
          last_payment_at: webhookData.paid_at || new Date().toISOString()
        })
        .eq('id', payment.subscription_id);

      console.log(`Updated subscription ${payment.subscription_id} status to active`);
    }

    // إنشاء دفعة في نظام SaaS
    if (payment.saas_invoice_id || payment.subscription_id) {
      await supabase
        .from('saas_payments')
        .insert({
          invoice_id: payment.saas_invoice_id,
          subscription_id: payment.subscription_id,
          tenant_id: payment.tenant_id,
          amount: payment.amount,
          currency: payment.currency,
          payment_method: 'sadad',
          status: 'succeeded',
          paid_at: webhookData.paid_at || new Date().toISOString(),
          external_payment_id: payment.sadad_transaction_id,
          payment_data: webhookData
        });

      console.log(`Created SaaS payment record for payment ${payment.id}`);
    }

  } catch (error) {
    console.error('Error handling payment success:', error);
    // لا نرمي الخطأ هنا لأن الدفعة نفسها نجحت
  }
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

// دالة التحقق من الأحداث المكررة
function checkForDuplicate(webhookData: SadadWebhookPayload): { isDuplicate: boolean; message?: string } {
  const now = Date.now();
  const eventKey = `${webhookData.transaction_id}:${webhookData.event_type}:${webhookData.timestamp}`;
  
  // تنظيف الأحداث المنتهية الصلاحية
  cleanupExpiredDuplicates();
  
  // التحقق من وجود حدث مكرر
  const existingEventTime = duplicateCache.get(eventKey);
  if (existingEventTime) {
    return {
      isDuplicate: true,
      message: `Duplicate event detected. Original event time: ${new Date(existingEventTime).toISOString()}`
    };
  }
  
  // إضافة الحدث للذاكرة المؤقتة
  duplicateCache.set(eventKey, now);
  
  return { isDuplicate: false };
}

// دالة تنظيف الأحداث المكررة المنتهية الصلاحية
function cleanupExpiredDuplicates() {
  const now = Date.now();
  const expiredThreshold = now - PERFORMANCE_CONFIG.duplicateDetectionTTL;
  
  for (const [key, timestamp] of duplicateCache.entries()) {
    if (timestamp < expiredThreshold) {
      duplicateCache.delete(key);
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
  
  try {
    const { data: settings, error: settingsError } = await supabase
      .from('sadad_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError || !settings) {
      // إذا كان هناك إعدادات مخزنة مؤقتاً، استخدمها كـ fallback
      if (cached) {
        console.warn('Using expired cached settings as fallback');
        return cached.data;
      }
      throw new Error("SADAD settings not found");
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