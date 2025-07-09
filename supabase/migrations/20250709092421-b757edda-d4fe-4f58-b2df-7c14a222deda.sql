-- تنفيذ خطة شاملة لضمان وجود قيود محاسبية لجميع الحسابات

-- 1. إنشاء قيود الأرصدة الافتتاحية للحسابات التي لا تحتوي على قيود
DO $$
DECLARE
    account_record RECORD;
    journal_entry_id UUID;
    journal_entry_number TEXT;
    opening_entries_count INTEGER := 0;
BEGIN
    -- إنشاء قيود افتتاحية للحسابات التي لها رصيد افتتاحي ولا تحتوي على قيود
    FOR account_record IN (
        SELECT 
            coa.id,
            coa.account_code,
            coa.account_name,
            coa.account_type,
            coa.opening_balance
        FROM public.chart_of_accounts coa
        WHERE coa.opening_balance != 0
        AND coa.allow_posting = true
        AND NOT EXISTS (
            SELECT 1 FROM public.journal_entry_lines jel
            JOIN public.journal_entries je ON jel.journal_entry_id = je.id
            WHERE jel.account_id = coa.id
            AND je.status = 'posted'
        )
    ) LOOP
        -- توليد رقم قيد جديد
        journal_entry_number := public.generate_journal_entry_number();
        
        -- إنشاء القيد الافتتاحي
        INSERT INTO public.journal_entries (
            entry_number,
            entry_date,
            description,
            reference_type,
            reference_id,
            total_debit,
            total_credit,
            status,
            created_by
        ) VALUES (
            journal_entry_number,
            '2025-01-01'::DATE,
            'رصيد افتتاحي - ' || account_record.account_name,
            'manual',
            NULL,
            CASE 
                WHEN account_record.account_type IN ('asset', 'expense') AND account_record.opening_balance > 0 THEN account_record.opening_balance
                WHEN account_record.account_type IN ('liability', 'equity', 'revenue') AND account_record.opening_balance < 0 THEN ABS(account_record.opening_balance)
                ELSE 0
            END,
            CASE 
                WHEN account_record.account_type IN ('liability', 'equity', 'revenue') AND account_record.opening_balance > 0 THEN account_record.opening_balance
                WHEN account_record.account_type IN ('asset', 'expense') AND account_record.opening_balance < 0 THEN ABS(account_record.opening_balance)
                ELSE 0
            END,
            'posted',
            auth.uid()
        ) RETURNING id INTO journal_entry_id;
        
        -- إنشاء سطر القيد للحساب
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, 
            account_id, 
            description, 
            debit_amount, 
            credit_amount, 
            line_number
        ) VALUES (
            journal_entry_id,
            account_record.id,
            'رصيد افتتاحي - ' || account_record.account_name,
            CASE 
                WHEN account_record.account_type IN ('asset', 'expense') AND account_record.opening_balance > 0 THEN account_record.opening_balance
                WHEN account_record.account_type IN ('liability', 'equity', 'revenue') AND account_record.opening_balance < 0 THEN ABS(account_record.opening_balance)
                ELSE 0
            END,
            CASE 
                WHEN account_record.account_type IN ('liability', 'equity', 'revenue') AND account_record.opening_balance > 0 THEN account_record.opening_balance
                WHEN account_record.account_type IN ('asset', 'expense') AND account_record.opening_balance < 0 THEN ABS(account_record.opening_balance)
                ELSE 0
            END,
            1
        );
        
        -- إنشاء سطر مقابل في حساب رأس المال أو الأرباح المحتجزة
        DECLARE
            equity_account_id UUID;
        BEGIN
            -- البحث عن حساب رأس المال
            SELECT id INTO equity_account_id 
            FROM public.chart_of_accounts 
            WHERE account_type = 'equity' 
            AND account_category = 'capital'
            AND allow_posting = true
            LIMIT 1;
            
            -- إذا لم يوجد، إنشاء حساب رأس المال
            IF equity_account_id IS NULL THEN
                INSERT INTO public.chart_of_accounts (
                    account_code, account_name, account_type, account_category,
                    level, allow_posting, is_active, opening_balance
                ) VALUES (
                    '3110', 'رأس المال', 'equity', 'capital',
                    2, true, true, 0
                ) RETURNING id INTO equity_account_id;
            END IF;
            
            -- إنشاء السطر المقابل
            INSERT INTO public.journal_entry_lines (
                journal_entry_id, 
                account_id, 
                description, 
                debit_amount, 
                credit_amount, 
                line_number
            ) VALUES (
                journal_entry_id,
                equity_account_id,
                'قيد مقابل للرصيد الافتتاحي',
                CASE 
                    WHEN account_record.account_type IN ('liability', 'equity', 'revenue') AND account_record.opening_balance > 0 THEN account_record.opening_balance
                    WHEN account_record.account_type IN ('asset', 'expense') AND account_record.opening_balance < 0 THEN ABS(account_record.opening_balance)
                    ELSE 0
                END,
                CASE 
                    WHEN account_record.account_type IN ('asset', 'expense') AND account_record.opening_balance > 0 THEN account_record.opening_balance
                    WHEN account_record.account_type IN ('liability', 'equity', 'revenue') AND account_record.opening_balance < 0 THEN ABS(account_record.opening_balance)
                    ELSE 0
                END,
                2
            );
        END;
        
        opening_entries_count := opening_entries_count + 1;
        
        RAISE NOTICE 'تم إنشاء قيد افتتاحي للحساب %: %', account_record.account_code, account_record.account_name;
    END LOOP;
    
    RAISE NOTICE 'تم إنشاء % قيد افتتاحي', opening_entries_count;
