
-- إنشاء جدول لحفظ تقارير المقارنة
CREATE TABLE public.comparison_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    report_name TEXT NOT NULL,
    report_type TEXT NOT NULL, -- 'budget_vs_actual', 'year_over_year', 'month_over_month'
    primary_period_start DATE NOT NULL,
    primary_period_end DATE NOT NULL,
    comparison_period_start DATE NOT NULL,
    comparison_period_end DATE NOT NULL,
    report_data JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول لتفاصيل بنود التقرير
CREATE TABLE public.comparison_report_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES public.comparison_reports(id) ON DELETE CASCADE,
    account_id UUID NOT NULL,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    primary_period_amount NUMERIC(15,3) DEFAULT 0,
    comparison_period_amount NUMERIC(15,3) DEFAULT 0,
    variance_amount NUMERIC(15,3) DEFAULT 0,
    variance_percentage NUMERIC(10,2) DEFAULT 0,
    analysis_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إضافة Row Level Security
ALTER TABLE public.comparison_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_report_items ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للتقارير
CREATE POLICY "المحاسبون يمكنهم إدارة تقارير المقارنة"
ON public.comparison_reports FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- سياسات الأمان لبنود التقارير
CREATE POLICY "المحاسبون يمكنهم إدارة بنود تقارير المقارنة"
ON public.comparison_report_items FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- دالة لحساب المقارنات بين الفترات
CREATE OR REPLACE FUNCTION public.generate_period_comparison(
    tenant_id_param UUID,
    primary_start_date DATE,
    primary_end_date DATE,
    comparison_start_date DATE,
    comparison_end_date DATE,
    account_types TEXT[] DEFAULT ARRAY['asset', 'liability', 'equity', 'revenue', 'expense']
)
RETURNS TABLE (
    account_id UUID,
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    primary_amount NUMERIC,
    comparison_amount NUMERIC,
    variance_amount NUMERIC,
    variance_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH primary_balances AS (
        SELECT 
            c.id,
            c.account_code,
            c.account_name,
            c.account_type,
            COALESCE(SUM(
                CASE 
                    WHEN jed.debit_amount IS NOT NULL THEN jed.debit_amount
                    ELSE 0
                END - 
                CASE 
                    WHEN jed.credit_amount IS NOT NULL THEN jed.credit_amount
                    ELSE 0
                END
            ), c.opening_balance) as period_amount
        FROM public.chart_of_accounts c
        LEFT JOIN public.journal_entry_details jed ON c.id = jed.account_id
        LEFT JOIN public.journal_entries je ON jed.journal_entry_id = je.id
        WHERE c.tenant_id = tenant_id_param
        AND c.account_type = ANY(account_types)
        AND (je.entry_date IS NULL OR (je.entry_date BETWEEN primary_start_date AND primary_end_date))
        AND c.is_active = true
        GROUP BY c.id, c.account_code, c.account_name, c.account_type, c.opening_balance
    ),
    comparison_balances AS (
        SELECT 
            c.id,
            COALESCE(SUM(
                CASE 
                    WHEN jed.debit_amount IS NOT NULL THEN jed.debit_amount
                    ELSE 0
                END - 
                CASE 
                    WHEN jed.credit_amount IS NOT NULL THEN jed.credit_amount
                    ELSE 0
                END
            ), c.opening_balance) as period_amount
        FROM public.chart_of_accounts c
        LEFT JOIN public.journal_entry_details jed ON c.id = jed.account_id
        LEFT JOIN public.journal_entries je ON jed.journal_entry_id = je.id
        WHERE c.tenant_id = tenant_id_param
        AND c.account_type = ANY(account_types)
        AND (je.entry_date IS NULL OR (je.entry_date BETWEEN comparison_start_date AND comparison_end_date))
        AND c.is_active = true
        GROUP BY c.id, c.opening_balance
    )
    SELECT 
        p.id,
        p.account_code,
        p.account_name,
        p.account_type,
        p.period_amount,
        COALESCE(c.period_amount, 0),
        (p.period_amount - COALESCE(c.period_amount, 0)),
        CASE 
            WHEN COALESCE(c.period_amount, 0) != 0 THEN 
                ((p.period_amount - COALESCE(c.period_amount, 0)) / ABS(c.period_amount)) * 100
            ELSE 0
        END
    FROM primary_balances p
    LEFT JOIN comparison_balances c ON p.id = c.id
    ORDER BY p.account_code;
END;
$$;

-- دالة لحفظ تقرير المقارنة
CREATE OR REPLACE FUNCTION public.save_comparison_report(
    tenant_id_param UUID,
    report_name_param TEXT,
    report_type_param TEXT,
    primary_start_date DATE,
    primary_end_date DATE,
    comparison_start_date DATE,
    comparison_end_date DATE,
    created_by_param UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    report_id UUID;
    comparison_record RECORD;
BEGIN
    -- إنشاء التقرير الرئيسي
    INSERT INTO public.comparison_reports (
        tenant_id, report_name, report_type, 
        primary_period_start, primary_period_end, 
        comparison_period_start, comparison_period_end, 
        created_by
    ) VALUES (
        tenant_id_param, report_name_param, report_type_param,
        primary_start_date, primary_end_date,
        comparison_start_date, comparison_end_date,
        created_by_param
    ) RETURNING id INTO report_id;
    
    -- إدراج بيانات المقارنة
    FOR comparison_record IN 
        SELECT * FROM public.generate_period_comparison(
            tenant_id_param, primary_start_date, primary_end_date, 
            comparison_start_date, comparison_end_date
        )
    LOOP
        INSERT INTO public.comparison_report_items (
            report_id, account_id, account_code, account_name,
            primary_period_amount, comparison_period_amount,
            variance_amount, variance_percentage
        ) VALUES (
            report_id, comparison_record.account_id, comparison_record.account_code, 
            comparison_record.account_name, comparison_record.primary_amount,
            comparison_record.comparison_amount, comparison_record.variance_amount,
            comparison_record.variance_percentage
        );
    END LOOP;
    
    RETURN report_id;
END;
$$;
