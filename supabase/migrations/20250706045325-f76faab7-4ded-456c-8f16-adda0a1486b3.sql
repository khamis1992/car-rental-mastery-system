-- Fix double-entry revenue issue by separating invoice and payment accounting

-- Create new function for invoice accounting (receivables only, no revenue)
CREATE OR REPLACE FUNCTION public.create_invoice_receivable_entry(invoice_id uuid, invoice_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    journal_entry_id UUID;
    journal_entry_number TEXT;
    customer_name TEXT;
    invoice_number TEXT;
    
    -- معرفات الحسابات
    receivable_account UUID;
    tax_payable_account UUID;
    
    -- المبالغ
    total_amount NUMERIC;
    tax_amount NUMERIC;
    net_amount NUMERIC;
BEGIN
    -- استخراج البيانات
    total_amount := (invoice_data->>'total_amount')::NUMERIC;
    tax_amount := COALESCE((invoice_data->>'tax_amount')::NUMERIC, 0);
    customer_name := invoice_data->>'customer_name';
    invoice_number := invoice_data->>'invoice_number';
    
    -- حساب صافي المبلغ (بدون ضرائب)
    net_amount := total_amount - tax_amount;
    
    -- الحصول على معرفات الحسابات
    SELECT id INTO receivable_account FROM public.chart_of_accounts WHERE account_code = '1130'; -- حسابات العملاء
    SELECT id INTO tax_payable_account FROM public.chart_of_accounts WHERE account_code = '2140'; -- ضرائب مستحقة
    
    -- التحقق من وجود الحسابات المطلوبة
    IF receivable_account IS NULL THEN
        RAISE EXCEPTION 'حساب العملاء المدينة (1130) غير موجود';
    END IF;
    
    -- توليد رقم القيد
    journal_entry_number := public.generate_journal_entry_number();
    
    -- إنشاء القيد المحاسبي (مديونية فقط، بدون إيراد)
    INSERT INTO public.journal_entries (
        entry_number,
        entry_date,
        description,
        reference_type,
        reference_id,
        total_debit,
        total_credit,
        status,
        created_by
    ) VALUES (
        journal_entry_number,
        CURRENT_DATE,
        'مديونية فاتورة - ' || invoice_number || ' - ' || customer_name,
        'invoice_receivable',
        invoice_id,
        total_amount,
        total_amount,
        'posted',
        auth.uid()
    ) RETURNING id INTO journal_entry_id;
    
    -- إنشاء سطور القيد
    -- المدينون (مدين) - إجمالي المبلغ
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, receivable_account, 'مديونية فاتورة - ' || invoice_number || ' - ' || customer_name, total_amount, 0, 1
    );
    
    -- الضرائب المستحقة (دائن) - إذا وجدت
    IF tax_amount > 0 AND tax_payable_account IS NOT NULL THEN
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
        ) VALUES (
            journal_entry_id, tax_payable_account, 'ضرائب مستحقة - فاتورة ' || invoice_number, 0, tax_amount, 2
        );
        
        -- حساب مؤقت للرصيد المتبقي (دائن)
        IF net_amount > 0 THEN
            -- استخدام حساب الفواتير المعلقة مؤقتاً حتى يتم الدفع
            INSERT INTO public.journal_entry_lines (
                journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
            ) VALUES (
                journal_entry_id, receivable_account, 'رصيد فاتورة معلق - ' || invoice_number, 0, net_amount, 3
            );
        END IF;
    ELSE
        -- إذا لم توجد ضرائب، استخدام حساب الفواتير المعلقة للرصيد الكامل
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
        ) VALUES (
            journal_entry_id, receivable_account, 'رصيد فاتورة معلق - ' || invoice_number, 0, total_amount, 2
        );
    END IF;
    
    -- ربط القيد بالفاتورة
    UPDATE public.invoices 
    SET journal_entry_id = journal_entry_id 
    WHERE id = invoice_id;
    
    RETURN journal_entry_id;
END;
$function$;

