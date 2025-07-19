-- إنشاء الدوال المحاسبية للتكامل المتقدم

-- دالة إنشاء قيد محاسبي لتكاليف المركبات
CREATE OR REPLACE FUNCTION public.create_vehicle_cost_journal_entry(
    vehicle_cost_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cost_record RECORD;
    entry_id UUID;
    entry_number TEXT;
    expense_account_id UUID;
    credit_account_id UUID;
BEGIN
    -- جلب بيانات التكلفة
    SELECT * INTO cost_record
    FROM public.vehicle_costs
    WHERE id = vehicle_cost_id;
    
    IF cost_record IS NULL THEN
        RAISE EXCEPTION 'تكلفة المركبة غير موجودة';
    END IF;
    
    -- توليد رقم القيد
    SELECT 'JE-VEH-' || to_char(now(), 'YYYY') || '-' || LPAD(
        (COALESCE(MAX(CAST(SUBSTRING(entry_number FROM '\d+$') AS INTEGER)), 0) + 1)::TEXT,
        6, '0'
    ) INTO entry_number
    FROM public.journal_entries
    WHERE tenant_id = cost_record.tenant_id
    AND entry_number ~ '^JE-VEH-\d{4}-\d+$';
    
    -- تحديد الحسابات بناءً على نوع التكلفة
    CASE cost_record.cost_type
        WHEN 'fuel' THEN
            -- حساب مصروفات الوقود
            SELECT id INTO expense_account_id
            FROM public.chart_of_accounts
            WHERE tenant_id = cost_record.tenant_id AND account_code LIKE '5101%' LIMIT 1;
        WHEN 'maintenance' THEN
            -- حساب مصروفات الصيانة
            SELECT id INTO expense_account_id
            FROM public.chart_of_accounts
            WHERE tenant_id = cost_record.tenant_id AND account_code LIKE '5102%' LIMIT 1;
        WHEN 'insurance' THEN
            -- حساب مصروفات التأمين
            SELECT id INTO expense_account_id
            FROM public.chart_of_accounts
            WHERE tenant_id = cost_record.tenant_id AND account_code LIKE '5103%' LIMIT 1;
        ELSE
            -- مصروفات أخرى
            SELECT id INTO expense_account_id
            FROM public.chart_of_accounts
            WHERE tenant_id = cost_record.tenant_id AND account_code LIKE '51%' LIMIT 1;
    END CASE;
    
    -- حساب النقدية أو الذمم الدائنة
    IF cost_record.supplier_id IS NOT NULL THEN
        -- ذمم دائنة
        SELECT id INTO credit_account_id
        FROM public.chart_of_accounts
        WHERE tenant_id = cost_record.tenant_id AND account_code LIKE '211%' LIMIT 1;
    ELSE
        -- نقدية
        SELECT id INTO credit_account_id
        FROM public.chart_of_accounts
        WHERE tenant_id = cost_record.tenant_id AND account_code LIKE '1110101%' LIMIT 1;
    END IF;
    
    -- إنشاء القيد المحاسبي
    INSERT INTO public.journal_entries (
        tenant_id, entry_number, entry_date, reference_type, reference_id,
        description, total_debit, total_credit, status, created_by
    ) VALUES (
        cost_record.tenant_id, entry_number, cost_record.cost_date,
        'vehicle_cost', vehicle_cost_id, 
        'تكلفة ' || cost_record.cost_type || ' للمركبة - ' || cost_record.description,
        cost_record.amount, cost_record.amount, 'posted', cost_record.created_by
    ) RETURNING id INTO entry_id;
    
    -- إضافة بنود القيد
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount,
        cost_center_id, created_at
    ) VALUES 
    (entry_id, expense_account_id, cost_record.description, cost_record.amount, 0, cost_record.cost_center_id, now()),
    (entry_id, credit_account_id, cost_record.description, 0, cost_record.amount, cost_record.cost_center_id, now());
    
    -- تحديث سجل التكلفة
    UPDATE public.vehicle_costs
    SET journal_entry_id = entry_id, updated_at = now()
    WHERE id = vehicle_cost_id;
    
    RETURN entry_id;
