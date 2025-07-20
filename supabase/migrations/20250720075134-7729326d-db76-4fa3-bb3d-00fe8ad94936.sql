-- إضافة فهارس محسنة لدفتر الأستاذ العام لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account_entry ON public.journal_entry_lines (account_id, journal_entry_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_date_status ON public.journal_entries (entry_date, status) WHERE status = 'posted';

-- تحسين أداء الاستعلامات التي تحتوي على تواريخ
CREATE INDEX IF NOT EXISTS idx_journal_entries_status_date_range ON public.journal_entries (status, entry_date) WHERE status = 'posted';