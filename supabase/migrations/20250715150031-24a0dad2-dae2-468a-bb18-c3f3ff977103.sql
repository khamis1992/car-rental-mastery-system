-- إضافة جدول مرفقات القيود المحاسبية
CREATE TABLE IF NOT EXISTS public.journal_entry_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    description TEXT,
    
    CONSTRAINT fk_journal_entry_attachments_tenant 
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- إضافة RLS للأمان
ALTER TABLE public.journal_entry_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المحاسبون يمكنهم إدارة مرفقات القيود" 
ON public.journal_entry_attachments
FOR ALL
USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
)
WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
);

-- إضافة فهرس للأداء
CREATE INDEX idx_journal_entry_attachments_journal_entry_id 
ON public.journal_entry_attachments(journal_entry_id);

CREATE INDEX idx_journal_entry_attachments_tenant_id 
ON public.journal_entry_attachments(tenant_id);

-- إضافة حقل مركز التكلفة إلى سطور القيود المحاسبية إذا لم يكن موجوداً
ALTER TABLE public.journal_entry_lines 
ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES public.cost_centers(id);

-- إضافة فهرس لمركز التكلفة
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_cost_center_id 
ON public.journal_entry_lines(cost_center_id);

-- إضافة جدول توزيع مراكز التكلفة للقيود المحاسبية
CREATE TABLE IF NOT EXISTS public.journal_entry_cost_center_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_line_id UUID NOT NULL REFERENCES public.journal_entry_lines(id) ON DELETE CASCADE,
    cost_center_id UUID NOT NULL REFERENCES public.cost_centers(id),
    allocation_percentage DECIMAL(5,2) CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
    allocation_amount DECIMAL(15,3) CHECK (allocation_amount >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    
    CONSTRAINT fk_je_cost_center_allocations_tenant 
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- إضافة RLS للتوزيعات
ALTER TABLE public.journal_entry_cost_center_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المحاسبون يمكنهم إدارة توزيع مراكز التكلفة" 
ON public.journal_entry_cost_center_allocations
FOR ALL
USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
)
WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
);

-- إضافة فهارس للأداء
CREATE INDEX idx_je_cost_center_allocations_line_id 
ON public.journal_entry_cost_center_allocations(journal_entry_line_id);

CREATE INDEX idx_je_cost_center_allocations_cost_center_id 
ON public.journal_entry_cost_center_allocations(cost_center_id);

-- إضافة جدول تنبيهات ميزانية مراكز التكلفة
CREATE TABLE IF NOT EXISTS public.cost_center_budget_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cost_center_id UUID NOT NULL REFERENCES public.cost_centers(id),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('budget_exceeded', 'budget_warning', 'budget_critical')),
    threshold_percentage DECIMAL(5,2) NOT NULL,
    current_spent DECIMAL(15,3) NOT NULL,
    budget_amount DECIMAL(15,3) NOT NULL,
    alert_message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    read_at TIMESTAMP WITH TIME ZONE,
    read_by UUID REFERENCES auth.users(id),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    
    CONSTRAINT fk_cost_center_budget_alerts_tenant 
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- إضافة RLS للتنبيهات
ALTER TABLE public.cost_center_budget_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة تنبيهات الميزانية" 
ON public.cost_center_budget_alerts
FOR ALL
USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
)
WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
);

-- دالة لإنشاء تنبيهات الميزانية تلقائياً
CREATE OR REPLACE FUNCTION public.check_cost_center_budget_alerts()
RETURNS TRIGGER AS $$
DECLARE
    budget_usage_percentage DECIMAL(5,2);
    alert_threshold DECIMAL(5,2);
BEGIN
    -- حساب نسبة استخدام الميزانية
    IF NEW.budget_amount > 0 THEN
        budget_usage_percentage := (NEW.actual_spent / NEW.budget_amount) * 100;
        
        -- تحقق من التنبيهات المختلفة
        IF budget_usage_percentage >= 100 THEN
            -- تجاوز الميزانية
            INSERT INTO public.cost_center_budget_alerts (
                cost_center_id, alert_type, threshold_percentage, 
                current_spent, budget_amount, alert_message, tenant_id
            ) VALUES (
                NEW.id, 'budget_exceeded', budget_usage_percentage,
                NEW.actual_spent, NEW.budget_amount,
                'تم تجاوز ميزانية مركز التكلفة: ' || NEW.cost_center_name,
                NEW.tenant_id
            );
        ELSIF budget_usage_percentage >= 90 THEN
            -- تحذير حرج
            INSERT INTO public.cost_center_budget_alerts (
                cost_center_id, alert_type, threshold_percentage, 
                current_spent, budget_amount, alert_message, tenant_id
            ) VALUES (
                NEW.id, 'budget_critical', budget_usage_percentage,
                NEW.actual_spent, NEW.budget_amount,
                'تحذير حرج: وصل مركز التكلفة إلى 90% من الميزانية',
                NEW.tenant_id
            );
        ELSIF budget_usage_percentage >= 75 THEN
            -- تحذير عادي
            INSERT INTO public.cost_center_budget_alerts (
                cost_center_id, alert_type, threshold_percentage, 
                current_spent, budget_amount, alert_message, tenant_id
            ) VALUES (
                NEW.id, 'budget_warning', budget_usage_percentage,
                NEW.actual_spent, NEW.budget_amount,
                'تحذير: وصل مركز التكلفة إلى 75% من الميزانية',
                NEW.tenant_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إضافة المشغل للتحقق من تنبيهات الميزانية
DROP TRIGGER IF EXISTS trigger_cost_center_budget_alerts ON public.cost_centers;
CREATE TRIGGER trigger_cost_center_budget_alerts
    AFTER UPDATE OF actual_spent ON public.cost_centers
    FOR EACH ROW
    EXECUTE FUNCTION public.check_cost_center_budget_alerts();