import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// إعدادات إعادة المحاولة للـ webhooks
const RETRY_CONFIG = {
  maxRetries: 5,
  initialDelay: 1000, // 1 ثانية
  maxDelay: 300000, // 5 دقائق
  backoffMultiplier: 2,
  retryableStatusCodes: [500, 502, 503, 504, 408, 429],
};

interface WebhookRetryJob {
  id: string;
  webhook_url: string;
  payload: any;
  attempt_count: number;
  max_retries: number;
  next_retry_at: string;
  created_at: string;
  last_error?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
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

    // التحقق من المصادقة (للطلبات اليدوية)
    const authHeader = req.headers.get("Authorization");
    let isSystemCall = false;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) {
        throw new Error("Unauthorized");
      }
    } else {
      // السماح بالاستدعاءات من النظام (cron jobs)
      isSystemCall = true;
    }

    if (req.method === "POST") {
      // معالجة طلب إضافة webhook للإعادة
      const requestData = await req.json();
      
      if (!requestData.webhook_url || !requestData.payload) {
        throw new Error("webhook_url and payload are required");
      }

      const webhookRetryJob = await createWebhookRetryJob(supabase, {
        webhook_url: requestData.webhook_url,
        payload: requestData.payload,
        max_retries: requestData.max_retries || RETRY_CONFIG.maxRetries
      });

      return new Response(JSON.stringify({
        success: true,
        job_id: webhookRetryJob.id,
        message: "Webhook retry job created successfully"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (req.method === "GET") {
      // معالجة المهام المعلقة (للاستدعاء من cron job)
      const result = await processRetryJobs(supabase);
      
      return new Response(JSON.stringify({
        success: true,
        processed_jobs: result.processedJobs,
        failed_jobs: result.failedJobs,
        completed_jobs: result.completedJobs
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Method not allowed");

  } catch (error) {
    console.error('Webhook retry error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

// دالة إنشاء مهمة إعادة محاولة webhook
async function createWebhookRetryJob(supabase: any, jobData: {
  webhook_url: string;
  payload: any;
  max_retries: number;
}): Promise<WebhookRetryJob> {
  const { data, error } = await supabase
    .from('webhook_retry_jobs')
    .insert({
      webhook_url: jobData.webhook_url,
      payload: jobData.payload,
      attempt_count: 0,
      max_retries: jobData.max_retries,
      next_retry_at: new Date().toISOString(),
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// دالة معالجة مهام الإعادة
async function processRetryJobs(supabase: any): Promise<{
  processedJobs: number;
  failedJobs: number;
  completedJobs: number;
}> {
  const now = new Date();
  
  // الحصول على المهام المعلقة التي حان وقت إعادة المحاولة
  const { data: pendingJobs, error } = await supabase
    .from('webhook_retry_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('next_retry_at', now.toISOString())
    .order('created_at', { ascending: true })
    .limit(50); // معالجة 50 مهمة كحد أقصى في كل مرة

  if (error) throw error;
  if (!pendingJobs || pendingJobs.length === 0) {
    return { processedJobs: 0, failedJobs: 0, completedJobs: 0 };
  }

  let processedJobs = 0;
  let failedJobs = 0;
  let completedJobs = 0;

  for (const job of pendingJobs) {
    try {
      const result = await executeWebhookRetry(job);
      
      if (result.success) {
        // نجحت المحاولة
        await supabase
          .from('webhook_retry_jobs')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);
        
        completedJobs++;
      } else {
        // فشلت المحاولة
        const newAttemptCount = job.attempt_count + 1;
        
        if (newAttemptCount >= job.max_retries) {
          // وصلت للحد الأقصى من المحاولات
          await supabase
            .from('webhook_retry_jobs')
            .update({
              status: 'failed',
              attempt_count: newAttemptCount,
              last_error: result.error,
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);
          
          failedJobs++;
        } else {
          // جدولة المحاولة التالية
          const nextRetryDelay = calculateRetryDelay(newAttemptCount);
          const nextRetryAt = new Date(Date.now() + nextRetryDelay);
          
          await supabase
            .from('webhook_retry_jobs')
            .update({
              attempt_count: newAttemptCount,
              next_retry_at: nextRetryAt.toISOString(),
              last_error: result.error,
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);
        }
      }
      
      processedJobs++;
    } catch (error) {
      console.error(`Error processing webhook retry job ${job.id}:`, error);
      failedJobs++;
    }
  }

  return { processedJobs, failedJobs, completedJobs };
}

// دالة تنفيذ إعادة محاولة webhook
async function executeWebhookRetry(job: WebhookRetryJob): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(job.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SADAD-Webhook-Retry/1.0',
        'X-Retry-Attempt': job.attempt_count.toString(),
      },
      body: JSON.stringify(job.payload)
    });

    // التحقق من نجاح الطلب
    if (response.ok) {
      return { success: true };
    }

    // التحقق من إمكانية إعادة المحاولة بناءً على status code
    const isRetryable = RETRY_CONFIG.retryableStatusCodes.includes(response.status);
    
    if (!isRetryable) {
      return { 
        success: false, 
        error: `Non-retryable error: ${response.status} ${response.statusText}` 
      };
    }

    return { 
      success: false, 
      error: `HTTP ${response.status}: ${response.statusText}` 
    };

  } catch (error) {
    return { 
      success: false, 
      error: `Network error: ${error.message}` 
    };
  }
}

// دالة حساب تأخير إعادة المحاولة مع exponential backoff
function calculateRetryDelay(attemptCount: number): number {
  const delay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attemptCount - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
}