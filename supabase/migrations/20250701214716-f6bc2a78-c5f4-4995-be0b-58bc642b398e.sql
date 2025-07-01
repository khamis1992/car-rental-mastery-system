-- إنشاء جدول الموظفين
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  national_id TEXT UNIQUE,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  hire_date DATE NOT NULL,
  salary NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  manager_id UUID REFERENCES public.employees(id),
  work_location_id UUID,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  bank_account_number TEXT,
  bank_name TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- إنشاء جدول مواقع العمل
CREATE TABLE public.work_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  radius_meters INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  working_hours_start TIME,
  working_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- إضافة المرجع الخارجي لمواقع العمل
ALTER TABLE public.employees 
ADD CONSTRAINT employees_work_location_id_fkey 
FOREIGN KEY (work_location_id) REFERENCES public.work_locations(id);

-- إنشاء جدول الحضور والغياب
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  break_start_time TIMESTAMP WITH TIME ZONE,
  break_end_time TIMESTAMP WITH TIME ZONE,
  total_hours NUMERIC,
  overtime_hours NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'early_leave', 'sick', 'vacation')),
  location_latitude NUMERIC,
  location_longitude NUMERIC,
  notes TEXT,
  approved_by UUID REFERENCES public.employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- إنشاء جدول طلبات الإجازات
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'maternity', 'emergency', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES public.employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول كشوف الرواتب
CREATE TABLE public.payroll (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  basic_salary NUMERIC NOT NULL,
  overtime_amount NUMERIC DEFAULT 0,
  allowances NUMERIC DEFAULT 0,
  bonuses NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  tax_deduction NUMERIC DEFAULT 0,
  social_insurance NUMERIC DEFAULT 0,
  gross_salary NUMERIC NOT NULL,
  net_salary NUMERIC NOT NULL,
  total_working_days INTEGER,
  actual_working_days INTEGER,
  overtime_hours NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid')),
  approved_by UUID REFERENCES public.employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, pay_period_start, pay_period_end)
);

-- إنشاء جدول تفاصيل بنود الراتب
CREATE TABLE public.payroll_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_id UUID NOT NULL REFERENCES public.payroll(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('allowance', 'bonus', 'deduction')),
  item_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للموظفين
CREATE POLICY "الموظفون يمكنهم رؤية بياناتهم" 
ON public.employees FOR SELECT 
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

CREATE POLICY "المديرون يمكنهم إدارة الموظفين" 
ON public.employees FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

-- سياسات الأمان لمواقع العمل
CREATE POLICY "الجميع يمكنهم رؤية مواقع العمل" 
ON public.work_locations FOR SELECT 
USING (true);

CREATE POLICY "المديرون يمكنهم إدارة مواقع العمل" 
ON public.work_locations FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

-- سياسات الأمان للحضور
CREATE POLICY "الموظفون يمكنهم رؤية حضورهم" 
ON public.attendance FOR SELECT 
USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role)
);

CREATE POLICY "الموظفون يمكنهم تسجيل حضورهم" 
ON public.attendance FOR INSERT 
WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "المديرون يمكنهم إدارة الحضور" 
ON public.attendance FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

-- سياسات الأمان لطلبات الإجازات
CREATE POLICY "الموظفون يمكنهم رؤية طلباتهم" 
ON public.leave_requests FOR SELECT 
USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role)
);

CREATE POLICY "الموظفون يمكنهم إنشاء طلبات إجازة" 
ON public.leave_requests FOR INSERT 
WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "المديرون يمكنهم إدارة طلبات الإجازات" 
ON public.leave_requests FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

-- سياسات الأمان للرواتب
CREATE POLICY "الموظفون يمكنهم رؤية رواتبهم" 
ON public.payroll FOR SELECT 
USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role) OR 
  has_role(auth.uid(), 'accountant'::user_role)
);

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة الرواتب" 
ON public.payroll FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role) OR 
  has_role(auth.uid(), 'accountant'::user_role)
);

CREATE POLICY "عرض بنود الراتب" 
ON public.payroll_items FOR SELECT 
USING (
  payroll_id IN (
    SELECT id FROM public.payroll WHERE 
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()) OR 
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
  )
);

CREATE POLICY "إدارة بنود الراتب" 
ON public.payroll_items FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role) OR 
  has_role(auth.uid(), 'accountant'::user_role)
);

-- إنشاء دوال لتوليد أرقام تلقائية
CREATE OR REPLACE FUNCTION public.generate_employee_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  employee_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.employees
  WHERE employee_number ~ '^EMP[0-9]+$';
  
  employee_number := 'EMP' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN employee_number;
END;
$$;

-- دالة لحساب الراتب الإجمالي والصافي
CREATE OR REPLACE FUNCTION public.calculate_payroll_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- حساب الراتب الإجمالي
  NEW.gross_salary := NEW.basic_salary + NEW.overtime_amount + NEW.allowances + NEW.bonuses;
  
  -- حساب الراتب الصافي
  NEW.net_salary := NEW.gross_salary - NEW.deductions - NEW.tax_deduction - NEW.social_insurance;
  
  RETURN NEW;
END;
$$;

-- إنشاء محفز لحساب الرواتب تلقائياً
CREATE TRIGGER calculate_payroll_totals_trigger
BEFORE INSERT OR UPDATE ON public.payroll
FOR EACH ROW
EXECUTE FUNCTION public.calculate_payroll_totals();

-- دالة لحساب ساعات العمل
CREATE OR REPLACE FUNCTION public.calculate_working_hours()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  break_duration INTERVAL := INTERVAL '0 minutes';
BEGIN
  IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
    -- حساب مدة الاستراحة إذا كانت موجودة
    IF NEW.break_start_time IS NOT NULL AND NEW.break_end_time IS NOT NULL THEN
      break_duration := NEW.break_end_time - NEW.break_start_time;
    END IF;
    
    -- حساب إجمالي ساعات العمل
    NEW.total_hours := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time - break_duration)) / 3600;
    
    -- حساب ساعات العمل الإضافي (أكثر من 8 ساعات)
    IF NEW.total_hours > 8 THEN
      NEW.overtime_hours := NEW.total_hours - 8;
    ELSE
      NEW.overtime_hours := 0;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء محفز لحساب ساعات العمل تلقائياً
CREATE TRIGGER calculate_working_hours_trigger
BEFORE INSERT OR UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.calculate_working_hours();

-- دالة لتحديث updated_at
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_locations_updated_at
BEFORE UPDATE ON public.work_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_updated_at
BEFORE UPDATE ON public.payroll
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();