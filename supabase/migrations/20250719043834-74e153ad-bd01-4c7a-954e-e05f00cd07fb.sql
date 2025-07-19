
-- Create table for recurring journal entries
CREATE TABLE public.recurring_journal_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    template_name TEXT NOT NULL,
    description TEXT NOT NULL,
    recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    recurrence_interval INTEGER NOT NULL DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    next_generation_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    auto_post BOOLEAN NOT NULL DEFAULT false,
    reference_type TEXT DEFAULT 'recurring',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID
);

-- Create table for recurring journal entry lines template
CREATE TABLE public.recurring_journal_entry_lines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    recurring_entry_id UUID NOT NULL REFERENCES public.recurring_journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL,
    cost_center_id UUID,
    description TEXT,
    debit_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    credit_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    line_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for recurring_journal_entries
ALTER TABLE public.recurring_journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة القيود المتكررة"
    ON public.recurring_journal_entries
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- Add RLS policies for recurring_journal_entry_lines
ALTER TABLE public.recurring_journal_entry_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة بنود القيود المتكررة"
    ON public.recurring_journal_entry_lines
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- Create function to calculate next generation date
CREATE OR REPLACE FUNCTION calculate_next_generation_date(
    current_date DATE,
    recurrence_type TEXT,
    interval_value INTEGER DEFAULT 1
) RETURNS DATE AS $$
BEGIN
    CASE recurrence_type
        WHEN 'daily' THEN
            RETURN current_date + (interval_value || ' days')::INTERVAL;
        WHEN 'weekly' THEN
            RETURN current_date + (interval_value || ' weeks')::INTERVAL;
        WHEN 'monthly' THEN
            RETURN current_date + (interval_value || ' months')::INTERVAL;
        WHEN 'yearly' THEN
            RETURN current_date + (interval_value || ' years')::INTERVAL;
        ELSE
            RETURN current_date + INTERVAL '1 day';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate journal entries from recurring templates
CREATE OR REPLACE FUNCTION generate_recurring_journal_entries()
RETURNS INTEGER AS $$
DECLARE
    recurring_entry RECORD;
    new_entry_id UUID;
    line_record RECORD;
    total_debit NUMERIC := 0;
    total_credit NUMERIC := 0;
    entries_created INTEGER := 0;
BEGIN
    -- Loop through all active recurring entries that are due
    FOR recurring_entry IN 
        SELECT * FROM public.recurring_journal_entries 
        WHERE is_active = true 
        AND next_generation_date <= CURRENT_DATE
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    LOOP
        -- Calculate totals for the entry
        SELECT 
            COALESCE(SUM(debit_amount), 0),
            COALESCE(SUM(credit_amount), 0)
        INTO total_debit, total_credit
        FROM public.recurring_journal_entry_lines
        WHERE recurring_entry_id = recurring_entry.id;
        
        -- Generate entry number
        INSERT INTO public.journal_entries (
            entry_number,
            entry_date,
            description,
            reference_type,
            reference_id,
            total_debit,
            total_credit,
            status,
            tenant_id,
            created_by
        ) VALUES (
            'RJE-' || TO_CHAR(NOW(), 'YYYY-MM') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6)),
            recurring_entry.next_generation_date,
            recurring_entry.description || ' (متكرر - ' || recurring_entry.template_name || ')',
            'recurring',
            recurring_entry.id::TEXT,
            total_debit,
            total_credit,
            CASE WHEN recurring_entry.auto_post THEN 'posted' ELSE 'draft' END,
            recurring_entry.tenant_id,
            recurring_entry.created_by
        ) RETURNING id INTO new_entry_id;
        
        -- Create journal entry lines
        FOR line_record IN 
            SELECT * FROM public.recurring_journal_entry_lines 
            WHERE recurring_entry_id = recurring_entry.id
            ORDER BY line_number
        LOOP
            INSERT INTO public.journal_entry_lines (
                journal_entry_id,
                account_id,
                cost_center_id,
                description,
                debit_amount,
                credit_amount,
                line_number
            ) VALUES (
                new_entry_id,
                line_record.account_id,
                line_record.cost_center_id,
                line_record.description,
                line_record.debit_amount,
                line_record.credit_amount,
                line_record.line_number
            );
        END LOOP;
        
        -- Update next generation date
        UPDATE public.recurring_journal_entries
        SET 
            next_generation_date = calculate_next_generation_date(
                next_generation_date, 
                recurrence_type, 
                recurrence_interval
            ),
            updated_at = NOW()
        WHERE id = recurring_entry.id;
        
        entries_created := entries_created + 1;
    END LOOP;
    
    RETURN entries_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX idx_recurring_journal_entries_next_date ON public.recurring_journal_entries(next_generation_date) WHERE is_active = true;
CREATE INDEX idx_recurring_journal_entry_lines_recurring_id ON public.recurring_journal_entry_lines(recurring_entry_id);
