
-- إضافة الحقول المطلوبة لخاصية عكس القيد التلقائي
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS auto_reverse_date date,
ADD COLUMN IF NOT EXISTS reversal_entry_id uuid,
ADD COLUMN IF NOT EXISTS reversed_by_entry_id uuid,
ADD COLUMN IF NOT EXISTS is_reversed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_reversal boolean DEFAULT false;

-- إضافة فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_journal_entries_auto_reverse_date 
ON public.journal_entries(auto_reverse_date) 
WHERE auto_reverse_date IS NOT NULL;

-- إضافة فهرس للعلاقات
CREATE INDEX IF NOT EXISTS idx_journal_entries_reversal_relations 
ON public.journal_entries(reversal_entry_id, reversed_by_entry_id);

-- دالة لإنشاء قيد عكسي
CREATE OR REPLACE FUNCTION public.create_reversal_entry(
    original_entry_id uuid,
    reversal_date date,
    reversal_reason text DEFAULT 'عكس تلقائي'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    original_entry RECORD;
    original_lines RECORD;
    new_entry_id uuid;
    new_entry_number text;
    tenant_id_var uuid;
BEGIN
    -- التحقق من وجود القيد الأصلي
    SELECT * INTO original_entry 
    FROM public.journal_entries 
    WHERE id = original_entry_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Journal entry not found';
    END IF;
    
    -- التحقق من أن القيد لم يتم عكسه من قبل
    IF original_entry.is_reversed THEN
        RAISE EXCEPTION 'Journal entry has already been reversed';
    END IF;
    
    -- الحصول على tenant_id
    SELECT get_current_tenant_id() INTO tenant_id_var;
    
    -- إنشاء رقم القيد الجديد
    new_entry_number := 'REV-' || original_entry.entry_number || '-' || 
                       TO_CHAR(reversal_date, 'YYYYMMDD');
    
    -- إنشاء القيد العكسي
    INSERT INTO public.journal_entries (
        tenant_id, entry_number, entry_date, description,
        total_debit, total_credit, status, reference_type,
        is_reversal, reversed_by_entry_id
    ) VALUES (
        tenant_id_var, new_entry_number, reversal_date,
        'عكس القيد: ' || original_entry.description || ' - ' || reversal_reason,
        original_entry.total_debit, original_entry.total_credit,
        'posted', 'reversal', true, original_entry_id
    ) RETURNING id INTO new_entry_id;
    
    -- نسخ البنود مع عكس المبالغ
    FOR original_lines IN 
        SELECT * FROM public.journal_entry_lines 
        WHERE journal_entry_id = original_entry_id
    LOOP
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, cost_center_id,
            description, debit_amount, credit_amount, line_number
        ) VALUES (
            new_entry_id, original_lines.account_id, original_lines.cost_center_id,
            'عكس: ' || original_lines.description,
            original_lines.credit_amount, -- عكس المبالغ
            original_lines.debit_amount,   -- عكس المبالغ
            original_lines.line_number
        );
    END LOOP;
    
    -- تحديث القيد الأصلي
    UPDATE public.journal_entries 
    SET is_reversed = true, reversal_entry_id = new_entry_id
    WHERE id = original_entry_id;
    
    -- تحديث أرصدة الحسابات
    PERFORM public.update_account_balances();
    
    RETURN new_entry_id;
END;
$$;

-- دالة للبحث عن القيود المطلوب عكسها تلقائياً
CREATE OR REPLACE FUNCTION public.process_auto_reverse_entries()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    entry_record RECORD;
    processed_count integer := 0;
    reversal_entry_id uuid;
BEGIN
    -- البحث عن القيود التي حان موعد عكسها
    FOR entry_record IN
        SELECT id, entry_number, description
        FROM public.journal_entries
        WHERE auto_reverse_date <= CURRENT_DATE
        AND status = 'posted'
        AND is_reversed = false
        AND is_reversal = false
    LOOP
        BEGIN
            -- إنشاء القيد العكسي
            SELECT public.create_reversal_entry(
                entry_record.id, 
                CURRENT_DATE, 
                'عكس تلقائي بتاريخ الاستحقاق'
            ) INTO reversal_entry_id;
            
            processed_count := processed_count + 1;
            
            -- تسجيل في سجل الأحداث
            INSERT INTO public.accounting_event_monitor (
                event_type, entity_id, status, 
                processing_completed_at, processing_duration_ms
            ) VALUES (
                'auto_reverse_processed', entry_record.id, 'completed',
                now(), 0
            );
            
        EXCEPTION WHEN OTHERS THEN
            -- تسجيل الخطأ
            INSERT INTO public.accounting_event_monitor (
                event_type, entity_id, status, error_message
            ) VALUES (
                'auto_reverse_failed', entry_record.id, 'failed', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN processed_count;
END;
$$;

-- دالة مجدولة لتشغيل العكس التلقائي يومياً
SELECT cron.schedule(
    'daily-auto-reverse-journal-entries',
    '0 2 * * *', -- كل يوم في الساعة 2 صباحاً
    $$
    SELECT public.process_auto_reverse_entries();
    $$
);
