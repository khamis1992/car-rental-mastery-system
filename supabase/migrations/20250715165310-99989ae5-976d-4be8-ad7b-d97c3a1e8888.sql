-- إضافة حقول جديدة لتحسين إدارة الأصول الثابتة
-- إضافة تعيين الموظفين والصيانة والتقارير المتقدمة

-- إضافة حقول جديدة لجدول الأصول الثابتة
ALTER TABLE public.fixed_assets 
ADD COLUMN IF NOT EXISTS assigned_employee_id UUID REFERENCES public.employees(id),
ADD COLUMN IF NOT EXISTS location_description TEXT,
ADD COLUMN IF NOT EXISTS condition_status TEXT DEFAULT 'excellent' CHECK (condition_status IN ('excellent', 'good', 'fair', 'poor', 'needs_repair')),
ADD COLUMN IF NOT EXISTS warranty_end_date DATE,
ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT,
ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE,
ADD COLUMN IF NOT EXISTS maintenance_schedule TEXT DEFAULT 'annual' CHECK (maintenance_schedule IN ('monthly', 'quarterly', 'semi_annual', 'annual', 'biennial')),
ADD COLUMN IF NOT EXISTS last_maintenance_date DATE,
ADD COLUMN IF NOT EXISTS next_maintenance_due DATE,
ADD COLUMN IF NOT EXISTS disposal_date DATE,
ADD COLUMN IF NOT EXISTS disposal_method TEXT CHECK (disposal_method IN ('sold', 'donated', 'scrapped', 'traded')),
ADD COLUMN IF NOT EXISTS disposal_proceeds NUMERIC(15,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS qr_code TEXT,
ADD COLUMN IF NOT EXISTS photos TEXT[],
ADD COLUMN IF NOT EXISTS documents TEXT[],
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- إنشاء جدول تاريخ تعيين الأصول للموظفين
CREATE TABLE IF NOT EXISTS public.asset_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.employees(id),
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    return_date DATE,
    assignment_type TEXT NOT NULL DEFAULT 'permanent' CHECK (assignment_type IN ('permanent', 'temporary', 'project_based')),
    assignment_purpose TEXT,
    assignment_status TEXT NOT NULL DEFAULT 'active' CHECK (assignment_status IN ('active', 'returned', 'transferred')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id)
);

-- إنشاء جدول صيانة الأصول
CREATE TABLE IF NOT EXISTS public.asset_maintenance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
    maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'emergency', 'routine')),
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    performed_by UUID REFERENCES public.employees(id),
    external_provider TEXT,
    cost NUMERIC(15,3) DEFAULT 0,
    description TEXT NOT NULL,
    parts_replaced TEXT[],
    hours_spent NUMERIC(5,2),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    warranty_work BOOLEAN DEFAULT false,
    photos TEXT[],
    documents TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id)
);

-- إنشاء جدول التقييم الدوري للأصول
CREATE TABLE IF NOT EXISTS public.asset_valuations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
    valuation_date DATE NOT NULL,
    valuation_method TEXT NOT NULL CHECK (valuation_method IN ('market_value', 'replacement_cost', 'depreciated_cost', 'professional_appraisal')),
    current_market_value NUMERIC(15,3),
    replacement_cost NUMERIC(15,3),
    appraiser_name TEXT,
    appraiser_license TEXT,
    valuation_report_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id)
);

