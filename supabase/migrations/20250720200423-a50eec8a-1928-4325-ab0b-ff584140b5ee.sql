
-- إصلاح مشكلة التباس column reference في دالة get_general_ledger_entries_enhanced
DROP FUNCTION IF EXISTS public.get_general_ledger_entries_enhanced(uuid, date, date);

CREATE OR REPLACE FUNCTION public.get_general_ledger_entries_enhanced(
    account_id_param uuid,
    start_date_param date,
    end_date_param date
) RETURNS TABLE(
    id uuid,
    entry_date date,
    entry_number text,
    description text,
    debit_amount numeric,
    credit_amount numeric,
    running_balance numeric,
    reference_id uuid,
    reference_type text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    running_balance_calc NUMERIC := 0;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- الحصول على الرصيد الافتتاحي للحساب مع تحديد الجدول بوضوح
    SELECT COALESCE(coa.opening_balance, 0) INTO running_balance_calc
    FROM public.chart_of_accounts coa
    WHERE coa.id = account_id_param AND coa.tenant_id = current_tenant_id;
    
    RETURN QUERY
    WITH sorted_entries AS (
        SELECT 
            jel.id as entry_line_id,
            je.entry_date,
            je.entry_number,
            COALESCE(jel.description, je.description) as description,
            jel.debit_amount,
            jel.credit_amount,
            je.reference_id,
            je.reference_type,
            je.created_at,
            jel.line_number
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
            se.entry_line_id,
            se.entry_date,
            se.entry_number,
            se.description,
            se.debit_amount,
            se.credit_amount,
            se.reference_id,
            se.reference_type,
            running_balance_calc + SUM(se.debit_amount - se.credit_amount) 
            OVER (ORDER BY se.entry_date, se.created_at, se.entry_line_id 
                  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as balance
        FROM sorted_entries se
    )
    SELECT 
        ewb.entry_line_id,
        ewb.entry_date,
        ewb.entry_number,
        ewb.description,
        ewb.debit_amount,
        ewb.credit_amount,
        ewb.balance,
        ewb.reference_id,
        ewb.reference_type
    FROM entries_with_balance ewb
    ORDER BY ewb.entry_date, ewb.entry_line_id;
END;
$$;

-- تحديث دالة get_account_summary لضمان عدم وجود التباس في column references
DROP FUNCTION IF EXISTS public.get_account_summary(uuid, date, date);

CREATE OR REPLACE FUNCTION public.get_account_summary(
    account_id_param uuid,
    start_date_param date,
    end_date_param date
) RETURNS TABLE(
    total_debit numeric,
    total_credit numeric,
    final_balance numeric,
    entries_count integer,
    opening_balance numeric
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
    GROUP BY coa.id, coa.current_balance, coa.opening_balance;
END;
$$;
