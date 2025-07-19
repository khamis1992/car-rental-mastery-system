
-- إضافة جدول إعدادات مستويات الحسابات
CREATE TABLE IF NOT EXISTS public.chart_of_accounts_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    max_account_levels INTEGER NOT NULL DEFAULT 5,
    account_code_format JSONB NOT NULL DEFAULT '{"pattern": "hierarchical", "separator": ".", "length_per_level": [2,2,2,2,2]}',
    auto_code_generation BOOLEAN NOT NULL DEFAULT true,
    require_parent_for_level JSONB NOT NULL DEFAULT '{"level_1": false, "level_2": true, "level_3": true, "level_4": true, "level_5": true}',
    level_naming JSONB NOT NULL DEFAULT '{"level_1": "حساب رئيسي", "level_2": "حساب فرعي", "level_3": "حساب تفصيلي", "level_4": "حساب فرعي متقدم", "level_5": "حساب نهائي"}',
    allow_posting_levels JSONB NOT NULL DEFAULT '{"level_1": false, "level_2": false, "level_3": true, "level_4": true, "level_5": true}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    CONSTRAINT fk_chart_settings_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- إضافة جدول قوالب الحسابات المحددة مسبقاً
CREATE TABLE IF NOT EXISTS public.account_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name TEXT NOT NULL,
    template_name_en TEXT,
    business_type TEXT NOT NULL, -- 'rental', 'trading', 'service', 'manufacturing', 'general'
    template_structure JSONB NOT NULL, -- هيكل الحسابات كامل
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_chart_settings_tenant ON public.chart_of_accounts_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_account_templates_business_type ON public.account_templates(business_type);
CREATE INDEX IF NOT EXISTS idx_account_templates_active ON public.account_templates(is_active) WHERE is_active = true;

-- تمكين Row Level Security
ALTER TABLE public.chart_of_accounts_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_templates ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان لإعدادات دليل الحسابات
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة إعدادات دليل الحسابات" ON public.chart_of_accounts_settings
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- إنشاء سياسات الأمان لقوالب الحسابات
CREATE POLICY "الجميع يمكنهم رؤية قوالب الحسابات النشطة" ON public.account_templates
    FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY "المديرون يمكنهم إدارة قوالب الحسابات" ON public.account_templates
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

-- دالة لتوليد رقم الحساب التلقائي
CREATE OR REPLACE FUNCTION public.generate_account_code(
    p_tenant_id UUID,
    p_parent_account_id UUID DEFAULT NULL,
    p_account_type TEXT DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_settings RECORD;
    v_parent_code TEXT := '';
    v_parent_level INTEGER := 0;
    v_new_level INTEGER := 1;
    v_next_sequence INTEGER := 1;
    v_generated_code TEXT;
    v_code_length INTEGER;
BEGIN
    -- الحصول على إعدادات دليل الحسابات
    SELECT * INTO v_settings 
    FROM public.chart_of_accounts_settings 
    WHERE tenant_id = p_tenant_id AND is_active = true
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'إعدادات دليل الحسابات غير موجودة للمؤسسة';
    END IF;
    
    -- إذا كان هناك حساب أب، احصل على معلوماته
    IF p_parent_account_id IS NOT NULL THEN
        SELECT account_code, level INTO v_parent_code, v_parent_level
        FROM public.chart_of_accounts
        WHERE id = p_parent_account_id AND tenant_id = p_tenant_id;
        
        v_new_level := v_parent_level + 1;
        
        -- التحقق من أن المستوى الجديد لا يتجاوز الحد الأقصى
        IF v_new_level > v_settings.max_account_levels THEN
            RAISE EXCEPTION 'تجاوز الحد الأقصى لمستويات الحسابات: %', v_settings.max_account_levels;
        END IF;
    END IF;
    
    -- تحديد طول الكود للمستوى الجديد
    v_code_length := (v_settings.account_code_format->>'length_per_level')::jsonb->(v_new_level-1)::text;
    IF v_code_length IS NULL THEN
        v_code_length := 2; -- افتراضي
    END IF;
    
    -- العثور على الرقم التسلسلي التالي
    IF p_parent_account_id IS NULL THEN
        -- للمستوى الأول
        SELECT COALESCE(MAX(CAST(account_code AS INTEGER)), 0) + 1 INTO v_next_sequence
        FROM public.chart_of_accounts
        WHERE tenant_id = p_tenant_id 
        AND parent_account_id IS NULL 
        AND account_code ~ '^[0-9]+$';
    ELSE
        -- للمستويات الفرعية
        SELECT COUNT(*) + 1 INTO v_next_sequence
        FROM public.chart_of_accounts
        WHERE tenant_id = p_tenant_id 
        AND parent_account_id = p_parent_account_id;
    END IF;
    
    -- توليد الكود
    IF p_parent_account_id IS NULL THEN
        v_generated_code := LPAD(v_next_sequence::TEXT, v_code_length, '0');
    ELSE
        v_generated_code := v_parent_code || 
                           (v_settings.account_code_format->>'separator') || 
                           LPAD(v_next_sequence::TEXT, v_code_length, '0');
    END IF;
    
    -- التحقق من عدم وجود تكرار
    WHILE EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = p_tenant_id AND account_code = v_generated_code
    ) LOOP
        v_next_sequence := v_next_sequence + 1;
        IF p_parent_account_id IS NULL THEN
            v_generated_code := LPAD(v_next_sequence::TEXT, v_code_length, '0');
        ELSE
            v_generated_code := v_parent_code || 
                               (v_settings.account_code_format->>'separator') || 
                               LPAD(v_next_sequence::TEXT, v_code_length, '0');
        END IF;
    END LOOP;
    
    RETURN v_generated_code;
