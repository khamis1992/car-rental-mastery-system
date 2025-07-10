import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // قراءة بيانات webhook
    const webhookData: SadadWebhookPayload = await req.json();
    
    console.log('Received SADAD webhook:', JSON.stringify(webhookData, null, 2));

    // التحقق من البيانات المطلوبة
    if (!webhookData.transaction_id || !webhookData.event_type) {
      throw new Error("Missing required webhook data");
    }

    // الحصول على إعدادات SADAD للتحقق من التوقيع
    const { data: settings, error: settingsError } = await supabase
      .from('sadad_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError || !settings) {
      throw new Error("SADAD settings not found");
    }

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

// دالة التحقق من التوقيع
async function verifySignature(payload: SadadWebhookPayload, merchantKey: string): Promise<boolean> {
  try {
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
    
    return computedSignature === payload.signature;
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