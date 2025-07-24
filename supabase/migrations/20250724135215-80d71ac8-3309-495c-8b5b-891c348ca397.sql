-- إصلاح تحذيرات Function Search Path Mutable - الدفعة السابعة (تصحيح)
-- حذف الدوال أولاً ثم إعادة إنشائها

-- حذف الدوال التي تحتاج تعديل
DROP FUNCTION IF EXISTS public.copy_default_chart_of_accounts(uuid);
DROP FUNCTION IF EXISTS public.copy_default_cost_centers(uuid);
DROP FUNCTION IF EXISTS public.copy_default_company_branding(uuid);

-- إعادة إنشاء الدوال مع إصلاح search_path

-- إصلاح دالة get_user_tenant_context
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_context jsonb;
    tenant_record record;
    user_permissions jsonb;
BEGIN
    -- التحقق من وجود المستخدم
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object(
            'user_id', null,
            'tenant_id', null,
            'role', null,
            'permissions', null,
            'status', 'unauthenticated'
        );
    END IF;
    
    -- جلب بيانات المؤسسة والدور
    SELECT 
        tu.tenant_id,
        tu.role,
        tu.status,
        t.name as tenant_name
    INTO tenant_record
    FROM tenant_users tu
    JOIN tenants t ON tu.tenant_id = t.id
    WHERE tu.user_id = auth.uid() 
    AND tu.status = 'active'
    AND t.status = 'active'
    LIMIT 1;
    
    -- إذا لم يتم العثور على المؤسسة، جرب tenant_user_roles
    IF tenant_record IS NULL THEN
        SELECT 
            tur.tenant_id,
            tur.role::text as role,
            tur.status,
            t.name as tenant_name
        INTO tenant_record
        FROM tenant_user_roles tur
        JOIN tenants t ON tur.tenant_id = t.id
        WHERE tur.user_id = auth.uid() 
        AND tur.status = 'active'
        AND t.status = 'active'
        LIMIT 1;
    END IF;
    
    -- إذا لم يتم العثور على أي مؤسسة
    IF tenant_record IS NULL THEN
        RETURN jsonb_build_object(
            'user_id', auth.uid(),
            'tenant_id', null,
            'role', null,
            'permissions', null,
            'status', 'no_tenant'
        );
    END IF;
    
    -- جلب الصلاحيات حسب الدور
    user_permissions := jsonb_build_object(
        'can_manage_users', CASE WHEN tenant_record.role IN ('super_admin', 'tenant_admin') THEN true ELSE false END,
        'can_manage_accounting', CASE WHEN tenant_record.role IN ('super_admin', 'tenant_admin', 'accountant') THEN true ELSE false END,
        'can_manage_vehicles', CASE WHEN tenant_record.role IN ('super_admin', 'tenant_admin', 'manager') THEN true ELSE false END,
        'can_view_reports', CASE WHEN tenant_record.role IN ('super_admin', 'tenant_admin', 'manager', 'accountant') THEN true ELSE false END,
        'can_manage_contracts', CASE WHEN tenant_record.role IN ('super_admin', 'tenant_admin', 'manager') THEN true ELSE false END
    );
    
    -- بناء السياق النهائي
    user_context := jsonb_build_object(
        'user_id', auth.uid(),
        'tenant_id', tenant_record.tenant_id,
        'role', tenant_record.role,
        'tenant_name', tenant_record.tenant_name,
        'permissions', user_permissions,
        'status', 'active'
    );
    
    RETURN user_context;
END;
$function$;

-- إصلاح دالة get_current_tenant_id
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    tenant_id uuid;
BEGIN
    -- التحقق من وجود المستخدم
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- جلب معرف المؤسسة من tenant_users أولاً
    SELECT tu.tenant_id INTO tenant_id
    FROM tenant_users tu
    JOIN tenants t ON tu.tenant_id = t.id
    WHERE tu.user_id = auth.uid() 
    AND tu.status = 'active'
    AND t.status = 'active'
    LIMIT 1;
    
    -- إذا لم يتم العثور على المؤسسة، جرب tenant_user_roles
    IF tenant_id IS NULL THEN
        SELECT tur.tenant_id INTO tenant_id
        FROM tenant_user_roles tur
        JOIN tenants t ON tur.tenant_id = t.id
        WHERE tur.user_id = auth.uid() 
        AND tur.status = 'active'
        AND t.status = 'active'
        LIMIT 1;
    END IF;
    
    RETURN tenant_id;
END;
$function$;

