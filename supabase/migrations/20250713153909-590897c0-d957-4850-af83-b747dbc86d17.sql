-- تحديث النظام المحاسبي مع حل مشكلة الـ policies الموجودة

-- حذف الـ policies الموجودة مسبقاً وإعادة إنشائها
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم إدارة " ON public.fixed_assets;
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم إدارة الأصول الثابتة" ON public.fixed_assets;
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم إدارة إهلاك الأصول" ON public.asset_depreciation;

-- إنشاء policies جديدة مع أسماء واضحة
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fixed_assets_management_policy" ON public.fixed_assets
  FOR ALL USING (tenant_id = get_current_tenant_id() AND 
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR 
     has_role(auth.uid(), 'accountant'::user_role)));

ALTER TABLE public.asset_depreciation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "asset_depreciation_management_policy" ON public.asset_depreciation
  FOR ALL USING (tenant_id = get_current_tenant_id() AND 
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR 
     has_role(auth.uid(), 'accountant'::user_role)));

-- إضافة دوال محاسبية متقدمة إضافية

-- دالة التحقق من توازن الميزانية العمومية
CREATE OR REPLACE FUNCTION public.validate_trial_balance()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_debits NUMERIC := 0;
    total_credits NUMERIC := 0;
    balance_result JSONB;
BEGIN
    -- حساب إجمالي المدين والدائن
    SELECT 
        COALESCE(SUM(CASE WHEN current_balance > 0 THEN current_balance ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN current_balance < 0 THEN ABS(current_balance) ELSE 0 END), 0)
    INTO total_debits, total_credits
    FROM public.chart_of_accounts
    WHERE allow_posting = true AND is_active = true;
    
    balance_result := jsonb_build_object(
        'total_debits', total_debits,
        'total_credits', total_credits,
        'difference', total_debits - total_credits,
        'is_balanced', (total_debits = total_credits),
        'validation_date', now()
    );
    
    RETURN balance_result;
END;
$$;

