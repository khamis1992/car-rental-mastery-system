-- Master Migration 003: Accounting Functions and Procedures
-- This consolidates all accounting-related functions into one file
-- Replaces multiple separate accounting function migrations

-- ============================================
-- TRANSACTION LOGGING FUNCTION (CONSOLIDATED)
-- ============================================
CREATE OR REPLACE FUNCTION public.log_transaction(
  p_transaction_type text,
  p_source_table text,
  p_source_id uuid,
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
SET search_path TO 'public'
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
    actual_employee_id,
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

-- ============================================
-- JOURNAL ENTRY GENERATION
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_year TEXT;
    sequence_number INTEGER;
    entry_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(
        CASE 
            WHEN entry_number LIKE current_year || '-%' THEN
                (SPLIT_PART(entry_number, '-', 2))::INTEGER
            ELSE 0
        END
    ), 0) + 1 INTO sequence_number
    FROM journal_entries
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    entry_number := current_year || '-' || LPAD(sequence_number::TEXT, 6, '0');
    
    RETURN entry_number;
END;
$$;

-- ============================================
-- CONTRACT ACCOUNTING ENTRY
-- ============================================
CREATE OR REPLACE FUNCTION public.create_contract_accounting_entry(
    contract_id UUID, 
    contract_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    journal_entry_id UUID;
    journal_entry_number TEXT;
    customer_name TEXT;
    vehicle_info TEXT;
    total_amount NUMERIC;
    security_deposit NUMERIC;
    insurance_amount NUMERIC;
    tax_amount NUMERIC;
    discount_amount NUMERIC;
    
    -- Account IDs
    receivable_account UUID;
    deferred_revenue_account UUID;
    deposit_liability_account UUID;
    insurance_liability_account UUID;
    tax_payable_account UUID;
    discount_account UUID;
BEGIN
    -- Extract contract data
    customer_name := contract_data->>'customer_name';
    vehicle_info := contract_data->>'vehicle_info';
    total_amount := (contract_data->>'total_amount')::NUMERIC;
    security_deposit := COALESCE((contract_data->>'security_deposit')::NUMERIC, 0);
    insurance_amount := COALESCE((contract_data->>'insurance_amount')::NUMERIC, 0);
    tax_amount := COALESCE((contract_data->>'tax_amount')::NUMERIC, 0);
    discount_amount := COALESCE((contract_data->>'discount_amount')::NUMERIC, 0);
    
    -- Get account IDs
    SELECT id INTO receivable_account FROM chart_of_accounts WHERE account_code = '1121';
    SELECT id INTO deferred_revenue_account FROM chart_of_accounts WHERE account_code = '2301';
    SELECT id INTO deposit_liability_account FROM chart_of_accounts WHERE account_code = '2201';
    SELECT id INTO insurance_liability_account FROM chart_of_accounts WHERE account_code = '2202';
    SELECT id INTO tax_payable_account FROM chart_of_accounts WHERE account_code = '2120';
    SELECT id INTO discount_account FROM chart_of_accounts WHERE account_code = '4201';
    
    -- Generate journal entry number
    journal_entry_number := generate_journal_entry_number();
    
    -- Create journal entry
    INSERT INTO journal_entries (
        entry_number, entry_date, description, reference_type, reference_id,
        total_debit, total_credit, status, created_by
    ) VALUES (
        journal_entry_number, CURRENT_DATE,
        'قيد عقد إيجار مؤجل - ' || customer_name || ' - ' || vehicle_info,
        'contract', contract_id,
        total_amount, total_amount, 'posted', auth.uid()
    ) RETURNING id INTO journal_entry_id;
    
    -- Create journal entry lines
    -- Debit: Accounts Receivable
    INSERT INTO journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, receivable_account,
        'حساب العميل - ' || customer_name, total_amount, 0, 1
    );
    
    -- Credit: Deferred Revenue
    INSERT INTO journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, deferred_revenue_account,
        'إيراد مؤجل - عقد إيجار', 0, total_amount - security_deposit - insurance_amount - tax_amount + discount_amount, 2
    );
    
    -- Credit: Security Deposit (if any)
    IF security_deposit > 0 THEN
        INSERT INTO journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
        ) VALUES (
            journal_entry_id, deposit_liability_account,
            'تأمين مستردّ', 0, security_deposit, 3
        );
    END IF;
    
    RETURN journal_entry_id;
