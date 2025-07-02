import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuotationResponse {
  token: string;
  action: 'accept' | 'reject' | 'view';
  client_notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { token, action, client_notes }: QuotationResponse = await req.json();

    if (!token || !action) {
      return new Response(
        JSON.stringify({ error: 'Token and action are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log(`Processing ${action} for token: ${token}`);

    // التحقق من صحة الرمز المميز وأن الرابط لم ينته
    const { data: quotation, error: fetchError } = await supabase
      .from('quotations')
      .select('*')
      .eq('public_token', token)
      .gt('public_link_expires_at', new Date().toISOString())
      .single();

    if (fetchError || !quotation) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // تحديث العرض حسب الإجراء
    let updateData: any = {};

    if (action === 'view') {
      updateData = {
        client_viewed_at: new Date().toISOString(),
      };
    } else if (action === 'accept') {
      if (quotation.status !== 'sent') {
        return new Response(
          JSON.stringify({ error: 'Quotation cannot be accepted in current status' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
      
      updateData = {
        status: 'accepted',
        client_response_at: new Date().toISOString(),
        client_notes: client_notes || null,
      };
    } else if (action === 'reject') {
      if (quotation.status !== 'sent') {
        return new Response(
          JSON.stringify({ error: 'Quotation cannot be rejected in current status' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
      
      updateData = {
        status: 'rejected',
        client_response_at: new Date().toISOString(),
        client_notes: client_notes || null,
      };
    }

    const { data: updatedQuotation, error: updateError } = await supabase
      .from('quotations')
      .update(updateData)
      .eq('public_token', token)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update quotation' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log(`Successfully processed ${action} for quotation ${quotation.quotation_number}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        quotation: updatedQuotation,
        message: action === 'accept' ? 'تم قبول عرض السعر بنجاح' : 
                action === 'reject' ? 'تم رفض عرض السعر' : 'تم تسجيل المشاهدة'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in public-quotation-response function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);