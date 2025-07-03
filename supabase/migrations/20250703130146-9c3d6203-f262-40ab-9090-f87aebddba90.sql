-- إصلاح مشكلة التباس employee_number في دالة generate_employee_number
CREATE OR REPLACE FUNCTION public.generate_employee_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  new_employee_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(employees.employee_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.employees
  WHERE employees.employee_number ~ '^EMP[0-9]+$';
  
  new_employee_number := 'EMP' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_employee_number;
END;
$$;