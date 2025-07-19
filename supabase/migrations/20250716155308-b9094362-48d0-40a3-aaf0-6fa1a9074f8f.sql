-- إنشاء دالة لتطبيق شجرة الحسابات الجديدة للتأجير
CREATE OR REPLACE FUNCTION public.setup_leasing_chart_of_accounts(tenant_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
    sub_parent_id UUID;
    sub_sub_parent_id UUID;
BEGIN
    -- حذف الحسابات الموجودة للمؤسسة المحددة
    UPDATE public.chart_of_accounts SET parent_account_id = NULL WHERE tenant_id = tenant_id_param;
    UPDATE public.chart_of_accounts SET consolidation_account_id = NULL WHERE tenant_id = tenant_id_param;
    DELETE FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param;
    
    -- المستوى الأول - الحسابات الرئيسية
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '1', 'الأصول', 'Assets', 'asset', 'current_asset', 1, false, true, 0, 0, true),
    (tenant_id_param, '2', 'الالتزامات', 'Liabilities', 'liability', 'current_liability', 1, false, true, 0, 0, true),
    (tenant_id_param, '3', 'حقوق الملكية', 'Equity', 'equity', 'capital', 1, false, true, 0, 0, true),
    (tenant_id_param, '4', 'الإيرادات', 'Revenue', 'revenue', 'operating_revenue', 1, false, true, 0, 0, true),
    (tenant_id_param, '5', 'المصروفات', 'Expenses', 'expense', 'operating_expense', 1, false, true, 0, 0, true);
    
    inserted_count := inserted_count + 5;

    -- الأصول المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '12', 'الأصول الغير متداولة', 'Non-Current Assets', 'asset', 'fixed_asset', parent_id, 2, false, true, 0, 0, true);

    -- النقدية وما يعادلها
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '111', 'النقدية و ما يعادلها', 'Cash and Cash Equivalents', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '112', 'العملاء التجاريون', 'Commercial Customers', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '113', 'ذمم مدينة اخري', 'Other Receivables', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '114', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '115', 'مصروفات مدفوعه مقدما', 'Prepaid Expenses', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '116', 'استثمارات قصيرة الاجل', 'Short-term Investments', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true);

    -- النقدية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '111';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '1111', 'النقدية', 'Cash', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0, true),
    (tenant_id_param, '1112', 'البنوك', 'Banks', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0, true);

    -- تفاصيل النقدية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1111';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '11111', 'الصندوق النقدي الرئيسي', 'Main Cash Box', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '11112', 'عهدة نقدية دائمة', 'Permanent Cash Custody', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '11113', 'عهدة نقدية مؤقتة', 'Temporary Cash Custody', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true);

    -- البنوك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '11121', 'بنوك محلية بالدينار الكويتي', 'Local Banks in KWD', 'asset', 'current_asset', parent_id, 5, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11121';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '111211', 'حساب البنك التجاري', 'Commercial Bank Account', 'asset', 'current_asset', parent_id, 6, true, true, 0, 0, true),
    (tenant_id_param, '111212', 'حساب بنك بيت التمويل', 'Kuwait Finance House Account', 'asset', 'current_asset', parent_id, 6, true, true, 0, 0, true);

    -- العملاء التجاريون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '1121', 'عملاء تجاريون شركات', 'Commercial Customers - Companies', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '1122', 'عملاء تجاريون شركات زميلة', 'Commercial Customers - Sister Companies', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '1123', 'عملاء تجاريون اشخاص', 'Commercial Customers - Individuals', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true);

    -- ذمم مدينة اخري
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '113';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '1131', 'ذمم موظفين', 'Employee Receivables', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '1132', 'ذمم مدينة لا تخص النشاط', 'Non-Operating Receivables', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true);

    -- المخزون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '114';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '1141', 'مخازن قطع الغيار', 'Spare Parts Warehouses', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0, true),
    (tenant_id_param, '1142', 'مخازن العدد و الأدوات', 'Tools and Equipment Warehouses', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0, true),
    (tenant_id_param, '1143', 'مخازن الأدوات المكتبية و المطبوعات', 'Office Supplies and Printing Warehouses', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1141';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '11411', 'مخزن قطع الغيار رقم 1', 'Spare Parts Warehouse No. 1', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1142';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '11421', 'مخزن عدد و أدوات رقم 1', 'Tools and Equipment Warehouse No. 1', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1143';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '11431', 'مخازن الأدوات المكتبية و المطبوعات رقم 1', 'Office Supplies Warehouse No. 1', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true);

    -- مصروفات مدفوعه مقدما
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '115';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '1151', 'مصروفات مدفوعه مقدما ايجارات', 'Prepaid Rent Expenses', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '1152', 'مصروفات مدفوعه مقدما صيانة', 'Prepaid Maintenance Expenses', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '1153', 'مصروفات مدفوعه مقدما قطع غيار', 'Prepaid Spare Parts Expenses', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true);

    -- الأصول الغير متداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '121', 'أصول طويلة الامد مملوكة للشركة', 'Long-term Assets Owned by Company', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '122', 'عقود ايجار تنتهي بالتملك', 'Finance Lease Contracts', 'asset', 'fixed_asset', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '123', 'استثمارات طويلة الاجل', 'Long-term Investments', 'asset', 'other_asset', parent_id, 3, true, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '121';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '1211', 'سيارات و باصات', 'Cars and Buses', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '1212', 'مباني و أراضي', 'Buildings and Land', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '1213', 'اثاث', 'Furniture', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '1214', 'معدات صيانة', 'Maintenance Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '1215', 'أجهزة كمبيوتر', 'Computer Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '1216', 'برامج و تكنولوجيا', 'Software and Technology', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true);

    inserted_count := inserted_count + 50;

    -- الالتزامات المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '21', 'الالتزامات المتداولة', 'Current Liabilities', 'liability', 'current_liability', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '22', 'الالتزامات طويلة الاجل', 'Long-term Liabilities', 'liability', 'long_term_liability', parent_id, 2, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '211', 'الحسابات الدائنة', 'Accounts Payable', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '212', 'قروض قصيرة الاجل', 'Short-term Loans', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0, true);

    -- الحسابات الدائنة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '211';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '2111', 'حسابات الموردين التجاريين', 'Commercial Suppliers Accounts', 'liability', 'current_liability', parent_id, 4, false, true, 0, 0, true),
    (tenant_id_param, '2112', 'حسابات دائنة اخري', 'Other Payables', 'liability', 'current_liability', parent_id, 4, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2111';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '21111', 'حسابات موردين تجاريون', 'Commercial Suppliers', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '21112', 'حسابات موردين قطع غيار', 'Spare Parts Suppliers', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '21113', 'حسابات موردين أقساط', 'Installment Suppliers', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '21114', 'حسابات موردين شركات زميله', 'Sister Companies Suppliers', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '21121', 'مستحقات أجور الموظفين', 'Employee Salaries Payable', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '21122', 'حسابات دائنة اخري متنوعة', 'Other Miscellaneous Payables', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0, true);

    -- قروض قصيرة الاجل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '212';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '2121', 'قروض بنوك قصيرة الاجل', 'Short-term Bank Loans', 'liability', 'current_liability', parent_id, 4, false, true, 0, 0, true),
    (tenant_id_param, '2122', 'قروض شركات التسهيلات قصيرة الاجل', 'Short-term Finance Company Loans', 'liability', 'current_liability', parent_id, 4, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2121';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '21211', 'قرض بنك التجاري قصير الاجل', 'Commercial Bank Short-term Loan', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '21212', 'قرض بنك بيت التمويل قصير الاجل', 'KFH Short-term Loan', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0, true);

    -- الالتزامات طويلة الاجل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '22';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '221', 'قروض بنوك طويلة الاجل', 'Long-term Bank Loans', 'liability', 'long_term_liability', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '222', 'قروض شركات التسهيلات طويلة الاجل', 'Long-term Finance Company Loans', 'liability', 'long_term_liability', parent_id, 3, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '221';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '2211', 'قرض بنك التجاري طويل الاجل', 'Commercial Bank Long-term Loan', 'liability', 'long_term_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '2212', 'قرض بنك بيت التمويل طويل الاجل', 'KFH Long-term Loan', 'liability', 'long_term_liability', parent_id, 4, true, true, 0, 0, true);

    -- حقوق الملكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '31', 'راس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '32', 'الأرباح المرحلة', 'Retained Earnings', 'equity', 'retained_earnings', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '33', 'الاحتياطيات', 'Reserves', 'equity', 'reserves', parent_id, 2, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '31';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '311', 'رأس مال الشركاء', 'Partners Capital', 'equity', 'capital', parent_id, 3, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '311';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '3111', 'راس المال القائم', 'Authorized Capital', 'equity', 'capital', parent_id, 4, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3111';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '31111', 'راس مال شريك أبو جراح', 'Partner Abu Jarrah Capital', 'equity', 'capital', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '31112', 'راس مال شريك أبو حسين', 'Partner Abu Hussein Capital', 'equity', 'capital', parent_id, 5, true, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '32';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '321', 'الأرباح المرحلة سنين سابقة', 'Prior Years Retained Earnings', 'equity', 'retained_earnings', parent_id, 3, true, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '33';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '331', 'الاحتياطي القانوني', 'Legal Reserve', 'equity', 'reserves', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '332', 'الاحتياطي العام', 'General Reserve', 'equity', 'reserves', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '333', 'احتياطي إعادة التقييم', 'Revaluation Reserve', 'equity', 'reserves', parent_id, 3, true, true, 0, 0, true);

    -- الإيرادات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '41', 'إيرادات التأجير', 'Rental Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '42', 'إيرادات الصيانة', 'Maintenance Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '43', 'إيرادات خدمات اخري', 'Other Service Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '44', 'إيرادات اخري', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0, true);

    -- إيرادات التأجير
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '411', 'إيرادات تأجير - شركات', 'Rental Revenue - Companies', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '412', 'إيرادات تأجير - شركات زميلة', 'Rental Revenue - Sister Companies', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '413', 'ايراد تأجير - اشخاص', 'Rental Revenue - Individuals', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '411';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '4111', 'ايراد تأجير سيارات و باصات - شركات', 'Car and Bus Rental Revenue - Companies', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '412';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '4121', 'ايراد تأجير سيارات و باصات - شركات زميله', 'Car and Bus Rental Revenue - Sister Companies', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '413';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '4131', 'ايراد تأجير سيارات و باصات - اشخاص', 'Car and Bus Rental Revenue - Individuals', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0, true);

    -- إيرادات الصيانة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '42';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '421', 'إيرادات ورشه الصيانة', 'Maintenance Workshop Revenue', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '421';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '4211', 'ايراد ورشة الصيانة الداخلية', 'Internal Maintenance Workshop Revenue', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '4212', 'ايراد ورش صيانة خارجيه', 'External Maintenance Workshop Revenue', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '4213', 'ايراد بيع قطع غيار', 'Spare Parts Sales Revenue', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0, true);

    -- إيرادات خدمات اخري
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '43';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '431', 'ايراد خدمات التوصيل و الاستلام', 'Delivery and Collection Service Revenue', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '432', 'إيرادات بيع سكراب', 'Scrap Sales Revenue', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '431';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '4311', 'ايراد خدمات التوصيل', 'Delivery Service Revenue', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '4312', 'ايراد خدمات الاستلام', 'Collection Service Revenue', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0, true);

    -- المصروفات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '51', 'مصروفات ثابتة', 'Fixed Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '52', 'مصروفات متغيرة', 'Variable Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0, true);

    -- مصروفات ثابتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '511', 'الإيجارات', 'Rent Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '512', 'الرواتب و الأجور و البدلات للموظفين', 'Employee Salaries and Benefits', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '513', 'الاهلاكات', 'Depreciation', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '514', 'اشتراكات', 'Subscriptions', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '515', 'مصاريف بنكية', 'Banking Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0, true);

    -- الإيجارات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '511';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '5111', 'ايجارات سيارات و باصات', 'Car and Bus Rent', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5112', 'ايجارات مكاتب و أراضي', 'Office and Land Rent', 'expense', 'operating_expense', parent_id, 4, false, true, 0, 0, true),
    (tenant_id_param, '5113', 'ايجارات شقق و عقارات', 'Apartment and Property Rent', 'expense', 'operating_expense', parent_id, 4, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '51121', 'ايجار مكاتب', 'Office Rent', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '51122', 'ايجار ورشة', 'Workshop Rent', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '51123', 'ايجار أراضي و مخازن', 'Land and Warehouse Rent', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5113';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '51131', 'ايجار شقق سكنية', 'Residential Apartment Rent', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0, true);

    -- الرواتب والأجور
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '512';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '5121', 'الرواتب الأساسية للموظفين', 'Basic Employee Salaries', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5122', 'بدلات نقدية للموظفين', 'Employee Cash Allowances', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5123', 'بدلات خطوط موبيل', 'Mobile Line Allowances', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5124', 'مصاريف الاجازات', 'Vacation Expenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5125', 'مصاريف نهاية الخدمة', 'End of Service Benefits', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true);

    -- الاهلاكات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '513';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '5131', 'مصروف اهلاك السيارات و الباصات', 'Car and Bus Depreciation', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5132', 'مصروف اهلاك مباني', 'Building Depreciation', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5133', 'مصروف اهلاك اثاث', 'Furniture Depreciation', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5134', 'مصروف اهلاك معدات الصيانة', 'Maintenance Equipment Depreciation', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5135', 'مصروف اهلاك أجهزة كمبيوتر', 'Computer Equipment Depreciation', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5136', 'مصروف إطفاء قيمة برامج و تكنولوجيا', 'Software and Technology Amortization', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true);

    -- اشتراكات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '514';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '5141', 'مصاريف حكوميه و اشتراكات', 'Government and Subscription Fees', 'expense', 'operating_expense', parent_id, 4, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5141';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '51411', 'مصاريف قانونيه و قضائية', 'Legal and Court Fees', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '51412', 'مصاريف تأمين الزامي', 'Mandatory Insurance Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '51413', 'مصاريف تأمين شامل', 'Comprehensive Insurance Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '51414', 'مصاريف مكاتب التدقيق', 'Audit Office Fees', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '51415', 'اشتراكات انتر نت', 'Internet Subscriptions', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '51416', 'اشتراكات تليفون ارضي', 'Landline Phone Subscriptions', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '51417', 'اشتراكات موبيل', 'Mobile Phone Subscriptions', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0, true);

    -- مصاريف بنكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '515';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '5151', 'مصاريف رسوم بنكية', 'Bank Fee Expenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5152', 'مصاريف فوائد بنوك', 'Bank Interest Expenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5153', 'مصاريف اصدار دفاتر شيكات', 'Checkbook Issuance Fees', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5154', 'عمولات تحويل رواتب', 'Salary Transfer Commissions', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true);

    -- مصروفات متغيرة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '52';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '521', 'أجور و رواتب مؤقتة', 'Temporary Wages and Salaries', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '522', 'مصروفات صيانة', 'Maintenance Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '523', 'مصاريف أدوات مكتبية و مطبوعات', 'Office Supplies and Printing Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0, true);

    -- أجور ورواتب مؤقتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '521';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '5211', 'رواتب يوميات للموظفين مؤقتة', 'Daily Wages for Temporary Employees', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5212', 'مكافئات', 'Bonuses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5213', 'اكراميات', 'Tips', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5214', 'أجور ساعات إضافية', 'Overtime Wages', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true);

    -- مصروفات صيانة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '522';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '5221', 'مصروفات قطع غيار', 'Spare Parts Expenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5222', 'مصروفات زيوت و فلاتر', 'Oil and Filter Expenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5223', 'مصروفات صبغ و حدادة', 'Paint and Blacksmith Expenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5224', 'تواير و بنشر', 'Tires and Puncture Repair', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5225', 'بطاريات', 'Batteries', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5226', 'مصروفات بنزين', 'Gasoline Expenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5227', 'مصروفات ديزل', 'Diesel Expenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true);

    -- مصاريف أدوات مكتبية ومطبوعات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '523';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '5231', 'ورق تصوير', 'Copy Paper', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5232', 'أدوات مكتبية', 'Office Supplies', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5233', 'مطبوعات', 'Printing', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '5234', 'إعلانات', 'Advertisements', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true);

    inserted_count := inserted_count + 150;
    
    RETURN inserted_count;
