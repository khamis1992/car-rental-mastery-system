-- إصلاح الدوال - الدفعة الثامنة (المجموعة 17-20)

CREATE OR REPLACE FUNCTION public.complete_liabilities_equity_revenue_expenses(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- إضافة حسابات متخصصة للخصوم والملكية والإيرادات والمصروفات
    
    -- 1. إضافة حسابات إضافية للخصوم
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '213', 'الضرائب المستحقة', 'Accrued Taxes', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '214', 'تأمينات اجتماعية مستحقة', 'Social Insurance Payable', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);

    -- 2. إضافة حسابات أخرى للإيرادات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '42', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '43', 'إيرادات استثمارية', 'Investment Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0);

    -- 3. إضافة حسابات أخرى للمصروفات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '52', 'مصروفات إدارية', 'Administrative Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '53', 'مصروفات أخرى', 'Other Expenses', 'expense', 'other_expense', parent_id, 2, false, true, 0, 0);

    inserted_count := 6;
    
    RETURN inserted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    tenant_uuid uuid;
BEGIN
    -- محاولة الحصول على معرف المؤسسة من السياق
    SELECT (current_setting('app.current_tenant_id', true))::uuid INTO tenant_uuid;
    
    -- إذا لم يتم العثور على معرف في السياق، جلبه من جدول tenant_users
    IF tenant_uuid IS NULL THEN
        SELECT tu.tenant_id INTO tenant_uuid
        FROM public.tenant_users tu
        WHERE tu.user_id = auth.uid()
        AND tu.status = 'active'
        ORDER BY tu.created_at DESC
        LIMIT 1;
    END IF;
    
    RETURN tenant_uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_context jsonb;
    user_role text;
    tenant_id uuid;
    permissions jsonb;
BEGIN
    -- الحصول على معرف المؤسسة
    SELECT public.get_current_tenant_id() INTO tenant_id;
    
    -- إذا لم يتم العثور على مؤسسة، إرجاع سياق فارغ
    IF tenant_id IS NULL THEN
        RETURN jsonb_build_object(
            'tenant_id', null,
            'role', null,
            'permissions', '{}'::jsonb
        );
    END IF;
    
    -- الحصول على دور المستخدم من جدول tenant_user_roles أو tenant_users
    SELECT tur.role::text INTO user_role
    FROM public.tenant_user_roles tur
    WHERE tur.user_id = auth.uid()
    AND tur.tenant_id = tenant_id
    AND tur.status = 'active'
    ORDER BY tur.created_at DESC
    LIMIT 1;
    
    -- إذا لم يتم العثور على دور في الجدول الجديد، البحث في الجدول القديم
    IF user_role IS NULL THEN
        SELECT tu.role::text INTO user_role
        FROM public.tenant_users tu
        WHERE tu.user_id = auth.uid()
        AND tu.tenant_id = tenant_id
        AND tu.status = 'active'
        ORDER BY tu.created_at DESC
        LIMIT 1;
    END IF;
    
    -- تحديد الصلاحيات بناءً على الدور
    CASE user_role
        WHEN 'super_admin' THEN
            permissions := jsonb_build_object(
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true,
                'can_manage_system', true
            );
        WHEN 'tenant_admin' THEN
            permissions := jsonb_build_object(
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true,
                'can_manage_system', false
            );
        WHEN 'manager' THEN
            permissions := jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true,
                'can_manage_system', false
            );
        WHEN 'accountant' THEN
            permissions := jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', true,
                'can_manage_vehicles', false,
                'can_view_reports', true,
                'can_manage_contracts', false,
                'can_manage_system', false
            );
        ELSE
            permissions := jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', false,
                'can_manage_vehicles', false,
                'can_view_reports', false,
                'can_manage_contracts', false,
                'can_manage_system', false
            );
    END CASE;
    
    -- بناء السياق النهائي
    user_context := jsonb_build_object(
        'tenant_id', tenant_id,
        'role', user_role,
        'permissions', permissions
    );
    
    RETURN user_context;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_user_activity(activity_type text, description text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  activity_id uuid;
  current_tenant_id uuid;
BEGIN
  current_tenant_id := public.get_current_tenant_id();
  
  INSERT INTO public.user_activities (
    user_id, tenant_id, activity_type, description
  ) VALUES (
    auth.uid(), current_tenant_id, activity_type, description
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$function$;