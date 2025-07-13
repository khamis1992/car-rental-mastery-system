-- المرحلة الأولى: الجزء الرابع - الدوال المساعدة والبيانات الافتراضية

-- إضافة العملة الأساسية KWD لجميع المؤسسات
INSERT INTO public.currencies (tenant_id, currency_code, currency_name_ar, currency_name_en, symbol, base_currency, exchange_rate)
SELECT 
  t.id,
  'KWD',
  'دينار كويتي',
  'Kuwaiti Dinar',
  'د.ك',
  true,
  1.0
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.currencies c 
  WHERE c.tenant_id = t.id AND c.currency_code = 'KWD'
);

-- إضافة إعدادات افتراضية للمحاسبة الكويتية
INSERT INTO public.advanced_accounting_settings (tenant_id, setting_category, setting_key, setting_value, setting_description)
SELECT 
  t.id,
  'depreciation',
  'default_method',
  '"straight_line"'::jsonb,
  'طريقة الإهلاك الافتراضية'
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.advanced_accounting_settings aas 
  WHERE aas.tenant_id = t.id AND aas.setting_key = 'default_method'
);

-- إضافة إعدادات ضريبة القيمة المضافة
INSERT INTO public.advanced_accounting_settings (tenant_id, setting_category, setting_key, setting_value, setting_description)
SELECT 
  t.id,
  'vat',
  'default_rate',
  '0'::jsonb,
  'معدل ضريبة القيمة المضافة الافتراضي'
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.advanced_accounting_settings aas 
  WHERE aas.tenant_id = t.id AND aas.setting_category = 'vat' AND aas.setting_key = 'default_rate'
);

-- إضافة إعدادات الزكاة
INSERT INTO public.advanced_accounting_settings (tenant_id, setting_category, setting_key, setting_value, setting_description)
SELECT 
  t.id,
  'zakat',
  'calculation_method',
  '"net_worth"'::jsonb,
  'طريقة حساب الزكاة'
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.advanced_accounting_settings aas 
  WHERE aas.tenant_id = t.id AND aas.setting_category = 'zakat'
);

-- دوال مساعدة لإدارة أرقام المستندات
CREATE OR REPLACE FUNCTION public.get_next_document_number(
  p_tenant_id UUID,
  p_document_type TEXT,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sequence RECORD;
  v_next_number INTEGER;
  v_formatted_number TEXT;
  v_current_year INTEGER;
  v_current_month INTEGER;
BEGIN
  -- الحصول على السنة والشهر الحاليين
  v_current_year := EXTRACT(YEAR FROM now());
  v_current_month := EXTRACT(MONTH FROM now());
  
  -- البحث عن تسلسل المستند
  SELECT * INTO v_sequence
  FROM public.document_sequences
  WHERE tenant_id = p_tenant_id
    AND document_type = p_document_type
    AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    AND is_active = true;
  
  IF NOT FOUND THEN
    -- إنشاء تسلسل جديد إذا لم يوجد
    INSERT INTO public.document_sequences (
      tenant_id, document_type, branch_id, current_number
    ) VALUES (
      p_tenant_id, p_document_type, p_branch_id, 1
    ) RETURNING * INTO v_sequence;
    
    v_next_number := 1;
  ELSE
    -- فحص إعادة التعيين السنوي أو الشهري
    IF (v_sequence.reset_annually AND 
        (v_sequence.last_reset IS NULL OR 
         EXTRACT(YEAR FROM v_sequence.last_reset) < v_current_year)) OR
       (v_sequence.reset_monthly AND 
        (v_sequence.last_reset IS NULL OR 
         DATE_TRUNC('month', v_sequence.last_reset) < DATE_TRUNC('month', now()))) THEN
      
      -- إعادة تعيين الرقم
      v_next_number := 1;
      
      UPDATE public.document_sequences
      SET current_number = v_next_number + 1,
          last_reset = CURRENT_DATE
      WHERE id = v_sequence.id;
    ELSE
      -- استخدام الرقم التالي
      v_next_number := v_sequence.current_number;
      
      UPDATE public.document_sequences
      SET current_number = current_number + 1
      WHERE id = v_sequence.id;
    END IF;
  END IF;
  
  -- تنسيق الرقم
  v_formatted_number := v_sequence.prefix || 
                       LPAD(v_next_number::TEXT, v_sequence.padding_length, '0') || 
                       v_sequence.suffix;
  
  RETURN v_formatted_number;
END;
$$;