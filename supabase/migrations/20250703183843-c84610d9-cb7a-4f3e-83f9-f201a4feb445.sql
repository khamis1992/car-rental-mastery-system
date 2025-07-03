-- إنشاء جدول الإشعارات فقط
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

-- تمكين RLS للإشعارات إذا لم يكن ممكناً
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان للإشعارات إن لم تكن موجودة
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'المستخدمون يمكنهم رؤية إشعاراتهم'
  ) THEN
    CREATE POLICY "المستخدمون يمكنهم رؤية إشعاراتهم"
    ON public.notifications
    FOR SELECT
    USING (recipient_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'المديرون يمكنهم إدارة الإشعارات'
  ) THEN
    CREATE POLICY "المديرون يمكنهم إدارة الإشعارات"
    ON public.notifications
    FOR ALL
    USING (
      has_role(auth.uid(), 'admin'::user_role) OR 
      has_role(auth.uid(), 'manager'::user_role)
    );
  END IF;
END
$$;