-- Apply the existing migration to fix the log_transaction function
-- This migration should already be in the migrations folder but we're ensuring it's applied
CREATE OR REPLACE FUNCTION public.log_transaction(
  p_transaction_type text,
  p_source_table text,
  p_source_id text,
  p_department_id uuid DEFAULT NULL,
  p_employee_id uuid DEFAULT NULL,
  p_customer_id uuid DEFAULT NULL,
  p_vehicle_id uuid DEFAULT NULL,
  p_amount numeric DEFAULT 0,
  p_description text DEFAULT '',
  p_details jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  actual_employee_id uuid;
  transaction_id uuid;
BEGIN
  -- If employee_id is provided, try to resolve it
  IF p_employee_id IS NOT NULL THEN
    -- First check if it's already a valid employee_id
    SELECT id INTO actual_employee_id 
    FROM employees 
    WHERE id = p_employee_id;
    
    -- If not found, try to find employee by user_id
    IF actual_employee_id IS NULL THEN
      SELECT id INTO actual_employee_id 
      FROM employees 
      WHERE user_id = p_employee_id;
    END IF;
    
    -- If still not found, log warning and set to NULL
    IF actual_employee_id IS NULL THEN
      RAISE WARNING 'Could not resolve employee_id % to valid employee', p_employee_id;
    END IF;
  END IF;

  -- Insert the transaction log entry
  INSERT INTO transaction_log (
    transaction_type,
    source_table,
    source_id,
    department_id,
    employee_id,
    customer_id,
    vehicle_id,
    amount,
    description,
    details,
    status,
    priority
  ) VALUES (
    p_transaction_type,
    p_source_table,
    p_source_id,
    p_department_id,
    actual_employee_id, -- Use the resolved employee_id or NULL
    p_customer_id,
    p_vehicle_id,
    p_amount,
    p_description,
    p_details,
    'pending',
    'normal'
  ) RETURNING id INTO transaction_id;
  
  RETURN transaction_id;
END;
$$;