-- إضافة سياسة التحديث المفقودة لجدول leave_requests
CREATE POLICY "المديرون يمكنهم تحديث طلبات الإجازات"
ON public.leave_requests
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role)
);