END;
$$;

-- دالة حساب الإهلاك الشهري للمركبات
CREATE OR REPLACE FUNCTION public.calculate_monthly_vehicle_depreciation(
    target_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    vehicle_record RECORD;
    monthly_depreciation NUMERIC(15,3);
    accumulated_depreciation NUMERIC(15,3);
    book_value NUMERIC(15,3);
    processed_count INTEGER := 0;
    entry_id UUID;
BEGIN
    -- حساب الإهلاك لجميع المركبات النشطة
    FOR vehicle_record IN (
        SELECT v.*, fa.purchase_cost, fa.useful_life_years, fa.residual_value
        FROM public.vehicles v
        JOIN public.fixed_assets fa ON v.id = fa.id
        WHERE v.status = 'active'
        AND fa.status = 'active'
        AND fa.purchase_date <= target_month
    ) LOOP
        -- حساب الإهلاك الشهري
        monthly_depreciation := (vehicle_record.purchase_cost - COALESCE(vehicle_record.residual_value, 0)) 
                               / (vehicle_record.useful_life_years * 12);
        
        -- حساب الإهلاك المتراكم
        SELECT COALESCE(SUM(monthly_depreciation), 0) INTO accumulated_depreciation
        FROM public.vehicle_depreciation_schedule
        WHERE vehicle_id = vehicle_record.id
        AND depreciation_date < target_month;
        
        accumulated_depreciation := accumulated_depreciation + monthly_depreciation;
        book_value := vehicle_record.purchase_cost - accumulated_depreciation;
        
        -- التحقق من عدم وجود إهلاك مسجل لنفس الشهر
        IF NOT EXISTS (
            SELECT 1 FROM public.vehicle_depreciation_schedule
            WHERE vehicle_id = vehicle_record.id
            AND depreciation_date = target_month
        ) THEN
            -- إدراج جدولة الإهلاك
            INSERT INTO public.vehicle_depreciation_schedule (
                vehicle_id, depreciation_date, monthly_depreciation,
                accumulated_depreciation, book_value, tenant_id
            ) VALUES (
                vehicle_record.id, target_month, monthly_depreciation,
                accumulated_depreciation, book_value, vehicle_record.tenant_id
            );
            
            processed_count := processed_count + 1;
        END IF;
    END LOOP;
    
    RETURN processed_count;
END;
$$;

-- دالة إنشاء قيد إهلاك المركبات
CREATE OR REPLACE FUNCTION public.create_depreciation_journal_entries(
    target_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    depreciation_record RECORD;
    entry_id UUID;
    entry_number TEXT;
    depreciation_expense_account UUID;
    accumulated_depreciation_account UUID;
    processed_count INTEGER := 0;
BEGIN
    -- معالجة جميع سجلات الإهلاك غير المعالجة
    FOR depreciation_record IN (
        SELECT vds.*, v.license_plate, v.tenant_id
        FROM public.vehicle_depreciation_schedule vds
        JOIN public.vehicles v ON vds.vehicle_id = v.id
        WHERE vds.depreciation_date = target_month
        AND vds.is_processed = false
        AND vds.monthly_depreciation > 0
    ) LOOP
        -- البحث عن حساب مصروفات الإهلاك
        SELECT id INTO depreciation_expense_account
        FROM public.chart_of_accounts
        WHERE tenant_id = depreciation_record.tenant_id
        AND account_code LIKE '5104%' LIMIT 1;
        
        -- البحث عن حساب مجمع الإهلاك
        SELECT id INTO accumulated_depreciation_account
        FROM public.chart_of_accounts
        WHERE tenant_id = depreciation_record.tenant_id
        AND account_code LIKE '12401%' LIMIT 1;
        
        -- توليد رقم القيد
        SELECT 'JE-DEP-' || to_char(target_month, 'YYYY-MM') || '-' || LPAD(
            (processed_count + 1)::TEXT, 4, '0'
        ) INTO entry_number;
        
        -- إنشاء القيد المحاسبي
        INSERT INTO public.journal_entries (
            tenant_id, entry_number, entry_date, reference_type, reference_id,
            description, total_debit, total_credit, status
        ) VALUES (
            depreciation_record.tenant_id, entry_number, target_month,
            'vehicle_depreciation', depreciation_record.id,
            'إهلاك شهري للمركبة ' || depreciation_record.license_plate,
            depreciation_record.monthly_depreciation, depreciation_record.monthly_depreciation,
            'posted'
        ) RETURNING id INTO entry_id;
        
        -- إضافة بنود القيد
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount
        ) VALUES 
        (entry_id, depreciation_expense_account, 'مصروف إهلاك شهري', depreciation_record.monthly_depreciation, 0),
        (entry_id, accumulated_depreciation_account, 'مجمع إهلاك المركبات', 0, depreciation_record.monthly_depreciation);
        
        -- تحديث حالة المعالجة
        UPDATE public.vehicle_depreciation_schedule
        SET is_processed = true, journal_entry_id = entry_id
        WHERE id = depreciation_record.id;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN processed_count;
END;
$$;

-- دالة تحديث رصيد المورد
CREATE OR REPLACE FUNCTION public.update_supplier_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    current_balance NUMERIC(15,3) := 0;
BEGIN
    -- حساب الرصيد الجاري للمورد
    SELECT COALESCE(SUM(credit_amount - debit_amount), 0)
    INTO current_balance
    FROM public.supplier_ledger
    WHERE supplier_id = NEW.supplier_id
    AND transaction_date <= NEW.transaction_date
    AND id <= NEW.id;
    
    -- تحديث الرصيد الجاري للسجل الحالي
    NEW.running_balance := current_balance;
    
    -- تحديث رصيد المورد في جدول الموردين
    UPDATE public.supplier_accounting
    SET current_balance = current_balance, updated_at = now()
    WHERE id = NEW.supplier_id;
    
    RETURN NEW;
END;
$$;

-- إنشاء تريجر تحديث رصيد المورد
DROP TRIGGER IF EXISTS trigger_update_supplier_balance ON public.supplier_ledger;
CREATE TRIGGER trigger_update_supplier_balance
    BEFORE INSERT OR UPDATE ON public.supplier_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.update_supplier_balance();

-- دالة تحديث قيمة المخزون
CREATE OR REPLACE FUNCTION public.update_inventory_value()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    current_quantity NUMERIC(15,3) := 0;
    avg_cost NUMERIC(15,3) := 0;
BEGIN
    -- حساب الكمية الحالية
    SELECT COALESCE(SUM(
        CASE 
            WHEN movement_type IN ('purchase', 'transfer_in', 'adjustment_positive') THEN quantity
            WHEN movement_type IN ('sale', 'transfer_out', 'adjustment_negative', 'maintenance_issue') THEN -quantity
            ELSE 0
        END
    ), 0) INTO current_quantity
    FROM public.inventory_movements
    WHERE inventory_item_id = NEW.inventory_item_id
    AND movement_date <= NEW.movement_date
    AND id <= NEW.id;
    
    -- حساب متوسط التكلفة (FIFO مبسط)
    SELECT COALESCE(AVG(unit_cost), 0) INTO avg_cost
    FROM public.inventory_movements
    WHERE inventory_item_id = NEW.inventory_item_id
    AND movement_type = 'purchase'
    AND unit_cost > 0;
    
    -- تحديث المخزون
    UPDATE public.inventory_accounting
    SET 
        quantity_on_hand = current_quantity,
        unit_cost = CASE WHEN avg_cost > 0 THEN avg_cost ELSE unit_cost END,
        last_updated = now()
    WHERE id = NEW.inventory_item_id;
    
    RETURN NEW;
END;
$$;

-- إنشاء تريجر تحديث قيمة المخزون
DROP TRIGGER IF EXISTS trigger_update_inventory_value ON public.inventory_movements;
CREATE TRIGGER trigger_update_inventory_value
    AFTER INSERT OR UPDATE ON public.inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_inventory_value();