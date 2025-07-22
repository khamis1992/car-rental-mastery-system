
-- Step 1: Enhance lease contract processing with cost center integration
-- Add cost center tracking to contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES public.cost_centers(id);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS depreciation_schedule_id UUID;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS accounting_status TEXT DEFAULT 'pending';

-- Create depreciation schedules table
CREATE TABLE IF NOT EXISTS public.depreciation_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
    cost_center_id UUID REFERENCES public.cost_centers(id),
    total_depreciation_amount NUMERIC NOT NULL DEFAULT 0,
    monthly_depreciation_amount NUMERIC NOT NULL DEFAULT 0,
    remaining_depreciation_amount NUMERIC NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
);

-- Create enhanced contract accounting entries table
CREATE TABLE IF NOT EXISTS public.contract_accounting_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    cost_center_id UUID REFERENCES public.cost_centers(id),
    entry_type TEXT NOT NULL CHECK (entry_type IN ('receivable', 'deferred_revenue', 'revenue_recognition', 'depreciation')),
    amount NUMERIC NOT NULL,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
    notes TEXT
);

-- Step 2: Create enhanced violation accounting system
-- Add cost center tracking to violations
ALTER TABLE public.traffic_violations ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES public.cost_centers(id);
ALTER TABLE public.traffic_violations ADD COLUMN IF NOT EXISTS liability_determination TEXT DEFAULT 'pending';
ALTER TABLE public.traffic_violations ADD COLUMN IF NOT EXISTS accounting_status TEXT DEFAULT 'pending';

-- Create vehicle return processing table
CREATE TABLE IF NOT EXISTS public.vehicle_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    return_date DATE NOT NULL,
    return_mileage INTEGER,
    fuel_level TEXT,
    condition_notes TEXT,
    maintenance_costs NUMERIC DEFAULT 0,
    customer_deductions NUMERIC DEFAULT 0,
    damage_assessment JSONB DEFAULT '{}',
    photos TEXT[],
    processed_by UUID REFERENCES auth.users(id),
    accounting_status TEXT DEFAULT 'pending' CHECK (accounting_status IN ('pending', 'processed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
);

-- Create vehicle return accounting entries table
CREATE TABLE IF NOT EXISTS public.vehicle_return_accounting_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_return_id UUID NOT NULL REFERENCES public.vehicle_returns(id) ON DELETE CASCADE,
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    cost_center_id UUID REFERENCES public.cost_centers(id),
    entry_type TEXT NOT NULL CHECK (entry_type IN ('maintenance_cost', 'customer_deduction', 'damage_cost')),
    amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
);

