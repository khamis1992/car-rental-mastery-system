-- حذف الدوال المتبقية وإعادة إنشائها
DROP FUNCTION IF EXISTS public.copy_default_chart_of_accounts(uuid);
DROP FUNCTION IF EXISTS public.copy_default_cost_centers(uuid);
DROP FUNCTION IF EXISTS public.copy_default_company_branding(uuid);
DROP FUNCTION IF EXISTS public.create_payment_accounting_entry(uuid, jsonb);

-- إنشاء الدوال بعد الحذف
-- 1. إصلاح create_payment_accounting_entry
CREATE OR REPLACE FUNCTION public.create_payment_accounting_entry(payment_id uuid, payment_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  payment_amount NUMERIC;
  invoice_number TEXT;
  customer_name TEXT;
  payment_method TEXT;
  payment_date DATE;
  
  -- معرفات الحسابات
  cash_account UUID;
  receivables_account UUID;
  current_tenant_id UUID;
BEGIN
  current_tenant_id := public.get_current_tenant_id();
  
  -- استخراج البيانات
  payment_amount := (payment_data->>'payment_amount')::NUMERIC;
  invoice_number := payment_data->>'invoice_number';
  customer_name := payment_data->>'customer_name';
  payment_method := payment_data->>'payment_method';
  payment_date := (payment_data->>'payment_date')::DATE;
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO cash_account FROM public.chart_of_accounts 
  WHERE account_code = '1111' AND tenant_id = current_tenant_id;
  
  SELECT id INTO receivables_account FROM public.chart_of_accounts 
  WHERE account_code = '1121' AND tenant_id = current_tenant_id;
  
  -- توليد رقم القيد
  journal_entry_number := public.generate_journal_entry_number();
  
  -- إنشاء القيد المحاسبي
  INSERT INTO public.journal_entries (
    entry_number,
    entry_date,
    description,
    reference_type,
    reference_id,
    total_debit,
    total_credit,
    status,
    created_by,
    tenant_id
  ) VALUES (
    journal_entry_number,
    COALESCE(payment_date, CURRENT_DATE),
    'سداد - ' || customer_name || ' - فاتورة: ' || invoice_number,
    'payment',
    payment_id,
    payment_amount,
    payment_amount,
    'posted',
    auth.uid(),
    current_tenant_id
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- النقدية (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number, tenant_id
  ) VALUES (
    journal_entry_id, cash_account, 'استلام نقدي - ' || customer_name, payment_amount, 0, 1, current_tenant_id
  );
  
  -- الذمم المدينة (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number, tenant_id
  ) VALUES (
    journal_entry_id, receivables_account, 'سداد ذمم - ' || customer_name, 0, payment_amount, 2, current_tenant_id
  );
  
  -- ربط القيد بالدفعة
  UPDATE public.payments SET journal_entry_id = journal_entry_id WHERE id = payment_id;
  
  RETURN journal_entry_id;
END;
$function$;

-- 2. إصلاح copy_default_chart_of_accounts
CREATE OR REPLACE FUNCTION public.copy_default_chart_of_accounts(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- نسخ الحسابات من النموذج الافتراضي
    INSERT INTO public.chart_of_accounts (
        tenant_id,
        account_code,
        account_name,
        account_name_en,
        account_type,
        account_category,
        level,
        allow_posting,
        is_active,
        opening_balance,
        current_balance
    )
    SELECT 
        tenant_id_param,
        account_code,
        account_name,
        account_name_en,
        account_type,
        account_category,
        level,
        allow_posting,
        is_active,
        opening_balance,
        current_balance
    FROM public.chart_of_accounts 
    WHERE tenant_id IS NULL
    AND is_active = true;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    -- إذا لم يتم إدراج أي حسابات، استخدم الدالة الشاملة
    IF inserted_count = 0 THEN
        SELECT public.create_correct_chart_of_accounts(tenant_id_param) INTO inserted_count;
    END IF;
    
    RETURN inserted_count;
END;
$function$;

-- 3. إصلاح copy_default_cost_centers
CREATE OR REPLACE FUNCTION public.copy_default_cost_centers(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- نسخ مراكز التكلفة الافتراضية
    INSERT INTO public.cost_centers (
        tenant_id,
        cost_center_code,
        cost_center_name,
        cost_center_type,
        level,
        hierarchy_path,
        budget_amount,
        actual_spent,
        is_active
    )
    SELECT 
        tenant_id_param,
        cost_center_code,
        cost_center_name,
        cost_center_type,
        level,
        hierarchy_path,
        budget_amount,
        actual_spent,
        is_active
    FROM public.cost_centers 
    WHERE tenant_id IS NULL
    AND is_active = true;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    -- إذا لم توجد مراكز تكلفة افتراضية، إنشاء مراكز أساسية
    IF inserted_count = 0 THEN
        INSERT INTO public.cost_centers (
            tenant_id,
            cost_center_code,
            cost_center_name,
            cost_center_type,
            level,
            hierarchy_path,
            budget_amount,
            actual_spent,
            is_active
        ) VALUES 
        (tenant_id_param, 'CC-ADMIN', 'الإدارة العامة', 'administrative', 1, 'CC-ADMIN', 0, 0, true),
        (tenant_id_param, 'CC-OPS', 'العمليات التشغيلية', 'operational', 1, 'CC-OPS', 0, 0, true),
        (tenant_id_param, 'CC-MAINT', 'الصيانة', 'maintenance', 1, 'CC-MAINT', 0, 0, true);
        
        inserted_count := 3;
    END IF;
    
    RETURN inserted_count;
END;
$function$;

-- 4. إصلاح copy_default_company_branding
CREATE OR REPLACE FUNCTION public.copy_default_company_branding(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- إنشاء إعدادات العلامة التجارية الافتراضية
    INSERT INTO public.company_branding (
        tenant_id,
        company_name,
        company_name_en,
        logo_url,
        primary_color,
        secondary_color,
        created_at,
        updated_at,
        is_active
    ) VALUES (
        tenant_id_param,
        'شركة تأجير السيارات',
        'Car Rental Company',
        NULL,
        '#1e40af',
        '#64748b',
        now(),
        now(),
        true
    );
    
    inserted_count := 1;
    
    RETURN inserted_count;
END;
$function$;