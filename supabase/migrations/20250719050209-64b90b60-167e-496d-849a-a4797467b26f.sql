
-- إضافة دالة الترحيل الدفعي للقيود المحاسبية
CREATE OR REPLACE FUNCTION public.batch_post_journal_entries(
    entry_ids UUID[],
    posted_by UUID DEFAULT auth.uid()
)
RETURNS TABLE(
    success_count INTEGER,
    failed_count INTEGER,
    failed_entries JSONB,
    total_debit NUMERIC,
    total_credit NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    entry_id UUID;
    entry_record RECORD;
    success_cnt INTEGER := 0;
    failed_cnt INTEGER := 0;
    failed_list JSONB := '[]'::jsonb;
    total_debit_amount NUMERIC := 0;
    total_credit_amount NUMERIC := 0;
    balance_check NUMERIC;
BEGIN
    -- التحقق من صحة المعرفات
    IF array_length(entry_ids, 1) IS NULL OR array_length(entry_ids, 1) = 0 THEN
        RAISE EXCEPTION 'لا توجد قيود للترحيل';
    END IF;
    
    -- معالجة كل قيد
    FOREACH entry_id IN ARRAY entry_ids
    LOOP
        BEGIN
            -- الحصول على بيانات القيد
            SELECT * INTO entry_record 
            FROM public.journal_entries 
            WHERE id = entry_id;
            
            -- التحقق من وجود القيد
            IF NOT FOUND THEN
                failed_cnt := failed_cnt + 1;
                failed_list := failed_list || jsonb_build_object(
                    'entry_id', entry_id,
                    'error', 'القيد غير موجود'
                );
                CONTINUE;
            END IF;
            
            -- التحقق من حالة القيد
            IF entry_record.status = 'posted' THEN
                failed_cnt := failed_cnt + 1;
                failed_list := failed_list || jsonb_build_object(
                    'entry_id', entry_id,
                    'entry_number', entry_record.entry_number,
                    'error', 'القيد مرحل مسبقاً'
                );
                CONTINUE;
            END IF;
            
            IF entry_record.status != 'draft' THEN
                failed_cnt := failed_cnt + 1;
                failed_list := failed_list || jsonb_build_object(
                    'entry_id', entry_id,
                    'entry_number', entry_record.entry_number,
                    'error', 'حالة القيد لا تسمح بالترحيل'
                );
                CONTINUE;
            END IF;
            
            -- التحقق من توازن القيد
            balance_check := entry_record.total_debit - entry_record.total_credit;
            IF ABS(balance_check) > 0.001 THEN
                failed_cnt := failed_cnt + 1;
                failed_list := failed_list || jsonb_build_object(
                    'entry_id', entry_id,
                    'entry_number', entry_record.entry_number,
                    'error', 'القيد غير متوازن - الفرق: ' || balance_check::text
                );
                CONTINUE;
            END IF;
            
            -- التحقق من وجود بنود للقيد
            IF NOT EXISTS (
                SELECT 1 FROM public.journal_entry_lines 
                WHERE journal_entry_id = entry_id
            ) THEN
                failed_cnt := failed_cnt + 1;
                failed_list := failed_list || jsonb_build_object(
                    'entry_id', entry_id,
                    'entry_number', entry_record.entry_number,
                    'error', 'لا توجد بنود للقيد'
                );
                CONTINUE;
            END IF;
            
            -- ترحيل القيد
            UPDATE public.journal_entries 
            SET 
                status = 'posted',
                posted_at = now(),
                posted_by = posted_by,
                updated_at = now()
            WHERE id = entry_id;
            
            -- إضافة إلى الإجماليات
            total_debit_amount := total_debit_amount + entry_record.total_debit;
            total_credit_amount := total_credit_amount + entry_record.total_credit;
            success_cnt := success_cnt + 1;
            
        EXCEPTION WHEN OTHERS THEN
            failed_cnt := failed_cnt + 1;
            failed_list := failed_list || jsonb_build_object(
                'entry_id', entry_id,
                'entry_number', COALESCE(entry_record.entry_number, 'غير معروف'),
                'error', SQLERRM
            );
        END;
    END LOOP;
    
    -- تحديث أرصدة الحسابات إذا تم ترحيل قيود بنجاح
    IF success_cnt > 0 THEN
        PERFORM public.update_account_balances();
    END IF;
    
    -- إرجاع النتائج
    RETURN QUERY SELECT 
        success_cnt,
        failed_cnt,
        failed_list,
        total_debit_amount,
        total_credit_amount;
END;
$$;

-- منح الصلاحيات للمحاسبين والمديرين
GRANT EXECUTE ON FUNCTION public.batch_post_journal_entries(UUID[], UUID) TO authenticated;

-- إضافة تعليق على الدالة
COMMENT ON FUNCTION public.batch_post_journal_entries(UUID[], UUID) IS 'دالة الترحيل الدفعي للقيود المحاسبية - تسمح بترحيل عدة قيود في عملية واحدة مع التحقق من صحة كل قيد';