-- إنشاء جدول عمليات النقل الداخلي للأصول
CREATE TABLE IF NOT EXISTS public.asset_transfers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
    from_employee_id UUID REFERENCES public.employees(id),
    to_employee_id UUID REFERENCES public.employees(id),
    from_location TEXT,
    to_location TEXT,
    transfer_date DATE NOT NULL,
    transfer_reason TEXT NOT NULL,
    approved_by UUID REFERENCES public.employees(id),
    transfer_status TEXT NOT NULL DEFAULT 'pending' CHECK (transfer_status IN ('pending', 'approved', 'completed', 'cancelled')),
    condition_before TEXT,
    condition_after TEXT,
    photos TEXT[],
    documents TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public.employees(id),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id)
);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_asset_assignments_asset_id ON public.asset_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_employee_id ON public.asset_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_status ON public.asset_assignments(assignment_status);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_asset_id ON public.asset_maintenance(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_scheduled_date ON public.asset_maintenance(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_status ON public.asset_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_asset_valuations_asset_id ON public.asset_valuations(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_transfers_asset_id ON public.asset_transfers(asset_id);

-- تمكين Row Level Security
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_transfers ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة تعيينات الأصول" 
ON public.asset_assignments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة صيانة الأصول" 
ON public.asset_maintenance 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة تقييمات الأصول" 
ON public.asset_valuations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة نقل الأصول" 
ON public.asset_transfers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- إنشاء دالة للإهلاك التلقائي المتقدم
CREATE OR REPLACE FUNCTION public.calculate_advanced_depreciation(
    asset_id_param UUID,
    calculation_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
    depreciation_amount NUMERIC,
    accumulated_depreciation NUMERIC,
    book_value NUMERIC,
    method_used TEXT
) AS $$
DECLARE
    asset_record RECORD;
    years_elapsed NUMERIC;
    months_elapsed NUMERIC;
    total_depreciation NUMERIC := 0;
    calculated_amount NUMERIC := 0;
BEGIN
    -- جلب بيانات الأصل
    SELECT * INTO asset_record
    FROM public.fixed_assets
    WHERE id = asset_id_param;
    
    IF asset_record IS NULL THEN
        RAISE EXCEPTION 'Asset not found';
    END IF;
    
    -- حساب الوقت المنقضي
    years_elapsed := EXTRACT(YEAR FROM AGE(calculation_date, asset_record.purchase_date));
    months_elapsed := EXTRACT(YEAR FROM AGE(calculation_date, asset_record.purchase_date)) * 12 + 
                      EXTRACT(MONTH FROM AGE(calculation_date, asset_record.purchase_date));
    
    -- حساب الإهلاك حسب الطريقة
    CASE asset_record.depreciation_method
        WHEN 'straight_line' THEN
            calculated_amount := (asset_record.purchase_cost - COALESCE(asset_record.residual_value, 0)) / 
                               asset_record.useful_life_years;
            total_depreciation := calculated_amount * years_elapsed;
            
        WHEN 'declining_balance' THEN
            -- طريقة الرصيد المتناقص
            calculated_amount := asset_record.purchase_cost * (asset_record.depreciation_rate / 100);
            total_depreciation := asset_record.purchase_cost * 
                                (1 - POWER(1 - (asset_record.depreciation_rate / 100), years_elapsed));
                                
        WHEN 'units_of_production' THEN
            -- طريقة وحدات الإنتاج (للمركبات مثلاً حسب المسافة)
            -- يمكن تخصيصها حسب نوع الأصل
            calculated_amount := (asset_record.purchase_cost - COALESCE(asset_record.residual_value, 0)) * 
                               (years_elapsed / asset_record.useful_life_years);
            total_depreciation := calculated_amount;
            
        ELSE
            -- افتراضي: خط مستقيم
            calculated_amount := (asset_record.purchase_cost - COALESCE(asset_record.residual_value, 0)) / 
                               asset_record.useful_life_years;
            total_depreciation := calculated_amount * years_elapsed;
    END CASE;
    
    -- التأكد من عدم تجاوز القيمة المتبقية
    total_depreciation := LEAST(total_depreciation, 
                               asset_record.purchase_cost - COALESCE(asset_record.residual_value, 0));
    
    RETURN QUERY SELECT 
        calculated_amount,
        total_depreciation,
        asset_record.purchase_cost - total_depreciation,
        asset_record.depreciation_method;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء دالة لتشغيل الإهلاك التلقائي الشهري
CREATE OR REPLACE FUNCTION public.run_monthly_depreciation()
RETURNS INTEGER AS $$
DECLARE
    asset_record RECORD;
    depreciation_result RECORD;
    processed_count INTEGER := 0;
    current_tenant UUID;
BEGIN
    -- معالجة جميع الأصول النشطة
    FOR asset_record IN 
        SELECT * FROM public.fixed_assets 
        WHERE status = 'active' 
        AND purchase_date <= CURRENT_DATE
        AND (disposal_date IS NULL OR disposal_date > CURRENT_DATE)
    LOOP
        -- حساب الإهلاك للأصل
        SELECT * INTO depreciation_result
        FROM public.calculate_advanced_depreciation(asset_record.id, CURRENT_DATE);
        
        -- تحديث الأصل بالقيم الجديدة
        UPDATE public.fixed_assets
        SET 
            accumulated_depreciation = depreciation_result.accumulated_depreciation,
            book_value = depreciation_result.book_value,
            updated_at = now()
        WHERE id = asset_record.id;
        
        -- إدراج سجل إهلاك
        INSERT INTO public.asset_depreciation (
            asset_id, depreciation_amount, accumulated_depreciation, 
            book_value, depreciation_date, method_used, 
            period_months, tenant_id, created_by
        ) VALUES (
            asset_record.id, 
            depreciation_result.depreciation_amount / 12, -- شهري
            depreciation_result.accumulated_depreciation,
            depreciation_result.book_value,
            CURRENT_DATE,
            depreciation_result.method_used,
            1, -- شهر واحد
            asset_record.tenant_id,
            NULL -- تلقائي
        );
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء دالة لتوليد تقرير شامل للأصول
CREATE OR REPLACE FUNCTION public.generate_asset_report(
    report_date DATE DEFAULT CURRENT_DATE,
    report_tenant_id UUID DEFAULT NULL
) RETURNS TABLE (
    asset_id UUID,
    asset_name TEXT,
    asset_code TEXT,
    category TEXT,
    purchase_cost NUMERIC,
    accumulated_depreciation NUMERIC,
    book_value NUMERIC,
    assigned_employee TEXT,
    location_description TEXT,
    condition_status TEXT,
    last_maintenance DATE,
    next_maintenance DATE,
    age_years NUMERIC,
    depreciation_rate_percent NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fa.id,
        fa.asset_name,
        fa.asset_code,
        fa.asset_category,
        fa.purchase_cost,
        fa.accumulated_depreciation,
        fa.book_value,
        COALESCE(e.full_name, 'غير معين') as assigned_employee,
        fa.location_description,
        fa.condition_status,
        fa.last_maintenance_date,
        fa.next_maintenance_due,
        EXTRACT(YEAR FROM AGE(report_date, fa.purchase_date)) as age_years,
        CASE 
            WHEN fa.purchase_cost > 0 THEN 
                (fa.accumulated_depreciation / fa.purchase_cost * 100)
            ELSE 0
        END as depreciation_rate_percent
    FROM public.fixed_assets fa
    LEFT JOIN public.asset_assignments aa ON fa.id = aa.asset_id AND aa.assignment_status = 'active'
    LEFT JOIN public.employees e ON aa.employee_id = e.id
    WHERE fa.status = 'active'
    AND (report_tenant_id IS NULL OR fa.tenant_id = report_tenant_id)
    ORDER BY fa.asset_category, fa.asset_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تعليقات على الجداول والحقول الجديدة
COMMENT ON TABLE public.asset_assignments IS 'تعيين الأصول الثابتة للموظفين';
COMMENT ON TABLE public.asset_maintenance IS 'سجل صيانة الأصول الثابتة';
COMMENT ON TABLE public.asset_valuations IS 'التقييم الدوري للأصول الثابتة';
COMMENT ON TABLE public.asset_transfers IS 'عمليات النقل الداخلي للأصول';

COMMENT ON COLUMN public.fixed_assets.assigned_employee_id IS 'الموظف المسؤول عن الأصل';
COMMENT ON COLUMN public.fixed_assets.condition_status IS 'حالة الأصل الفنية';
COMMENT ON COLUMN public.fixed_assets.maintenance_schedule IS 'جدولة الصيانة الدورية';
COMMENT ON COLUMN public.fixed_assets.barcode IS 'الباركود للأصل';
COMMENT ON COLUMN public.fixed_assets.qr_code IS 'رمز QR للأصل';