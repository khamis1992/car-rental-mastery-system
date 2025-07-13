-- تحسين وتطوير النظام المحاسبي الكويتي الشامل
-- Kuwait Comprehensive Accounting System Enhancement

-- إضافة جدول الأصول الثابتة المطور
CREATE TABLE IF NOT EXISTS public.fixed_assets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    asset_code TEXT NOT NULL,
    asset_name TEXT NOT NULL,
    asset_category TEXT NOT NULL,
    description TEXT,
    purchase_date DATE NOT NULL,
    purchase_cost NUMERIC(15,3) NOT NULL DEFAULT 0,
    useful_life_years INTEGER NOT NULL DEFAULT 5,
    residual_value NUMERIC(15,3) NOT NULL DEFAULT 0,
    depreciation_method TEXT NOT NULL DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'declining_balance')),
    accumulated_depreciation NUMERIC(15,3) NOT NULL DEFAULT 0,
    book_value NUMERIC(15,3) NOT NULL DEFAULT 0,
    location TEXT,
    supplier_name TEXT,
    invoice_number TEXT,
    serial_number TEXT,
    warranty_expiry DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disposed', 'under_maintenance')),
    disposal_date DATE,
    disposal_amount NUMERIC(15,3),
    disposal_reason TEXT,
    account_id UUID REFERENCES public.chart_of_accounts(id),
    accumulated_depreciation_account_id UUID REFERENCES public.chart_of_accounts(id),
    depreciation_expense_account_id UUID REFERENCES public.chart_of_accounts(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(tenant_id, asset_code)
);

-- إضافة جدول إهلاك الأصول
CREATE TABLE IF NOT EXISTS public.asset_depreciation (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
    depreciation_date DATE NOT NULL,
    depreciation_amount NUMERIC(15,3) NOT NULL,
    accumulated_depreciation NUMERIC(15,3) NOT NULL,
    book_value NUMERIC(15,3) NOT NULL,
    method_used TEXT NOT NULL,
    period_months INTEGER NOT NULL DEFAULT 12,
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- إضافة جدول المعاملات البنكية
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
    transaction_date DATE NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'fee', 'interest')),
    debit_amount NUMERIC(15,3),
    credit_amount NUMERIC(15,3),
    balance_after NUMERIC(15,3),
    description TEXT NOT NULL,
    reference_number TEXT,
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- إضافة جدول بنود الميزانية
CREATE TABLE IF NOT EXISTS public.budget_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    item_type TEXT NOT NULL CHECK (item_type IN ('revenue', 'expense')),
    budgeted_amount NUMERIC(15,3) NOT NULL,
    actual_amount NUMERIC(15,3) DEFAULT 0,
    variance_amount NUMERIC(15,3) DEFAULT 0,
    variance_percentage NUMERIC(5,2) DEFAULT 0,
    q1_amount NUMERIC(15,3) DEFAULT 0,
    q2_amount NUMERIC(15,3) DEFAULT 0,
    q3_amount NUMERIC(15,3) DEFAULT 0,
    q4_amount NUMERIC(15,3) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة جدول مراكز التكلفة المطور
CREATE TABLE IF NOT EXISTS public.cost_centers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    cost_center_code TEXT NOT NULL,
    cost_center_name TEXT NOT NULL,
    cost_center_type TEXT CHECK (cost_center_type IN ('department', 'project', 'location', 'activity')),
    description TEXT,
    parent_id UUID REFERENCES public.cost_centers(id),
    level INTEGER DEFAULT 1,
    hierarchy_path TEXT,
    manager_id UUID REFERENCES public.employees(id),
    department_id UUID REFERENCES public.departments(id),
    budget_amount NUMERIC(15,3) DEFAULT 0,
    actual_spent NUMERIC(15,3) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(tenant_id, cost_center_code)
);

-- إضافة جدول تخصيص مراكز التكلفة
CREATE TABLE IF NOT EXISTS public.cost_center_allocations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cost_center_id UUID NOT NULL REFERENCES public.cost_centers(id),
    reference_type TEXT NOT NULL CHECK (reference_type IN ('contract', 'invoice', 'expense', 'payroll')),
    reference_id UUID NOT NULL,
    allocation_percentage NUMERIC(5,2),
    allocation_amount NUMERIC(15,3),
    allocation_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- إضافة جدول المؤشرات المالية المتقدمة
