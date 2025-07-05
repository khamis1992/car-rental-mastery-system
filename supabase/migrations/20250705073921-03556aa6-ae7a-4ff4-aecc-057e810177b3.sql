-- Create payroll table
CREATE TABLE public.payroll (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  basic_salary NUMERIC NOT NULL DEFAULT 0,
  overtime_amount NUMERIC NOT NULL DEFAULT 0,
  allowances NUMERIC NOT NULL DEFAULT 0,
  bonuses NUMERIC NOT NULL DEFAULT 0,
  deductions NUMERIC NOT NULL DEFAULT 0,
  tax_deduction NUMERIC NOT NULL DEFAULT 0,
  social_insurance NUMERIC NOT NULL DEFAULT 0,
  gross_salary NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  total_working_days INTEGER,
  actual_working_days INTEGER,
  overtime_hours NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid')),
  approved_by UUID REFERENCES public.employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create payroll items table for allowances, bonuses, and deductions
CREATE TABLE public.payroll_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_id UUID NOT NULL REFERENCES public.payroll(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('allowance', 'bonus', 'deduction')),
  item_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payroll settings table
CREATE TABLE public.payroll_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tax_rate NUMERIC NOT NULL DEFAULT 5.0,
  social_insurance_rate NUMERIC NOT NULL DEFAULT 6.0,
  overtime_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  working_hours_per_day INTEGER NOT NULL DEFAULT 8,
  working_days_per_month INTEGER NOT NULL DEFAULT 22,
  tax_threshold NUMERIC NOT NULL DEFAULT 0,
  max_social_insurance NUMERIC NOT NULL DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS on payroll tables
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payroll
CREATE POLICY "المديرون والمحاسبون يمكنهم إدارة الرواتب" ON public.payroll FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'accountant'));

CREATE POLICY "الموظفون يمكنهم رؤية رواتبهم فقط" ON public.payroll FOR SELECT 
USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()) OR 
       has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'accountant'));

-- Create RLS policies for payroll items
CREATE POLICY "المديرون والمحاسبون يمكنهم إدارة بنود الرواتب" ON public.payroll_items FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'accountant'));

-- Create RLS policies for payroll settings
CREATE POLICY "المديرون يمكنهم إدارة إعدادات الرواتب" ON public.payroll_settings FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "الموظفون يمكنهم رؤية إعدادات الرواتب" ON public.payroll_settings FOR SELECT 
USING (true);

-- Create trigger to automatically calculate payroll totals
CREATE OR REPLACE FUNCTION public.calculate_payroll_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- حساب الراتب الإجمالي
  NEW.gross_salary := NEW.basic_salary + NEW.overtime_amount + NEW.allowances + NEW.bonuses;
  
  -- حساب الراتب الصافي
  NEW.net_salary := NEW.gross_salary - NEW.deductions - NEW.tax_deduction - NEW.social_insurance;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_payroll_totals_trigger
  BEFORE INSERT OR UPDATE ON public.payroll
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_payroll_totals();

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_payroll_updated_at
  BEFORE UPDATE ON public.payroll
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_settings_updated_at
  BEFORE UPDATE ON public.payroll_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default payroll settings
INSERT INTO public.payroll_settings (tax_rate, social_insurance_rate, overtime_multiplier, working_hours_per_day, working_days_per_month, tax_threshold, max_social_insurance)
VALUES (5.0, 6.0, 1.5, 8, 22, 0, 2000);