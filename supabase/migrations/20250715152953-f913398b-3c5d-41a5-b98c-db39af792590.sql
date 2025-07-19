-- Create journal automation rules table
CREATE TABLE public.journal_automation_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    rule_name TEXT NOT NULL,
    trigger_event TEXT NOT NULL CHECK (trigger_event IN ('invoice_generated', 'payment_received', 'expense_recorded', 'contract_signed', 'rental_completed')),
    conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    account_mappings JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    execution_count INTEGER NOT NULL DEFAULT 0,
    last_executed TIMESTAMP WITH TIME ZONE,
    success_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID
);

-- Create journal automation executions table
CREATE TABLE public.journal_automation_executions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_id UUID NOT NULL,
    triggered_by TEXT NOT NULL,
    reference_id UUID NOT NULL,
    reference_type TEXT NOT NULL,
    journal_entry_id UUID,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    execution_time_ms INTEGER NOT NULL DEFAULT 0
);

-- Add foreign key constraints
ALTER TABLE public.journal_automation_rules 
ADD CONSTRAINT fk_journal_automation_rules_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.journal_automation_executions 
ADD CONSTRAINT fk_journal_automation_executions_rule 
FOREIGN KEY (rule_id) REFERENCES public.journal_automation_rules(id) ON DELETE CASCADE;

ALTER TABLE public.journal_automation_executions 
ADD CONSTRAINT fk_journal_automation_executions_journal_entry 
FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_journal_automation_rules_tenant_id ON public.journal_automation_rules(tenant_id);
CREATE INDEX idx_journal_automation_rules_trigger_event ON public.journal_automation_rules(trigger_event);
CREATE INDEX idx_journal_automation_rules_is_active ON public.journal_automation_rules(is_active);
CREATE INDEX idx_journal_automation_executions_rule_id ON public.journal_automation_executions(rule_id);
CREATE INDEX idx_journal_automation_executions_executed_at ON public.journal_automation_executions(executed_at);

-- Enable Row Level Security
ALTER TABLE public.journal_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_automation_executions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for journal_automation_rules
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة قواعد الأتمتة"
ON public.journal_automation_rules
FOR ALL
USING (
    tenant_id = get_current_tenant_id() AND
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR 
     has_role(auth.uid(), 'accountant'::user_role))
);

-- Create RLS policies for journal_automation_executions
CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية سجل التنفيذ"
ON public.journal_automation_executions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.journal_automation_rules jar 
        WHERE jar.id = rule_id 
        AND jar.tenant_id = get_current_tenant_id()
    ) AND
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR 
     has_role(auth.uid(), 'accountant'::user_role))
);

CREATE POLICY "النظام يمكنه إدراج سجلات التنفيذ"
ON public.journal_automation_executions
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.journal_automation_rules jar 
        WHERE jar.id = rule_id 
        AND jar.tenant_id = get_current_tenant_id()
    )
);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_journal_automation_rules_updated_at
    BEFORE UPDATE ON public.journal_automation_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();