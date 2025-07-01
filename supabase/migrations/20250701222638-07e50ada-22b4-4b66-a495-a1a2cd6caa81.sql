-- إنشاء جدول الميزانيات التقديرية
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_name TEXT NOT NULL,
  budget_year INTEGER NOT NULL,
  budget_period TEXT NOT NULL DEFAULT 'annual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_revenue_budget NUMERIC DEFAULT 0,
  total_expense_budget NUMERIC DEFAULT 0,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- إنشاء جدول بنود الميزانية
CREATE TABLE public.budget_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  item_type TEXT NOT NULL, -- revenue, expense
  budgeted_amount NUMERIC NOT NULL,
  q1_amount NUMERIC DEFAULT 0,
  q2_amount NUMERIC DEFAULT 0,
  q3_amount NUMERIC DEFAULT 0,
  q4_amount NUMERIC DEFAULT 0,
  actual_amount NUMERIC DEFAULT 0,
  variance_amount NUMERIC DEFAULT 0,
  variance_percentage NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول تقارير الأداء المالي
CREATE TABLE public.financial_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_type TEXT NOT NULL, -- monthly, quarterly, annual
  period_year INTEGER NOT NULL,
  period_month INTEGER,
  period_quarter INTEGER,
  total_revenue NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  gross_profit NUMERIC DEFAULT 0,
  net_profit NUMERIC DEFAULT 0,
  profit_margin NUMERIC DEFAULT 0,
  revenue_growth NUMERIC DEFAULT 0,
  expense_ratio NUMERIC DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- إنشاء جدول المؤشرات المالية
CREATE TABLE public.financial_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kpi_name TEXT NOT NULL,
  kpi_value NUMERIC NOT NULL,
  kpi_target NUMERIC,
  kpi_unit TEXT DEFAULT 'currency',
  period_date DATE NOT NULL,
  kpi_category TEXT NOT NULL, -- profitability, liquidity, efficiency
  calculation_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- تمكين RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_kpis ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة الميزانيات" 
