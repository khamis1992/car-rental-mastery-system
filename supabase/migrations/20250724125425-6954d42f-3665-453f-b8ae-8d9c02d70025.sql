-- إصلاح جميع الدوال المتبقية لتضمين SET search_path

-- تحديث copy_default_company_branding
CREATE OR REPLACE FUNCTION public.copy_default_company_branding(target_tenant_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  default_tenant_id UUID;
  branding_record RECORD;
BEGIN
  -- الحصول على معرف المؤسسة الافتراضية
  SELECT id INTO default_tenant_id 
  FROM tenants 
  WHERE name = 'Default Organization' 
  LIMIT 1;
  
  IF default_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Default organization not found';
  END IF;
  
  -- التحقق من عدم وجود علامة تجارية مسبقاً
  IF EXISTS (SELECT 1 FROM company_branding WHERE tenant_id = target_tenant_id) THEN
    RETURN 0;
  END IF;
  
  -- نسخ العلامة التجارية
  SELECT * INTO branding_record
  FROM company_branding 
  WHERE tenant_id = default_tenant_id 
  LIMIT 1;
  
  IF branding_record.id IS NOT NULL THEN
    INSERT INTO company_branding (
      company_name_ar,
      company_name_en,
      address_ar,
      address_en,
      phone,
      email,
      website,
      tax_number,
      commercial_registration,
      logo_url,
      header_image_url,
      footer_image_url,
      header_height,
      footer_height,
      show_header,
      show_footer,
      is_active,
      tenant_id,
      created_by
    ) VALUES (
      branding_record.company_name_ar,
      branding_record.company_name_en,
      branding_record.address_ar,
      branding_record.address_en,
      branding_record.phone,
      branding_record.email,
      branding_record.website,
      branding_record.tax_number,
      branding_record.commercial_registration,
      branding_record.logo_url,
      branding_record.header_image_url,
      branding_record.footer_image_url,
      branding_record.header_height,
      branding_record.footer_height,
      branding_record.show_header,
      branding_record.show_footer,
      branding_record.is_active,
      target_tenant_id,
      auth.uid()
    );
    
    RETURN 1;
  END IF;
  
  RETURN 0;
END;
$function$;

-- تحديث copy_default_chart_of_accounts
CREATE OR REPLACE FUNCTION public.copy_default_chart_of_accounts(target_tenant_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  default_tenant_id UUID;
  copied_count INTEGER := 0;
  account_record RECORD;
  new_account_id UUID;
  parent_mapping JSONB := '{}';
BEGIN
  -- الحصول على معرف المؤسسة الافتراضية
  SELECT id INTO default_tenant_id 
  FROM tenants 
  WHERE name = 'Default Organization' 
  LIMIT 1;
  
  IF default_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Default organization not found';
  END IF;
  
  -- التحقق من عدم وجود حسابات مسبقاً
  IF EXISTS (SELECT 1 FROM chart_of_accounts WHERE tenant_id = target_tenant_id) THEN
    RETURN 0; -- لا ننسخ إذا كانت الحسابات موجودة
  END IF;
  
  -- نسخ الحسابات بالترتيب الهرمي (المستوى الأول أولاً)
  FOR account_record IN (
    SELECT * FROM chart_of_accounts 
    WHERE tenant_id = default_tenant_id 
    AND is_active = true
    ORDER BY level ASC, account_code ASC
  ) LOOP
    -- إنشاء الحساب الجديد
    INSERT INTO chart_of_accounts (
      account_code,
      account_name,
      account_name_en,
      account_type,
      account_category,
      parent_account_id,
      level,
      is_active,
      allow_posting,
      opening_balance,
      current_balance,
      notes,
      tenant_id,
      created_by
    ) VALUES (
      account_record.account_code,
      account_record.account_name,
      account_record.account_name_en,
      account_record.account_type,
      account_record.account_category,
      CASE 
        WHEN account_record.parent_account_id IS NOT NULL 
        THEN (parent_mapping->>account_record.parent_account_id::text)::UUID
        ELSE NULL 
      END,
      account_record.level,
      account_record.is_active,
      account_record.allow_posting,
      account_record.opening_balance,
      account_record.current_balance,
      account_record.notes,
      target_tenant_id,
      auth.uid()
    ) RETURNING id INTO new_account_id;
    
    -- حفظ تطابق الهوية للحسابات الفرعية
    parent_mapping := parent_mapping || jsonb_build_object(account_record.id::text, new_account_id::text);
    copied_count := copied_count + 1;
  END LOOP;
  
  RETURN copied_count;
END;
$function$;

-- تحديث get_related_modules
CREATE OR REPLACE FUNCTION public.get_related_modules(module_name text, entity_id uuid)
RETURNS TABLE(related_module text, related_id uuid, relationship_type text, notes text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        mcr.target_module,
        mcr.target_id,
        mcr.relationship_type,
        mcr.notes
    FROM module_cross_references mcr
    WHERE mcr.source_module = module_name 
    AND mcr.source_id = entity_id
    AND mcr.is_active = true
    AND mcr.tenant_id = get_current_tenant_id()
    
    UNION
    
    SELECT 
        mcr.source_module,
        mcr.source_id,
        mcr.relationship_type,
        mcr.notes
    FROM module_cross_references mcr
    WHERE mcr.target_module = module_name 
    AND mcr.target_id = entity_id
    AND mcr.is_active = true
    AND mcr.tenant_id = get_current_tenant_id();
END;
$function$;

-- تحديث correct_account_balance
CREATE OR REPLACE FUNCTION public.correct_account_balance(account_code_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    account_record RECORD;
    old_balance NUMERIC;
    new_balance NUMERIC;
    total_debits NUMERIC := 0;
    total_credits NUMERIC := 0;
BEGIN
    -- الحصول على تفاصيل الحساب
    SELECT id, account_name, account_type, current_balance, opening_balance
    INTO account_record
    FROM public.chart_of_accounts 
    WHERE account_code = account_code_param;
    
    IF account_record.id IS NULL THEN
        RAISE EXCEPTION 'Account with code % not found', account_code_param;
    END IF;
    
    old_balance := account_record.current_balance;
    
    -- حساب إجمالي المدين والدائن من القيود المحاسبية الصحيحة
    SELECT 
        COALESCE(SUM(jel.debit_amount), 0),
        COALESCE(SUM(jel.credit_amount), 0)
    INTO total_debits, total_credits
    FROM public.journal_entry_lines jel
    JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    WHERE jel.account_id = account_record.id
    AND je.status = 'posted';
    
    -- حساب الرصيد الصحيح حسب نوع الحساب
    CASE account_record.account_type
        WHEN 'asset', 'expense' THEN
            new_balance := account_record.opening_balance + total_debits - total_credits;
        WHEN 'liability', 'equity', 'revenue' THEN
            new_balance := account_record.opening_balance + total_credits - total_debits;
        ELSE
            new_balance := account_record.opening_balance;
    END CASE;
    
    -- تحديث الرصيد
    UPDATE public.chart_of_accounts 
    SET 
        current_balance = new_balance,
        updated_at = now()
    WHERE id = account_record.id;
    
    RETURN jsonb_build_object(
        'account_code', account_code_param,
        'account_name', account_record.account_name,
        'old_balance', old_balance,
        'new_balance', new_balance,
        'correction_amount', new_balance - old_balance,
        'total_debits', total_debits,
        'total_credits', total_credits,
        'corrected_at', now()
    );
END;
$function$;

-- تحديث copy_default_cost_centers
CREATE OR REPLACE FUNCTION public.copy_default_cost_centers(target_tenant_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  default_tenant_id UUID;
  copied_count INTEGER := 0;
  center_record RECORD;
  new_center_id UUID;
  parent_mapping JSONB := '{}';
BEGIN
  -- الحصول على معرف المؤسسة الافتراضية
  SELECT id INTO default_tenant_id 
  FROM tenants 
  WHERE name = 'Default Organization' 
  LIMIT 1;
  
  IF default_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Default organization not found';
  END IF;
  
  -- التحقق من عدم وجود مراكز تكلفة مسبقاً
  IF EXISTS (SELECT 1 FROM cost_centers WHERE tenant_id = target_tenant_id) THEN
    RETURN 0;
  END IF;
  
  -- نسخ مراكز التكلفة بالترتيب الهرمي
  FOR center_record IN (
    SELECT * FROM cost_centers 
    WHERE tenant_id = default_tenant_id 
    AND is_active = true
    ORDER BY level ASC, cost_center_code ASC
  ) LOOP
    INSERT INTO cost_centers (
      cost_center_code,
      cost_center_name,
      description,
      parent_id,
      level,
      cost_center_type,
      hierarchy_path,
      budget_amount,
      actual_spent,
      is_active,
      tenant_id,
      created_by
    ) VALUES (
      center_record.cost_center_code,
      center_record.cost_center_name,
      center_record.description,
      CASE 
        WHEN center_record.parent_id IS NOT NULL 
        THEN (parent_mapping->>center_record.parent_id::text)::UUID
        ELSE NULL 
      END,
      center_record.level,
      center_record.cost_center_type,
      center_record.hierarchy_path,
      center_record.budget_amount,
      0, -- البدء برصيد صفر للفعلي
      center_record.is_active,
      target_tenant_id,
      auth.uid()
    ) RETURNING id INTO new_center_id;
    
    parent_mapping := parent_mapping || jsonb_build_object(center_record.id::text, new_center_id::text);
    copied_count := copied_count + 1;
  END LOOP;
  
  RETURN copied_count;
END;
$function$;

-- تحديث ensure_tenant_id_on_insert
CREATE OR REPLACE FUNCTION public.ensure_tenant_id_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
BEGIN
    IF NEW.tenant_id IS NULL THEN
        current_tenant_id := public.get_current_tenant_id();
        
        IF current_tenant_id IS NULL THEN
            RAISE EXCEPTION 'لا يمكن تحديد هوية المؤسسة الحالية';
        END IF;
        
        NEW.tenant_id := current_tenant_id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- تحديث create_attendance_accounting_entry
CREATE OR REPLACE FUNCTION public.create_attendance_accounting_entry(attendance_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  employee_name TEXT;
  attendance_date TEXT;
  total_cost NUMERIC;
  
  -- معرفات الحسابات
  labor_expense_account UUID;
  wages_payable_account UUID;
BEGIN
  -- استخراج البيانات
  employee_name := attendance_data->>'employee_name';
  attendance_date := attendance_data->>'date';
  total_cost := (attendance_data->>'total_cost')::NUMERIC;
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO labor_expense_account FROM public.chart_of_accounts WHERE account_code = '5110';
  SELECT id INTO wages_payable_account FROM public.chart_of_accounts WHERE account_code = '2110';
  
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
    created_by
  ) VALUES (
    journal_entry_number,
    attendance_date::DATE,
    'تكلفة عمالة يومية - ' || employee_name || ' - ' || attendance_date,
    'attendance',
    NULL,
    total_cost,
    total_cost,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- مصروف العمالة (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, labor_expense_account, 'تكلفة عمالة - ' || employee_name, total_cost, 0, 1
  );
  
  -- الأجور المستحقة (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, wages_payable_account, 'أجور مستحقة - ' || employee_name, 0, total_cost, 2
  );
  
  RETURN journal_entry_id;
END;
$function$;

-- تحديث log_user_activity
CREATE OR REPLACE FUNCTION public.log_user_activity(action_type_param text, action_description_param text DEFAULT NULL::text, ip_address_param text DEFAULT NULL::text, user_agent_param text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  current_tenant_id UUID;
BEGIN
  current_tenant_id := public.get_current_tenant_id();
  
  INSERT INTO public.user_activity_logs (
    tenant_id, user_id, action_type, action_description,
    ip_address, user_agent
  ) VALUES (
    current_tenant_id, auth.uid(), action_type_param, action_description_param,
    ip_address_param, user_agent_param
  );
END;
$function$;

-- تحديث create_user_invitation
CREATE OR REPLACE FUNCTION public.create_user_invitation(email_param text, role_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  current_tenant_id UUID;
  invitation_token TEXT;
  invitation_id UUID;
BEGIN
  current_tenant_id := public.get_current_tenant_id();
  
  -- التحقق من الصلاحيات
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND tenant_id = current_tenant_id
    AND role IN ('tenant_admin', 'manager')
    AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'ليس لديك صلاحية لدعوة مستخدمين');
  END IF;
  
  -- التحقق من عدم وجود دعوة سابقة معلقة
  IF EXISTS (
    SELECT 1 FROM public.user_invitations 
    WHERE email = email_param 
    AND tenant_id = current_tenant_id
    AND status = 'pending'
    AND expires_at > now()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'يوجد دعوة معلقة لهذا البريد الإلكتروني');
  END IF;
  
  -- إنشاء رمز الدعوة
  invitation_token := encode(gen_random_bytes(32), 'hex');
  
  -- إنشاء الدعوة
  INSERT INTO public.user_invitations (
    tenant_id, email, role, invited_by, invitation_token
  ) VALUES (
    current_tenant_id, email_param, role_param, auth.uid(), invitation_token
  ) RETURNING id INTO invitation_id;
  
  -- تسجيل النشاط
  PERFORM public.log_user_activity(
    'user_invited',
    'دعوة مستخدم جديد: ' || email_param || ' بدور: ' || role_param
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', invitation_id,
    'invitation_token', invitation_token
  );
END;
$function$;

-- تحديث update_invoice_payment_status
CREATE OR REPLACE FUNCTION public.update_invoice_payment_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    -- تحديث حالة الفاتورة وفقاً للمدفوعات
    UPDATE invoices SET 
        paid_amount = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM payments 
            WHERE invoice_id = NEW.invoice_id AND status = 'completed'
        ),
        outstanding_amount = total_amount - (
            SELECT COALESCE(SUM(amount), 0) 
            FROM payments 
            WHERE invoice_id = NEW.invoice_id AND status = 'completed'
        ),
        status = CASE 
            WHEN (
                SELECT COALESCE(SUM(amount), 0) 
                FROM payments 
                WHERE invoice_id = NEW.invoice_id AND status = 'completed'
            ) >= total_amount THEN 'paid'
            WHEN (
                SELECT COALESCE(SUM(amount), 0) 
                FROM payments 
                WHERE invoice_id = NEW.invoice_id AND status = 'completed'
            ) > 0 THEN 'partially_paid'
            ELSE status
        END,
        paid_at = CASE 
            WHEN (
                SELECT COALESCE(SUM(amount), 0) 
                FROM payments 
                WHERE invoice_id = NEW.invoice_id AND status = 'completed'
            ) >= total_amount THEN NOW()
            ELSE paid_at
        END
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
END;
$function$;

-- تحديث get_account_balance_optimized
CREATE OR REPLACE FUNCTION public.get_account_balance_optimized(account_id_param uuid, as_of_date date DEFAULT CURRENT_DATE)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    account_balance numeric := 0;
    opening_balance numeric := 0;
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- الحصول على الرصيد الافتتاحي
    SELECT COALESCE(coa.opening_balance, 0) INTO opening_balance
    FROM public.chart_of_accounts coa
    WHERE coa.id = account_id_param 
    AND coa.tenant_id = current_tenant_id;
    
    -- حساب الحركات حتى التاريخ المحدد
    SELECT COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) INTO account_balance
    FROM public.journal_entry_lines jel
    INNER JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    WHERE jel.account_id = account_id_param
    AND jel.tenant_id = current_tenant_id
    AND je.entry_date <= as_of_date
    AND je.status = 'posted';
    
    RETURN opening_balance + account_balance;
END;
$function$;

-- تحديث create_correct_chart_of_accounts
CREATE OR REPLACE FUNCTION public.create_correct_chart_of_accounts(tenant_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- حذف أي حسابات موجودة للمؤسسة
    DELETE FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param;
    
    -- المستوى الأول - الحسابات الرئيسية
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1', 'الأصول', 'Assets', 'asset', 'current_asset', 1, false, true, 0, 0),
    (tenant_id_param, '2', 'الالتزامات', 'Liabilities', 'liability', 'current_liability', 1, false, true, 0, 0),
    (tenant_id_param, '3', 'حقوق الملكية', 'Equity', 'equity', 'capital', 1, false, true, 0, 0),
    (tenant_id_param, '4', 'الإيرادات', 'Revenue', 'revenue', 'operating_revenue', 1, false, true, 0, 0),
    (tenant_id_param, '5', 'المصروفات', 'Expenses', 'expense', 'operating_expense', 1, false, true, 0, 0);
    
    inserted_count := inserted_count + 5;

    -- المستوى الثاني - الأصول
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '12', 'الأصول الثابتة', 'Fixed Assets', 'asset', 'fixed_asset', parent_id, 2, false, true, 0, 0);
    
    -- المستوى الثاني - الالتزامات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21', 'الالتزامات المتداولة', 'Current Liabilities', 'liability', 'current_liability', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '22', 'الالتزامات طويلة الأجل', 'Long-term Liabilities', 'liability', 'long_term_liability', parent_id, 2, false, true, 0, 0);
    
    -- المستوى الثاني - حقوق الملكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '31', 'رأس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '32', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, false, true, 0, 0);
    
    -- المستوى الثاني - الإيرادات  
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '41', 'إيرادات التأجير', 'Rental Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0);
    
    -- المستوى الثاني - المصروفات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '51', 'مصروفات التشغيل', 'Operating Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0);
    
    inserted_count := inserted_count + 8;

    -- المستوى الثالث - الأصول المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '111', 'النقدية وما في حكمها', 'Cash and Cash Equivalents', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '112', 'الذمم المدينة', 'Accounts Receivable', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '113', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);
    
    -- المستوى الثالث - الأصول الثابتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '121', 'السيارات والمركبات', 'Vehicles', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '122', 'مجمع إهلاك السيارات والمركبات', 'Accumulated Depreciation - Vehicles', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0);
    
    -- المستوى الثالث - الالتزامات المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '211', 'الذمم الدائنة', 'Accounts Payable', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '212', 'المصروفات المستحقة', 'Accrued Expenses', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
    
    -- المستوى الثالث - رأس المال
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '31';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '311', 'رأس المال المدفوع', 'Paid-up Capital', 'equity', 'capital', parent_id, 3, true, true, 0, 0);
    
    -- المستوى الثالث - إيرادات التأجير
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '411', 'إيرادات تأجير السيارات', 'Car Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0);
    
    -- المستوى الثالث - مصروفات التشغيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '511', 'الرواتب والأجور', 'Salaries and Wages', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '512', 'مصروفات الصيانة', 'Maintenance Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '513', 'مصروفات الوقود', 'Fuel Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '514', 'الإهلاك', 'Depreciation', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0);
    
    inserted_count := inserted_count + 12;

    -- المستوى الرابع - النقدية وما في حكمها
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '111';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1111', 'الصندوق', 'Cash on Hand', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1112', 'البنوك', 'Banks', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
    
    -- المستوى الرابع - الذمم المدينة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1121', 'ذمم العملاء', 'Customer Receivables', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
    
    -- المستوى الرابع - المخزون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '113';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1131', 'قطع غيار', 'Spare Parts', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
    
    -- المستوى الرابع - السيارات والمركبات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '121';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1211', 'سيارات صالون', 'Sedan Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1212', 'حافلات', 'Buses', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
    
    -- المستوى الرابع - مجمع الإهلاك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '122';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1221', 'مجمع إهلاك السيارات الصالون', 'Accumulated Depreciation - Sedan Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1222', 'مجمع إهلاك الحافلات', 'Accumulated Depreciation - Buses', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
    
    -- المستوى الرابع - الذمم الدائنة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '211';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2111', 'ذمم الموردين', 'Supplier Payables', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0);
    
    -- المستوى الرابع - الرواتب والأجور
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '511';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5111', 'رواتب إدارية', 'Administrative Salaries', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '5112', 'أجور عمال', 'Workers Wages', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0);
    
    inserted_count := inserted_count + 11;
    
    RETURN inserted_count;
END;
$function$;

-- تعليق للإشارة لاكتمال الدالة
COMMENT ON FUNCTION public.create_correct_chart_of_accounts(uuid) IS 'دالة إنشاء دليل حسابات صحيح ومحدثة لتضمين SET search_path';