-- Fix the generate_customer_number_simple function
CREATE OR REPLACE FUNCTION public.generate_customer_number_simple()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id UUID;
    next_number INTEGER;
    customer_number TEXT;
BEGIN
    -- Get current tenant ID
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'لا يمكن تحديد المؤسسة الحالية';
    END IF;
    
    -- Get next customer number for this tenant (fix ambiguous column reference)
    SELECT COALESCE(MAX(CAST(SUBSTRING(c.customer_number FROM '^[0-9]+') AS INTEGER)), 0) + 1 
    INTO next_number
    FROM public.customers c
    WHERE c.tenant_id = current_tenant_id
    AND c.customer_number ~ '^[0-9]+$';
    
    -- Format customer number
    customer_number := LPAD(next_number::text, 6, '0');
    
    RETURN customer_number;
END;
$function$;

-- Fix the ensure_customer_tenant_id trigger function
CREATE OR REPLACE FUNCTION public.ensure_customer_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id UUID;
BEGIN
    -- Get current tenant ID
    current_tenant_id := public.get_current_tenant_id();
    
    -- Check if user is authenticated and has tenant access
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'يجب تسجيل الدخول لإضافة عميل';
    END IF;
    
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'لا يمكن تحديد المؤسسة الحالية. تأكد من ربط المستخدم بمؤسسة صالحة.';
    END IF;
    
    -- Set tenant_id if not provided or override if different
    NEW.tenant_id := current_tenant_id;
    
    -- Generate customer number if not provided
    IF NEW.customer_number IS NULL OR NEW.customer_number = '' THEN
        NEW.customer_number := public.generate_customer_number_simple();
    END IF;
    
    -- Set created_by if not provided
    IF NEW.created_by IS NULL THEN
        NEW.created_by := auth.uid();
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS ensure_customer_tenant_id_trigger ON public.customers;
CREATE TRIGGER ensure_customer_tenant_id_trigger
    BEFORE INSERT ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_customer_tenant_id();

-- Add a function to validate customer data before insertion
CREATE OR REPLACE FUNCTION public.validate_customer_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Validate required fields
    IF NEW.name IS NULL OR TRIM(NEW.name) = '' THEN
        RAISE EXCEPTION 'اسم العميل مطلوب';
    END IF;
    
    IF NEW.customer_type IS NULL THEN
        RAISE EXCEPTION 'نوع العميل مطلوب';
    END IF;
    
    -- Validate customer type
    IF NEW.customer_type NOT IN ('individual', 'company') THEN
        RAISE EXCEPTION 'نوع العميل يجب أن يكون "individual" أو "company"';
    END IF;
    
    -- Additional validation for company type
    IF NEW.customer_type = 'company' AND (NEW.company_name IS NULL OR TRIM(NEW.company_name) = '') THEN
        RAISE EXCEPTION 'اسم الشركة مطلوب للعملاء من نوع شركة';
    END IF;
    
    -- Validate phone number format (basic validation)
    IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
        IF NOT (NEW.phone ~ '^[\+]?[0-9\-\(\)\s]+$') THEN
            RAISE EXCEPTION 'رقم الهاتف غير صالح';
        END IF;
    END IF;
    
    -- Validate email format (basic validation)
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        IF NOT (NEW.email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
            RAISE EXCEPTION 'البريد الإلكتروني غير صالح';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create validation trigger
DROP TRIGGER IF EXISTS validate_customer_before_insert_trigger ON public.customers;
CREATE TRIGGER validate_customer_before_insert_trigger
    BEFORE INSERT ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_customer_before_insert();