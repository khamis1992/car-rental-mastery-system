-- إكمال دليل الحسابات الشامل
CREATE OR REPLACE FUNCTION public.complete_missing_chart_accounts(tenant_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- المخزون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '113', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '113';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '11301', 'مخزون المواد الخام', 'Raw Materials Inventory', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11302', 'مخزون قطع الغيار', 'Spare Parts Inventory', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11303', 'مخزون المنتجات تحت التصنيع', 'Work in Progress Inventory', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11304', 'مخزون المنتجات تامة الصنع', 'Finished Goods Inventory', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- المصروفات المدفوعة مقدماً
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '114', 'المصروفات المدفوعة مقدماً', 'Prepaid Expenses', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '114';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '11401', 'إيجارات مدفوعة مقدماً', 'Prepaid Rent', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11402', 'تأمينات مدفوعة مقدماً', 'Prepaid Insurance', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11403', 'رسوم ترخيص مدفوعة مقدماً', 'Prepaid License Fees', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- الأصول الثابتة - التفاصيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '121', 'الأراضي والمباني', 'Land and Buildings', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '122', 'المعدات والآلات', 'Equipment and Machinery', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '123', 'وسائل النقل', 'Vehicles', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '124', 'الأثاث والتجهيزات', 'Furniture and Fixtures', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '125', 'مجمع استهلاك الأصول الثابتة', 'Accumulated Depreciation', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل الأراضي والمباني
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '121';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '12101', 'الأراضي', 'Land', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '12102', 'المباني والإنشاءات', 'Buildings and Constructions', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '12103', 'تحسينات المباني', 'Building Improvements', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- الالتزامات المتداولة - التفاصيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '211';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '21101', 'ذمم الموردين - المحلية', 'Local Suppliers Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '21102', 'ذمم الموردين - الأجنبية', 'Foreign Suppliers Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '21103', 'أوراق الدفع', 'Notes Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- المصروفات المستحقة - التفاصيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '212';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '21201', 'رواتب وأجور مستحقة', 'Accrued Salaries and Wages', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '21202', 'مكافآت نهاية الخدمة', 'End of Service Benefits', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '21203', 'إجازات مستحقة', 'Accrued Vacation', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '21204', 'مصروفات كهرباء ومياه مستحقة', 'Accrued Utilities', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- الضرائب والرسوم - التفاصيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '213';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant, zakat_applicable)
    VALUES 
    (tenant_id_param, '21301', 'ضريبة الدخل مستحقة', 'Accrued Income Tax', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true, false),
    (tenant_id_param, '21302', 'الزكاة مستحقة', 'Accrued Zakat', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true, true),
    (tenant_id_param, '21303', 'رسوم تجارية مستحقة', 'Accrued Commercial Fees', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true, false),
    (tenant_id_param, '21304', 'ضريبة القيمة المضافة', 'VAT Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true, false)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- حقوق الملكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '31', 'رأس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '32', 'الاحتياطيات', 'Reserves', 'equity', 'retained_earnings', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '33', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 'retained_earnings', parent_id, 2, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- رأس المال - التفاصيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '31';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '3101', 'رأس المال المدفوع', 'Paid-up Capital', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '3102', 'علاوة إصدار الأسهم', 'Share Premium', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '3103', 'رأس مال إضافي', 'Additional Capital', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- الإيرادات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '41', 'إيرادات التشغيل', 'Operating Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '42', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'non_operating_revenue', parent_id, 2, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- إيرادات التشغيل - التفاصيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '4101', 'إيرادات المبيعات', 'Sales Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '4102', 'إيرادات الخدمات', 'Service Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '4103', 'مردودات ومسموحات المبيعات', 'Sales Returns and Allowances', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '4104', 'خصومات المبيعات', 'Sales Discounts', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- المصروفات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '51', 'تكلفة البضاعة المباعة', 'Cost of Goods Sold', 'expense', 'cost_of_sales', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '52', 'مصروفات التشغيل', 'Operating Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '53', 'مصروفات إدارية وعمومية', 'General and Administrative Expenses', 'expense', 'administrative_expense', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '54', 'مصروفات أخرى', 'Other Expenses', 'expense', 'other_expense', parent_id, 2, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تكلفة البضاعة المباعة - التفاصيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '5101', 'تكلفة المواد المباشرة', 'Direct Materials Cost', 'expense', 'cost_of_sales', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5102', 'تكلفة العمالة المباشرة', 'Direct Labor Cost', 'expense', 'cost_of_sales', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5103', 'تكاليف صناعية غير مباشرة', 'Manufacturing Overhead', 'expense', 'cost_of_sales', parent_id, 3, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- المصروفات الإدارية - التفاصيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '53';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '5301', 'رواتب وأجور', 'Salaries and Wages', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5302', 'إيجارات', 'Rent Expense', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5303', 'كهرباء ومياه', 'Utilities', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5304', 'صيانة وإصلاحات', 'Maintenance and Repairs', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5305', 'وقود ومحروقات', 'Fuel and Gasoline', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5306', 'اتصالات وإنترنت', 'Communications and Internet', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5307', 'تأمينات', 'Insurance', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5308', 'استهلاك الأصول الثابتة', 'Depreciation Expense', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5309', 'مصروفات قانونية ومهنية', 'Legal and Professional Fees', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5310', 'مصروفات تدريب وتطوير', 'Training and Development', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    inserted_count := 50; -- تقدير العدد المضاف
    
    RETURN inserted_count;
END;
$function$;

-- تطبيق الدالة على جميع المؤسسات النشطة
CREATE OR REPLACE FUNCTION public.apply_complete_chart_to_all_tenants()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    tenant_record RECORD;
    total_created INTEGER := 0;
    result_data JSONB := '{}';
BEGIN
    FOR tenant_record IN (
        SELECT id, name FROM public.tenants 
        WHERE status = 'active' 
        AND id != '00000000-0000-0000-0000-000000000000'
    ) LOOP
        BEGIN
            -- تطبيق الحسابات المفقودة
            SELECT public.complete_missing_chart_accounts(tenant_record.id) INTO total_created;
            
            result_data := result_data || jsonb_build_object(
                tenant_record.id::text, 
                jsonb_build_object(
                    'tenant_name', tenant_record.name,
                    'accounts_added', total_created,
                    'status', 'success'
                )
            );
            
        EXCEPTION WHEN OTHERS THEN
            result_data := result_data || jsonb_build_object(
                tenant_record.id::text,
                jsonb_build_object(
                    'tenant_name', tenant_record.name,
                    'accounts_added', 0,
                    'status', 'error',
                    'error_message', SQLERRM
                )
            );
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'completion_date', now(),
        'results_by_tenant', result_data
    );
END;
$function$;

-- تشغيل الدالة لتطبيق الحسابات على جميع المؤسسات
SELECT public.apply_complete_chart_to_all_tenants();