END;
$function$;

-- إنشاء دالة لتطبيق الشجرة الجديدة على جميع المؤسسات
CREATE OR REPLACE FUNCTION public.apply_leasing_chart_to_all_tenants()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    tenant_record RECORD;
    total_created INTEGER := 0;
    accounts_count INTEGER := 0;
    result_data JSONB := '{}';
BEGIN
    -- تطبيق دليل الحسابات الجديد على جميع المؤسسات الموجودة
    FOR tenant_record IN (
        SELECT id, name FROM public.tenants 
        WHERE status IN ('active', 'trial') 
        AND id != '00000000-0000-0000-0000-000000000000'
    ) LOOP
        BEGIN
            -- تطبيق شجرة الحسابات الجديدة للتأجير
            SELECT public.setup_leasing_chart_of_accounts(tenant_record.id) INTO accounts_count;
            
            total_created := total_created + accounts_count;
            
            -- تسجيل النتائج
            result_data := result_data || jsonb_build_object(
                tenant_record.id::text, 
                jsonb_build_object(
                    'tenant_name', tenant_record.name,
                    'accounts_created', accounts_count,
                    'status', 'success'
                )
            );
            
        EXCEPTION WHEN OTHERS THEN
            result_data := result_data || jsonb_build_object(
                tenant_record.id::text,
                jsonb_build_object(
                    'tenant_name', tenant_record.name,
                    'accounts_created', 0,
                    'status', 'error',
                    'error_message', SQLERRM
                )
            );
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'total_accounts_created', total_created,
        'migration_date', now(),
        'results_by_tenant', result_data
    );
END;
$function$;

-- تطبيق شجرة الحسابات الجديدة على جميع المؤسسات
SELECT public.apply_leasing_chart_to_all_tenants();