import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionData {
  id: string;
  tenant_id: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string;
  auto_renew: boolean;
  discount_percentage: number;
  plan: {
    plan_name: string;
    price_monthly: number;
    price_yearly: number;
  };
  tenant: {
    name: string;
    email: string;
  };
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_type: 'subscription' | 'usage' | 'addon' | 'discount';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    console.log("Starting automatic billing process...");

    // Get subscriptions that need billing today
    const today = new Date().toISOString().split('T')[0];
    
    const { data: subscriptions, error: subsError } = await supabase
      .from('saas_subscriptions')
      .select(`
        *,
        plan:subscription_plans(plan_name, price_monthly, price_yearly),
        tenant:tenants(name, email)
      `)
      .eq('status', 'active')
      .eq('auto_renew', true)
      .lte('next_billing_date', today);

    if (subsError) {
      console.error("Error fetching subscriptions:", subsError);
      throw subsError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No subscriptions need billing today");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No subscriptions need billing today",
          processed: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions to process`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const subscription of subscriptions as SubscriptionData[]) {
      try {
        console.log(`Processing subscription ${subscription.id} for tenant ${subscription.tenant.name}`);

        // Calculate billing amounts
        const unitPrice = subscription.billing_cycle === 'monthly' 
          ? subscription.plan.price_monthly 
          : subscription.plan.price_yearly;

        const subtotal = unitPrice;
        const discountAmount = (subtotal * (subscription.discount_percentage || 0)) / 100;
        const taxAmount = ((subtotal - discountAmount) * 0.05); // 5% tax
        const totalAmount = subtotal - discountAmount + taxAmount;

        // Calculate next billing period
        const currentPeriodEnd = new Date(subscription.current_period_end);
        const nextPeriodStart = new Date(currentPeriodEnd);
        nextPeriodStart.setDate(nextPeriodStart.getDate() + 1);
        
        const nextPeriodEnd = new Date(nextPeriodStart);
        if (subscription.billing_cycle === 'monthly') {
          nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
        } else {
          nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
        }

        const nextBillingDate = new Date(nextPeriodEnd);
        nextBillingDate.setDate(nextBillingDate.getDate() + 1);

        // Create invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('saas_invoices')
          .insert({
            subscription_id: subscription.id,
            tenant_id: subscription.tenant_id,
            billing_period_start: nextPeriodStart.toISOString().split('T')[0],
            billing_period_end: nextPeriodEnd.toISOString().split('T')[0],
            subtotal: subtotal,
            tax_amount: taxAmount,
            discount_amount: discountAmount,
            total_amount: totalAmount,
            currency: 'KWD',
            status: 'sent',
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
            created_by: null // System generated
          })
          .select()
          .single();

        if (invoiceError) {
          console.error(`Error creating invoice for subscription ${subscription.id}:`, invoiceError);
          throw invoiceError;
        }

        console.log(`Created invoice ${invoice.invoice_number} for subscription ${subscription.id}`);

        // Create invoice items
        const invoiceItems: InvoiceItem[] = [
          {
            description: `${subscription.plan.plan_name} - ${subscription.billing_cycle === 'monthly' ? 'شهري' : 'سنوي'}`,
            quantity: 1,
            unit_price: unitPrice,
            total_price: unitPrice,
            item_type: 'subscription'
          }
        ];

        if (discountAmount > 0) {
          invoiceItems.push({
            description: `خصم ${subscription.discount_percentage}%`,
            quantity: 1,
            unit_price: -discountAmount,
            total_price: -discountAmount,
            item_type: 'discount'
          });
        }

        const { error: itemsError } = await supabase
          .from('saas_invoice_items')
          .insert(
            invoiceItems.map(item => ({
              invoice_id: invoice.id,
              ...item
            }))
          );

        if (itemsError) {
          console.error(`Error creating invoice items for invoice ${invoice.id}:`, itemsError);
          throw itemsError;
        }

        // Update subscription for next billing cycle
        const { error: updateError } = await supabase
          .from('saas_subscriptions')
          .update({
            current_period_start: nextPeriodStart.toISOString().split('T')[0],
            current_period_end: nextPeriodEnd.toISOString().split('T')[0],
            next_billing_date: nextBillingDate.toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error(`Error updating subscription ${subscription.id}:`, updateError);
          throw updateError;
        }

        results.push({
          subscription_id: subscription.id,
          tenant_name: subscription.tenant.name,
          invoice_number: invoice.invoice_number,
          amount: totalAmount,
          status: 'success'
        });

        successCount++;
        console.log(`Successfully processed subscription ${subscription.id}`);

      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        results.push({
          subscription_id: subscription.id,
          tenant_name: subscription.tenant?.name || 'Unknown',
          error: error.message,
          status: 'error'
        });
        errorCount++;
      }
    }

    console.log(`Billing process completed. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${subscriptions.length} subscriptions`,
        summary: {
          total: subscriptions.length,
          success: successCount,
          errors: errorCount
        },
        results: results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Billing process error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});