CREATE TABLE IF NOT EXISTS public.advanced_kpis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    kpi_code TEXT NOT NULL UNIQUE,
    kpi_name_ar TEXT NOT NULL,
    kpi_name_en TEXT,
    category TEXT NOT NULL CHECK (category IN ('profitability', 'liquidity', 'efficiency', 'growth', 'risk')),
    calculation_formula TEXT NOT NULL,
    calculation_period TEXT NOT NULL DEFAULT 'monthly' CHECK (calculation_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    target_value NUMERIC(15,3),
    current_value NUMERIC(15,3),
    previous_value NUMERIC(15,3),
    alert_threshold_low NUMERIC(15,3),
    alert_threshold_high NUMERIC(15,3),
    is_automated BOOLEAN DEFAULT true,
    department_id UUID REFERENCES public.departments(id),
    last_calculated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- إضافة جدول تصنيفات الذكاء الاصطناعي
CREATE TABLE IF NOT EXISTS public.ai_classifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('expense', 'revenue', 'asset', 'liability')),
    transaction_id UUID NOT NULL,
    suggested_category TEXT NOT NULL,
    suggested_account_id UUID REFERENCES public.chart_of_accounts(id),
    confidence_score NUMERIC(3,2),
    ai_reasoning TEXT,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    model_version TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- إضافة جدول رؤى الذكاء الاصطناعي
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    insight_type TEXT NOT NULL CHECK (insight_type IN ('anomaly', 'trend', 'recommendation', 'warning', 'opportunity')),
    insight_title TEXT NOT NULL,
    insight_description TEXT NOT NULL,
    priority_level TEXT DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
    affected_accounts TEXT[],
    recommended_actions TEXT[],
    insight_data JSONB,
    is_dismissed BOOLEAN DEFAULT false,
    dismissed_by UUID REFERENCES auth.users(id),
    dismissed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- إضافة جدول دورات العمل
CREATE TABLE IF NOT EXISTS public.accounting_workflows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_name TEXT NOT NULL,
    workflow_type TEXT NOT NULL CHECK (workflow_type IN ('approval', 'processing', 'notification', 'reconciliation')),
    trigger_event TEXT NOT NULL,
    conditions JSONB,
    actions JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    execution_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- إضافة جدول مراقبة الأحداث المحاسبية