END;
$$;

-- ============================================
-- PAYMENT REVENUE ENTRY
-- ============================================
CREATE OR REPLACE FUNCTION public.create_payment_revenue_entry(
    payment_id UUID, 
    payment_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    journal_entry_id UUID;
    journal_entry_number TEXT;
    customer_name TEXT;
    invoice_number TEXT;
    amount NUMERIC;
    payment_method TEXT;
    payment_date DATE;
    
    -- Account IDs
    cash_account UUID;
    bank_account UUID;
    receivable_account UUID;
    deferred_revenue_account UUID;
    revenue_account UUID;
BEGIN
    -- Extract payment data
    customer_name := payment_data->>'customer_name';
    invoice_number := payment_data->>'invoice_number';
    amount := (payment_data->>'amount')::NUMERIC;
    payment_method := payment_data->>'payment_method';
    payment_date := (payment_data->>'payment_date')::DATE;
    
    -- Get account IDs
    SELECT id INTO cash_account FROM chart_of_accounts WHERE account_code = '1111';
    SELECT id INTO bank_account FROM chart_of_accounts WHERE account_code = '11121';
    SELECT id INTO receivable_account FROM chart_of_accounts WHERE account_code = '1121';
    SELECT id INTO deferred_revenue_account FROM chart_of_accounts WHERE account_code = '2301';
    SELECT id INTO revenue_account FROM chart_of_accounts WHERE account_code = '411';
    
    -- Determine cash account based on payment method
    IF payment_method = 'bank_transfer' THEN
        cash_account := bank_account;
    END IF;
    
    -- Generate journal entry number
    journal_entry_number := generate_journal_entry_number();
    
    -- Create journal entry
    INSERT INTO journal_entries (
        entry_number, entry_date, description, reference_type, reference_id,
        total_debit, total_credit, status, created_by
    ) VALUES (
        journal_entry_number, payment_date,
        'قيد دفعة - ' || customer_name || ' - فاتورة: ' || invoice_number,
        'payment', payment_id,
        amount, amount, 'posted', auth.uid()
    ) RETURNING id INTO journal_entry_id;
    
    -- Create journal entry lines
    -- Debit: Cash/Bank
    INSERT INTO journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, cash_account,
        'تحصيل نقدي - ' || customer_name, amount, 0, 1
    );
    
    -- Credit: Accounts Receivable
    INSERT INTO journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, receivable_account,
        'تحصيل من العميل - ' || customer_name, 0, amount, 2
    );
    
    RETURN journal_entry_id;
END;
$$;

-- ============================================
-- ATTENDANCE ACCOUNTING ENTRY
-- ============================================
CREATE OR REPLACE FUNCTION public.create_attendance_accounting_entry(attendance_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  employee_name TEXT;
  attendance_date TEXT;
  total_cost NUMERIC;
  
  -- Account IDs
  labor_expense_account UUID;
  wages_payable_account UUID;
BEGIN
  -- Extract data
  employee_name := attendance_data->>'employee_name';
  attendance_date := attendance_data->>'date';
  total_cost := (attendance_data->>'total_cost')::NUMERIC;
  
  -- Get account IDs
  SELECT id INTO labor_expense_account FROM chart_of_accounts WHERE account_code = '5110';
  SELECT id INTO wages_payable_account FROM chart_of_accounts WHERE account_code = '2110';
  
  -- Generate journal entry number
  journal_entry_number := generate_journal_entry_number();
  
  -- Create journal entry
  INSERT INTO journal_entries (
    entry_number, entry_date, description, reference_type, reference_id,
    total_debit, total_credit, status, created_by
  ) VALUES (
    journal_entry_number, attendance_date::DATE,
    'تكلفة عمالة يومية - ' || employee_name || ' - ' || attendance_date,
    'attendance', NULL,
    total_cost, total_cost, 'posted', auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- Create journal entry lines
  -- Labor expense (debit)
  INSERT INTO journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, labor_expense_account, 
    'تكلفة عمالة - ' || employee_name, total_cost, 0, 1
  );
  
  -- Wages payable (credit)
  INSERT INTO journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, wages_payable_account, 
    'أجور مستحقة - ' || employee_name, 0, total_cost, 2
  );
  
  RETURN journal_entry_id;
END;
$$;