-- دالة حساب التدفقات النقدية
CREATE OR REPLACE FUNCTION public.calculate_cash_flow(start_date DATE, end_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    operating_cash_flow NUMERIC := 0;
    investing_cash_flow NUMERIC := 0;
    financing_cash_flow NUMERIC := 0;
    net_cash_flow NUMERIC := 0;
    result JSONB;
BEGIN
    -- حساب التدفق النقدي من العمليات التشغيلية
    SELECT COALESCE(SUM(
        CASE 
            WHEN jel.debit_amount > 0 AND coa.account_type = 'asset' AND coa.account_category = 'current_asset' THEN jel.debit_amount
            WHEN jel.credit_amount > 0 AND coa.account_type = 'revenue' THEN jel.credit_amount
            WHEN jel.debit_amount > 0 AND coa.account_type = 'expense' THEN -jel.debit_amount
            ELSE 0
        END
    ), 0) INTO operating_cash_flow
    FROM public.journal_entry_lines jel
    JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    JOIN public.chart_of_accounts coa ON jel.account_id = coa.id
    WHERE je.entry_date BETWEEN start_date AND end_date
    AND je.status = 'posted';
    
    -- حساب التدفق النقدي من الاستثمار
    SELECT COALESCE(SUM(
        CASE 
            WHEN jel.debit_amount > 0 AND coa.account_type = 'asset' AND coa.account_category = 'fixed_asset' THEN -jel.debit_amount
            WHEN jel.credit_amount > 0 AND coa.account_type = 'asset' AND coa.account_category = 'fixed_asset' THEN jel.credit_amount
            ELSE 0
        END
    ), 0) INTO investing_cash_flow
    FROM public.journal_entry_lines jel
    JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    JOIN public.chart_of_accounts coa ON jel.account_id = coa.id
    WHERE je.entry_date BETWEEN start_date AND end_date
    AND je.status = 'posted';
    
    -- حساب التدفق النقدي من التمويل
    SELECT COALESCE(SUM(
        CASE 
            WHEN jel.credit_amount > 0 AND coa.account_type = 'liability' THEN jel.credit_amount
            WHEN jel.credit_amount > 0 AND coa.account_type = 'equity' THEN jel.credit_amount
            WHEN jel.debit_amount > 0 AND coa.account_type = 'liability' THEN -jel.debit_amount
            ELSE 0
        END
    ), 0) INTO financing_cash_flow
    FROM public.journal_entry_lines jel
    JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    JOIN public.chart_of_accounts coa ON jel.account_id = coa.id
    WHERE je.entry_date BETWEEN start_date AND end_date
    AND je.status = 'posted';
    
    net_cash_flow := operating_cash_flow + investing_cash_flow + financing_cash_flow;
    
    result := jsonb_build_object(
        'period_start', start_date,
        'period_end', end_date,
        'operating_cash_flow', operating_cash_flow,
        'investing_cash_flow', investing_cash_flow,
        'financing_cash_flow', financing_cash_flow,
        'net_cash_flow', net_cash_flow,
        'calculated_at', now()
    );
    
    RETURN result;
END;
$$;

-- دالة حساب نسب السيولة المتقدمة
CREATE OR REPLACE FUNCTION public.calculate_liquidity_ratios()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_assets NUMERIC := 0;
    current_liabilities NUMERIC := 0;
    quick_assets NUMERIC := 0;
    cash_and_equivalents NUMERIC := 0;
    inventory NUMERIC := 0;
    current_ratio NUMERIC := 0;
    quick_ratio NUMERIC := 0;
    cash_ratio NUMERIC := 0;
    result JSONB;
BEGIN
    -- حساب الأصول المتداولة
    SELECT COALESCE(SUM(current_balance), 0) INTO current_assets
    FROM public.chart_of_accounts 
    WHERE account_type = 'asset' AND account_category = 'current_asset' AND is_active = true;
    
    -- حساب الخصوم المتداولة
    SELECT COALESCE(SUM(current_balance), 0) INTO current_liabilities
    FROM public.chart_of_accounts 
    WHERE account_type = 'liability' AND account_category = 'current_liability' AND is_active = true;
    
    -- حساب النقدية ومعادلاتها
    SELECT COALESCE(SUM(current_balance), 0) INTO cash_and_equivalents
    FROM public.chart_of_accounts 
    WHERE account_name ILIKE '%نقد%' OR account_name ILIKE '%بنك%' OR account_name ILIKE '%صندوق%';
    
    -- حساب المخزون (إذا وجد)
    SELECT COALESCE(SUM(current_balance), 0) INTO inventory
    FROM public.chart_of_accounts 
    WHERE account_name ILIKE '%مخزون%' OR account_name ILIKE '%بضاعة%';
    
    -- حساب الأصول السريعة (الأصول المتداولة - المخزون)
    quick_assets := current_assets - inventory;
    
    -- حساب النسب
    IF current_liabilities > 0 THEN
        current_ratio := current_assets / current_liabilities;
        quick_ratio := quick_assets / current_liabilities;
        cash_ratio := cash_and_equivalents / current_liabilities;
    END IF;
    
    result := jsonb_build_object(
        'current_assets', current_assets,
        'current_liabilities', current_liabilities,
        'quick_assets', quick_assets,
        'cash_and_equivalents', cash_and_equivalents,
        'inventory', inventory,
        'current_ratio', current_ratio,
        'quick_ratio', quick_ratio,
        'cash_ratio', cash_ratio,
        'calculated_at', now()
    );
    
    RETURN result;
END;
$$;

-- دالة مراجعة القيود المعلقة والتحقق من سلامتها
CREATE OR REPLACE FUNCTION public.audit_orphaned_entries()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    audit_results JSONB := '[]';
    entry_record RECORD;
    total_amount NUMERIC := 0;
BEGIN
    -- البحث عن القيود المعلقة وإنشاء تقرير
    FOR entry_record IN (
        SELECT 
            je.id,
            je.entry_number,
            je.reference_type,
            je.reference_id,
            je.total_debit,
            je.description,
            je.entry_date,
            CASE 
                WHEN je.reference_type = 'invoice' THEN 
                    CASE WHEN EXISTS(SELECT 1 FROM public.invoices WHERE id = je.reference_id) 
                         THEN 'valid' ELSE 'orphaned' END
                WHEN je.reference_type = 'payment' THEN 
                    CASE WHEN EXISTS(SELECT 1 FROM public.payments WHERE id = je.reference_id) 
                         THEN 'valid' ELSE 'orphaned' END
                WHEN je.reference_type = 'contract' THEN 
                    CASE WHEN EXISTS(SELECT 1 FROM public.contracts WHERE id = je.reference_id) 
                         THEN 'valid' ELSE 'orphaned' END
                ELSE 'unknown'
            END as status
        FROM public.journal_entries je
        WHERE je.status = 'posted'
        ORDER BY je.entry_date DESC
    ) LOOP
        IF entry_record.status = 'orphaned' THEN
            total_amount := total_amount + entry_record.total_debit;
        END IF;
        
        audit_results := audit_results || jsonb_build_object(
            'entry_number', entry_record.entry_number,
            'reference_type', entry_record.reference_type,
            'reference_id', entry_record.reference_id,
            'amount', entry_record.total_debit,
            'description', entry_record.description,
            'entry_date', entry_record.entry_date,
            'status', entry_record.status
        );
    END LOOP;
    
    RETURN jsonb_build_object(
        'total_orphaned_amount', total_amount,
        'audit_date', now(),
        'entries', audit_results
    );
END;
$$;

-- دالة تطبيق الصيانة الدورية للنظام المحاسبي
CREATE OR REPLACE FUNCTION public.periodic_accounting_maintenance()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    maintenance_result JSONB;
    balances_updated INTEGER := 0;
    orphaned_entries INTEGER := 0;
    kpis_calculated INTEGER := 0;
BEGIN
    -- تحديث أرصدة الحسابات
    UPDATE public.chart_of_accounts 
    SET current_balance = (
        SELECT 
            CASE 
                WHEN coa.account_type IN ('asset', 'expense') THEN 
                    coa.opening_balance + COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)
                WHEN coa.account_type IN ('liability', 'equity', 'revenue') THEN 
                    coa.opening_balance + COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0)
                ELSE coa.opening_balance
            END
        FROM public.journal_entry_lines jel
        JOIN public.journal_entries je ON jel.journal_entry_id = je.id
        WHERE jel.account_id = chart_of_accounts.id
        AND je.status = 'posted'
    ),
    updated_at = now()
    WHERE allow_posting = true;
    
    GET DIAGNOSTICS balances_updated = ROW_COUNT;
    
    -- حساب المؤشرات المالية تلقائياً
    SELECT COUNT(*) INTO kpis_calculated
    FROM public.calculate_all_kpis();
    
    -- تنظيف البيانات القديمة (أكثر من سنة)
    DELETE FROM public.accounting_audit_trail 
    WHERE created_at < now() - INTERVAL '1 year';
    
    DELETE FROM public.accounting_event_monitor 
    WHERE created_at < now() - INTERVAL '6 months' AND status = 'completed';
    
    maintenance_result := jsonb_build_object(
        'balances_updated', balances_updated,
        'kpis_calculated', kpis_calculated,
        'maintenance_date', now(),
        'status', 'completed'
    );
    
    RETURN maintenance_result;
