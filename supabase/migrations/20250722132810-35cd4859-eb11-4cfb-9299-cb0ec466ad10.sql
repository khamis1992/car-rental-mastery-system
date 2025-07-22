
-- المرحلة الأولى: تحديث قاعدة البيانات لنظام استهلاك المركبات الشامل

-- 1. إضافة جدول جدولة الاستهلاك للمركبات
CREATE TABLE IF NOT EXISTS public.vehicle_depreciation_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  depreciation_date DATE NOT NULL,
  monthly_depreciation NUMERIC(15,3) NOT NULL DEFAULT 0,
  accumulated_depreciation NUMERIC(15,3) NOT NULL DEFAULT 0,
  book_value NUMERIC(15,3) NOT NULL DEFAULT 0,
  is_processed BOOLEAN NOT NULL DEFAULT false,
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  UNIQUE(vehicle_id, depreciation_date)
);

-- 2. إضافة جدول تتبع تكاليف المركبات  
CREATE TABLE IF NOT EXISTS public.vehicle_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  cost_date DATE NOT NULL,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('fuel', 'maintenance', 'insurance', 'registration', 'repairs', 'other')),
  amount NUMERIC(15,3) NOT NULL,
  description TEXT NOT NULL,
  supplier_id UUID,
  invoice_number TEXT,
  odometer_reading INTEGER,
  cost_center_id UUID REFERENCES public.cost_centers(id),
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  attachment_url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('monthly', 'quarterly', 'annually'))
);

-- 3. إضافة جدول إعدادات الاستهلاك
CREATE TABLE IF NOT EXISTS public.depreciation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  auto_calculate_monthly BOOLEAN NOT NULL DEFAULT true,
  auto_post_entries BOOLEAN NOT NULL DEFAULT false,
  depreciation_day_of_month INTEGER NOT NULL DEFAULT 1 CHECK (depreciation_day_of_month BETWEEN 1 AND 28),
  default_useful_life_years INTEGER NOT NULL DEFAULT 5,
  default_residual_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  notification_before_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 4. إضافة جدول تقارير الاستهلاك
CREATE TABLE IF NOT EXISTS public.depreciation_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('monthly', 'annual', 'custom')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}',
  total_depreciation NUMERIC(15,3) NOT NULL DEFAULT 0,
  vehicles_count INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generated_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'archived'))
);

-- 5. تمكين RLS على الجداول الجديدة
ALTER TABLE public.vehicle_depreciation_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depreciation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depreciation_reports ENABLE ROW LEVEL SECURITY;

-- 6. إنشاء سياسات RLS
CREATE POLICY "المحاسبون يمكنهم إدارة جدولة الاستهلاك" 
ON public.vehicle_depreciation_schedule FOR ALL 
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']));

CREATE POLICY "المحاسبون يمكنهم إدارة تكاليف المركبات" 
ON public.vehicle_costs FOR ALL 
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']));

CREATE POLICY "المحاسبون يمكنهم إدارة إعدادات الاستهلاك" 
ON public.depreciation_settings FOR ALL 
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']));

CREATE POLICY "المحاسبون يمكنهم إدارة تقارير الاستهلاك" 
ON public.depreciation_reports FOR ALL 
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']));

-- 7. إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_vehicle_depreciation_schedule_vehicle_date 
ON public.vehicle_depreciation_schedule(vehicle_id, depreciation_date);

