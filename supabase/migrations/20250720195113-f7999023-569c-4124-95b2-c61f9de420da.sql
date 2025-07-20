
-- إصلاح هيكل دفتر الأستاذ العام - المرحلة الأولى
-- التأكد من وجود جدول journal_entry_lines مع البنية الصحيحة

-- التحقق من وجود الجدول وإنشاؤه إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL,
    account_id UUID NOT NULL,
    cost_center_id UUID,
    description TEXT,
    debit_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    credit_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    line_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
);

-- إضافة الفهارس اللازمة لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_journal_entry_id ON public.journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account_id ON public.journal_entry_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_tenant_id ON public.journal_entry_lines(tenant_id);

-- تطبيق RLS على الجدول
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسة عزل البيانات للمؤسسات
DROP POLICY IF EXISTS "journal_entry_lines_tenant_isolation" ON public.journal_entry_lines;
CREATE POLICY "journal_entry_lines_tenant_isolation" 
ON public.journal_entry_lines 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- إضافة trigger لتعيين tenant_id تلقائياً
DROP TRIGGER IF EXISTS set_tenant_id_journal_entry_lines ON public.journal_entry_lines;
CREATE TRIGGER set_tenant_id_journal_entry_lines
    BEFORE INSERT ON public.journal_entry_lines
    FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_trigger();

-- تحديث دالة الحصول على بيانات دفتر الأستاذ لتكون متوافقة مع البنية الجديدة
CREATE OR REPLACE FUNCTION public.get_general_ledger_entries_enhanced(
    account_id_param UUID,
    start_date_param DATE,
    end_date_param DATE
) RETURNS TABLE(
    id UUID,
    entry_date DATE,
    entry_number TEXT,
    description TEXT,
    debit_amount NUMERIC,
    credit_amount NUMERIC,
    running_balance NUMERIC,
    reference_id UUID,
    reference_type TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    running_balance_calc NUMERIC := 0;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- الحصول على الرصيد الافتتاحي للحساب
    SELECT COALESCE(opening_balance, 0) INTO running_balance_calc
    FROM public.chart_of_accounts 
    WHERE id = account_id_param AND tenant_id = current_tenant_id;
    
    RETURN QUERY
    WITH sorted_entries AS (
        SELECT 
            jel.id,
            je.entry_date,
            je.entry_number,
            COALESCE(jel.description, je.description) as description,
            jel.debit_amount,
            jel.credit_amount,
            je.reference_id,
            je.reference_type,
            je.created_at
        FROM public.journal_entry_lines jel
        INNER JOIN public.journal_entries je ON jel.journal_entry_id = je.id
        WHERE jel.account_id = account_id_param
        AND jel.tenant_id = current_tenant_id
        AND je.tenant_id = current_tenant_id
        AND je.entry_date BETWEEN start_date_param AND end_date_param
        AND je.status = 'posted'
        ORDER BY je.entry_date, je.created_at, jel.line_number
    ),
    entries_with_balance AS (
        SELECT 
            se.*,
            running_balance_calc + SUM(se.debit_amount - se.credit_amount) 
            OVER (ORDER BY se.entry_date, se.created_at, se.id 
                  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as balance
        FROM sorted_entries se
    )
    SELECT 
        ewb.id,
        ewb.entry_date,
        ewb.entry_number,
        ewb.description,
        ewb.debit_amount,
        ewb.credit_amount,
        ewb.balance,
        ewb.reference_id,
        ewb.reference_type
    FROM entries_with_balance ewb;
END;
$$;

-- إنشاء دالة لحساب ملخص الحساب
CREATE OR REPLACE FUNCTION public.get_account_summary(
    account_id_param UUID,
    start_date_param DATE,
    end_date_param DATE
) RETURNS TABLE(
    total_debit NUMERIC,
    total_credit NUMERIC,
    final_balance NUMERIC,
    entries_count INTEGER,
    opening_balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    RETURN QUERY
    SELECT 
        COALESCE(SUM(jel.debit_amount), 0) as total_debit,
        COALESCE(SUM(jel.credit_amount), 0) as total_credit,
        coa.current_balance as final_balance,
        COUNT(jel.id)::INTEGER as entries_count,
        COALESCE(coa.opening_balance, 0) as opening_balance
    FROM public.chart_of_accounts coa
    LEFT JOIN public.journal_entry_lines jel ON coa.id = jel.account_id
    LEFT JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    WHERE coa.id = account_id_param 
    AND coa.tenant_id = current_tenant_id
    AND (je.id IS NULL OR (
        je.tenant_id = current_tenant_id 
        AND je.entry_date BETWEEN start_date_param AND end_date_param
        AND je.status = 'posted'
    ))
    GROUP BY coa.current_balance, coa.opening_balance;
END;
$$;
