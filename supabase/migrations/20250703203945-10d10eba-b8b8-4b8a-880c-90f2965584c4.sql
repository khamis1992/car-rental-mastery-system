-- التأكد من وجود جدول leave_requests مع التحديثات المطلوبة
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS لطلبات الإجازات
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان لطلبات الإجازات
DO $$
BEGIN
  -- إسقاط السياسات الموجودة إذا كانت موجودة
  DROP POLICY IF EXISTS "الموظفون يمكنهم رؤية طلباتهم" ON public.leave_requests;
  DROP POLICY IF EXISTS "الموظفون يمكنهم إنشاء طلبات إجازة" ON public.leave_requests;
  DROP POLICY IF EXISTS "المديرون يمكنهم إدارة طلبات الإجازات" ON public.leave_requests;
  
  -- إعادة إنشاء السياسات بشكل صحيح
  CREATE POLICY "الموظفون يمكنهم رؤية طلباتهم"
  ON public.leave_requests
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    ) OR
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role)
  );

  CREATE POLICY "الموظفون يمكنهم إنشاء طلبات إجازة"
  ON public.leave_requests
  FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

  CREATE POLICY "المديرون يمكنهم إدارة طلبات الإجازات"
  ON public.leave_requests
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role)
  );
END $$;

-- إنشاء trigger للتحديث التلقائي لوقت التعديل
CREATE OR REPLACE FUNCTION public.update_updated_at_leave_requests()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger إذا لم يكن موجوداً
DROP TRIGGER IF EXISTS trigger_update_leave_requests_updated_at ON public.leave_requests;
CREATE TRIGGER trigger_update_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_leave_requests();

-- التأكد من وجود جدول الإشعارات
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'info',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recipient_id UUID NOT NULL,
  sender_id UUID,
  entity_type TEXT,
  entity_id UUID
);

-- تمكين RLS للإشعارات
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان للإشعارات
DO $$
BEGIN
  DROP POLICY IF EXISTS "المستخدمون يمكنهم رؤية إشعاراتهم" ON public.notifications;
  DROP POLICY IF EXISTS "المديرون يمكنهم إدارة الإشعارات" ON public.notifications;
  
  CREATE POLICY "المستخدمون يمكنهم رؤية إشعاراتهم"
  ON public.notifications
  FOR SELECT
  USING (recipient_id = auth.uid());

  CREATE POLICY "المديرون يمكنهم إدارة الإشعارات"
  ON public.notifications
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role)
  );
END $$;