-- Step 3: Create ERP integration monitoring table
CREATE TABLE IF NOT EXISTS public.erp_integration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type TEXT NOT NULL CHECK (operation_type IN ('contract_creation', 'violation_registration', 'vehicle_return')),
    reference_id UUID NOT NULL,
    reference_table TEXT NOT NULL,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    cost_center_id UUID REFERENCES public.cost_centers(id),
    error_message TEXT,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_accounting_entries_contract_id ON public.contract_accounting_entries(contract_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_return_accounting_entries_return_id ON public.vehicle_return_accounting_entries(vehicle_return_id);
CREATE INDEX IF NOT EXISTS idx_erp_integration_log_reference ON public.erp_integration_log(reference_id, reference_table);
CREATE INDEX IF NOT EXISTS idx_depreciation_schedules_contract_id ON public.depreciation_schedules(contract_id);

-- Enable RLS on new tables
ALTER TABLE public.depreciation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_return_accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_integration_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "tenant_isolation_depreciation_schedules" ON public.depreciation_schedules
    FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_isolation_contract_accounting_entries" ON public.contract_accounting_entries
    FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_isolation_vehicle_returns" ON public.vehicle_returns
    FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_isolation_vehicle_return_accounting_entries" ON public.vehicle_return_accounting_entries
    FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_isolation_erp_integration_log" ON public.erp_integration_log
    FOR ALL USING (tenant_id = get_current_tenant_id());

-- Step 4: Create enhanced accounting functions
-- Function to create comprehensive contract accounting entry
CREATE OR REPLACE FUNCTION public.create_enhanced_contract_accounting_entry(
    contract_id_param UUID,
    cost_center_id_param UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    contract_record RECORD;
    journal_entry_id UUID;
    receivable_account_id UUID;
    deferred_revenue_account_id UUID;
    current_tenant_id UUID;
    entry_number TEXT;
    depreciation_schedule_id UUID;
BEGIN
    current_tenant_id := get_current_tenant_id();
    
    -- Get contract details
    SELECT c.*, cust.name as customer_name, v.make, v.model
    INTO contract_record
    FROM public.contracts c
    JOIN public.customers cust ON c.customer_id = cust.id
    JOIN public.vehicles v ON c.vehicle_id = v.id
    WHERE c.id = contract_id_param AND c.tenant_id = current_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contract not found or access denied';
    END IF;
    
    -- Get account IDs
    SELECT id INTO receivable_account_id 
    FROM public.chart_of_accounts 
    WHERE tenant_id = current_tenant_id AND account_code = '11301' AND is_active = true;
    
    SELECT id INTO deferred_revenue_account_id 
    FROM public.chart_of_accounts 
    WHERE tenant_id = current_tenant_id AND account_code = '21301' AND is_active = true;
    
    IF receivable_account_id IS NULL OR deferred_revenue_account_id IS NULL THEN
        RAISE EXCEPTION 'Required accounting accounts not found';
    END IF;
    
    -- Generate entry number
    entry_number := 'CON-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(nextval('journal_entry_sequence')::TEXT, 6, '0');
    
    -- Create journal entry
    INSERT INTO public.journal_entries (
        tenant_id, entry_number, entry_date, description,
        reference_type, reference_id, total_debit, total_credit,
        status, created_by
    ) VALUES (
        current_tenant_id, entry_number, CURRENT_DATE,
        'قيد عقد إيجار - ' || contract_record.contract_number || ' - ' || contract_record.customer_name,
        'contract', contract_id_param, contract_record.total_amount, contract_record.total_amount,
        'posted', auth.uid()
    ) RETURNING id INTO journal_entry_id;
    
    -- Create journal entry lines
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, debit_amount, credit_amount,
        description, tenant_id, cost_center_id
    ) VALUES 
    (journal_entry_id, receivable_account_id, contract_record.total_amount, 0,
     'مديونية عقد إيجار - ' || contract_record.contract_number, current_tenant_id, cost_center_id_param),
    (journal_entry_id, deferred_revenue_account_id, 0, contract_record.total_amount,
     'إيرادات مؤجلة - ' || contract_record.contract_number, current_tenant_id, cost_center_id_param);
    
    -- Create depreciation schedule
    INSERT INTO public.depreciation_schedules (
        contract_id, vehicle_id, cost_center_id, total_depreciation_amount,
        monthly_depreciation_amount, remaining_depreciation_amount,
        start_date, end_date, tenant_id, created_by
    ) VALUES (
        contract_id_param, contract_record.vehicle_id, cost_center_id_param,
        contract_record.total_amount * 0.1, -- 10% depreciation
        (contract_record.total_amount * 0.1) / GREATEST(contract_record.rental_days / 30, 1),
        contract_record.total_amount * 0.1,
        contract_record.start_date, contract_record.end_date,
        current_tenant_id, auth.uid()
    ) RETURNING id INTO depreciation_schedule_id;
    
    -- Log the accounting entry
    INSERT INTO public.contract_accounting_entries (
        contract_id, journal_entry_id, cost_center_id, entry_type,
        amount, processing_status, tenant_id, created_by
    ) VALUES (
        contract_id_param, journal_entry_id, cost_center_id_param, 'receivable',
        contract_record.total_amount, 'processed', current_tenant_id, auth.uid()
    );
    
    -- Update contract
    UPDATE public.contracts 
    SET depreciation_schedule_id = depreciation_schedule_id,
        accounting_status = 'processed'
    WHERE id = contract_id_param;
    
    RETURN journal_entry_id;
END;
$$;

-- Function to create violation accounting entry
CREATE OR REPLACE FUNCTION public.create_enhanced_violation_accounting_entry(
    violation_id_param UUID,
    cost_center_id_param UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    violation_record RECORD;
    journal_entry_id UUID;
    receivable_account_id UUID;
    liability_account_id UUID;
    current_tenant_id UUID;
    entry_number TEXT;
BEGIN
    current_tenant_id := get_current_tenant_id();
    
    -- Get violation details
    SELECT v.*, c.name as customer_name
    INTO violation_record
    FROM public.traffic_violations v
    JOIN public.customers c ON v.customer_id = c.id
    WHERE v.id = violation_id_param AND v.tenant_id = current_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Violation not found or access denied';
    END IF;
    
    -- Get account IDs
    SELECT id INTO receivable_account_id 
    FROM public.chart_of_accounts 
    WHERE tenant_id = current_tenant_id AND account_code = '1140' AND is_active = true;
    
    SELECT id INTO liability_account_id 
    FROM public.chart_of_accounts 
    WHERE tenant_id = current_tenant_id AND account_code = '2150' AND is_active = true;
    
    IF receivable_account_id IS NULL OR liability_account_id IS NULL THEN
        RAISE EXCEPTION 'Required accounting accounts not found';
    END IF;
    
    -- Generate entry number
    entry_number := 'VIO-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(nextval('journal_entry_sequence')::TEXT, 6, '0');
    
    -- Create journal entry
    INSERT INTO public.journal_entries (
        tenant_id, entry_number, entry_date, description,
        reference_type, reference_id, total_debit, total_credit,
        status, created_by
    ) VALUES (
        current_tenant_id, entry_number, CURRENT_DATE,
        'قيد مخالفة مرورية - ' || violation_record.violation_number || ' - ' || violation_record.customer_name,
        'violation', violation_id_param, violation_record.total_amount, violation_record.total_amount,
        'posted', auth.uid()
    ) RETURNING id INTO journal_entry_id;
    
    -- Create journal entry lines
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, debit_amount, credit_amount,
        description, tenant_id, cost_center_id
    ) VALUES 
    (journal_entry_id, receivable_account_id, violation_record.total_amount, 0,
     'مديونية مخالفة - ' || violation_record.violation_number, current_tenant_id, cost_center_id_param),
    (journal_entry_id, liability_account_id, 0, violation_record.total_amount,
     'التزام مخالفة - ' || violation_record.violation_number, current_tenant_id, cost_center_id_param);
    
    -- Update violation
    UPDATE public.traffic_violations 
    SET accounting_status = 'processed',
        liability_determination = 'customer_liable',
        cost_center_id = cost_center_id_param
    WHERE id = violation_id_param;
    
    RETURN journal_entry_id;
END;
$$;

-- Function to create vehicle return accounting entry
CREATE OR REPLACE FUNCTION public.create_vehicle_return_accounting_entry(
    vehicle_return_id_param UUID,
    cost_center_id_param UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    return_record RECORD;
    journal_entry_id UUID;
    maintenance_expense_account_id UUID;
    receivable_account_id UUID;
    current_tenant_id UUID;
    entry_number TEXT;
    total_amount NUMERIC;
BEGIN
    current_tenant_id := get_current_tenant_id();
    
    -- Get return details
    SELECT vr.*, c.name as customer_name, v.make, v.model
    INTO return_record
    FROM public.vehicle_returns vr
    JOIN public.customers c ON vr.customer_id = c.id
    JOIN public.vehicles v ON vr.vehicle_id = v.id
    WHERE vr.id = vehicle_return_id_param AND vr.tenant_id = current_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Vehicle return not found or access denied';
    END IF;
    
    total_amount := return_record.maintenance_costs + return_record.customer_deductions;
    
    IF total_amount <= 0 THEN
        RETURN NULL; -- No accounting entry needed
    END IF;
    
    -- Get account IDs
    SELECT id INTO maintenance_expense_account_id 
    FROM public.chart_of_accounts 
    WHERE tenant_id = current_tenant_id AND account_code = '5130' AND is_active = true;
    
    SELECT id INTO receivable_account_id 
    FROM public.chart_of_accounts 
    WHERE tenant_id = current_tenant_id AND account_code = '11301' AND is_active = true;
    
    IF maintenance_expense_account_id IS NULL OR receivable_account_id IS NULL THEN
        RAISE EXCEPTION 'Required accounting accounts not found';
    END IF;
    
    -- Generate entry number
    entry_number := 'VRT-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(nextval('journal_entry_sequence')::TEXT, 6, '0');
    
    -- Create journal entry
    INSERT INTO public.journal_entries (
        tenant_id, entry_number, entry_date, description,
        reference_type, reference_id, total_debit, total_credit,
        status, created_by
    ) VALUES (
        current_tenant_id, entry_number, CURRENT_DATE,
        'قيد إرجاع مركبة - ' || return_record.customer_name || ' - ' || return_record.make || ' ' || return_record.model,
        'vehicle_return', vehicle_return_id_param, total_amount, total_amount,
        'posted', auth.uid()
    ) RETURNING id INTO journal_entry_id;
    
    -- Create journal entry lines
    IF return_record.maintenance_costs > 0 THEN
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, debit_amount, credit_amount,
            description, tenant_id, cost_center_id
        ) VALUES 
        (journal_entry_id, maintenance_expense_account_id, return_record.maintenance_costs, 0,
         'تكاليف صيانة مركبة', current_tenant_id, cost_center_id_param);
    END IF;
    
    IF return_record.customer_deductions > 0 THEN
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, debit_amount, credit_amount,
            description, tenant_id, cost_center_id
        ) VALUES 
        (journal_entry_id, receivable_account_id, return_record.customer_deductions, 0,
         'خصومات على العميل', current_tenant_id, cost_center_id_param);
    END IF;
    
    -- Update vehicle return
    UPDATE public.vehicle_returns 
    SET accounting_status = 'processed'
    WHERE id = vehicle_return_id_param;
    
    RETURN journal_entry_id;
