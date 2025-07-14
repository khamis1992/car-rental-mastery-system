-- إنشاء جداول المراقبة والأمان

-- جدول سجلات العمليات على البيانات
CREATE TABLE IF NOT EXISTS public.data_operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES public.tenants(id),
    operation_type TEXT NOT NULL CHECK (operation_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
    table_name TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT
);

-- جدول الأحداث الأمنية
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES public.tenants(id),
    event_type TEXT NOT NULL,
    table_name TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT,
    severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_data_operation_logs_tenant_id ON public.data_operation_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_operation_logs_timestamp ON public.data_operation_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_data_operation_logs_operation_type ON public.data_operation_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_data_operation_logs_table_name ON public.data_operation_logs(table_name);

CREATE INDEX IF NOT EXISTS idx_security_events_tenant_id ON public.security_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON public.security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);

-- تمكين Row Level Security
ALTER TABLE public.data_operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للبيانات
CREATE POLICY "المديرون يمكنهم رؤية سجلات العمليات" 
ON public.data_operation_logs FOR SELECT 
USING (
    tenant_id = get_current_tenant_id() AND
    (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role))
);

CREATE POLICY "النظام يمكنه إدراج سجلات العمليات" 
ON public.data_operation_logs FOR INSERT 
WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "المديرون يمكنهم رؤية الأحداث الأمنية" 
ON public.security_events FOR SELECT 
USING (
    tenant_id = get_current_tenant_id() AND
    (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role))
);

CREATE POLICY "النظام يمكنه إدراج الأحداث الأمنية" 
ON public.security_events FOR INSERT 
WITH CHECK (tenant_id = get_current_tenant_id());