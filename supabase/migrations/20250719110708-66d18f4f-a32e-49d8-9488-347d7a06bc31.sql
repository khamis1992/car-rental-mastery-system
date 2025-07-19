
-- إضافة جداول الوثائق والمرفقات
CREATE TABLE IF NOT EXISTS public.document_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  reference_type TEXT NOT NULL CHECK (reference_type IN ('journal_entry', 'contract', 'invoice', 'payment', 'expense')),
  reference_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_required BOOLEAN DEFAULT false,
  document_category TEXT DEFAULT 'supporting_document',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة جدول مراجعة القيود المحاسبية
CREATE TABLE IF NOT EXISTS public.journal_entry_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  journal_entry_id UUID NOT NULL,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  review_comments TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  required_documents JSONB DEFAULT '[]'::jsonb,
  missing_documents JSONB DEFAULT '[]'::jsonb,
  review_checklist JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة جدول ربط القيود بالعقود والأساطيل تلقائياً
CREATE TABLE IF NOT EXISTS public.automated_entry_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  rule_name TEXT NOT NULL,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('contract_created', 'contract_completed', 'payment_received', 'vehicle_maintenance', 'fuel_purchase')),
  conditions JSONB DEFAULT '{}'::jsonb,
  account_mappings JSONB NOT NULL DEFAULT '{}'::jsonb,
  template_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة جدول التقارير المالية المحفوظة
CREATE TABLE IF NOT EXISTS public.financial_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('trial_balance', 'income_statement', 'balance_sheet', 'cash_flow', 'custom')),
  report_parameters JSONB DEFAULT '{}'::jsonb,
  report_data JSONB,
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_scheduled BOOLEAN DEFAULT false,
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  next_generation_date TIMESTAMP WITH TIME ZONE,
  report_format TEXT DEFAULT 'json' CHECK (report_format IN ('json', 'pdf', 'excel')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة جدول مراجعة المستندات
CREATE TABLE IF NOT EXISTS public.document_review_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  entry_type TEXT NOT NULL,
  required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  review_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval_workflow JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_document_attachments_reference ON public.document_attachments(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_document_attachments_tenant ON public.document_attachments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_reviews_entry ON public.journal_entry_reviews(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_reviews_reviewer ON public.journal_entry_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_automated_entry_rules_tenant ON public.automated_entry_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_tenant ON public.financial_reports(tenant_id);

-- تمكين RLS
ALTER TABLE public.document_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_entry_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_review_checklist ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS
CREATE POLICY "tenant_isolation_document_attachments" ON public.document_attachments
FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_isolation_journal_entry_reviews" ON public.journal_entry_reviews
FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_isolation_automated_entry_rules" ON public.automated_entry_rules
FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_isolation_financial_reports" ON public.financial_reports
FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_isolation_document_review_checklist" ON public.document_review_checklist
FOR ALL USING (tenant_id = get_current_tenant_id());

-- إضافة أعمدة جديدة للجداول الموجودة
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS requires_review BOOLEAN DEFAULT true;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'under_review', 'approved', 'rejected'));
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS automated_rule_id UUID REFERENCES public.automated_entry_rules(id);
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS supporting_documents_complete BOOLEAN DEFAULT false;

-- إنشاء دالة لإنشاء القيود التلقائية
CREATE OR REPLACE FUNCTION public.create_automated_journal_entry(
  rule_id UUID,
  reference_type TEXT,
  reference_id UUID,
  transaction_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rule_record RECORD;
  journal_entry_id UUID;
  current_tenant_id UUID;
  entry_number TEXT;
BEGIN
  current_tenant_id := get_current_tenant_id();
  
  -- جلب قاعدة الأتمتة
  SELECT * INTO rule_record
  FROM public.automated_entry_rules
  WHERE id = rule_id AND tenant_id = current_tenant_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'قاعدة الأتمتة غير موجودة أو غير نشطة';
  END IF;
  
  -- إنشاء رقم القيد
  SELECT 'AUTO-' || extract(year from now()) || '-' || lpad(nextval('journal_entry_sequence')::text, 6, '0')
  INTO entry_number;
  
  -- إنشاء القيد المحاسبي
  INSERT INTO public.journal_entries (
    tenant_id, entry_number, entry_date, entry_type,
    description, reference_id, reference_table,
    total_debit, total_credit, status,
    automated_rule_id, requires_review,
    created_by
  ) VALUES (
    current_tenant_id,
    entry_number,
    CURRENT_DATE,
    'automated',
    rule_record.template_description,
    reference_id,
    reference_type,
    (transaction_data->>'total_amount')::NUMERIC,
    (transaction_data->>'total_amount')::NUMERIC,
    'draft',
    rule_id,
    false, -- القيود التلقائية لا تحتاج مراجعة افتراضياً
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إضافة سطور القيد بناءً على قاعدة الأتمتة
  -- (سيتم تنفيذ هذا في الكود)
  
  RETURN journal_entry_id;
END;
$$;

-- إنشاء دالة لتقييم مراجعة القيود
CREATE OR REPLACE FUNCTION public.evaluate_journal_entry_review(
  entry_id UUID,
  reviewer_id UUID,
  review_status TEXT,
  comments TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_tenant_id UUID;
  review_result JSONB;
  missing_docs JSONB := '[]'::jsonb;
BEGIN
  current_tenant_id := get_current_tenant_id();
  
  -- تحديث حالة المراجعة
  UPDATE public.journal_entry_reviews
  SET 
    review_status = evaluate_journal_entry_review.review_status,
    review_comments = comments,
    reviewed_at = now(),
    updated_at = now()
  WHERE journal_entry_id = entry_id AND tenant_id = current_tenant_id;
  
  -- تحديث حالة القيد
  UPDATE public.journal_entries
  SET 
    review_status = evaluate_journal_entry_review.review_status,
    status = CASE 
      WHEN evaluate_journal_entry_review.review_status = 'approved' THEN 'posted'
      WHEN evaluate_journal_entry_review.review_status = 'rejected' THEN 'rejected'
      ELSE 'draft'
    END,
    updated_at = now()
  WHERE id = entry_id AND tenant_id = current_tenant_id;
  
  review_result := jsonb_build_object(
    'success', true,
    'entry_id', entry_id,
    'review_status', review_status,
    'reviewed_at', now()
  );
  
  RETURN review_result;
END;
$$;

-- إنشاء trigger لتسجيل تحديثات الحسابات
CREATE OR REPLACE FUNCTION public.log_account_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.account_audit_log (
    account_id, user_id, tenant_id,
    action_type, old_values, new_values
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    get_current_tenant_id(),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger على جدول دليل الحسابات
DROP TRIGGER IF EXISTS chart_of_accounts_audit_trigger ON public.chart_of_accounts;
CREATE TRIGGER chart_of_accounts_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION public.log_account_changes();
