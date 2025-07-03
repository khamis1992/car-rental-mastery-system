-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_code TEXT NOT NULL UNIQUE,
  department_name TEXT NOT NULL,
  department_name_en TEXT,
  description TEXT,
  manager_id UUID REFERENCES public.employees(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add index on department_code for faster lookups
CREATE INDEX idx_departments_code ON public.departments(department_code);
CREATE INDEX idx_departments_active ON public.departments(is_active);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "المديرون يمكنهم إدارة الأقسام"
  ON public.departments
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

CREATE POLICY "الموظفون يمكنهم رؤية الأقسام"
  ON public.departments
  FOR SELECT
  USING (is_active = true);

-- Function to generate department code
CREATE OR REPLACE FUNCTION public.generate_department_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  department_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(department_code FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.departments
  WHERE department_code ~ '^DEPT[0-9]+$';
  
  department_code := 'DEPT' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN department_code;
END;
$$;

-- Update trigger for updated_at
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default departments
INSERT INTO public.departments (department_code, department_name, department_name_en, description, created_by) VALUES
('DEPT001', 'تقنية المعلومات', 'Information Technology', 'قسم تقنية المعلومات والبرمجيات', auth.uid()),
('DEPT002', 'المالية', 'Finance', 'قسم المحاسبة والشؤون المالية', auth.uid()),
('DEPT003', 'الموارد البشرية', 'Human Resources', 'قسم الموارد البشرية وشؤون الموظفين', auth.uid()),
('DEPT004', 'التسويق', 'Marketing', 'قسم التسويق والمبيعات', auth.uid()),
('DEPT005', 'العمليات', 'Operations', 'قسم العمليات التشغيلية', auth.uid()),
('DEPT006', 'خدمة العملاء', 'Customer Service', 'قسم خدمة العملاء والدعم الفني', auth.uid());

-- Add foreign key constraint to employees table (department should reference departments table)
-- First, let's add a department_id column to employees
ALTER TABLE public.employees 
ADD COLUMN department_id UUID REFERENCES public.departments(id);

-- Create an index for the foreign key
CREATE INDEX idx_employees_department_id ON public.employees(department_id);