CREATE INDEX IF NOT EXISTS idx_vehicle_depreciation_schedule_tenant 
ON public.vehicle_depreciation_schedule(tenant_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_costs_vehicle_date 
ON public.vehicle_costs(vehicle_id, cost_date);

CREATE INDEX IF NOT EXISTS idx_vehicle_costs_type 
ON public.vehicle_costs(cost_type);

CREATE INDEX IF NOT EXISTS idx_vehicle_costs_tenant 
ON public.vehicle_costs(tenant_id);

-- 8. إنشاء دالة حساب الاستهلاك المحسّنة
CREATE OR REPLACE FUNCTION public.calculate_vehicle_monthly_depreciation(
    vehicle_id_param UUID,
    calculation_date DATE DEFAULT CURRENT_DATE
) RETURNS NUMERIC(15,3)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    vehicle_record RECORD;
    monthly_depreciation NUMERIC(15,3) := 0;
    depreciable_amount NUMERIC(15,3);
    months_in_service INTEGER;
BEGIN
    -- جلب بيانات المركبة
    SELECT v.*, fa.purchase_cost, fa.useful_life_years, fa.residual_value, fa.depreciation_method, fa.purchase_date
    INTO vehicle_record
    FROM public.vehicles v
    LEFT JOIN public.fixed_assets fa ON v.asset_id = fa.id
    WHERE v.id = vehicle_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'المركبة غير موجودة';
    END IF;
    
    -- التحقق من وجود بيانات الأصل
    IF vehicle_record.purchase_cost IS NULL THEN
        RETURN 0;
    END IF;
    
    -- حساب المبلغ القابل للاستهلاك
    depreciable_amount := vehicle_record.purchase_cost - COALESCE(vehicle_record.residual_value, 0);
    
    -- حساب الاستهلاك حسب الطريقة
    CASE vehicle_record.depreciation_method
        WHEN 'straight_line' THEN
            monthly_depreciation := depreciable_amount / (vehicle_record.useful_life_years * 12);
        WHEN 'declining_balance' THEN
            -- طريقة الرصيد المتناقص (معدل مضاعف)
            monthly_depreciation := (vehicle_record.purchase_cost * 2 / vehicle_record.useful_life_years) / 12;
        ELSE
            -- افتراضي: القسط الثابت
            monthly_depreciation := depreciable_amount / (vehicle_record.useful_life_years * 12);
    END CASE;
    
    RETURN ROUND(monthly_depreciation, 3);
END;
$$;

-- 9. دالة إنشاء جدولة الاستهلاك التلقائية
CREATE OR REPLACE FUNCTION public.generate_vehicle_depreciation_schedule(
    vehicle_id_param UUID,
    start_date DATE DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    vehicle_record RECORD;
    schedule_date DATE;
    monthly_depreciation NUMERIC(15,3);
    accumulated_depreciation NUMERIC(15,3) := 0;
    book_value NUMERIC(15,3);
    months_to_generate INTEGER;
    records_created INTEGER := 0;
    current_tenant_id UUID;
BEGIN
    current_tenant_id := get_current_tenant_id();
    
    -- جلب بيانات المركبة
    SELECT v.*, fa.purchase_cost, fa.useful_life_years, fa.purchase_date
    INTO vehicle_record
    FROM public.vehicles v
    LEFT JOIN public.fixed_assets fa ON v.asset_id = fa.id
    WHERE v.id = vehicle_id_param AND v.tenant_id = current_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'المركبة غير موجودة';
    END IF;
    
    -- تحديد تاريخ البداية
    IF start_date IS NULL THEN
        start_date := COALESCE(vehicle_record.purchase_date, CURRENT_DATE);
    END IF;
    
    -- حساب الاستهلاك الشهري
    monthly_depreciation := public.calculate_vehicle_monthly_depreciation(vehicle_id_param);
    
    IF monthly_depreciation = 0 THEN
        RETURN 0;
    END IF;
    
    -- حساب عدد الأشهر المطلوب جدولتها
    months_to_generate := vehicle_record.useful_life_years * 12;
    
    -- إنشاء الجدولة
    FOR i IN 0..months_to_generate-1 LOOP
        schedule_date := start_date + INTERVAL '1 month' * i;
        accumulated_depreciation := accumulated_depreciation + monthly_depreciation;
        book_value := vehicle_record.purchase_cost - accumulated_depreciation;
        
        -- التأكد من عدم تجاوز القيمة الدفترية للصفر
        IF book_value < 0 THEN
            book_value := 0;
            monthly_depreciation := vehicle_record.purchase_cost - (accumulated_depreciation - monthly_depreciation);
            accumulated_depreciation := vehicle_record.purchase_cost;
        END IF;
        
        -- إدراج السجل إذا لم يكن موجوداً
        INSERT INTO public.vehicle_depreciation_schedule (
            vehicle_id, depreciation_date, monthly_depreciation,
            accumulated_depreciation, book_value, tenant_id, created_by
        ) VALUES (
            vehicle_id_param, schedule_date, monthly_depreciation,
            accumulated_depreciation, book_value, current_tenant_id, auth.uid()
        ) ON CONFLICT (vehicle_id, depreciation_date) DO NOTHING;
        
        records_created := records_created + 1;
        
        -- إيقاف الحلقة إذا وصلت القيمة الدفترية للصفر
        IF book_value = 0 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN records_created;
END;
$$;

-- 10. دالة معالجة الاستهلاك الشهري
CREATE OR REPLACE FUNCTION public.process_monthly_depreciation(
    target_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    processed_vehicles INTEGER := 0;
    total_depreciation NUMERIC(15,3) := 0;
    entries_created INTEGER := 0;
    schedule_record RECORD;
    entry_id UUID;
    depreciation_expense_account UUID;
    accumulated_depreciation_account UUID;
BEGIN
    current_tenant_id := get_current_tenant_id();
    
    -- البحث عن حسابات الاستهلاك
    SELECT id INTO depreciation_expense_account
    FROM public.chart_of_accounts
    WHERE tenant_id = current_tenant_id 
    AND account_code LIKE '51%' 
    AND account_name ILIKE '%استهلاك%مركبات%'
    LIMIT 1;
    
    SELECT id INTO accumulated_depreciation_account
    FROM public.chart_of_accounts
    WHERE tenant_id = current_tenant_id 
    AND account_code LIKE '124%' 
    AND account_name ILIKE '%مجمع%استهلاك%مركبات%'
    LIMIT 1;
    
    -- معالجة جدولة الاستهلاك للشهر المحدد
    FOR schedule_record IN (
        SELECT vds.*, v.license_plate, v.make, v.model
        FROM public.vehicle_depreciation_schedule vds
        JOIN public.vehicles v ON vds.vehicle_id = v.id
        WHERE vds.tenant_id = current_tenant_id
        AND vds.depreciation_date = target_month
        AND vds.is_processed = false
        AND vds.monthly_depreciation > 0
    ) LOOP
        -- إنشاء قيد محاسبي إذا توفرت الحسابات
        IF depreciation_expense_account IS NOT NULL AND accumulated_depreciation_account IS NOT NULL THEN
            INSERT INTO public.journal_entries (
                tenant_id, entry_number, entry_date, description,
                total_debit, total_credit, status, reference_type, reference_id
            ) VALUES (
                current_tenant_id,
                'DEP-VEH-' || to_char(target_month, 'YYYY-MM') || '-' || LPAD((entries_created + 1)::TEXT, 4, '0'),
                target_month,
                'استهلاك شهري للمركبة ' || schedule_record.license_plate || ' - ' || schedule_record.make || ' ' || schedule_record.model,
                schedule_record.monthly_depreciation,
                schedule_record.monthly_depreciation,
                'posted',
                'vehicle_depreciation',
                schedule_record.id
            ) RETURNING id INTO entry_id;
            
            -- إضافة تفاصيل القيد
            INSERT INTO public.journal_entry_lines (
                journal_entry_id, account_id, description, debit_amount, credit_amount, tenant_id
            ) VALUES 
            (entry_id, depreciation_expense_account, 'مصروف استهلاك شهري - ' || schedule_record.license_plate, schedule_record.monthly_depreciation, 0, current_tenant_id),
            (entry_id, accumulated_depreciation_account, 'مجمع استهلاك المركبات - ' || schedule_record.license_plate, 0, schedule_record.monthly_depreciation, current_tenant_id);
            
            entries_created := entries_created + 1;
        END IF;
        
        -- تحديث حالة المعالجة
        UPDATE public.vehicle_depreciation_schedule
        SET is_processed = true, journal_entry_id = entry_id
        WHERE id = schedule_record.id;
        
        processed_vehicles := processed_vehicles + 1;
        total_depreciation := total_depreciation + schedule_record.monthly_depreciation;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'processed_vehicles', processed_vehicles,
        'total_depreciation', total_depreciation,
        'entries_created', entries_created,
        'target_month', target_month
    );
END;
$$;

-- 11. إدراج إعدادات افتراضية للاستهلاك
INSERT INTO public.depreciation_settings (tenant_id, created_by)
SELECT get_current_tenant_id(), auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM public.depreciation_settings 
    WHERE tenant_id = get_current_tenant_id()
);

-- 12. تحديث جدول المركبات لدعم المعلومات المحاسبية المتقدمة
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS accumulated_depreciation NUMERIC(15,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_book_value NUMERIC(15,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_depreciation_date DATE,
ADD COLUMN IF NOT EXISTS depreciation_status TEXT DEFAULT 'active' CHECK (depreciation_status IN ('active', 'paused', 'completed', 'disposed'));

-- 13. دالة تحديث القيم المحاسبية للمركبة
CREATE OR REPLACE FUNCTION public.update_vehicle_accounting_values()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث القيم المحاسبية للمركبة عند إضافة استهلاك جديد
    UPDATE public.vehicles
    SET 
        accumulated_depreciation = NEW.accumulated_depreciation,
        current_book_value = NEW.book_value,
        last_depreciation_date = NEW.depreciation_date,
        updated_at = now()
    WHERE id = NEW.vehicle_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. إنشاء تريجر تحديث القيم المحاسبية
DROP TRIGGER IF EXISTS trigger_update_vehicle_accounting ON public.vehicle_depreciation_schedule;
CREATE TRIGGER trigger_update_vehicle_accounting
    AFTER INSERT OR UPDATE ON public.vehicle_depreciation_schedule
    FOR EACH ROW
    EXECUTE FUNCTION public.update_vehicle_accounting_values();
