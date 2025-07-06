-- Create function to reprocess missing invoice entries
CREATE OR REPLACE FUNCTION public.reprocess_missing_invoice_entries()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  invoice_record RECORD;
  processed_count INTEGER := 0;
  error_count INTEGER := 0;
  results JSONB := '[]'::jsonb;
  result_item JSONB;
BEGIN
  -- البحث عن الفواتير التي لا تحتوي على قيود محاسبية
  FOR invoice_record IN (
    SELECT 
      i.id,
      i.invoice_number,
      i.total_amount,
      i.tax_amount,
      i.discount_amount,
      i.created_at,
      c.name as customer_name
    FROM public.invoices i
    JOIN public.customers c ON i.customer_id = c.id
    WHERE i.journal_entry_id IS NULL
    ORDER BY i.created_at DESC
  ) LOOP
    BEGIN
      -- إنشاء القيد المحاسبي للفاتورة
      PERFORM public.create_invoice_accounting_entry(
        invoice_record.id,
        jsonb_build_object(
          'customer_name', invoice_record.customer_name,
          'invoice_number', invoice_record.invoice_number,
          'total_amount', invoice_record.total_amount,
          'tax_amount', COALESCE(invoice_record.tax_amount, 0),
          'discount_amount', COALESCE(invoice_record.discount_amount, 0)
        )
      );
      
      processed_count := processed_count + 1;
      
      result_item := jsonb_build_object(
        'invoice_id', invoice_record.id,
        'invoice_number', invoice_record.invoice_number,
        'amount', invoice_record.total_amount,
        'status', 'success'
      );
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      
      result_item := jsonb_build_object(
        'invoice_id', invoice_record.id,
        'invoice_number', invoice_record.invoice_number,
        'amount', invoice_record.total_amount,
        'status', 'error',
        'error_message', SQLERRM
      );
    END;
    
    results := results || result_item;
  END LOOP;
  
  RETURN jsonb_build_object(
    'processed_count', processed_count,
    'error_count', error_count,
    'total_processed', processed_count + error_count,
    'results', results
  );
END;
$function$;