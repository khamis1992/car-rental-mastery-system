
-- إنشاء جدول دعوات المستخدمين
CREATE TABLE public.user_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  invitation_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول سجل نشاط المستخدمين
CREATE TABLE public.user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  action_description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول إدارة الجلسات
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_token TEXT NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- تفعيل Row Level Security
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للدعوات
CREATE POLICY "المديرون يمكنهم إدارة الدعوات"
ON public.user_invitations
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND role IN ('tenant_admin', 'manager')
    AND status = 'active'
  )
);

-- سياسات الأمان لسجل النشاط
CREATE POLICY "المديرون يمكنهم رؤية سجل النشاط"
ON public.user_activity_logs
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND role IN ('tenant_admin', 'manager')
    AND status = 'active'
  )
);

-- سياسات الأمان للجلسات
CREATE POLICY "المديرون يمكنهم إدارة الجلسات"
ON public.user_sessions
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND role IN ('tenant_admin', 'manager')
    AND status = 'active'
  )
);

-- دالة لتسجيل نشاط المستخدم
CREATE OR REPLACE FUNCTION public.log_user_activity(
  action_type_param TEXT,
  action_description_param TEXT DEFAULT NULL,
  ip_address_param TEXT DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_tenant_id UUID;
BEGIN
  current_tenant_id := public.get_current_tenant_id();
  
  INSERT INTO public.user_activity_logs (
    tenant_id, user_id, action_type, action_description,
    ip_address, user_agent
  ) VALUES (
    current_tenant_id, auth.uid(), action_type_param, action_description_param,
    ip_address_param, user_agent_param
  );
END;
$$;

-- دالة لإنشاء دعوة مستخدم
CREATE OR REPLACE FUNCTION public.create_user_invitation(
  email_param TEXT,
  role_param TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_tenant_id UUID;
  invitation_token TEXT;
  invitation_id UUID;
BEGIN
  current_tenant_id := public.get_current_tenant_id();
  
  -- التحقق من الصلاحيات
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND tenant_id = current_tenant_id
    AND role IN ('tenant_admin', 'manager')
    AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'ليس لديك صلاحية لدعوة مستخدمين');
  END IF;
  
  -- التحقق من عدم وجود دعوة سابقة معلقة
  IF EXISTS (
    SELECT 1 FROM public.user_invitations 
    WHERE email = email_param 
    AND tenant_id = current_tenant_id
    AND status = 'pending'
    AND expires_at > now()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'يوجد دعوة معلقة لهذا البريد الإلكتروني');
  END IF;
  
  -- إنشاء رمز الدعوة
  invitation_token := encode(gen_random_bytes(32), 'hex');
  
  -- إنشاء الدعوة
  INSERT INTO public.user_invitations (
    tenant_id, email, role, invited_by, invitation_token
  ) VALUES (
    current_tenant_id, email_param, role_param, auth.uid(), invitation_token
  ) RETURNING id INTO invitation_id;
  
  -- تسجيل النشاط
  PERFORM public.log_user_activity(
    'user_invited',
    'دعوة مستخدم جديد: ' || email_param || ' بدور: ' || role_param
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', invitation_id,
    'invitation_token', invitation_token
  );
END;
$$;

-- فهرسة للأداء
CREATE INDEX idx_user_invitations_tenant_status ON public.user_invitations(tenant_id, status);
CREATE INDEX idx_user_invitations_email_status ON public.user_invitations(email, status);
CREATE INDEX idx_user_activity_logs_tenant_user ON public.user_activity_logs(tenant_id, user_id);
CREATE INDEX idx_user_sessions_tenant_user ON public.user_sessions(tenant_id, user_id, is_active);