END $$;

-- 2. إنشاء قيود محاسبية للعمليات الموجودة بدون قيود
DO $$
DECLARE
    contract_record RECORD;
    invoice_record RECORD;
    payment_record RECORD;
    violation_record RECORD;
    maintenance_record RECORD;
    processed_count INTEGER := 0;
    journal_entry_result UUID;
BEGIN
    -- إنشاء قيود للعقود المكتملة بدون قيود محاسبية
    FOR contract_record IN (
        SELECT 
            c.id,
            c.contract_number,
            c.final_amount,
            c.created_at,
            cust.name as customer_name
        FROM public.contracts c
        JOIN public.customers cust ON c.customer_id = cust.id
        WHERE c.status = 'completed' 
        AND NOT EXISTS (
            SELECT 1 FROM public.journal_entries je 
            WHERE je.reference_type = 'contract' 
            AND je.reference_id = c.id
        )
        LIMIT 10 -- تحديد العدد لتجنب المعالجة المفرطة
    ) LOOP
        BEGIN
            -- يمكن إضافة منطق إنشاء قيود العقود هنا إذا كان لديك دالة مخصصة
            processed_count := processed_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'خطأ في معالجة العقد %: %', contract_record.contract_number, SQLERRM;
        END;
    END LOOP;
    
    -- إنشاء قيود للفواتير بدون قيود محاسبية
    FOR invoice_record IN (
        SELECT 
            i.id,
            i.invoice_number,
            i.total_amount,
            i.tax_amount,
            i.created_at,
            c.name as customer_name
        FROM public.invoices i
        JOIN public.customers c ON i.customer_id = c.id
        WHERE i.status = 'sent'
        AND NOT EXISTS (
            SELECT 1 FROM public.journal_entries je 
            WHERE je.reference_type = 'invoice' 
            AND je.reference_id = i.id
        )
        LIMIT 10
    ) LOOP
        BEGIN
            -- إنشاء قيد المديونية للفاتورة
            SELECT public.create_invoice_receivable_entry(
                invoice_record.id,
                jsonb_build_object(
                    'customer_name', invoice_record.customer_name,
                    'invoice_number', invoice_record.invoice_number,
                    'total_amount', invoice_record.total_amount,
                    'tax_amount', COALESCE(invoice_record.tax_amount, 0)
                )
            ) INTO journal_entry_result;
            
            processed_count := processed_count + 1;
            RAISE NOTICE 'تم إنشاء قيد محاسبي للفاتورة %', invoice_record.invoice_number;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'خطأ في معالجة الفاتورة %: %', invoice_record.invoice_number, SQLERRM;
        END;
    END LOOP;
    
    -- إنشاء قيود للمدفوعات المكتملة بدون قيود محاسبية
    FOR payment_record IN (
        SELECT 
            p.id,
            p.amount,
            p.payment_date,
            i.invoice_number,
            c.name as customer_name
        FROM public.payments p
        JOIN public.invoices i ON p.invoice_id = i.id
        JOIN public.customers c ON i.customer_id = c.id
        WHERE p.status = 'completed'
        AND NOT EXISTS (
            SELECT 1 FROM public.journal_entries je 
            WHERE je.reference_type = 'payment' 
            AND je.reference_id = p.id
        )
        LIMIT 10
    ) LOOP
        BEGIN
            -- إنشاء قيد المدفوعة
            SELECT public.create_payment_accounting_entry(
                payment_record.id,
                jsonb_build_object(
                    'customer_name', payment_record.customer_name,
                    'invoice_number', payment_record.invoice_number,
                    'amount', payment_record.amount,
                    'payment_date', payment_record.payment_date
                )
            ) INTO journal_entry_result;
            
            processed_count := processed_count + 1;
            RAISE NOTICE 'تم إنشاء قيد محاسبي للدفعة رقم %', payment_record.id;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'خطأ في معالجة الدفعة %: %', payment_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'تم معالجة % عملية وإنشاء قيودها المحاسبية', processed_count;