-- Create new function for payment accounting (revenue recognition)
CREATE OR REPLACE FUNCTION public.create_payment_revenue_entry(payment_id uuid, payment_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    journal_entry_id UUID;
    journal_entry_number TEXT;
    customer_name TEXT;
    invoice_number TEXT;
    
    -- معرفات الحسابات
    cash_account UUID;
    receivable_account UUID;
    revenue_account UUID;
    
    -- المبالغ
    payment_amount NUMERIC;
BEGIN
    -- استخراج البيانات
    payment_amount := (payment_data->>'payment_amount')::NUMERIC;
    customer_name := payment_data->>'customer_name';
    invoice_number := payment_data->>'invoice_number';
    
    -- الحصول على معرفات الحسابات
    SELECT id INTO cash_account FROM public.chart_of_accounts WHERE account_code = '1110'; -- صندوق النقدية
    SELECT id INTO receivable_account FROM public.chart_of_accounts WHERE account_code = '1130'; -- حسابات العملاء
    SELECT id INTO revenue_account FROM public.chart_of_accounts WHERE account_code = '4110'; -- إيرادات التأجير
    
    -- البحث عن حساب نقدي إذا لم يوجد الحساب الافتراضي
    IF cash_account IS NULL THEN
        SELECT id INTO cash_account 
        FROM public.chart_of_accounts 
        WHERE account_type = 'asset' AND account_category = 'current_asset' 
        AND (account_name ILIKE '%صندوق%' OR account_name ILIKE '%نقدية%' OR account_name ILIKE '%cash%')
        LIMIT 1;
    END IF;
    
    -- التحقق من وجود الحسابات المطلوبة
    IF cash_account IS NULL THEN
        RAISE EXCEPTION 'لا يوجد حساب نقدية متاح في النظام';
    END IF;
    
    IF receivable_account IS NULL THEN
        RAISE EXCEPTION 'حساب العملاء المدينة (1130) غير موجود';
    END IF;
    
    IF revenue_account IS NULL THEN
        RAISE EXCEPTION 'حساب إيرادات التأجير (4110) غير موجود';
    END IF;
    
    -- توليد رقم القيد
    journal_entry_number := public.generate_journal_entry_number();
    
    -- إنشاء القيد المحاسبي (تسجيل الإيراد عند الدفع)
    INSERT INTO public.journal_entries (
        entry_number,
        entry_date,
        description,
        reference_type,
        reference_id,
        total_debit,
        total_credit,
        status,
        created_by
    ) VALUES (
        journal_entry_number,
        CURRENT_DATE,
        'دفعة وإيراد - ' || invoice_number || ' - ' || customer_name,
        'payment_revenue',
        payment_id,
        payment_amount,
        payment_amount,
        'posted',
        auth.uid()
    ) RETURNING id INTO journal_entry_id;
    
    -- إنشاء سطور القيد
    -- النقدية (مدين) - استلام النقد
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, cash_account, 'نقدية مستلمة - ' || invoice_number || ' - ' || customer_name, payment_amount, 0, 1
    );
    
    -- الإيراد (دائن) - تسجيل الإيراد
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, revenue_account, 'إيراد محقق - ' || invoice_number || ' - ' || customer_name, 0, payment_amount, 2
    );
    
    -- ربط القيد بالدفعة
    UPDATE public.payments 
    SET journal_entry_id = journal_entry_id 
    WHERE id = payment_id;
    
    RETURN journal_entry_id;
END;
$function$;

-- Create function to identify and fix double revenue entries
CREATE OR REPLACE FUNCTION public.fix_double_revenue_entries()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    invoice_entry RECORD;
    payment_entry RECORD;
    processed_count INTEGER := 0;
    fixed_count INTEGER := 0;
    error_count INTEGER := 0;
    results JSONB := '[]'::jsonb;
    result_item JSONB;
BEGIN
    -- البحث عن القيود المزدوجة (فواتير ودفعات لنفس المبلغ)
    FOR invoice_entry IN (
        SELECT 
            je_invoice.id as invoice_journal_id,
            je_payment.id as payment_journal_id,
            i.id as invoice_id,
            i.invoice_number,
            i.total_amount,
            p.id as payment_id,
            p.amount as payment_amount
        FROM public.journal_entries je_invoice
        JOIN public.invoices i ON je_invoice.reference_id = i.id 
        JOIN public.payments p ON p.invoice_id = i.id
        JOIN public.journal_entries je_payment ON je_payment.reference_id = p.id
        WHERE je_invoice.reference_type = 'invoice' 
        AND je_payment.reference_type = 'payment'
        AND je_invoice.status = 'posted'
        AND je_payment.status = 'posted'
        -- التحقق من وجود إيراد مزدوج
        AND EXISTS (
            SELECT 1 FROM public.journal_entry_lines jel1
            JOIN public.chart_of_accounts coa1 ON jel1.account_id = coa1.id
            WHERE jel1.journal_entry_id = je_invoice.id 
            AND coa1.account_code = '4110' -- إيرادات التأجير
            AND jel1.credit_amount > 0
        )
        AND EXISTS (
            SELECT 1 FROM public.journal_entry_lines jel2  
            JOIN public.chart_of_accounts coa2 ON jel2.account_id = coa2.id
            WHERE jel2.journal_entry_id = je_payment.id
            AND coa2.account_code = '4110' -- إيرادات التأجير  
            AND jel2.credit_amount > 0
        )
    ) LOOP
        BEGIN
            processed_count := processed_count + 1;
            
            -- إلغاء القيد المحاسبي للفاتورة (الذي يحتوي على الإيراد المزدوج)
            UPDATE public.journal_entries 
            SET status = 'reversed',
                reversed_at = now(),
                reversed_by = auth.uid(),
                reversal_reason = 'تصحيح الإيراد المزدوج - إزالة الإيراد من الفاتورة'
            WHERE id = invoice_entry.invoice_journal_id;
            
            -- إنشاء قيد جديد للفاتورة (مديونية فقط)
            PERFORM public.create_invoice_receivable_entry(
                invoice_entry.invoice_id,
                jsonb_build_object(
                    'customer_name', 'عميل',
                    'invoice_number', invoice_entry.invoice_number,
                    'total_amount', invoice_entry.total_amount,
                    'tax_amount', 0
                )
            );
            
            fixed_count := fixed_count + 1;
            
            result_item := jsonb_build_object(
                'invoice_id', invoice_entry.invoice_id,
                'invoice_number', invoice_entry.invoice_number,
                'payment_id', invoice_entry.payment_id,
                'amount', invoice_entry.total_amount,
                'status', 'fixed'
            );
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            
            result_item := jsonb_build_object(
                'invoice_id', invoice_entry.invoice_id,
                'invoice_number', invoice_entry.invoice_number,
                'payment_id', invoice_entry.payment_id,
                'amount', invoice_entry.total_amount,
                'status', 'error',
                'error_message', SQLERRM
            );
        END;
        
        results := results || result_item;
    END LOOP;
    
    RETURN jsonb_build_object(
        'processed_count', processed_count,
        'fixed_count', fixed_count,
        'error_count', error_count,
        'results', results
    );
END;
$function$;