-- إصلاح دالة generate_journal_entry_number
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_year integer;
    next_number integer;
    entry_number text;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- الحصول على الرقم التالي للسنة الحالية
    SELECT COALESCE(MAX(
        CASE 
            WHEN entry_number ~ ('^JE-' || current_year || '-\d+$') 
            THEN CAST(SUBSTRING(entry_number FROM LENGTH('JE-' || current_year || '-') + 1) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1 
    INTO next_number
    FROM journal_entries
    WHERE entry_number LIKE 'JE-' || current_year || '-%';
    
    entry_number := 'JE-' || current_year || '-' || LPAD(next_number::text, 6, '0');
    
    RETURN entry_number;
END;
$function$;

-- إصلاح دالة check_period_status
CREATE OR REPLACE FUNCTION public.check_period_status(period_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    period_record record;
    result jsonb;
BEGIN
    -- البحث عن الفترة المالية التي تحتوي على التاريخ المحدد
    SELECT 
        fp.*,
        CASE 
            WHEN fp.status = 'closed' THEN false
            WHEN fp.is_locked = true THEN false
            WHEN period_date < fp.start_date OR period_date > fp.end_date THEN false
            ELSE true
        END as can_modify
    INTO period_record
    FROM financial_periods fp
    WHERE period_date BETWEEN fp.start_date AND fp.end_date
    AND fp.tenant_id = get_current_tenant_id()
    LIMIT 1;
    
    -- إذا لم يتم العثور على فترة مالية
    IF period_record IS NULL THEN
        result := jsonb_build_object(
            'can_modify', false,
            'status', 'no_period',
            'message', 'لا توجد فترة مالية مفتوحة لهذا التاريخ'
        );
    ELSE
        result := jsonb_build_object(
            'can_modify', period_record.can_modify,
            'status', period_record.status,
            'is_locked', period_record.is_locked,
            'period_name', period_record.period_name,
            'start_date', period_record.start_date,
            'end_date', period_record.end_date,
            'message', CASE 
                WHEN period_record.status = 'closed' THEN 'الفترة المالية مقفلة'
                WHEN period_record.is_locked = true THEN 'الفترة المالية مؤمنة'
                WHEN period_record.can_modify = false THEN 'لا يمكن التعديل في هذه الفترة'
                ELSE 'يمكن إجراء العمليات في هذه الفترة'
            END
        );
    END IF;
    
    RETURN result;
END;
$function$;

-- إصلاح دالة log_user_activity
CREATE OR REPLACE FUNCTION public.log_user_activity(activity_type text, description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO user_activity_logs (
        user_id,
        tenant_id,
        activity_type,
        description,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        get_current_tenant_id(),
        activity_type,
        description,
        COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 
                current_setting('request.headers', true)::json->>'x-real-ip'),
        current_setting('request.headers', true)::json->>'user-agent'
    );
END;
$function$;

-- إعادة إنشاء دالة copy_default_chart_of_accounts
CREATE OR REPLACE FUNCTION public.copy_default_chart_of_accounts(target_tenant_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    account_record RECORD;
    new_account_id UUID;
    parent_mapping JSONB := '{}';
BEGIN
    -- نسخ الحسابات مع الحفاظ على التسلسل الهرمي
    FOR account_record IN 
        SELECT * FROM chart_of_accounts 
        WHERE tenant_id IS NULL OR tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
        ORDER BY level ASC, account_code ASC
    LOOP
        -- إنشاء معرف جديد للحساب
        new_account_id := gen_random_uuid();
        
        -- إدراج الحساب الجديد
        INSERT INTO chart_of_accounts (
            id,
            tenant_id,
            account_code,
            account_name,
            account_name_en,
            account_type,
            account_category,
            parent_account_id,
            level,
            allow_posting,
            is_active,
            opening_balance,
            current_balance
        ) VALUES (
            new_account_id,
            target_tenant_id,
            account_record.account_code,
            account_record.account_name,
            account_record.account_name_en,
            account_record.account_type,
            account_record.account_category,
            CASE 
                WHEN account_record.parent_account_id IS NOT NULL 
                THEN (parent_mapping->>account_record.parent_account_id::text)::uuid
                ELSE NULL
            END,
            account_record.level,
            account_record.allow_posting,
            account_record.is_active,
            account_record.opening_balance,
            account_record.current_balance
        );
        
        -- حفظ تطابق المعرفات للاستخدام في الحسابات الفرعية
        parent_mapping := parent_mapping || jsonb_build_object(account_record.id::text, new_account_id::text);
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$function$;

-- إعادة إنشاء دالة copy_default_cost_centers
CREATE OR REPLACE FUNCTION public.copy_default_cost_centers(target_tenant_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    cost_center_record RECORD;
BEGIN
    -- نسخ مراكز التكلفة الافتراضية
    FOR cost_center_record IN 
        SELECT * FROM cost_centers 
        WHERE tenant_id IS NULL OR tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
    LOOP
        INSERT INTO cost_centers (
            tenant_id,
            cost_center_code,
            cost_center_name,
            cost_center_type,
            level,
            hierarchy_path,
            budget_amount,
            actual_spent,
            department_id,
            manager_id,
            is_active
        ) VALUES (
            target_tenant_id,
            cost_center_record.cost_center_code,
            cost_center_record.cost_center_name,
            cost_center_record.cost_center_type,
            cost_center_record.level,
            cost_center_record.hierarchy_path,
            cost_center_record.budget_amount,
            cost_center_record.actual_spent,
            NULL, -- سيتم ربطها لاحقاً بالأقسام
            NULL, -- سيتم ربطها لاحقاً بالمدراء
            cost_center_record.is_active
        );
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$function$;

-- إعادة إنشاء دالة copy_default_company_branding
CREATE OR REPLACE FUNCTION public.copy_default_company_branding(target_tenant_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- إنشاء إعدادات العلامة التجارية الافتراضية
    INSERT INTO company_branding (
        tenant_id,
        company_name,
        company_name_en,
        logo_url,
        primary_color,
        secondary_color,
        font_family,
        address,
        phone,
        email,
        website,
        tax_number,
        commercial_registration,
        created_at,
        updated_at
    ) VALUES (
        target_tenant_id,
        'اسم الشركة',
        'Company Name',
        NULL,
        '#1e40af', -- لون أزرق افتراضي
        '#64748b', -- لون رمادي افتراضي
        'font-sans',
        'العنوان',
        '+965 XXXX XXXX',
        'info@company.com',
        'www.company.com',
        NULL,
        NULL,
        now(),
        now()
    );
END;
$function$;