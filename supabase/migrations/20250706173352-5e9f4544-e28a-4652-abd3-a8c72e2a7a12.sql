-- إنشاء جدول سجل المراجعة المحاسبي
CREATE TABLE IF NOT EXISTS public.accounting_audit_trail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول مراقبة الأحداث المحاسبية
CREATE TABLE IF NOT EXISTS public.accounting_event_monitor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  processing_duration_ms INTEGER,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول إعدادات الـ webhooks
CREATE TABLE IF NOT EXISTS public.accounting_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  event_types TEXT[] NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  secret_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- تمكين RLS
ALTER TABLE public.accounting_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_event_monitor ENABLE ROLS LEVEL SECURITY;
ALTER TABLE public.accounting_webhooks ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للمراجعة المحاسبية
CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية سجل المراجعة" 
ON public.accounting_audit_trail FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "النظام يمكنه إضافة سجلات المراجعة" 
ON public.accounting_audit_trail FOR INSERT 
WITH CHECK (true);

-- سياسات RLS لمراقبة الأحداث
CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية مراقبة الأحداث" 
ON public.accounting_event_monitor FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "النظام يمكنه إدارة مراقبة الأحداث" 
ON public.accounting_event_monitor FOR ALL 
USING (true);

-- سياسات RLS للـ webhooks
CREATE POLICY "المديرون يمكنهم إدارة الـ webhooks" 
ON public.accounting_webhooks FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_accounting_audit_trail_entity ON public.accounting_audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_accounting_audit_trail_event_type ON public.accounting_audit_trail(event_type);
CREATE INDEX IF NOT EXISTS idx_accounting_audit_trail_created_at ON public.accounting_audit_trail(created_at);

CREATE INDEX IF NOT EXISTS idx_accounting_event_monitor_status ON public.accounting_event_monitor(status);
CREATE INDEX IF NOT EXISTS idx_accounting_event_monitor_event_type ON public.accounting_event_monitor(event_type);

-- دالة لتنظيف البيانات القديمة
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- حذف سجلات المراجعة الأقدم من 6 أشهر
  DELETE FROM public.accounting_audit_trail 
  WHERE created_at < now() - INTERVAL '6 months';
  
  -- حذف سجلات مراقبة الأحداث المكتملة الأقدم من شهر واحد
  DELETE FROM public.accounting_event_monitor 
  WHERE status = 'completed' AND created_at < now() - INTERVAL '1 month';
END;
$$;