END;
$$;

-- دالة إنشاء تقرير شامل للوضع المالي
CREATE OR REPLACE FUNCTION public.generate_financial_summary(as_of_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    summary_result JSONB;
    total_assets NUMERIC := 0;
    total_liabilities NUMERIC := 0;
    total_equity NUMERIC := 0;
    total_revenue NUMERIC := 0;
    total_expenses NUMERIC := 0;
    net_income NUMERIC := 0;
    liquidity_ratios JSONB;
    trial_balance JSONB;
BEGIN
    -- حساب المجاميع الأساسية
    SELECT COALESCE(SUM(current_balance), 0) INTO total_assets
    FROM public.chart_of_accounts WHERE account_type = 'asset' AND is_active = true;
    
    SELECT COALESCE(SUM(current_balance), 0) INTO total_liabilities
    FROM public.chart_of_accounts WHERE account_type = 'liability' AND is_active = true;
    
    SELECT COALESCE(SUM(current_balance), 0) INTO total_equity
    FROM public.chart_of_accounts WHERE account_type = 'equity' AND is_active = true;
    
    SELECT COALESCE(SUM(current_balance), 0) INTO total_revenue
    FROM public.chart_of_accounts WHERE account_type = 'revenue' AND is_active = true;
    
    SELECT COALESCE(SUM(current_balance), 0) INTO total_expenses
    FROM public.chart_of_accounts WHERE account_type = 'expense' AND is_active = true;
    
    net_income := total_revenue - total_expenses;
    
    -- الحصول على نسب السيولة
    liquidity_ratios := public.calculate_liquidity_ratios();
    
    -- التحقق من توازن الميزانية
    trial_balance := public.validate_trial_balance();
    
    summary_result := jsonb_build_object(
        'as_of_date', as_of_date,
        'financial_position', jsonb_build_object(
            'total_assets', total_assets,
            'total_liabilities', total_liabilities,
            'total_equity', total_equity,
            'assets_liabilities_equity_total', total_assets - (total_liabilities + total_equity)
        ),
        'income_statement', jsonb_build_object(
            'total_revenue', total_revenue,
            'total_expenses', total_expenses,
            'net_income', net_income,
            'profit_margin_pct', CASE WHEN total_revenue > 0 THEN (net_income / total_revenue) * 100 ELSE 0 END
        ),
        'liquidity_analysis', liquidity_ratios,
        'trial_balance_check', trial_balance,
        'generated_at', now()
    );
    
    RETURN summary_result;
END;
$$;

-- تحديث الأنواع في جدول أنواع الأصول
UPDATE public.asset_categories 
SET 
    default_depreciation_method = 'straight_line',
    is_active = true
WHERE default_depreciation_method IS NULL;

-- إدراج فئات أصول افتراضية للسياق الكويتي
INSERT INTO public.asset_categories (
    category_name, default_useful_life, default_depreciation_method, default_residual_rate, description
) VALUES 
('سيارات وباصات', 5, 'straight_line', 10.0, 'المركبات المستخدمة في أعمال التأجير'),
('أجهزة كمبيوتر ومعدات مكتبية', 3, 'straight_line', 5.0, 'أجهزة الحاسوب والمعدات المكتبية'),
('أثاث ومفروشات', 7, 'straight_line', 5.0, 'الأثاث والمفروشات المكتبية'),
('مباني ومنشآت', 25, 'straight_line', 5.0, 'المباني والمنشآت العقارية'),
('معدات ورش الصيانة', 10, 'straight_line', 10.0, 'معدات وأدوات ورش صيانة المركبات'),
('برامج وأنظمة تقنية', 5, 'straight_line', 0.0, 'البرامج والأنظمة التقنية')
ON CONFLICT (category_name) DO NOTHING;