END;
$$;

-- دالة للتحقق من صحة هيكل الحساب
CREATE OR REPLACE FUNCTION public.validate_account_structure(
    p_tenant_id UUID,
    p_account_code TEXT,
    p_parent_account_id UUID DEFAULT NULL,
    p_level INTEGER DEFAULT 1
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_settings RECORD;
    v_validation_result JSONB := '{"valid": true, "errors": []}'::jsonb;
    v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- الحصول على إعدادات دليل الحسابات
    SELECT * INTO v_settings 
    FROM public.chart_of_accounts_settings 
    WHERE tenant_id = p_tenant_id AND is_active = true
    LIMIT 1;
    
    IF NOT FOUND THEN
        v_errors := array_append(v_errors, 'إعدادات دليل الحسابات غير موجودة');
        RETURN jsonb_build_object('valid', false, 'errors', v_errors);
    END IF;
    
    -- التحقق من المستوى
    IF p_level > v_settings.max_account_levels THEN
        v_errors := array_append(v_errors, 'تجاوز الحد الأقصى لمستويات الحسابات');
    END IF;
    
    -- التحقق من وجود الحساب الأب إذا كان مطلوباً
    IF p_level > 1 AND p_parent_account_id IS NULL THEN
        IF (v_settings.require_parent_for_level->('level_' || p_level))::boolean = true THEN
            v_errors := array_append(v_errors, 'الحساب الأب مطلوب لهذا المستوى');
        END IF;
    END IF;
    
    -- التحقق من تكرار رقم الحساب
    IF EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = p_tenant_id AND account_code = p_account_code
    ) THEN
        v_errors := array_append(v_errors, 'رقم الحساب موجود مسبقاً');
    END IF;
    
    -- إرجاع النتيجة
    IF array_length(v_errors, 1) > 0 THEN
        RETURN jsonb_build_object('valid', false, 'errors', v_errors);
    ELSE
        RETURN jsonb_build_object('valid', true, 'errors', v_errors);
    END IF;
END;
$$;

-- إدراج الإعدادات الافتراضية لجميع المؤسسات الموجودة
INSERT INTO public.chart_of_accounts_settings (tenant_id, max_account_levels, account_code_format, auto_code_generation)
SELECT 
    id as tenant_id,
    5 as max_account_levels,
    '{"pattern": "hierarchical", "separator": ".", "length_per_level": [2,2,2,2,2]}'::jsonb as account_code_format,
    true as auto_code_generation
FROM public.tenants 
WHERE id NOT IN (SELECT tenant_id FROM public.chart_of_accounts_settings)
AND status = 'active';

-- إدراج قوالب الحسابات الأساسية
INSERT INTO public.account_templates (template_name, template_name_en, business_type, template_structure, description) VALUES
('نموذج شركة تأجير السيارات', 'Car Rental Company Template', 'rental', 
'{"accounts": [
  {"code": "1", "name": "الأصول", "type": "asset", "level": 1},
  {"code": "2", "name": "الخصوم", "type": "liability", "level": 1},
  {"code": "3", "name": "حقوق الملكية", "type": "equity", "level": 1},
  {"code": "4", "name": "الإيرادات", "type": "revenue", "level": 1},
  {"code": "5", "name": "المصروفات", "type": "expense", "level": 1}
]}', 'نموذج محاسبي مصمم خصيصاً لشركات تأجير السيارات'),

('نموذج الشركة التجارية', 'Trading Company Template', 'trading',
'{"accounts": [
  {"code": "1", "name": "الأصول", "type": "asset", "level": 1},
  {"code": "2", "name": "الخصوم", "type": "liability", "level": 1},
  {"code": "3", "name": "حقوق الملكية", "type": "equity", "level": 1},
  {"code": "4", "name": "الإيرادات", "type": "revenue", "level": 1},
  {"code": "5", "name": "تكلفة البضاعة المباعة", "type": "expense", "level": 1},
  {"code": "6", "name": "المصروفات", "type": "expense", "level": 1}
]}', 'نموذج محاسبي للشركات التجارية'),

('النموذج العام', 'General Template', 'general',
'{"accounts": [
  {"code": "1", "name": "الأصول", "type": "asset", "level": 1},
  {"code": "2", "name": "الخصوم", "type": "liability", "level": 1},
  {"code": "3", "name": "حقوق الملكية", "type": "equity", "level": 1},
  {"code": "4", "name": "الإيرادات", "type": "revenue", "level": 1},
  {"code": "5", "name": "المصروفات", "type": "expense", "level": 1}
]}', 'نموذج محاسبي عام يناسب معظم أنواع الأعمال');
