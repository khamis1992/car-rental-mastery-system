-- إنشاء جدول التصنيف التلقائي للمعاملات
CREATE TABLE public.ai_classifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL, -- journal_entry, invoice, payment, etc.
  transaction_id UUID NOT NULL,
  suggested_category TEXT NOT NULL,
  suggested_account_id UUID REFERENCES public.chart_of_accounts(id),
  confidence_score NUMERIC DEFAULT 0,
  ai_reasoning TEXT,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  model_version TEXT DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- إنشاء جدول التنبؤات المالية
CREATE TABLE public.financial_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forecast_type TEXT NOT NULL, -- revenue, expense, cash_flow, budget_variance
  period_type TEXT NOT NULL, -- monthly, quarterly, annual
  forecast_period DATE NOT NULL,
  current_value NUMERIC,
  predicted_value NUMERIC NOT NULL,
  confidence_interval_low NUMERIC,
  confidence_interval_high NUMERIC,
  accuracy_score NUMERIC,
  model_used TEXT,
  input_features JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- إنشاء جدول التحليلات المتقدمة
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_type TEXT NOT NULL, -- trend_analysis, anomaly_detection, recommendation
  insight_title TEXT NOT NULL,
  insight_description TEXT NOT NULL,
  insight_data JSONB,
  priority_level TEXT DEFAULT 'medium', -- low, medium, high, critical
  affected_accounts TEXT[],
  recommended_actions TEXT[],
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_by UUID,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- إنشاء جدول نماذج التعلم الآلي
CREATE TABLE public.ml_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL UNIQUE,
  model_type TEXT NOT NULL, -- classification, regression, anomaly_detection
  model_version TEXT NOT NULL,
  training_data_count INTEGER DEFAULT 0,
  accuracy_score NUMERIC DEFAULT 0,
  last_trained_at TIMESTAMP WITH TIME ZONE,
  model_parameters JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول بيانات التدريب
CREATE TABLE public.training_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID NOT NULL REFERENCES public.ml_models(id),
  input_features JSONB NOT NULL,
  expected_output JSONB NOT NULL,
  actual_output JSONB,
  is_validated BOOLEAN DEFAULT false,
  validation_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS
ALTER TABLE public.ai_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_data ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة التصنيفات الذكية" 
ON public.ai_classifications FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية التنبؤات المالية" 
ON public.financial_forecasts FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة التنبؤات المالية" 
ON public.financial_forecasts FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية الرؤى الذكية" 
ON public.ai_insights FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة الرؤى الذكية" 
ON public.ai_insights FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المديرون يمكنهم إدارة نماذج التعلم الآلي" 
ON public.ml_models FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية نماذج التعلم الآلي" 
ON public.ml_models FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة بيانات التدريب" 
ON public.training_data FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- دالة لاستخراج خصائص المعاملة للتصنيف
CREATE OR REPLACE FUNCTION public.extract_transaction_features(
  description TEXT,
  amount NUMERIC,
  transaction_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  features JSONB;
  day_of_week INTEGER;
  month_of_year INTEGER;
  amount_range TEXT;
BEGIN
  day_of_week := EXTRACT(DOW FROM transaction_date);
  month_of_year := EXTRACT(MONTH FROM transaction_date);
  
  -- تصنيف المبلغ
  CASE 
    WHEN amount < 100 THEN amount_range := 'small';
    WHEN amount < 1000 THEN amount_range := 'medium';
    WHEN amount < 10000 THEN amount_range := 'large';
    ELSE amount_range := 'very_large';
  END CASE;
  
  features := jsonb_build_object(
    'description', LOWER(description),
    'amount', amount,
    'amount_range', amount_range,
    'day_of_week', day_of_week,
    'month_of_year', month_of_year,
    'description_length', LENGTH(description),
    'contains_numbers', (description ~ '[0-9]'),
    'word_count', array_length(string_to_array(description, ' '), 1)
  );
  
  RETURN features;
END;
$$;

-- دالة لحساب دقة التنبؤات
CREATE OR REPLACE FUNCTION public.calculate_forecast_accuracy()
RETURNS TABLE(forecast_type TEXT, avg_accuracy NUMERIC, forecast_count INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ff.forecast_type,
    AVG(
      CASE 
        WHEN ff.current_value > 0 THEN 
          100 - ABS(ff.predicted_value - ff.current_value) / ff.current_value * 100
        ELSE 0 
      END
    ) as avg_accuracy,
    COUNT(*)::INTEGER as forecast_count
  FROM public.financial_forecasts ff
  WHERE ff.current_value IS NOT NULL
    AND ff.forecast_period <= CURRENT_DATE
  GROUP BY ff.forecast_type;
END;
$$;

-- إدراج النماذج الافتراضية
INSERT INTO public.ml_models (model_name, model_type, model_version, model_parameters) VALUES
('transaction_classifier', 'classification', '1.0', '{"algorithm": "gpt-4o-mini", "categories": ["revenue", "expense", "asset", "liability"]}'),
('revenue_forecaster', 'regression', '1.0', '{"algorithm": "linear_regression", "features": ["historical_revenue", "seasonal_factors", "economic_indicators"]}'),
('expense_predictor', 'regression', '1.0', '{"algorithm": "polynomial_regression", "features": ["historical_expenses", "business_growth", "inflation_rate"]}'),
('anomaly_detector', 'anomaly_detection', '1.0', '{"algorithm": "isolation_forest", "threshold": 0.1, "features": ["amount", "frequency", "account_type"]}');

-- إنشاء فهارس للأداء
CREATE INDEX idx_ai_classifications_transaction ON public.ai_classifications(transaction_type, transaction_id);
CREATE INDEX idx_financial_forecasts_period ON public.financial_forecasts(forecast_type, forecast_period);
CREATE INDEX idx_ai_insights_type ON public.ai_insights(insight_type, priority_level);
CREATE INDEX idx_training_data_model ON public.training_data(model_id, is_validated);