CREATE TABLE IF NOT EXISTS public.accounting_event_monitor (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    processing_duration_ms INTEGER,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة جدول مسار المراجعة المحاسبي
CREATE TABLE IF NOT EXISTS public.accounting_audit_trail (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES auth.users(id),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة جدول Webhooks المحاسبية
CREATE TABLE IF NOT EXISTS public.accounting_webhooks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    event_types TEXT[] NOT NULL,
    secret_key TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_fixed_assets_tenant_id ON public.fixed_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_asset_code ON public.fixed_assets(asset_code);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_category ON public.fixed_assets(asset_category);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON public.fixed_assets(status);

CREATE INDEX IF NOT EXISTS idx_asset_depreciation_tenant_id ON public.asset_depreciation(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asset_depreciation_asset_id ON public.asset_depreciation(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_depreciation_date ON public.asset_depreciation(depreciation_date);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_tenant_id ON public.bank_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_id ON public.bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON public.bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_type ON public.bank_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_budget_items_tenant_id ON public.budget_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON public.budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_account_id ON public.budget_items(account_id);

CREATE INDEX IF NOT EXISTS idx_cost_centers_tenant_id ON public.cost_centers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_code ON public.cost_centers(cost_center_code);
CREATE INDEX IF NOT EXISTS idx_cost_centers_parent_id ON public.cost_centers(parent_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_active ON public.cost_centers(is_active);

CREATE INDEX IF NOT EXISTS idx_cost_center_allocations_center_id ON public.cost_center_allocations(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_cost_center_allocations_reference ON public.cost_center_allocations(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_advanced_kpis_code ON public.advanced_kpis(kpi_code);
CREATE INDEX IF NOT EXISTS idx_advanced_kpis_category ON public.advanced_kpis(category);
CREATE INDEX IF NOT EXISTS idx_advanced_kpis_automated ON public.advanced_kpis(is_automated);

CREATE INDEX IF NOT EXISTS idx_ai_classifications_transaction ON public.ai_classifications(transaction_type, transaction_id);
CREATE INDEX IF NOT EXISTS idx_ai_classifications_approved ON public.ai_classifications(is_approved);

CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON public.ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_priority ON public.ai_insights(priority_level);
CREATE INDEX IF NOT EXISTS idx_ai_insights_dismissed ON public.ai_insights(is_dismissed);

CREATE INDEX IF NOT EXISTS idx_accounting_workflows_type ON public.accounting_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_accounting_workflows_active ON public.accounting_workflows(is_active);

CREATE INDEX IF NOT EXISTS idx_accounting_event_monitor_type ON public.accounting_event_monitor(event_type);
CREATE INDEX IF NOT EXISTS idx_accounting_event_monitor_status ON public.accounting_event_monitor(status);
CREATE INDEX IF NOT EXISTS idx_accounting_event_monitor_entity ON public.accounting_event_monitor(entity_id);

CREATE INDEX IF NOT EXISTS idx_accounting_audit_trail_entity ON public.accounting_audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_accounting_audit_trail_user ON public.accounting_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_accounting_audit_trail_created ON public.accounting_audit_trail(created_at);

-- إنشاء دوال محاسبية متقدمة

-- دالة حساب القيمة الدفترية للأصول
CREATE OR REPLACE FUNCTION public.calculate_book_value(asset_cost NUMERIC, accumulated_depreciation NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN GREATEST(asset_cost - accumulated_depreciation, 0);
END;
$$;

-- دالة حساب إهلاك الأصول تلقائياً
CREATE OR REPLACE FUNCTION public.calculate_asset_depreciation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- تحديث القيمة الدفترية عند إضافة إهلاك جديد
  UPDATE public.fixed_assets 
  SET 
    accumulated_depreciation = NEW.accumulated_depreciation,
    book_value = public.calculate_book_value(purchase_cost, NEW.accumulated_depreciation),
    updated_at = now()
  WHERE id = NEW.asset_id;
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger لحساب إهلاك الأصول
CREATE TRIGGER asset_depreciation_update
    AFTER INSERT ON public.asset_depreciation
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_asset_depreciation();

-- دالة حساب تخصيص مراكز التكلفة
CREATE OR REPLACE FUNCTION public.update_cost_center_allocations()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- تحديث المبلغ الفعلي المنفق في مركز التكلفة
  UPDATE public.cost_centers 
  SET 
    actual_spent = (
      SELECT COALESCE(SUM(allocation_amount), 0)
      FROM public.cost_center_allocations 
      WHERE cost_center_id = NEW.cost_center_id
    ),
    updated_at = now()
  WHERE id = NEW.cost_center_id;
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger لتحديث مراكز التكلفة
CREATE TRIGGER cost_center_allocation_update
    AFTER INSERT OR UPDATE OR DELETE ON public.cost_center_allocations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_cost_center_allocations();

-- دالة حساب المؤشرات المالية المتقدمة
CREATE OR REPLACE FUNCTION public.calculate_advanced_kpi(kpi_code_param TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  formula TEXT;
  result NUMERIC := 0;
  current_revenue NUMERIC := 0;
  current_expenses NUMERIC := 0;
  current_assets NUMERIC := 0;
  current_liabilities NUMERIC := 0;
  current_equity NUMERIC := 0;
BEGIN
  -- الحصول على صيغة الحساب
  SELECT calculation_formula INTO formula 
  FROM public.advanced_kpis 
  WHERE kpi_code = kpi_code_param;
  
  IF formula IS NULL THEN
    RETURN 0;
  END IF;
  
  -- حساب القيم الأساسية
  SELECT COALESCE(SUM(current_balance), 0) INTO current_revenue
  FROM public.chart_of_accounts WHERE account_type = 'revenue';
  
  SELECT COALESCE(SUM(current_balance), 0) INTO current_expenses
  FROM public.chart_of_accounts WHERE account_type = 'expense';
  
  SELECT COALESCE(SUM(current_balance), 0) INTO current_assets
  FROM public.chart_of_accounts WHERE account_type = 'asset';
  
  SELECT COALESCE(SUM(current_balance), 0) INTO current_liabilities
  FROM public.chart_of_accounts WHERE account_type = 'liability';
  
  SELECT COALESCE(SUM(current_balance), 0) INTO current_equity
  FROM public.chart_of_accounts WHERE account_type = 'equity';
  
  -- حساب المؤشرات حسب الكود
  CASE kpi_code_param
    WHEN 'NET_PROFIT_MARGIN' THEN
      IF current_revenue > 0 THEN
        result := ((current_revenue - current_expenses) / current_revenue) * 100;
      END IF;
    WHEN 'ROA' THEN -- معدل العائد على الأصول
      IF current_assets > 0 THEN
        result := ((current_revenue - current_expenses) / current_assets) * 100;
      END IF;
    WHEN 'DEBT_TO_EQUITY' THEN -- نسبة الدين إلى حقوق الملكية
      IF current_equity > 0 THEN
        result := (current_liabilities / current_equity) * 100;
      END IF;
    WHEN 'CURRENT_RATIO' THEN -- نسبة السيولة الجارية
      DECLARE
        current_assets_only NUMERIC := 0;
        current_liabilities_only NUMERIC := 0;
      BEGIN
        SELECT COALESCE(SUM(current_balance), 0) INTO current_assets_only
        FROM public.chart_of_accounts 
        WHERE account_type = 'asset' AND account_category = 'current_asset';
        
        SELECT COALESCE(SUM(current_balance), 0) INTO current_liabilities_only
        FROM public.chart_of_accounts 
        WHERE account_type = 'liability' AND account_category = 'current_liability';
        
        IF current_liabilities_only > 0 THEN
          result := current_assets_only / current_liabilities_only;
        END IF;
      END;
    ELSE
      result := 0;
  END CASE;
  
  -- تحديث القيمة في الجدول
  UPDATE public.advanced_kpis 
  SET 
    previous_value = current_value,
    current_value = result,
    last_calculated_at = now(),
    updated_at = now()
  WHERE kpi_code = kpi_code_param;
  
  RETURN result;
END;
$$;

-- دالة حساب جميع المؤشرات
CREATE OR REPLACE FUNCTION public.calculate_all_kpis()
RETURNS TABLE(kpi_code TEXT, calculated_value NUMERIC, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    kpi_record RECORD;
    calc_value NUMERIC;
BEGIN
    FOR kpi_record IN SELECT ak.kpi_code FROM public.advanced_kpis ak WHERE ak.is_automated = true LOOP
        BEGIN
            calc_value := public.calculate_advanced_kpi(kpi_record.kpi_code);
            kpi_code := kpi_record.kpi_code;
            calculated_value := calc_value;
            status := 'success';
            RETURN NEXT;
        EXCEPTION WHEN OTHERS THEN
            kpi_code := kpi_record.kpi_code;
            calculated_value := 0;
            status := 'error: ' || SQLERRM;
            RETURN NEXT;
        END;
    END LOOP;
END;
$$;

-- إدراج المؤشرات المالية الأساسية للسياق الكويتي
INSERT INTO public.advanced_kpis (
    kpi_code, kpi_name_ar, kpi_name_en, category, calculation_formula, target_value
) VALUES 
('NET_PROFIT_MARGIN', 'هامش الربح الصافي', 'Net Profit Margin', 'profitability', '((Revenue - Expenses) / Revenue) * 100', 15.0),
('ROA', 'معدل العائد على الأصول', 'Return on Assets', 'profitability', '((Revenue - Expenses) / Total Assets) * 100', 12.0),
('DEBT_TO_EQUITY', 'نسبة الدين إلى حقوق الملكية', 'Debt to Equity Ratio', 'risk', '(Total Liabilities / Total Equity) * 100', 50.0),
('CURRENT_RATIO', 'نسبة السيولة الجارية', 'Current Ratio', 'liquidity', 'Current Assets / Current Liabilities', 1.5),
('REVENUE_GROWTH', 'نمو الإيرادات', 'Revenue Growth', 'growth', '((Current Revenue - Previous Revenue) / Previous Revenue) * 100', 10.0),
('OPERATING_MARGIN', 'هامش التشغيل', 'Operating Margin', 'efficiency', '((Operating Revenue - Operating Expenses) / Operating Revenue) * 100', 20.0)
ON CONFLICT (kpi_code) DO NOTHING;

-- إنشاء policies الأمان

-- للأصول الثابتة
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة الأصول الثابتة" ON public.fixed_assets
  FOR ALL USING (tenant_id = get_current_tenant_id() AND 
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR 
     has_role(auth.uid(), 'accountant'::user_role)));

-- لإهلاك الأصول
ALTER TABLE public.asset_depreciation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة إهلاك الأصول" ON public.asset_depreciation
  FOR ALL USING (tenant_id = get_current_tenant_id() AND 
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR 
     has_role(auth.uid(), 'accountant'::user_role)));

-- للمعاملات البنكية
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "المحاسبون يمكنهم إدارة معاملات البنوك tenant" ON public.bank_transactions
  FOR ALL USING (tenant_id = get_current_tenant_id() AND 
    (has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant'])));

-- للميزانيات
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "المحاسبون يمكنهم إدارة بنود ميزانيات tenant" ON public.budget_items
  FOR ALL USING (tenant_id = get_current_tenant_id() AND 
    (has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant'])));

-- لمراكز التكلفة
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة مراكز التكلفة" ON public.cost_centers
  FOR ALL USING (tenant_id = get_current_tenant_id() AND 
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR 
     has_role(auth.uid(), 'accountant'::user_role)));

-- لتخصيص مراكز التكلفة
ALTER TABLE public.cost_center_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة تخصيص مراكز التكلفة" ON public.cost_center_allocations
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role) OR 
                 has_role(auth.uid(), 'manager'::user_role) OR 
                 has_role(auth.uid(), 'accountant'::user_role));

-- للمؤشرات المتقدمة
ALTER TABLE public.advanced_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة المؤشرات المتقدمة" ON public.advanced_kpis
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role) OR 
                 has_role(auth.uid(), 'manager'::user_role) OR 
                 has_role(auth.uid(), 'accountant'::user_role));

-- للذكاء الاصطناعي
ALTER TABLE public.ai_classifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة تصنيفات الذكاء الاصطناعي" ON public.ai_classifications
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role) OR 
                 has_role(auth.uid(), 'manager'::user_role) OR 
                 has_role(auth.uid(), 'accountant'::user_role));

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة رؤى الذكاء الاصطناعي" ON public.ai_insights
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role) OR 
                 has_role(auth.uid(), 'manager'::user_role) OR 
                 has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية رؤى الذكاء الاصطناعي" ON public.ai_insights
  FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role) OR 
                   has_role(auth.uid(), 'manager'::user_role) OR 
                   has_role(auth.uid(), 'accountant'::user_role));

-- لدورات العمل
ALTER TABLE public.accounting_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "المديرون يمكنهم إدارة دورات العمل المحاسبية" ON public.accounting_workflows
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role) OR 
                 has_role(auth.uid(), 'manager'::user_role));

-- لمراقبة الأحداث
ALTER TABLE public.accounting_event_monitor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية مراقبة الأحداث" ON public.accounting_event_monitor
  FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role) OR 
                   has_role(auth.uid(), 'manager'::user_role) OR 
                   has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "النظام يمكنه إدارة مراقبة الأحداث" ON public.accounting_event_monitor
  FOR ALL USING (true);

-- لمسار المراجعة
ALTER TABLE public.accounting_audit_trail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية سجل المراجعة" ON public.accounting_audit_trail
  FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role) OR 
                   has_role(auth.uid(), 'manager'::user_role) OR 
                   has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "النظام يمكنه إضافة سجلات المراجعة" ON public.accounting_audit_trail
  FOR INSERT WITH CHECK (true);

-- للـ Webhooks
ALTER TABLE public.accounting_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "المديرون يمكنهم إدارة Webhooks المحاسبية" ON public.accounting_webhooks
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role) OR 
                 has_role(auth.uid(), 'manager'::user_role));