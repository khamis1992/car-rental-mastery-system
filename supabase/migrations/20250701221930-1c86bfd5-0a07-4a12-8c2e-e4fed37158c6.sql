-- إنشاء جدول الأصول الثابتة
CREATE TABLE public.fixed_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_code TEXT NOT NULL UNIQUE,
  asset_name TEXT NOT NULL,
  asset_category TEXT NOT NULL,
  description TEXT,
  purchase_date DATE NOT NULL,
  purchase_cost NUMERIC NOT NULL,
  useful_life_years INTEGER NOT NULL,
  residual_value NUMERIC DEFAULT 0,
  depreciation_method TEXT NOT NULL DEFAULT 'straight_line',
  accumulated_depreciation NUMERIC DEFAULT 0,
  book_value NUMERIC NOT NULL,
  location TEXT,
  supplier_name TEXT,
  invoice_number TEXT,
  serial_number TEXT,
  warranty_expiry DATE,
  status TEXT NOT NULL DEFAULT 'active',
  disposal_date DATE,
  disposal_amount NUMERIC,
  disposal_reason TEXT,
  account_id UUID REFERENCES public.chart_of_accounts(id),
  accumulated_depreciation_account_id UUID REFERENCES public.chart_of_accounts(id),
  depreciation_expense_account_id UUID REFERENCES public.chart_of_accounts(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- إنشاء جدول الاستهلاك
CREATE TABLE public.asset_depreciation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.fixed_assets(id),
  depreciation_date DATE NOT NULL,
  depreciation_amount NUMERIC NOT NULL,
  accumulated_depreciation NUMERIC NOT NULL,
  book_value NUMERIC NOT NULL,
  method_used TEXT NOT NULL,
  period_months INTEGER NOT NULL DEFAULT 12,
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- إنشاء جدول فئات الأصول
CREATE TABLE public.asset_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE,
  default_useful_life INTEGER NOT NULL,
  default_depreciation_method TEXT NOT NULL DEFAULT 'straight_line',
  default_residual_rate NUMERIC DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_depreciation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS للأصول الثابتة
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة الأصول الثابتة" 
ON public.fixed_assets 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "الموظفون يمكنهم رؤية الأصول الثابتة" 
ON public.fixed_assets 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role) OR has_role(auth.uid(), 'receptionist'::user_role));