END;
$$;

-- Create triggers for automatic processing
CREATE OR REPLACE FUNCTION public.trigger_contract_accounting()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
        INSERT INTO public.erp_integration_log (
            operation_type, reference_id, reference_table,
            processing_status, tenant_id, created_by
        ) VALUES (
            'contract_creation', NEW.id, 'contracts',
            'pending', NEW.tenant_id, auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trigger_violation_accounting()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.erp_integration_log (
            operation_type, reference_id, reference_table,
            processing_status, tenant_id, created_by
        ) VALUES (
            'violation_registration', NEW.id, 'traffic_violations',
            'pending', NEW.tenant_id, auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trigger_vehicle_return_accounting()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.erp_integration_log (
            operation_type, reference_id, reference_table,
            processing_status, tenant_id, created_by
        ) VALUES (
            'vehicle_return', NEW.id, 'vehicle_returns',
            'pending', NEW.tenant_id, auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_contract_accounting ON public.contracts;
CREATE TRIGGER trigger_contract_accounting
    AFTER INSERT OR UPDATE ON public.contracts
    FOR EACH ROW EXECUTE FUNCTION public.trigger_contract_accounting();

DROP TRIGGER IF EXISTS trigger_violation_accounting ON public.traffic_violations;
CREATE TRIGGER trigger_violation_accounting
    AFTER INSERT ON public.traffic_violations
    FOR EACH ROW EXECUTE FUNCTION public.trigger_violation_accounting();

DROP TRIGGER IF EXISTS trigger_vehicle_return_accounting ON public.vehicle_returns;
CREATE TRIGGER trigger_vehicle_return_accounting
    AFTER INSERT ON public.vehicle_returns
    FOR EACH ROW EXECUTE FUNCTION public.trigger_vehicle_return_accounting();