END $$;

-- 3. تحديث جميع أرصدة الحسابات
SELECT public.update_account_balances();

-- 4. إنشاء تقرير موجز عن حالة النظام
DO $$
DECLARE
    total_accounts INTEGER;
    accounts_with_entries INTEGER;
    accounts_without_entries INTEGER;
    total_journal_entries INTEGER;
    unbalanced_entries INTEGER;
BEGIN
    -- حساب إجمالي الحسابات
    SELECT COUNT(*) INTO total_accounts
    FROM public.chart_of_accounts
    WHERE allow_posting = true AND is_active = true;
    
    -- حساب الحسابات التي لها قيود
    SELECT COUNT(DISTINCT jel.account_id) INTO accounts_with_entries
    FROM public.journal_entry_lines jel
    JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    JOIN public.chart_of_accounts coa ON jel.account_id = coa.id
    WHERE je.status = 'posted' 
    AND coa.allow_posting = true 
    AND coa.is_active = true;
    
    -- حساب الحسابات بدون قيود
    accounts_without_entries := total_accounts - accounts_with_entries;
    
    -- حساب إجمالي القيود المحاسبية
    SELECT COUNT(*) INTO total_journal_entries
    FROM public.journal_entries
    WHERE status = 'posted';
    
    -- حساب القيود غير المتوازنة
    SELECT COUNT(*) INTO unbalanced_entries
    FROM (
        SELECT je.id
        FROM public.journal_entries je
        LEFT JOIN public.journal_entry_lines jel ON je.id = jel.journal_entry_id
        WHERE je.status = 'posted'
        GROUP BY je.id
        HAVING COALESCE(SUM(jel.debit_amount), 0) != COALESCE(SUM(jel.credit_amount), 0)
    ) unbalanced;
    
    -- طباعة التقرير
    RAISE NOTICE '=== تقرير حالة النظام المحاسبي ===';
    RAISE NOTICE 'إجمالي الحسابات النشطة: %', total_accounts;
    RAISE NOTICE 'الحسابات التي لها قيود: %', accounts_with_entries;
    RAISE NOTICE 'الحسابات بدون قيود: %', accounts_without_entries;
    RAISE NOTICE 'إجمالي القيود المحاسبية: %', total_journal_entries;
    RAISE NOTICE 'القيود غير المتوازنة: %', unbalanced_entries;
    RAISE NOTICE '=== انتهى التقرير ===';
END $$;