-- دليل الحسابات الشامل للشركة
-- تطبيق المعايير المحاسبية الكويتية مع هيكل منطقي وشامل

-- إنشاء دالة لإضافة دليل الحسابات الشامل
CREATE OR REPLACE FUNCTION public.setup_comprehensive_chart_of_accounts_v2(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    assets_parent_id UUID;
    liabilities_parent_id UUID;
    equity_parent_id UUID;
    revenue_parent_id UUID;
    expenses_parent_id UUID;
    
    -- متغيرات الأصول
    current_assets_id UUID;
    non_current_assets_id UUID;
    cash_equivalents_id UUID;
    cash_id UUID;
    banks_id UUID;
    trade_customers_id UUID;
    other_receivables_id UUID;
    inventory_id UUID;
    prepaid_expenses_id UUID;
    
    -- متغيرات الالتزامات
    current_liabilities_id UUID;
    long_term_liabilities_id UUID;
    accounts_payable_id UUID;
    other_payables_id UUID;
    short_term_loans_id UUID;
    long_term_loans_id UUID;
    
    -- متغيرات حقوق الملكية
    capital_id UUID;
    retained_earnings_id UUID;
    reserves_id UUID;
    
    -- متغيرات الإيرادات
    rental_revenue_id UUID;
    maintenance_revenue_id UUID;
    other_services_revenue_id UUID;
    
    -- متغيرات المصروفات
    fixed_expenses_id UUID;
    variable_expenses_id UUID;
    rent_expenses_id UUID;
    salaries_expenses_id UUID;
    depreciation_expenses_id UUID;
    subscriptions_expenses_id UUID;
    bank_expenses_id UUID;
    
BEGIN
    -- بدلاً من حذف الحسابات الموجودة، سنضيف الحسابات الجديدة فقط مع تجنب التكرار
    -- هذا يحافظ على البيانات والقيود المحاسبية الموجودة
    
    -- ==================== المستوى الأول - الحسابات الرئيسية ====================
    
    -- الأصول - إضافة أو تحديث
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '1', 'الأصول', 'Assets', 'asset', 'current_asset', 1, false, true, 0, 0)
    ON CONFLICT (tenant_id, account_code) DO UPDATE SET
        account_name = EXCLUDED.account_name,
        account_name_en = EXCLUDED.account_name_en,
        updated_at = now()
    RETURNING id INTO assets_parent_id;
    
    -- إذا لم يتم الإرجاع (الحساب موجود)، احصل على المعرف
    IF assets_parent_id IS NULL THEN
        SELECT id INTO assets_parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '1';
    END IF;
    
    -- الالتزامات - إضافة أو تحديث
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '2', 'الالتزامات', 'Liabilities', 'liability', 'current_liability', 1, false, true, 0, 0)
    ON CONFLICT (tenant_id, account_code) DO UPDATE SET
        account_name = EXCLUDED.account_name,
        account_name_en = EXCLUDED.account_name_en,
        updated_at = now()
    RETURNING id INTO liabilities_parent_id;
    
    IF liabilities_parent_id IS NULL THEN
        SELECT id INTO liabilities_parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '2';
    END IF;
    
    -- حقوق الملكية - إضافة أو تحديث
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '3', 'حقوق الملكية', 'Equity', 'equity', 'capital', 1, false, true, 0, 0)
    ON CONFLICT (tenant_id, account_code) DO UPDATE SET
        account_name = EXCLUDED.account_name,
        account_name_en = EXCLUDED.account_name_en,
        updated_at = now()
    RETURNING id INTO equity_parent_id;
    
    IF equity_parent_id IS NULL THEN
        SELECT id INTO equity_parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '3';
    END IF;
    
    -- الإيرادات - إضافة أو تحديث
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '4', 'الإيرادات', 'Revenue', 'revenue', 'operating_revenue', 1, false, true, 0, 0)
    ON CONFLICT (tenant_id, account_code) DO UPDATE SET
        account_name = EXCLUDED.account_name,
        account_name_en = EXCLUDED.account_name_en,
        updated_at = now()
    RETURNING id INTO revenue_parent_id;
    
    IF revenue_parent_id IS NULL THEN
        SELECT id INTO revenue_parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '4';
    END IF;
    
    -- المصروفات - إضافة أو تحديث
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '5', 'المصروفات', 'Expenses', 'expense', 'operating_expense', 1, false, true, 0, 0)
    ON CONFLICT (tenant_id, account_code) DO UPDATE SET
        account_name = EXCLUDED.account_name,
        account_name_en = EXCLUDED.account_name_en,
        updated_at = now()
    RETURNING id INTO expenses_parent_id;
    
    IF expenses_parent_id IS NULL THEN
        SELECT id INTO expenses_parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '5';
    END IF;
    
    inserted_count := inserted_count + 5;
    
    -- ==================== المستوى الثاني - الأصول ====================
    
    -- الأصول المتداولة
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', assets_parent_id, 2, false, true, 0, 0)
    ON CONFLICT (tenant_id, account_code) DO UPDATE SET
        account_name = EXCLUDED.account_name,
        account_name_en = EXCLUDED.account_name_en,
        parent_account_id = EXCLUDED.parent_account_id,
        updated_at = now()
    RETURNING id INTO current_assets_id;
    
    IF current_assets_id IS NULL THEN
        SELECT id INTO current_assets_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '11';
    END IF;
    
    -- الأصول الغير متداولة
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '12', 'الأصول الغير متداولة', 'Non-Current Assets', 'asset', 'fixed_asset', assets_parent_id, 2, false, true, 0, 0)
    ON CONFLICT (tenant_id, account_code) DO UPDATE SET
        account_name = EXCLUDED.account_name,
        account_name_en = EXCLUDED.account_name_en,
        parent_account_id = EXCLUDED.parent_account_id,
        updated_at = now()
    RETURNING id INTO non_current_assets_id;
    
    IF non_current_assets_id IS NULL THEN
        SELECT id INTO non_current_assets_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '12';
    END IF;
    
    inserted_count := inserted_count + 2;
    
    -- ==================== المستوى الثالث - تفاصيل الأصول المتداولة ====================
    
    -- النقدية وما يعادلها
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '111', 'النقدية وما يعادلها', 'Cash and Cash Equivalents', 'asset', 'current_asset', current_assets_id, 3, false, true, 0, 0)
    ON CONFLICT (tenant_id, account_code) DO UPDATE SET
        account_name = EXCLUDED.account_name,
        parent_account_id = EXCLUDED.parent_account_id,
        updated_at = now()
    RETURNING id INTO cash_equivalents_id;
    
    IF cash_equivalents_id IS NULL THEN
        SELECT id INTO cash_equivalents_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '111';
    END IF;
    
    -- العملاء التجاريون
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '112', 'العملاء التجاريون', 'Trade Customers', 'asset', 'current_asset', current_assets_id, 3, false, true, 0, 0)
    RETURNING id INTO trade_customers_id;
    
    -- ذمم مدينة أخرى
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '113', 'ذمم مدينة أخرى', 'Other Receivables', 'asset', 'current_asset', current_assets_id, 3, false, true, 0, 0)
    RETURNING id INTO other_receivables_id;
    
    -- المخزون
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '114', 'المخزون', 'Inventory', 'asset', 'current_asset', current_assets_id, 3, false, true, 0, 0)
    RETURNING id INTO inventory_id;
    
    -- مصروفات مدفوعة مقدماً
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '115', 'مصروفات مدفوعة مقدماً', 'Prepaid Expenses', 'asset', 'current_asset', current_assets_id, 3, false, true, 0, 0)
    RETURNING id INTO prepaid_expenses_id;
    
    -- استثمارات قصيرة الأجل
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '116', 'استثمارات قصيرة الأجل', 'Short-term Investments', 'asset', 'current_asset', current_assets_id, 3, true, true, 0, 0);
    
    inserted_count := inserted_count + 6;
    
    -- ==================== المستوى الرابع - تفاصيل النقدية ====================
    
    -- النقدية
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '1111', 'النقدية', 'Cash', 'asset', 'current_asset', cash_equivalents_id, 4, false, true, 0, 0)
    RETURNING id INTO cash_id;
    
    -- البنوك
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '1112', 'البنوك', 'Banks', 'asset', 'current_asset', cash_equivalents_id, 4, false, true, 0, 0)
    RETURNING id INTO banks_id;
    
    inserted_count := inserted_count + 2;
    
    -- ==================== المستوى الخامس - تفاصيل النقدية والبنوك ====================
    
    -- الصناديق النقدية
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11111', 'الصندوق النقدي الرئيسي', 'Main Cash Box', 'asset', 'current_asset', cash_id, 5, true, true, 0, 0),
    (tenant_id_param, '11112', 'عهدة نقدية دائمة', 'Permanent Cash Custody', 'asset', 'current_asset', cash_id, 5, true, true, 0, 0),
    (tenant_id_param, '11113', 'عهدة نقدية مؤقتة', 'Temporary Cash Custody', 'asset', 'current_asset', cash_id, 5, true, true, 0, 0)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;
    
    -- البنوك المحلية
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11121', 'بنوك محلية بالدينار الكويتي', 'Local Banks in KWD', 'asset', 'current_asset', banks_id, 5, false, true, 0, 0),
    (tenant_id_param, '111211', 'حساب البنك التجاري حساب رقم', 'Commercial Bank Account No.', 'asset', 'current_asset', banks_id, 6, true, true, 0, 0),
    (tenant_id_param, '111212', 'حساب بنك بيت التمويل حساب رقم', 'Kuwait Finance House Account No.', 'asset', 'current_asset', banks_id, 6, true, true, 0, 0);
    
    inserted_count := inserted_count + 6;
    
    -- ==================== تفاصيل العملاء ====================
    
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1121', 'عملاء تجاريون شركات', 'Trade Customers - Companies', 'asset', 'current_asset', trade_customers_id, 4, true, true, 0, 0),
    (tenant_id_param, '1122', 'عملاء تجاريون شركات زميلة', 'Trade Customers - Related Companies', 'asset', 'current_asset', trade_customers_id, 4, true, true, 0, 0),
    (tenant_id_param, '1123', 'عملاء تجاريون أشخاص', 'Trade Customers - Individuals', 'asset', 'current_asset', trade_customers_id, 4, true, true, 0, 0);
    
    -- ==================== تفاصيل الذمم المدينة الأخرى ====================
    
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1131', 'ذمم موظفين', 'Employee Receivables', 'asset', 'current_asset', other_receivables_id, 4, true, true, 0, 0),
    (tenant_id_param, '1132', 'ذمم مدينة لا تخص النشاط', 'Non-operating Receivables', 'asset', 'current_asset', other_receivables_id, 4, true, true, 0, 0);
    
    -- ==================== تفاصيل المخزون ====================
    
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1141', 'مخازن قطع الغيار', 'Spare Parts Warehouses', 'asset', 'current_asset', inventory_id, 4, false, true, 0, 0),
    (tenant_id_param, '11411', 'مخزن قطع الغيار رقم 1', 'Spare Parts Warehouse No. 1', 'asset', 'current_asset', inventory_id, 5, true, true, 0, 0),
    (tenant_id_param, '1142', 'مخازن العدد والأدوات', 'Tools and Equipment Warehouses', 'asset', 'current_asset', inventory_id, 4, false, true, 0, 0),
    (tenant_id_param, '11421', 'مخزن عدد وأدوات رقم 1', 'Tools and Equipment Warehouse No. 1', 'asset', 'current_asset', inventory_id, 5, true, true, 0, 0),
    (tenant_id_param, '1143', 'مخازن الأدوات المكتبية والمطبوعات', 'Office Supplies and Publications Warehouses', 'asset', 'current_asset', inventory_id, 4, false, true, 0, 0),
    (tenant_id_param, '11431', 'مخازن الأدوات المكتبية والمطبوعات رقم 1', 'Office Supplies and Publications Warehouse No. 1', 'asset', 'current_asset', inventory_id, 5, true, true, 0, 0);
    
    -- ==================== تفاصيل المصروفات المدفوعة مقدماً ====================
    
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1151', 'مصروفات مدفوعة مقدماً إيجارات', 'Prepaid Rent Expenses', 'asset', 'current_asset', prepaid_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '1152', 'مصروفات مدفوعة مقدماً صيانة', 'Prepaid Maintenance Expenses', 'asset', 'current_asset', prepaid_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '1153', 'مصروفات مدفوعة مقدماً قطع غيار', 'Prepaid Spare Parts Expenses', 'asset', 'current_asset', prepaid_expenses_id, 4, true, true, 0, 0);
    
    inserted_count := inserted_count + 14;
    
    -- ==================== الأصول غير المتداولة ====================
    
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '121', 'أصول طويلة الأمد مملوكة للشركة', 'Long-term Assets Owned by Company', 'asset', 'fixed_asset', non_current_assets_id, 3, false, true, 0, 0),
    (tenant_id_param, '1211', 'سيارات وباصات', 'Cars and Buses', 'asset', 'fixed_asset', non_current_assets_id, 4, true, true, 0, 0),
    (tenant_id_param, '1212', 'مباني وأراضي', 'Buildings and Land', 'asset', 'fixed_asset', non_current_assets_id, 4, true, true, 0, 0),
    (tenant_id_param, '1213', 'أثاث', 'Furniture', 'asset', 'fixed_asset', non_current_assets_id, 4, true, true, 0, 0),
    (tenant_id_param, '1214', 'معدات صيانة', 'Maintenance Equipment', 'asset', 'fixed_asset', non_current_assets_id, 4, true, true, 0, 0),
    (tenant_id_param, '1215', 'أجهزة كمبيوتر', 'Computer Equipment', 'asset', 'fixed_asset', non_current_assets_id, 4, true, true, 0, 0),
    (tenant_id_param, '1216', 'برامج وتكنولوجيا', 'Software and Technology', 'asset', 'fixed_asset', non_current_assets_id, 4, true, true, 0, 0),
    (tenant_id_param, '122', 'عقود إيجار تنتهي بالتملك', 'Finance Lease Contracts', 'asset', 'fixed_asset', non_current_assets_id, 3, true, true, 0, 0),
    (tenant_id_param, '123', 'استثمارات طويلة الأجل', 'Long-term Investments', 'asset', 'fixed_asset', non_current_assets_id, 3, true, true, 0, 0);
    
    inserted_count := inserted_count + 9;
    
    -- ============= الالتزامات ===============

    -- الالتزامات المتداولة
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '21', 'الالتزامات المتداولة', 'Current Liabilities', 'liability', 'current_liability', liabilities_parent_id, 2, false, true, 0, 0)
    RETURNING id INTO current_liabilities_id;
    
    -- الالتزامات طويلة الأجل
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '22', 'الالتزامات طويلة الأجل', 'Long-term Liabilities', 'liability', 'long_term_liability', liabilities_parent_id, 2, false, true, 0, 0)
    RETURNING id INTO long_term_liabilities_id;
    
    -- الحسابات الدائنة
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '211', 'الحسابات الدائنة', 'Accounts Payable', 'liability', 'current_liability', current_liabilities_id, 3, false, true, 0, 0)
    RETURNING id INTO accounts_payable_id;
    
    -- تفاصيل الحسابات الدائنة
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2111', 'حسابات الموردين التجاريين', 'Trade Suppliers', 'liability', 'current_liability', accounts_payable_id, 4, false, true, 0, 0),
    (tenant_id_param, '21111', 'حسابات موردين تجاريون', 'Trade Suppliers Accounts', 'liability', 'current_liability', accounts_payable_id, 5, true, true, 0, 0),
    (tenant_id_param, '21112', 'حسابات موردين قطع غيار', 'Spare Parts Suppliers', 'liability', 'current_liability', accounts_payable_id, 5, true, true, 0, 0),
    (tenant_id_param, '21113', 'حسابات موردين أقساط', 'Installment Suppliers', 'liability', 'current_liability', accounts_payable_id, 5, true, true, 0, 0),
    (tenant_id_param, '21114', 'حسابات موردين شركات زميلة', 'Related Company Suppliers', 'liability', 'current_liability', accounts_payable_id, 5, true, true, 0, 0),
    (tenant_id_param, '2112', 'حسابات دائنة أخرى', 'Other Payables', 'liability', 'current_liability', accounts_payable_id, 4, false, true, 0, 0),
    (tenant_id_param, '21121', 'مستحقات أجور الموظفين', 'Employee Salary Accruals', 'liability', 'current_liability', accounts_payable_id, 5, true, true, 0, 0),
    (tenant_id_param, '21122', 'حسابات دائنة أخرى', 'Other Creditor Accounts', 'liability', 'current_liability', accounts_payable_id, 5, true, true, 0, 0);
    
    -- قروض قصيرة الأجل
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '212', 'قروض قصيرة الأجل', 'Short-term Loans', 'liability', 'current_liability', current_liabilities_id, 3, false, true, 0, 0),
    (tenant_id_param, '2121', 'قروض بنوك قصيرة الأجل', 'Short-term Bank Loans', 'liability', 'current_liability', current_liabilities_id, 4, false, true, 0, 0),
    (tenant_id_param, '21211', 'قرض بنك التجاري حساب رقم', 'Commercial Bank Loan Account No.', 'liability', 'current_liability', current_liabilities_id, 5, true, true, 0, 0),
    (tenant_id_param, '21212', 'قرض بنك بيت التمويل حساب رقم', 'Kuwait Finance House Loan Account No.', 'liability', 'current_liability', current_liabilities_id, 5, true, true, 0, 0),
    (tenant_id_param, '2122', 'قروض شركات التسهيلات قصيرة الأجل', 'Short-term Facility Company Loans', 'liability', 'current_liability', current_liabilities_id, 4, false, true, 0, 0),
    (tenant_id_param, '21221', 'قرض شركة حساب رقم', 'Company Loan Account No.', 'liability', 'current_liability', current_liabilities_id, 5, true, true, 0, 0);
    
    -- قروض طويلة الأجل
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '221', 'قروض بنوك طويلة الأجل', 'Long-term Bank Loans', 'liability', 'long_term_liability', long_term_liabilities_id, 3, false, true, 0, 0),
    (tenant_id_param, '22111', 'قرض بنك التجاري حساب رقم', 'Commercial Bank Long-term Loan Account No.', 'liability', 'long_term_liability', long_term_liabilities_id, 5, true, true, 0, 0),
    (tenant_id_param, '22112', 'قرض بنك بيت التمويل حساب رقم', 'Kuwait Finance House Long-term Loan Account No.', 'liability', 'long_term_liability', long_term_liabilities_id, 5, true, true, 0, 0),
    (tenant_id_param, '222', 'قروض شركات التسهيلات طويلة الأجل', 'Long-term Facility Company Loans', 'liability', 'long_term_liability', long_term_liabilities_id, 3, false, true, 0, 0),
    (tenant_id_param, '22221', 'قرض شركة حساب رقم', 'Long-term Company Loan Account No.', 'liability', 'long_term_liability', long_term_liabilities_id, 5, true, true, 0, 0);
    
    inserted_count := inserted_count + 21;

    -- ============= حقوق الملكية ===============
    
    -- رأس المال
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '31', 'رأس المال', 'Capital', 'equity', 'capital', equity_parent_id, 2, false, true, 0, 0)
    RETURNING id INTO capital_id;
    
    -- الأرباح المرحلة
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '32', 'الأرباح المرحلة', 'Retained Earnings', 'equity', 'capital', equity_parent_id, 2, false, true, 0, 0)
    RETURNING id INTO retained_earnings_id;
    
    -- الاحتياطيات
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '33', 'الاحتياطيات', 'Reserves', 'equity', 'capital', equity_parent_id, 2, false, true, 0, 0)
    RETURNING id INTO reserves_id;
    
    -- تفاصيل رأس المال
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '311', 'رأس مال الشركاء', 'Partners Capital', 'equity', 'capital', capital_id, 3, false, true, 0, 0),
    (tenant_id_param, '3111', 'رأس المال القائم', 'Paid-up Capital', 'equity', 'capital', capital_id, 4, false, true, 0, 0),
    (tenant_id_param, '31111', 'رأس مال شريك أبو جراح', 'Partner Abu Jarrah Capital', 'equity', 'capital', capital_id, 5, true, true, 0, 0),
    (tenant_id_param, '31112', 'رأس مال شريك أبو حسين', 'Partner Abu Hussein Capital', 'equity', 'capital', capital_id, 5, true, true, 0, 0);
    
    -- تفاصيل الأرباح المرحلة
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '321', 'الأرباح المرحلة سنين سابقة', 'Retained Earnings Previous Years', 'equity', 'capital', retained_earnings_id, 3, true, true, 0, 0);
    
    -- تفاصيل الاحتياطيات
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '331', 'الاحتياطي القانوني', 'Legal Reserve', 'equity', 'capital', reserves_id, 3, true, true, 0, 0),
    (tenant_id_param, '332', 'الاحتياطي العام', 'General Reserve', 'equity', 'capital', reserves_id, 3, true, true, 0, 0),
    (tenant_id_param, '333', 'احتياطي إعادة التقييم', 'Revaluation Reserve', 'equity', 'capital', reserves_id, 3, true, true, 0, 0);
    
    inserted_count := inserted_count + 11;

    -- ============= الإيرادات ===============
    
    -- إيرادات التأجير
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '41', 'إيرادات التأجير', 'Rental Revenue', 'revenue', 'operating_revenue', revenue_parent_id, 2, false, true, 0, 0)
    RETURNING id INTO rental_revenue_id;
    
    -- إيرادات الصيانة
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '42', 'إيرادات الصيانة', 'Maintenance Revenue', 'revenue', 'operating_revenue', revenue_parent_id, 2, false, true, 0, 0)
    RETURNING id INTO maintenance_revenue_id;
    
    -- إيرادات خدمات أخرى
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '43', 'إيرادات خدمات أخرى', 'Other Services Revenue', 'revenue', 'operating_revenue', revenue_parent_id, 2, false, true, 0, 0)
    RETURNING id INTO other_services_revenue_id;
    
    -- إيرادات أخرى
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '44', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'other_revenue', revenue_parent_id, 2, true, true, 0, 0);
    
    -- تفاصيل إيرادات التأجير
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '411', 'إيرادات تأجير شركات', 'Rental Revenue - Companies', 'revenue', 'operating_revenue', rental_revenue_id, 3, false, true, 0, 0),
    (tenant_id_param, '4111', 'إيرادات تأجير سيارات وباصات شركات', 'Car & Bus Rental Revenue - Companies', 'revenue', 'operating_revenue', rental_revenue_id, 4, true, true, 0, 0),
    (tenant_id_param, '412', 'إيرادات تأجير شركات زميلة', 'Rental Revenue - Related Companies', 'revenue', 'operating_revenue', rental_revenue_id, 3, false, true, 0, 0),
    (tenant_id_param, '4121', 'إيرادات تأجير سيارات وباصات شركات زميلة', 'Car & Bus Rental Revenue - Related Companies', 'revenue', 'operating_revenue', rental_revenue_id, 4, true, true, 0, 0),
    (tenant_id_param, '413', 'إيرادات تأجير أشخاص', 'Rental Revenue - Individuals', 'revenue', 'operating_revenue', rental_revenue_id, 3, false, true, 0, 0),
    (tenant_id_param, '4131', 'إيرادات تأجير سيارات وباصات أشخاص', 'Car & Bus Rental Revenue - Individuals', 'revenue', 'operating_revenue', rental_revenue_id, 4, true, true, 0, 0);
    
    -- تفاصيل إيرادات الصيانة
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '421', 'إيرادات ورشة الصيانة', 'Workshop Maintenance Revenue', 'revenue', 'operating_revenue', maintenance_revenue_id, 3, false, true, 0, 0),
    (tenant_id_param, '4211', 'إيرادات ورشة الصيانة الداخلية', 'Internal Workshop Maintenance Revenue', 'revenue', 'operating_revenue', maintenance_revenue_id, 4, true, true, 0, 0),
    (tenant_id_param, '4212', 'إيرادات ورش صيانة خارجية', 'External Workshop Maintenance Revenue', 'revenue', 'operating_revenue', maintenance_revenue_id, 4, true, true, 0, 0),
    (tenant_id_param, '4213', 'إيرادات بيع قطع غيار', 'Spare Parts Sales Revenue', 'revenue', 'operating_revenue', maintenance_revenue_id, 4, true, true, 0, 0);
    
    -- تفاصيل إيرادات الخدمات الأخرى
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '431', 'إيرادات خدمات التوصيل والاستلام', 'Delivery and Collection Services Revenue', 'revenue', 'operating_revenue', other_services_revenue_id, 3, false, true, 0, 0),
    (tenant_id_param, '4311', 'إيرادات خدمات التوصيل', 'Delivery Services Revenue', 'revenue', 'operating_revenue', other_services_revenue_id, 4, true, true, 0, 0),
    (tenant_id_param, '4312', 'إيرادات خدمات الاستلام', 'Collection Services Revenue', 'revenue', 'operating_revenue', other_services_revenue_id, 4, true, true, 0, 0),
    (tenant_id_param, '432', 'إيرادات بيع سكراب', 'Scrap Sales Revenue', 'revenue', 'other_revenue', other_services_revenue_id, 3, true, true, 0, 0);
    
    inserted_count := inserted_count + 18;

    -- ============= المصروفات ===============
    
    -- مصروفات ثابتة
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '51', 'مصروفات ثابتة', 'Fixed Expenses', 'expense', 'operating_expense', expenses_parent_id, 2, false, true, 0, 0)
    RETURNING id INTO fixed_expenses_id;
    
    -- مصروفات متغيرة
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '52', 'مصروفات متغيرة', 'Variable Expenses', 'expense', 'operating_expense', expenses_parent_id, 2, false, true, 0, 0)
    RETURNING id INTO variable_expenses_id;
    
    -- تفاصيل المصروفات الثابتة
    
    -- الإيجارات
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '511', 'الإيجارات', 'Rent Expenses', 'expense', 'operating_expense', fixed_expenses_id, 3, false, true, 0, 0)
    RETURNING id INTO rent_expenses_id;
    
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5111', 'إيجارات سيارات وباصات من الغير', 'Vehicle and Bus Rent from Others', 'expense', 'operating_expense', rent_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5112', 'إيجارات مكاتب وأراضي', 'Office and Land Rent', 'expense', 'operating_expense', rent_expenses_id, 4, false, true, 0, 0),
    (tenant_id_param, '51121', 'إيجار مكاتب', 'Office Rent', 'expense', 'operating_expense', rent_expenses_id, 5, true, true, 0, 0),
    (tenant_id_param, '51122', 'إيجار ورشة', 'Workshop Rent', 'expense', 'operating_expense', rent_expenses_id, 5, true, true, 0, 0),
    (tenant_id_param, '51123', 'إيجار أراضي ومخازن', 'Land and Warehouse Rent', 'expense', 'operating_expense', rent_expenses_id, 5, true, true, 0, 0),
    (tenant_id_param, '5113', 'إيجارات شقق وعقارات', 'Apartment and Property Rent', 'expense', 'operating_expense', rent_expenses_id, 4, false, true, 0, 0),
    (tenant_id_param, '51131', 'إيجار شقق سكنية', 'Residential Apartment Rent', 'expense', 'operating_expense', rent_expenses_id, 5, true, true, 0, 0);
    
    -- الرواتب والأجور
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '512', 'الرواتب والأجور والبدلات للموظفين', 'Salaries, Wages and Allowances', 'expense', 'operating_expense', fixed_expenses_id, 3, false, true, 0, 0)
    RETURNING id INTO salaries_expenses_id;
    
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5121', 'الرواتب الأساسية للموظفين', 'Basic Employee Salaries', 'expense', 'operating_expense', salaries_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5122', 'بدلات نقدية للموظفين', 'Employee Cash Allowances', 'expense', 'operating_expense', salaries_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5123', 'بدلات خطوط موبايل', 'Mobile Line Allowances', 'expense', 'operating_expense', salaries_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5124', 'مصاريف الإجازات', 'Vacation Expenses', 'expense', 'operating_expense', salaries_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5125', 'مصاريف نهاية الخدمة', 'End of Service Expenses', 'expense', 'operating_expense', salaries_expenses_id, 4, true, true, 0, 0);
    
    -- الاهلاكات
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '513', 'إهلاك الأصول غير المتداولة', 'Non-Current Assets Depreciation', 'expense', 'operating_expense', fixed_expenses_id, 3, false, true, 0, 0)
    RETURNING id INTO depreciation_expenses_id;
    
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5131', 'مصروف إهلاك السيارات والباصات', 'Vehicle and Bus Depreciation Expense', 'expense', 'operating_expense', depreciation_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5132', 'مصروف إهلاك مباني', 'Building Depreciation Expense', 'expense', 'operating_expense', depreciation_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5133', 'مصروف إهلاك أثاث', 'Furniture Depreciation Expense', 'expense', 'operating_expense', depreciation_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5134', 'مصروف إهلاك معدات الصيانة', 'Maintenance Equipment Depreciation Expense', 'expense', 'operating_expense', depreciation_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5135', 'مصروف إهلاك أجهزة كمبيوتر', 'Computer Equipment Depreciation Expense', 'expense', 'operating_expense', depreciation_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5136', 'مصروف إطفاء قيمة برامج وتكنولوجيا', 'Software and Technology Amortization Expense', 'expense', 'operating_expense', depreciation_expenses_id, 4, true, true, 0, 0);
    
    -- الاشتراكات
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '514', 'اشتراكات شهرية وسنوية', 'Monthly and Annual Subscriptions', 'expense', 'operating_expense', fixed_expenses_id, 3, false, true, 0, 0)
    RETURNING id INTO subscriptions_expenses_id;
    
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5141', 'مصاريف حكومية واشتراكات', 'Government Fees and Subscriptions', 'expense', 'operating_expense', subscriptions_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5142', 'مصاريف قانونية وقضائية', 'Legal and Judicial Expenses', 'expense', 'operating_expense', subscriptions_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5143', 'مصاريف تأمين إلزامي', 'Mandatory Insurance Expenses', 'expense', 'operating_expense', subscriptions_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5144', 'مصاريف تأمين شامل', 'Comprehensive Insurance Expenses', 'expense', 'operating_expense', subscriptions_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5145', 'مصاريف مكاتب التدقيق', 'Audit Office Expenses', 'expense', 'operating_expense', subscriptions_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5146', 'اشتراكات إنترنت', 'Internet Subscriptions', 'expense', 'operating_expense', subscriptions_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5147', 'اشتراكات تليفون أرضي', 'Landline Telephone Subscriptions', 'expense', 'operating_expense', subscriptions_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5148', 'اشتراكات موبايل', 'Mobile Subscriptions', 'expense', 'operating_expense', subscriptions_expenses_id, 4, true, true, 0, 0);
    
    -- مصاريف بنكية
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES (tenant_id_param, '515', 'مصاريف بنكية', 'Banking Expenses', 'expense', 'operating_expense', fixed_expenses_id, 3, false, true, 0, 0)
    RETURNING id INTO bank_expenses_id;
    
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5151', 'مصاريف رسوم بنكية', 'Bank Fees', 'expense', 'operating_expense', bank_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5152', 'مصاريف فوائد بنوك', 'Bank Interest Expenses', 'expense', 'operating_expense', bank_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5153', 'مصاريف إصدار دفاتر شيكات', 'Checkbook Issuance Expenses', 'expense', 'operating_expense', bank_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5154', 'عمولات تحويل رواتب', 'Salary Transfer Commissions', 'expense', 'operating_expense', bank_expenses_id, 4, true, true, 0, 0);
    
    -- تفاصيل المصروفات المتغيرة
    
    -- أجور ورواتب مؤقتة
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '521', 'أجور ورواتب مؤقتة', 'Temporary Wages and Salaries', 'expense', 'operating_expense', variable_expenses_id, 3, false, true, 0, 0),
    (tenant_id_param, '5211', 'أجور ورواتب يومية', 'Daily Wages and Salaries', 'expense', 'operating_expense', variable_expenses_id, 4, false, true, 0, 0),
    (tenant_id_param, '52111', 'رواتب يوميات للموظفين مؤقتة', 'Temporary Employee Daily Wages', 'expense', 'operating_expense', variable_expenses_id, 5, true, true, 0, 0),
    (tenant_id_param, '5212', 'مكافآت', 'Bonuses', 'expense', 'operating_expense', variable_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5213', 'إكراميات', 'Tips', 'expense', 'operating_expense', variable_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5214', 'أجور ساعات إضافية', 'Overtime Wages', 'expense', 'operating_expense', variable_expenses_id, 4, true, true, 0, 0);
    
    -- مصروفات صيانة
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '522', 'مصروفات صيانة', 'Maintenance Expenses', 'expense', 'operating_expense', variable_expenses_id, 3, false, true, 0, 0),
    (tenant_id_param, '5221', 'مصروفات قطع غيار', 'Spare Parts Expenses', 'expense', 'operating_expense', variable_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5222', 'مصروفات زيوت وفلاتر', 'Oil and Filter Expenses', 'expense', 'operating_expense', variable_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5223', 'مصروفات صبغ وحدادة', 'Paint and Metalwork Expenses', 'expense', 'operating_expense', variable_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5224', 'تواير وبنشر', 'Tires and Puncture Repair', 'expense', 'operating_expense', variable_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5225', 'بطاريات', 'Batteries', 'expense', 'operating_expense', variable_expenses_id, 4, true, true, 0, 0);
    
    -- مصروفات وقود
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '523', 'مصروفات وقود', 'Fuel Expenses', 'expense', 'operating_expense', variable_expenses_id, 3, false, true, 0, 0),
    (tenant_id_param, '5231', 'مصروفات بنزين', 'Gasoline Expenses', 'expense', 'operating_expense', variable_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5232', 'مصروفات ديزل', 'Diesel Expenses', 'expense', 'operating_expense', variable_expenses_id, 4, true, true, 0, 0);
    
    -- مصاريف أدوات مكتبية
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '524', 'مصاريف أدوات مكتبية ومطبوعات', 'Office Supplies and Publications Expenses', 'expense', 'operating_expense', variable_expenses_id, 3, false, true, 0, 0),
    (tenant_id_param, '5241', 'ورق تصوير', 'Copying Paper', 'expense', 'operating_expense', variable_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5242', 'أدوات مكتبية', 'Office Supplies', 'expense', 'operating_expense', variable_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '5243', 'مطبوعات', 'Publications', 'expense', 'operating_expense', variable_expenses_id, 4, true, true, 0, 0),
    (tenant_id_param, '525', 'إعلانات', 'Advertisements', 'expense', 'operating_expense', variable_expenses_id, 3, true, true, 0, 0);
    
    inserted_count := inserted_count + 69;
    
    RETURN inserted_count;
END;
$$;

-- تطبيق دليل الحسابات على جميع المؤسسات النشطة
DO $$
DECLARE
    tenant_record RECORD;
    accounts_created INTEGER;
BEGIN
    FOR tenant_record IN 
        SELECT id, name FROM public.tenants WHERE status = 'active'
    LOOP
        SELECT public.setup_comprehensive_chart_of_accounts_v2(tenant_record.id) INTO accounts_created;
        RAISE NOTICE 'تم إنشاء % حساب للمؤسسة: %', accounts_created, tenant_record.name;
    END LOOP;
END;
$$;

-- إنشاء فهارس إضافية لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_chart_accounts_tenant_type ON public.chart_of_accounts(tenant_id, account_type);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_tenant_category ON public.chart_of_accounts(tenant_id, account_category);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_tenant_level ON public.chart_of_accounts(tenant_id, level);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_parent ON public.chart_of_accounts(parent_account_id);

COMMENT ON FUNCTION public.setup_comprehensive_chart_of_accounts_v2(UUID) IS 'دالة إنشاء دليل الحسابات الشامل وفقاً للمعايير المحاسبية الكويتية مع هيكل تفصيلي كامل للشركة'; 