ON public.budgets FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة بنود الميزانية" 
ON public.budget_items FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية الأداء المالي" 
ON public.financial_performance FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة الأداء المالي" 
ON public.financial_performance FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية المؤشرات المالية" 
ON public.financial_kpis FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة المؤشرات المالية" 
ON public.financial_kpis FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- دالة لحساب تقرير الأداء المالي الشهري
CREATE OR REPLACE FUNCTION public.calculate_monthly_performance(
  target_year INTEGER,
  target_month INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  performance_id UUID;
  total_rev NUMERIC := 0;
  total_exp NUMERIC := 0;
  gross_prof NUMERIC := 0;
  net_prof NUMERIC := 0;
  prof_margin NUMERIC := 0;
  prev_month_rev NUMERIC := 0;
  rev_growth NUMERIC := 0;
  exp_ratio NUMERIC := 0;
BEGIN
  -- حساب إجمالي الإيرادات للشهر
  SELECT COALESCE(SUM(current_balance), 0) INTO total_rev
  FROM public.chart_of_accounts
  WHERE account_type = 'revenue';
  
  -- حساب إجمالي المصروفات للشهر
  SELECT COALESCE(SUM(current_balance), 0) INTO total_exp
  FROM public.chart_of_accounts
  WHERE account_type = 'expense';
  
  -- حساب الربح الإجمالي والصافي
  gross_prof := total_rev - total_exp;
  net_prof := gross_prof; -- مبسط للآن
  
  -- حساب هامش الربح
  IF total_rev > 0 THEN
    prof_margin := (net_prof / total_rev) * 100;
  END IF;
  
  -- حساب نمو الإيرادات (مقارنة بالشهر السابق)
  SELECT COALESCE(total_revenue, 0) INTO prev_month_rev
  FROM public.financial_performance
  WHERE period_year = target_year
    AND period_month = target_month - 1
    AND period_type = 'monthly'
  LIMIT 1;
  
  IF prev_month_rev > 0 THEN
    rev_growth := ((total_rev - prev_month_rev) / prev_month_rev) * 100;
  END IF;
  
  -- حساب نسبة المصروفات
  IF total_rev > 0 THEN
    exp_ratio := (total_exp / total_rev) * 100;
  END IF;
  
  -- إدراج أو تحديث تقرير الأداء
  INSERT INTO public.financial_performance (
    period_type,
    period_year,
    period_month,
    total_revenue,
    total_expenses,
    gross_profit,
    net_profit,
    profit_margin,
    revenue_growth,
    expense_ratio
  ) VALUES (
    'monthly',
    target_year,
    target_month,
    total_rev,
    total_exp,
    gross_prof,
    net_prof,
    prof_margin,
    rev_growth,
    exp_ratio
  ) 
  ON CONFLICT (period_type, period_year, period_month) 
  DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_expenses = EXCLUDED.total_expenses,
    gross_profit = EXCLUDED.gross_profit,
    net_profit = EXCLUDED.net_profit,
    profit_margin = EXCLUDED.profit_margin,
    revenue_growth = EXCLUDED.revenue_growth,
    expense_ratio = EXCLUDED.expense_ratio,
    calculated_at = now()
  RETURNING id INTO performance_id;
  
  RETURN performance_id;
END;
$$;

-- دالة لحساب التباين في الميزانية
CREATE OR REPLACE FUNCTION public.calculate_budget_variance(budget_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  item_record RECORD;
  actual_amt NUMERIC;
  variance_amt NUMERIC;
  variance_pct NUMERIC;
BEGIN
  FOR item_record IN 
    SELECT bi.*, coa.current_balance
    FROM public.budget_items bi
    JOIN public.chart_of_accounts coa ON bi.account_id = coa.id
    WHERE bi.budget_id = budget_id
  LOOP
    actual_amt := item_record.current_balance;
    variance_amt := actual_amt - item_record.budgeted_amount;
    
    IF item_record.budgeted_amount != 0 THEN
      variance_pct := (variance_amt / item_record.budgeted_amount) * 100;
    ELSE
      variance_pct := 0;
    END IF;
    
    UPDATE public.budget_items 
    SET 
      actual_amount = actual_amt,
      variance_amount = variance_amt,
      variance_percentage = variance_pct,
      updated_at = now()
    WHERE id = item_record.id;
  END LOOP;
END;
$$;

-- دالة لحساب المؤشرات المالية الرئيسية
CREATE OR REPLACE FUNCTION public.calculate_financial_kpis(for_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  kpis_created INTEGER := 0;
  total_revenue NUMERIC;
  total_assets NUMERIC;
  total_liabilities NUMERIC;
  total_equity NUMERIC;
  current_assets NUMERIC;
  current_liabilities NUMERIC;
  net_income NUMERIC;
  revenue_growth NUMERIC;
BEGIN
  -- حساب المؤشرات الأساسية
  SELECT COALESCE(SUM(current_balance), 0) INTO total_revenue
  FROM public.chart_of_accounts WHERE account_type = 'revenue';
  
  SELECT COALESCE(SUM(current_balance), 0) INTO total_assets
  FROM public.chart_of_accounts WHERE account_type = 'asset';
  
  SELECT COALESCE(SUM(current_balance), 0) INTO total_liabilities
  FROM public.chart_of_accounts WHERE account_type = 'liability';
  
  SELECT COALESCE(SUM(current_balance), 0) INTO total_equity
  FROM public.chart_of_accounts WHERE account_type = 'equity';
  
  SELECT COALESCE(SUM(current_balance), 0) INTO current_assets
  FROM public.chart_of_accounts 
  WHERE account_type = 'asset' AND account_category = 'current_asset';
  
  SELECT COALESCE(SUM(current_balance), 0) INTO current_liabilities
  FROM public.chart_of_accounts 
  WHERE account_type = 'liability' AND account_category = 'current_liability';
  
  net_income := total_revenue - (SELECT COALESCE(SUM(current_balance), 0) FROM public.chart_of_accounts WHERE account_type = 'expense');
  
  -- إدراج المؤشرات
  INSERT INTO public.financial_kpis (kpi_name, kpi_value, period_date, kpi_category, kpi_unit) VALUES
  ('إجمالي الإيرادات', total_revenue, for_date, 'profitability', 'currency'),
  ('إجمالي الأصول', total_assets, for_date, 'liquidity', 'currency'),
  ('صافي الدخل', net_income, for_date, 'profitability', 'currency'),
  ('نسبة السيولة السريعة', CASE WHEN current_liabilities > 0 THEN current_assets / current_liabilities ELSE 0 END, for_date, 'liquidity', 'ratio'),
  ('نسبة الدين إلى حقوق الملكية', CASE WHEN total_equity > 0 THEN total_liabilities / total_equity ELSE 0 END, for_date, 'liquidity', 'ratio'),
  ('هامش الربح الصافي', CASE WHEN total_revenue > 0 THEN (net_income / total_revenue) * 100 ELSE 0 END, for_date, 'profitability', 'percentage');
  
  kpis_created := 6;
  
  RETURN kpis_created;
END;
$$;

-- إنشاء فهارس للأداء
CREATE INDEX idx_budget_items_budget_id ON public.budget_items(budget_id);
CREATE INDEX idx_budget_items_account_id ON public.budget_items(account_id);
CREATE INDEX idx_financial_performance_period ON public.financial_performance(period_type, period_year, period_month);
CREATE INDEX idx_financial_kpis_period ON public.financial_kpis(period_date, kpi_category);

-- إضافة constraint فريد للأداء المالي
ALTER TABLE public.financial_performance 
ADD CONSTRAINT unique_financial_performance 
UNIQUE (period_type, period_year, period_month, period_quarter);