-- إنشاء سياسات RLS للاستهلاك
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة الاستهلاك" 
ON public.asset_depreciation 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- إنشاء سياسات RLS لفئات الأصول
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة فئات الأصول" 
ON public.asset_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- دالة لتوليد رقم الأصل
CREATE OR REPLACE FUNCTION public.generate_asset_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  asset_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(asset_code FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.fixed_assets
  WHERE asset_code ~ '^AST[0-9]+$';
  
  asset_code := 'AST' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN asset_code;
END;
$$;

-- دالة لحساب الاستهلاك الشهري
CREATE OR REPLACE FUNCTION public.calculate_monthly_depreciation(
  asset_cost NUMERIC,
  residual_value NUMERIC,
  useful_life_years INTEGER,
  method TEXT DEFAULT 'straight_line'
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  monthly_depreciation NUMERIC;
  depreciable_amount NUMERIC;
BEGIN
  depreciable_amount := asset_cost - residual_value;
  
  CASE method
    WHEN 'straight_line' THEN
      monthly_depreciation := depreciable_amount / (useful_life_years * 12);
    WHEN 'declining_balance' THEN
      -- طريقة الرصيد المتناقص (200% declining balance)
      monthly_depreciation := (asset_cost * 2 / useful_life_years) / 12;
    ELSE
      monthly_depreciation := depreciable_amount / (useful_life_years * 12);
  END CASE;
  
  RETURN ROUND(monthly_depreciation, 3);
END;
$$;

-- دالة لحساب القيمة الدفترية
CREATE OR REPLACE FUNCTION public.calculate_book_value(
  asset_cost NUMERIC,
  accumulated_depreciation NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN GREATEST(asset_cost - accumulated_depreciation, 0);
END;
$$;

-- دالة لإنشاء قيد الاستهلاك الشهري
CREATE OR REPLACE FUNCTION public.create_depreciation_entries()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  asset_record RECORD;
  depreciation_amount NUMERIC;
  entry_id UUID;
  entries_created INTEGER := 0;
  current_month TEXT;
  current_year TEXT;
BEGIN
  current_month := TO_CHAR(CURRENT_DATE, 'MM');
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  FOR asset_record IN 
    SELECT * FROM public.fixed_assets 
    WHERE status = 'active' 
    AND purchase_date <= CURRENT_DATE
    AND accumulated_depreciation < (purchase_cost - residual_value)
  LOOP
    -- حساب الاستهلاك الشهري
    depreciation_amount := public.calculate_monthly_depreciation(
      asset_record.purchase_cost,
      asset_record.residual_value,
      asset_record.useful_life_years,
      asset_record.depreciation_method
    );
    
    -- التحقق من عدم تجاوز القيمة القابلة للاستهلاك
    IF asset_record.accumulated_depreciation + depreciation_amount > 
       (asset_record.purchase_cost - asset_record.residual_value) THEN
      depreciation_amount := (asset_record.purchase_cost - asset_record.residual_value) - asset_record.accumulated_depreciation;
    END IF;
    
    IF depreciation_amount > 0 THEN
      -- إنشاء قيد محاسبي للاستهلاك
      INSERT INTO public.journal_entries (
        entry_date,
        description,
        reference_type,
        reference_id,
        total_debit,
        total_credit,
        status
      ) VALUES (
        CURRENT_DATE,
        'استهلاك شهري - ' || asset_record.asset_name || ' - ' || current_month || '/' || current_year,
        'depreciation',
        asset_record.id,
        depreciation_amount,
        depreciation_amount,
        'posted'
      ) RETURNING id INTO entry_id;
      
      -- إضافة سطور القيد
      INSERT INTO public.journal_entry_lines (
        journal_entry_id,
        account_id,
        description,
        debit_amount,
        credit_amount,
        line_number
      ) VALUES 
      (entry_id, asset_record.depreciation_expense_account_id, 'مصروف استهلاك - ' || asset_record.asset_name, depreciation_amount, 0, 1),
      (entry_id, asset_record.accumulated_depreciation_account_id, 'مجمع استهلاك - ' || asset_record.asset_name, 0, depreciation_amount, 2);
      
      -- تسجيل الاستهلاك
      INSERT INTO public.asset_depreciation (
        asset_id,
        depreciation_date,
        depreciation_amount,
        accumulated_depreciation,
        book_value,
        method_used,
        journal_entry_id
      ) VALUES (
        asset_record.id,
        CURRENT_DATE,
        depreciation_amount,
        asset_record.accumulated_depreciation + depreciation_amount,
        public.calculate_book_value(asset_record.purchase_cost, asset_record.accumulated_depreciation + depreciation_amount),
        asset_record.depreciation_method,
        entry_id
      );
      
      -- تحديث الأصل
      UPDATE public.fixed_assets 
      SET 
        accumulated_depreciation = accumulated_depreciation + depreciation_amount,
        book_value = public.calculate_book_value(purchase_cost, accumulated_depreciation + depreciation_amount),
        updated_at = now()
      WHERE id = asset_record.id;
      
      entries_created := entries_created + 1;
    END IF;
  END LOOP;
  
  RETURN entries_created;
END;
$$;

-- إدراج فئات الأصول الافتراضية
INSERT INTO public.asset_categories (category_name, default_useful_life, default_depreciation_method, description) VALUES
('مركبات', 5, 'straight_line', 'السيارات والمركبات'),
('أثاث ومعدات مكتبية', 10, 'straight_line', 'الأثاث والمعدات المكتبية'),
('أجهزة كمبيوتر', 3, 'straight_line', 'أجهزة الكمبيوتر والتقنية'),
('مباني', 25, 'straight_line', 'المباني والمنشآت'),
('معدات', 7, 'straight_line', 'المعدات والآلات');