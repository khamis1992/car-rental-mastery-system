-- إصلاح دالة reprocess_missing_payment_entries
CREATE OR REPLACE FUNCTION public.reprocess_missing_payment_entries()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payment_record RECORD;
  processed_count INTEGER := 0;
  error_count INTEGER := 0;
  results JSONB := '[]'::jsonb;
  result_item JSONB;
BEGIN
  -- البحث عن المدفوعات التي لا تحتوي على قيود محاسبية
  FOR payment_record IN (
    SELECT 
      p.id,
      p.amount,
      p.payment_date,
      p.payment_method,
      i.invoice_number,
      c.name as customer_name
    FROM public.payments p
    JOIN public.invoices i ON p.invoice_id = i.id
    JOIN public.customers c ON i.customer_id = c.id
    WHERE p.journal_entry_id IS NULL
    AND p.status = 'completed'
    ORDER BY p.created_at DESC
  ) LOOP
    BEGIN
      -- إنشاء القيد المحاسبي للدفعة
      PERFORM public.create_payment_accounting_entry(
        payment_record.id,
        jsonb_build_object(
          'customer_name', payment_record.customer_name,
          'invoice_number', payment_record.invoice_number,
          'payment_amount', payment_record.amount,
          'payment_method', payment_record.payment_method,
          'payment_date', payment_record.payment_date
        )
      );
      
      processed_count := processed_count + 1;
      
      result_item := jsonb_build_object(
        'payment_id', payment_record.id,
        'invoice_number', payment_record.invoice_number,
        'amount', payment_record.amount,
        'status', 'success'
      );
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      
      result_item := jsonb_build_object(
        'payment_id', payment_record.id,
        'invoice_number', payment_record.invoice_number,
        'amount', payment_record.amount,
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
$$;