-- المرحلة الثانية: تحسين الأداء المالي
-- إضافة فهارس مُحسّنة للاستعلامات المالية المتكررة

-- 1. فهارس للقيود المحاسبية
CREATE INDEX IF NOT EXISTS idx_journal_entries_date_tenant_status 
ON public.journal_entries (entry_date, tenant_id, status) 
WHERE status = 'posted';

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account_date 
ON public.journal_entry_lines (account_id, created_at DESC) 
WHERE tenant_id IS NOT NULL;

-- 2. فهارس محاسبة العملاء
CREATE INDEX IF NOT EXISTS idx_customer_subsidiary_ledger_composite 
ON public.customer_subsidiary_ledger (customer_id, transaction_date DESC, tenant_id) 
WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_customer_status_date 
ON public.invoices (customer_id, status, issue_date DESC) 
WHERE tenant_id IS NOT NULL;

-- 3. فهارس البنوك والمدفوعات
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_date 
ON public.bank_transactions (bank_account_id, transaction_date DESC) 
WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_status_date 
ON public.payments (status, payment_date DESC, tenant_id);

-- 4. فهارس الفترات المالية
CREATE INDEX IF NOT EXISTS idx_financial_periods_tenant_date_range 
ON public.financial_periods (tenant_id, start_date, end_date) 
WHERE is_closed = false;

-- 5. فهارس التقارير المالية
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_tenant_active_type 
ON public.chart_of_accounts (tenant_id, account_type, is_active) 
WHERE is_active = true;

-- 6. فهارس الموافقات المالية
CREATE INDEX IF NOT EXISTS idx_approvals_tenant_status_type 
ON public.approvals (reference_table, status, requested_at DESC) 
WHERE reference_table IN ('journal_entries', 'expense_vouchers', 'payments');

-- 7. تحسين دالة get_current_tenant_id لأداء أفضل
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth
 STABLE
AS $function$
DECLARE
    current_user_id uuid;
    tenant_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- استخدام فهرس محسن للبحث
    SELECT tu.tenant_id INTO tenant_id
    FROM public.tenant_users tu
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    ORDER BY tu.created_at DESC
    LIMIT 1;
    
    RETURN tenant_id;
END;
$function$;

-- 8. دالة محسنة للحصول على أرصدة الحسابات
CREATE OR REPLACE FUNCTION public.get_account_balance_optimized(account_id_param uuid, as_of_date date DEFAULT CURRENT_DATE)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
 STABLE
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

-- 9. دالة سريعة لعمر الديون
CREATE OR REPLACE FUNCTION public.calculate_customer_aging_fast(customer_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
 STABLE
AS $function$
DECLARE
    current_tenant_id uuid;
    aging_result jsonb;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    SELECT jsonb_build_object(
        'current', COALESCE(SUM(CASE WHEN CURRENT_DATE - transaction_date <= 30 THEN (debit_amount - credit_amount) ELSE 0 END), 0),
        '30_days', COALESCE(SUM(CASE WHEN CURRENT_DATE - transaction_date BETWEEN 31 AND 60 THEN (debit_amount - credit_amount) ELSE 0 END), 0),
        '60_days', COALESCE(SUM(CASE WHEN CURRENT_DATE - transaction_date BETWEEN 61 AND 90 THEN (debit_amount - credit_amount) ELSE 0 END), 0),
        '90_plus', COALESCE(SUM(CASE WHEN CURRENT_DATE - transaction_date > 90 THEN (debit_amount - credit_amount) ELSE 0 END), 0),
        'total', COALESCE(SUM(debit_amount - credit_amount), 0)
    ) INTO aging_result
    FROM public.customer_subsidiary_ledger
    WHERE customer_id = customer_id_param
    AND tenant_id = current_tenant_id;
    
    RETURN aging_result;
END;
$function$;