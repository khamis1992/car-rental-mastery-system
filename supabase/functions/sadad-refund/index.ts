import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SadadRefundRequest {
  payment_id: string;
  amount?: number; // إذا لم يتم تحديده، سيتم استرداد المبلغ كاملاً
  reason: string;
  refund_type: 'full' | 'partial';
  notes?: string;
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

    if (req.method === "POST") {
      // طلب استرداد جديد
      const requestData: SadadRefundRequest = await req.json();
      const result = await processRefundRequest(supabase, requestData, userData.user.id);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: result.success ? 200 : 400,
      });
    }

    if (req.method === "GET") {
      // الحصول على قائمة طلبات الاسترداد
      const paymentId = new URL(req.url).searchParams.get('payment_id');
      const status = new URL(req.url).searchParams.get('status');
      
      const refunds = await getRefunds(supabase, { payment_id: paymentId, status });
      
      return new Response(JSON.stringify({
        success: true,
        refunds
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Method not allowed");

  } catch (error) {
    console.error('SADAD refund error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

// دالة معالجة طلب الاسترداد
async function processRefundRequest(
  supabase: any, 
  requestData: SadadRefundRequest, 
  userId: string
): Promise<any> {
  try {
    // التحقق من صحة البيانات المدخلة
    if (!requestData.payment_id || !requestData.reason || !requestData.refund_type) {
      throw new Error("Missing required fields: payment_id, reason, refund_type");
    }

    // الحصول على تفاصيل الدفعة
    const { data: payment, error: paymentError } = await supabase
      .from('sadad_payments')
      .select('*')
      .eq('id', requestData.payment_id)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }

    // التحقق من حالة الدفعة
    if (payment.sadad_status !== 'paid') {
      throw new Error("Only paid payments can be refunded");
    }

    // حساب مبلغ الاسترداد
    const refundAmount = requestData.refund_type === 'full' 
      ? payment.amount 
      : (requestData.amount || payment.amount);

    // التحقق من صحة مبلغ الاسترداد
    if (refundAmount <= 0 || refundAmount > payment.amount) {
      throw new Error("Invalid refund amount");
    }

    // التحقق من المبلغ المسترد سابقاً
    const { data: existingRefunds } = await supabase
      .from('sadad_refunds')
      .select('amount')
      .eq('payment_id', requestData.payment_id)
      .eq('status', 'completed');

    const totalRefunded = existingRefunds?.reduce((sum: number, refund: any) => sum + refund.amount, 0) || 0;
    
    if (totalRefunded + refundAmount > payment.amount) {
      throw new Error(`Refund amount exceeds available balance. Available: ${payment.amount - totalRefunded}`);
    }

    // الحصول على إعدادات SADAD
    const { data: settings, error: settingsError } = await supabase
      .from('sadad_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError || !settings) {
      throw new Error("SADAD settings not found");
    }

    // إنشاء سجل طلب الاسترداد في قاعدة البيانات
    const { data: refund, error: refundError } = await supabase
      .from('sadad_refunds')
      .insert({
        payment_id: requestData.payment_id,
        sadad_transaction_id: payment.sadad_transaction_id,
        amount: refundAmount,
        currency: payment.currency,
        refund_type: requestData.refund_type,
        reason: requestData.reason,
        notes: requestData.notes,
        status: 'processing',
        requested_by: userId,
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (refundError) throw refundError;

    // إعداد بيانات طلب الاسترداد لـ SADAD
    const refundPayload = {
      merchant_id: settings.merchant_id,
      original_transaction_id: payment.sadad_transaction_id,
      refund_amount: refundAmount,
      currency: payment.currency,
      reason: requestData.reason,
      refund_reference: refund.id
    };

    // توقيع الطلب
    const signature = await generateRefundSignature(refundPayload, settings.merchant_key);
    const finalPayload = { ...refundPayload, signature };

    // تسجيل طلب الاسترداد في سجل المعاملات
    await supabase
      .from('sadad_transaction_log')
      .insert({
        payment_id: requestData.payment_id,
        action: 'refund_request',
        request_data: finalPayload,
        status: 'pending'
      });

    // إرسال طلب الاسترداد إلى SADAD
    const sadadResponse = await fetch(`${settings.api_url}/api/v1/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/2.0',
        'X-Request-ID': crypto.randomUUID(),
      },
      body: JSON.stringify(finalPayload)
    });

    const responseData = await sadadResponse.json();

    // تسجيل استجابة SADAD
    await supabase
      .from('sadad_transaction_log')
      .insert({
        payment_id: requestData.payment_id,
        action: 'refund_response',
        response_data: responseData,
        status: sadadResponse.ok ? 'success' : 'error',
        error_message: sadadResponse.ok ? null : responseData.message || 'Refund request failed'
      });

    if (!sadadResponse.ok) {
      // تحديث حالة طلب الاسترداد إلى فاشل
      await supabase
        .from('sadad_refunds')
        .update({
          status: 'failed',
          sadad_response: responseData,
          failed_at: new Date().toISOString(),
          error_message: responseData.message || 'Unknown error'
        })
        .eq('id', refund.id);

      throw new Error(`SADAD refund API error: ${responseData.message || 'Unknown error'}`);
    }

    // تحديث طلب الاسترداد بالاستجابة من SADAD
    await supabase
      .from('sadad_refunds')
      .update({
        sadad_refund_id: responseData.refund_id,
        sadad_response: responseData,
        status: responseData.status || 'processing'
      })
      .eq('id', refund.id);

    return {
      success: true,
      refund_id: refund.id,
      sadad_refund_id: responseData.refund_id,
      status: responseData.status,
      amount: refundAmount,
      currency: payment.currency,
      message: "Refund request submitted successfully"
    };

  } catch (error) {
    console.error('Process refund request error:', error);
    throw error;
  }
}

// دالة الحصول على طلبات الاسترداد
async function getRefunds(supabase: any, filters: {
  payment_id?: string;
  status?: string;
}): Promise<any[]> {
  let query = supabase
    .from('sadad_refunds')
    .select(`
      *,
      sadad_payments (
        id,
        amount,
        currency,
        sadad_transaction_id
      )
    `);

  if (filters.payment_id) {
    query = query.eq('payment_id', filters.payment_id);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  return data || [];
}

// دالة توليد التوقيع لطلب الاسترداد
async function generateRefundSignature(payload: any, merchantKey: string): Promise<string> {
  try {
    const signatureString = [
      payload.merchant_id,
      payload.original_transaction_id,
      payload.refund_amount.toString(),
      payload.currency,
      payload.refund_reference,
      merchantKey
    ].join('|');

    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('Refund signature generation error:', error);
    throw new Error('Failed to generate refund signature');
  }
}