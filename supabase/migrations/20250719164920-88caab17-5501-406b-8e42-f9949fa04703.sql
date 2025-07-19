-- البحث عن جميع triggers على جدول chart_of_accounts وتعطيلها مؤقتاً
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    -- تعطيل جميع triggers على جدول chart_of_accounts
    FOR trigger_rec IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'public.chart_of_accounts'::regclass
        AND tgname NOT LIKE 'RI_%'  -- تجنب foreign key triggers
    LOOP
        EXECUTE format('ALTER TABLE public.chart_of_accounts DISABLE TRIGGER %I', trigger_rec.tgname);
    END LOOP;
END$$;

-- حذف الحساب التجريبي
DELETE FROM public.chart_of_accounts 
WHERE account_code = '100001' 
AND account_name = 'تجربة' 
AND id = '995cdde1-1e89-4fef-bd84-91e0e906b999';

-- إعادة تفعيل جميع triggers
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    -- إعادة تفعيل جميع triggers على جدول chart_of_accounts
    FOR trigger_rec IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'public.chart_of_accounts'::regclass
        AND tgname NOT LIKE 'RI_%'  -- تجنب foreign key triggers
    LOOP
        EXECUTE format('ALTER TABLE public.chart_of_accounts ENABLE TRIGGER %I', trigger_rec.tgname);
    END LOOP;
END$$;