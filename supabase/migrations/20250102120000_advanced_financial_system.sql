-- Advanced Financial System Database Schema
-- Created for CFO Vision Implementation

-- ===== نظام التكاليف المتقدم =====

-- جدول الأنشطة (Activities)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_code VARCHAR(20) NOT NULL,
  activity_name VARCHAR(255) NOT NULL,
  activity_description TEXT,
  cost_driver VARCHAR(100) NOT NULL,
  cost_pool_id UUID,
  department_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  tenant_id UUID NOT NULL
);

-- جدول محركات التكلفة (Cost Drivers)
CREATE TABLE cost_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_code VARCHAR(20) NOT NULL,
  driver_name VARCHAR(100) NOT NULL,
  measurement_unit VARCHAR(50) NOT NULL,
  driver_type VARCHAR(50) NOT NULL, -- 'volume', 'time', 'complexity'
  calculation_method VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- جدول تخصيص التكاليف (Cost Allocations)
CREATE TABLE cost_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL,
  cost_center_id UUID NOT NULL,
  resource_id UUID,
  allocation_basis VARCHAR(50) NOT NULL,
  allocation_percentage DECIMAL(5,2),
  allocated_amount DECIMAL(15,3) NOT NULL,
  allocation_date DATE NOT NULL,
  allocation_period VARCHAR(20) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- جدول تجمعات التكلفة (Cost Pools)
CREATE TABLE cost_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_code VARCHAR(20) NOT NULL,
  pool_name VARCHAR(100) NOT NULL,
  pool_description TEXT,
  pool_type VARCHAR(50) NOT NULL, -- 'overhead', 'direct', 'shared'
  total_cost DECIMAL(15,3) DEFAULT 0,
  allocation_method VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- ===== نظام الموازنات المتقدم =====

-- جدول الموازنات الرئيسية (Master Budgets)
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_code VARCHAR(20) NOT NULL,
  budget_name VARCHAR(255) NOT NULL,
  budget_year INTEGER NOT NULL,
  budget_type VARCHAR(50) NOT NULL, -- 'master', 'sales', 'operational', 'capital', 'cash_flow'
  budget_version INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'active', 'closed'
  total_budget DECIMAL(15,3) DEFAULT 0,
  actual_amount DECIMAL(15,3) DEFAULT 0,
  variance DECIMAL(15,3) DEFAULT 0,
  variance_percentage DECIMAL(5,2) DEFAULT 0,
  created_by UUID NOT NULL,
  approved_by UUID,
  approved_date TIMESTAMP WITH TIME ZONE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- جدول بنود الموازنة (Budget Items)
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL,
  account_code VARCHAR(7) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  budget_category VARCHAR(50) NOT NULL,
  line_item_code VARCHAR(20),
  jan_budget DECIMAL(15,3) DEFAULT 0,
  feb_budget DECIMAL(15,3) DEFAULT 0,
  mar_budget DECIMAL(15,3) DEFAULT 0,
  apr_budget DECIMAL(15,3) DEFAULT 0,
  may_budget DECIMAL(15,3) DEFAULT 0,
  jun_budget DECIMAL(15,3) DEFAULT 0,
  jul_budget DECIMAL(15,3) DEFAULT 0,
  aug_budget DECIMAL(15,3) DEFAULT 0,
  sep_budget DECIMAL(15,3) DEFAULT 0,
  oct_budget DECIMAL(15,3) DEFAULT 0,
  nov_budget DECIMAL(15,3) DEFAULT 0,
  dec_budget DECIMAL(15,3) DEFAULT 0,
  total_budget DECIMAL(15,3) DEFAULT 0,
  actual_amount DECIMAL(15,3) DEFAULT 0,
  variance DECIMAL(15,3) DEFAULT 0,
  variance_percentage DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- جدول التنبؤات المالية (Financial Forecasts)
CREATE TABLE financial_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_code VARCHAR(20) NOT NULL,
  forecast_name VARCHAR(255) NOT NULL,
  forecast_type VARCHAR(50) NOT NULL, -- 'revenue', 'cost', 'cash_flow', 'profit'
  forecast_method VARCHAR(50) NOT NULL, -- 'statistical', 'ai', 'hybrid'
  forecast_period VARCHAR(20) NOT NULL,
  forecast_date DATE NOT NULL,
  forecast_value DECIMAL(15,3) NOT NULL,
  confidence_level DECIMAL(5,2) NOT NULL,
  assumptions TEXT,
  external_factors TEXT,
  accuracy_score DECIMAL(5,2),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- جدول سيناريوهات التخطيط (Planning Scenarios)
CREATE TABLE planning_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_code VARCHAR(20) NOT NULL,
  scenario_name VARCHAR(255) NOT NULL,
  scenario_type VARCHAR(50) NOT NULL, -- 'optimistic', 'realistic', 'pessimistic'
  scenario_description TEXT,
  base_year INTEGER NOT NULL,
  forecast_years INTEGER NOT NULL,
  growth_rate DECIMAL(5,2) NOT NULL,
  cost_inflation_rate DECIMAL(5,2) NOT NULL,
  market_share_change DECIMAL(5,2) NOT NULL,
  external_assumptions TEXT,
  probability DECIMAL(5,2) NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- ===== نظام إدارة المخاطر =====

-- جدول المخاطر المالية (Financial Risks)
CREATE TABLE financial_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_code VARCHAR(20) NOT NULL,
  risk_type VARCHAR(50) NOT NULL, -- 'credit', 'liquidity', 'market', 'operational', 'regulatory'
  risk_category VARCHAR(50) NOT NULL,
  risk_description TEXT NOT NULL,
  risk_source VARCHAR(100),
  impact_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  probability DECIMAL(5,2) NOT NULL, -- 0-100
  risk_score DECIMAL(5,2) NOT NULL,
  current_exposure DECIMAL(15,3) DEFAULT 0,
  maximum_exposure DECIMAL(15,3) DEFAULT 0,
  mitigation_strategies TEXT,
  contingency_plans TEXT,
  responsible_party UUID,
  risk_owner UUID,
  review_date DATE,
  last_assessment_date DATE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'mitigated', 'accepted', 'transferred', 'closed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- جدول تقييم المخاطر الائتمانية (Credit Risk Assessments)
CREATE TABLE credit_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  assessment_date DATE NOT NULL,
  credit_score INTEGER NOT NULL,
  credit_limit DECIMAL(15,3) NOT NULL,
  current_exposure DECIMAL(15,3) DEFAULT 0,
  overdue_amount DECIMAL(15,3) DEFAULT 0,
  payment_history_score DECIMAL(5,2) NOT NULL,
  risk_rating VARCHAR(2) NOT NULL, -- 'A', 'B', 'C', 'D', 'E'
  default_probability DECIMAL(5,2) NOT NULL,
  collection_efficiency DECIMAL(5,2) NOT NULL,
  recommended_action TEXT,
  assessment_method VARCHAR(50) NOT NULL,
  model_version VARCHAR(20),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- جدول مراقبة السيولة (Liquidity Monitoring)
CREATE TABLE liquidity_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitoring_date DATE NOT NULL,
  cash_position DECIMAL(15,3) NOT NULL,
  short_term_obligations DECIMAL(15,3) NOT NULL,
  liquidity_ratio DECIMAL(5,2) NOT NULL,
  current_ratio DECIMAL(5,2) NOT NULL,
  quick_ratio DECIMAL(5,2) NOT NULL,
  minimum_cash_requirement DECIMAL(15,3) NOT NULL,
  liquidity_gap DECIMAL(15,3) NOT NULL,
  stress_test_scenario VARCHAR(100),
  risk_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  funding_sources TEXT,
  recommendations TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- جدول اختبارات الإجهاد (Stress Tests)
CREATE TABLE stress_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_code VARCHAR(20) NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  test_type VARCHAR(50) NOT NULL, -- 'scenario', 'sensitivity', 'reverse'
  test_date DATE NOT NULL,
  scenario_description TEXT NOT NULL,
  test_assumptions TEXT NOT NULL,
  baseline_value DECIMAL(15,3) NOT NULL,
  stressed_value DECIMAL(15,3) NOT NULL,
  impact_amount DECIMAL(15,3) NOT NULL,
  impact_percentage DECIMAL(5,2) NOT NULL,
  survival_months INTEGER,
  pass_fail_status VARCHAR(10) NOT NULL, -- 'pass', 'fail', 'conditional'
  mitigation_actions TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- ===== نظام التحليلات الذكية =====

-- جدول النماذج التنبؤية (Predictive Models)
CREATE TABLE predictive_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_code VARCHAR(20) NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  model_type VARCHAR(50) NOT NULL, -- 'regression', 'classification', 'time_series', 'neural_network'
  model_purpose VARCHAR(100) NOT NULL,
  algorithm_used VARCHAR(100) NOT NULL,
  training_data_size INTEGER NOT NULL,
  accuracy_score DECIMAL(5,2) NOT NULL,
  precision_score DECIMAL(5,2),
  recall_score DECIMAL(5,2),
  f1_score DECIMAL(5,2),
  model_parameters TEXT,
  feature_importance TEXT,
  model_version VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_trained_date DATE,
  next_training_date DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- جدول التحليلات التنبؤية (Predictive Analytics)
CREATE TABLE predictive_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL,
  prediction_date DATE NOT NULL,
  prediction_period VARCHAR(20) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  current_value DECIMAL(15,3) NOT NULL,
  predicted_value DECIMAL(15,3) NOT NULL,
  confidence_level DECIMAL(5,2) NOT NULL,
  influencing_factors TEXT,
  prediction_accuracy DECIMAL(5,2),
  business_impact VARCHAR(100),
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- جدول تحليل سلوك العملاء (Customer Behavior Analysis)
CREATE TABLE customer_behavior_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  analysis_date DATE NOT NULL,
  behavior_score DECIMAL(5,2) NOT NULL,
  churn_probability DECIMAL(5,2) NOT NULL,
  lifetime_value DECIMAL(15,3) NOT NULL,
  next_rental_probability DECIMAL(5,2) NOT NULL,
  preferred_vehicle_type VARCHAR(50),
  seasonal_patterns TEXT,
  risk_indicators TEXT,
  retention_strategies TEXT,
  segment_id UUID,
  last_interaction_date DATE,
  interaction_frequency INTEGER,
  avg_transaction_value DECIMAL(15,3),
  satisfaction_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- جدول تحليل الطلب (Demand Analysis)
CREATE TABLE demand_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_date DATE NOT NULL,
  vehicle_category VARCHAR(50) NOT NULL,
  forecasted_demand INTEGER NOT NULL,
  actual_demand INTEGER,
  demand_variance INTEGER,
  seasonal_factor DECIMAL(5,2) NOT NULL,
  trend_factor DECIMAL(5,2) NOT NULL,
  external_factors TEXT,
  confidence_interval_lower INTEGER,
  confidence_interval_upper INTEGER,
  forecast_accuracy DECIMAL(5,2),
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- جدول تحسين الأسعار (Price Optimization)
CREATE TABLE price_optimization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL,
  analysis_date DATE NOT NULL,
  current_price DECIMAL(10,3) NOT NULL,
  optimal_price DECIMAL(10,3) NOT NULL,
  price_change_percentage DECIMAL(5,2) NOT NULL,
  demand_elasticity DECIMAL(5,2) NOT NULL,
  competitor_avg_price DECIMAL(10,3),
  market_conditions VARCHAR(100),
  price_sensitivity DECIMAL(5,2) NOT NULL,
  revenue_impact DECIMAL(15,3) NOT NULL,
  utilization_impact DECIMAL(5,2) NOT NULL,
  profit_impact DECIMAL(15,3) NOT NULL,
  implementation_date DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- جدول كشف الاحتيال (Fraud Detection)
CREATE TABLE fraud_detection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  detection_date DATE NOT NULL,
  fraud_score DECIMAL(5,2) NOT NULL,
  risk_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  anomaly_indicators TEXT NOT NULL,
  detection_methods TEXT NOT NULL,
  false_positive_probability DECIMAL(5,2),
  investigation_priority INTEGER NOT NULL,
  recommended_actions TEXT,
  investigation_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'investigating', 'resolved', 'false_positive'
  resolution_notes TEXT,
  investigated_by UUID,
  investigation_date DATE,
  resolution_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- جدول التنبيهات الذكية (Intelligent Alerts)
CREATE TABLE intelligent_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_code VARCHAR(20) NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- 'revenue', 'cost', 'risk', 'opportunity', 'anomaly'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  alert_title VARCHAR(255) NOT NULL,
  alert_description TEXT NOT NULL,
  affected_metrics TEXT,
  impact_assessment DECIMAL(5,2) NOT NULL,
  confidence_score DECIMAL(5,2) NOT NULL,
  threshold_value DECIMAL(15,3),
  current_value DECIMAL(15,3),
  recommended_actions TEXT,
  auto_resolution BOOLEAN DEFAULT false,
  resolution_script TEXT,
  alert_status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'dismissed'
  acknowledged_by UUID,
  acknowledged_date TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolved_date TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- ===== نظام التقارير المتقدمة =====

-- جدول تكوين التقارير (Report Configurations)
CREATE TABLE report_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_code VARCHAR(20) NOT NULL,
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL, -- 'financial', 'operational', 'regulatory', 'management'
  report_category VARCHAR(50) NOT NULL,
  report_description TEXT,
  data_sources TEXT NOT NULL,
  parameters TEXT,
  filters TEXT,
  grouping_criteria TEXT,
  sorting_criteria TEXT,
  chart_types TEXT,
  export_formats TEXT,
  schedule_frequency VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  auto_generate BOOLEAN DEFAULT false,
  email_distribution TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- جدول تاريخ التقارير (Report History)
CREATE TABLE report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_config_id UUID NOT NULL,
  report_instance_id VARCHAR(50) NOT NULL,
  generation_date TIMESTAMP WITH TIME ZONE NOT NULL,
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  generation_status VARCHAR(20) NOT NULL, -- 'generating', 'completed', 'failed'
  file_path TEXT,
  file_size BIGINT,
  generation_time_seconds INTEGER,
  generated_by UUID NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID NOT NULL
);

-- ===== الفهارس والقيود =====

-- فهارس الأداء
CREATE INDEX idx_activities_tenant_id ON activities(tenant_id);
CREATE INDEX idx_activities_active ON activities(is_active);
CREATE INDEX idx_cost_drivers_tenant_id ON cost_drivers(tenant_id);
CREATE INDEX idx_cost_allocations_tenant_id ON cost_allocations(tenant_id);
CREATE INDEX idx_cost_allocations_activity_id ON cost_allocations(activity_id);
CREATE INDEX idx_cost_allocations_date ON cost_allocations(allocation_date);

CREATE INDEX idx_budgets_tenant_id ON budgets(tenant_id);
CREATE INDEX idx_budgets_year ON budgets(budget_year);
CREATE INDEX idx_budgets_type ON budgets(budget_type);
CREATE INDEX idx_budgets_status ON budgets(status);
CREATE INDEX idx_budget_items_tenant_id ON budget_items(tenant_id);
CREATE INDEX idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX idx_budget_items_account_code ON budget_items(account_code);

CREATE INDEX idx_financial_risks_tenant_id ON financial_risks(tenant_id);
CREATE INDEX idx_financial_risks_type ON financial_risks(risk_type);
CREATE INDEX idx_financial_risks_status ON financial_risks(status);
CREATE INDEX idx_credit_assessments_tenant_id ON credit_risk_assessments(tenant_id);
CREATE INDEX idx_credit_assessments_customer_id ON credit_risk_assessments(customer_id);
CREATE INDEX idx_credit_assessments_date ON credit_risk_assessments(assessment_date);

CREATE INDEX idx_predictive_models_tenant_id ON predictive_models(tenant_id);
CREATE INDEX idx_predictive_models_active ON predictive_models(is_active);
CREATE INDEX idx_predictive_analytics_tenant_id ON predictive_analytics(tenant_id);
CREATE INDEX idx_predictive_analytics_date ON predictive_analytics(prediction_date);
CREATE INDEX idx_customer_behavior_tenant_id ON customer_behavior_analysis(tenant_id);
CREATE INDEX idx_customer_behavior_customer_id ON customer_behavior_analysis(customer_id);
CREATE INDEX idx_customer_behavior_date ON customer_behavior_analysis(analysis_date);

CREATE INDEX idx_intelligent_alerts_tenant_id ON intelligent_alerts(tenant_id);
CREATE INDEX idx_intelligent_alerts_type ON intelligent_alerts(alert_type);
CREATE INDEX idx_intelligent_alerts_status ON intelligent_alerts(alert_status);
CREATE INDEX idx_intelligent_alerts_severity ON intelligent_alerts(severity);

-- القيود الأساسية
ALTER TABLE activities ADD CONSTRAINT fk_activities_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE cost_drivers ADD CONSTRAINT fk_cost_drivers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE cost_allocations ADD CONSTRAINT fk_cost_allocations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE cost_allocations ADD CONSTRAINT fk_cost_allocations_activity FOREIGN KEY (activity_id) REFERENCES activities(id);
ALTER TABLE cost_pools ADD CONSTRAINT fk_cost_pools_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE budgets ADD CONSTRAINT fk_budgets_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE budget_items ADD CONSTRAINT fk_budget_items_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE budget_items ADD CONSTRAINT fk_budget_items_budget FOREIGN KEY (budget_id) REFERENCES budgets(id);
ALTER TABLE financial_forecasts ADD CONSTRAINT fk_financial_forecasts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE planning_scenarios ADD CONSTRAINT fk_planning_scenarios_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE financial_risks ADD CONSTRAINT fk_financial_risks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE credit_risk_assessments ADD CONSTRAINT fk_credit_assessments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE credit_risk_assessments ADD CONSTRAINT fk_credit_assessments_customer FOREIGN KEY (customer_id) REFERENCES customers(id);
ALTER TABLE liquidity_monitoring ADD CONSTRAINT fk_liquidity_monitoring_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE stress_tests ADD CONSTRAINT fk_stress_tests_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE predictive_models ADD CONSTRAINT fk_predictive_models_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE predictive_analytics ADD CONSTRAINT fk_predictive_analytics_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE predictive_analytics ADD CONSTRAINT fk_predictive_analytics_model FOREIGN KEY (model_id) REFERENCES predictive_models(id);
ALTER TABLE customer_behavior_analysis ADD CONSTRAINT fk_customer_behavior_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE customer_behavior_analysis ADD CONSTRAINT fk_customer_behavior_customer FOREIGN KEY (customer_id) REFERENCES customers(id);
ALTER TABLE demand_analysis ADD CONSTRAINT fk_demand_analysis_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE price_optimization ADD CONSTRAINT fk_price_optimization_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE price_optimization ADD CONSTRAINT fk_price_optimization_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id);
ALTER TABLE fraud_detection ADD CONSTRAINT fk_fraud_detection_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE intelligent_alerts ADD CONSTRAINT fk_intelligent_alerts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE report_configurations ADD CONSTRAINT fk_report_configurations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE report_history ADD CONSTRAINT fk_report_history_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE report_history ADD CONSTRAINT fk_report_history_config FOREIGN KEY (report_config_id) REFERENCES report_configurations(id);

-- تفعيل Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_behavior_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_optimization ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "tenant_isolation_activities" ON activities FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_cost_drivers" ON cost_drivers FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_cost_allocations" ON cost_allocations FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_cost_pools" ON cost_pools FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_budgets" ON budgets FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_budget_items" ON budget_items FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_financial_forecasts" ON financial_forecasts FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_planning_scenarios" ON planning_scenarios FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_financial_risks" ON financial_risks FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_credit_assessments" ON credit_risk_assessments FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_liquidity_monitoring" ON liquidity_monitoring FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_stress_tests" ON stress_tests FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_predictive_models" ON predictive_models FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_predictive_analytics" ON predictive_analytics FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_customer_behavior" ON customer_behavior_analysis FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_demand_analysis" ON demand_analysis FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_price_optimization" ON price_optimization FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_fraud_detection" ON fraud_detection FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_intelligent_alerts" ON intelligent_alerts FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_report_configurations" ON report_configurations FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "tenant_isolation_report_history" ON report_history FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

-- ===== الدوال المساعدة =====

-- دالة حساب نقاط المخاطر
CREATE OR REPLACE FUNCTION calculate_risk_score(
  impact_level VARCHAR(20),
  probability DECIMAL(5,2)
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  impact_weight INTEGER;
  risk_score DECIMAL(5,2);
BEGIN
  -- تحديد وزن التأثير
  impact_weight := CASE impact_level
    WHEN 'low' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'high' THEN 3
    WHEN 'critical' THEN 4
    ELSE 1
  END;
  
  -- حساب نقاط المخاطر
  risk_score := (impact_weight * probability) / 4;
  
  RETURN ROUND(risk_score, 2);
END;
$$ LANGUAGE plpgsql;

-- دالة حساب التصنيف الائتماني
CREATE OR REPLACE FUNCTION calculate_credit_rating(
  credit_score INTEGER
) RETURNS VARCHAR(2) AS $$
BEGIN
  RETURN CASE
    WHEN credit_score >= 80 THEN 'A'
    WHEN credit_score >= 70 THEN 'B'
    WHEN credit_score >= 60 THEN 'C'
    WHEN credit_score >= 50 THEN 'D'
    ELSE 'E'
  END;
END;
$$ LANGUAGE plpgsql;

-- دالة حساب انحراف الموازنة
CREATE OR REPLACE FUNCTION calculate_budget_variance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.variance := NEW.actual_amount - NEW.total_budget;
  NEW.variance_percentage := CASE
    WHEN NEW.total_budget > 0 THEN (NEW.variance / NEW.total_budget) * 100
    ELSE 0
  END;
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق المحفز على جدول بنود الموازنة
CREATE TRIGGER budget_items_variance_trigger
  BEFORE UPDATE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_budget_variance();

-- دالة إنشاء تنبيه ذكي
CREATE OR REPLACE FUNCTION create_intelligent_alert(
  p_alert_type VARCHAR(50),
  p_severity VARCHAR(20),
  p_title VARCHAR(255),
  p_description TEXT,
  p_impact_assessment DECIMAL(5,2),
  p_confidence_score DECIMAL(5,2),
  p_tenant_id UUID
) RETURNS UUID AS $$
DECLARE
  alert_id UUID;
BEGIN
  INSERT INTO intelligent_alerts (
    alert_code,
    alert_type,
    severity,
    alert_title,
    alert_description,
    impact_assessment,
    confidence_score,
    tenant_id
  ) VALUES (
    'AL-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('alert_sequence')::TEXT, 4, '0'),
    p_alert_type,
    p_severity,
    p_title,
    p_description,
    p_impact_assessment,
    p_confidence_score,
    p_tenant_id
  ) RETURNING id INTO alert_id;
  
  RETURN alert_id;
END;
$$ LANGUAGE plpgsql;

-- إنشاء تسلسل للتنبيهات
CREATE SEQUENCE alert_sequence START 1;

-- دالة التحقق من حدود السيولة
CREATE OR REPLACE FUNCTION check_liquidity_limits()
RETURNS TRIGGER AS $$
DECLARE
  liquidity_threshold DECIMAL(5,2) := 1.2;
  tenant_id UUID;
BEGIN
  -- الحصول على معرف المستأجر
  SELECT tenant_id INTO tenant_id FROM user_profiles WHERE user_id = auth.uid();
  
  -- التحقق من نسبة السيولة
  IF NEW.liquidity_ratio < liquidity_threshold THEN
    PERFORM create_intelligent_alert(
      'liquidity',
      'high',
      'تحذير: انخفاض نسبة السيولة',
      'نسبة السيولة الحالية ' || NEW.liquidity_ratio || ' أقل من الحد الأدنى المطلوب ' || liquidity_threshold,
      75.0,
      95.0,
      tenant_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق المحفز على مراقبة السيولة
CREATE TRIGGER liquidity_monitoring_trigger
  AFTER INSERT OR UPDATE ON liquidity_monitoring
  FOR EACH ROW
  EXECUTE FUNCTION check_liquidity_limits();

-- إدراج بيانات أولية للأنشطة
INSERT INTO activities (activity_code, activity_name, activity_description, cost_driver, tenant_id) VALUES
('ACT-001', 'صيانة المركبات', 'جميع أنشطة الصيانة الدورية والطارئة للمركبات', 'vehicle_maintenance_hours', '00000000-0000-0000-0000-000000000000'),
('ACT-002', 'استهلاك الوقود', 'تكاليف الوقود لجميع المركبات', 'kilometers_driven', '00000000-0000-0000-0000-000000000000'),
('ACT-003', 'خدمة العملاء', 'جميع أنشطة خدمة العملاء والدعم', 'customer_interactions', '00000000-0000-0000-0000-000000000000'),
('ACT-004', 'الإدارة العامة', 'الأنشطة الإدارية والمالية العامة', 'revenue_percentage', '00000000-0000-0000-0000-000000000000'),
('ACT-005', 'التسويق والمبيعات', 'أنشطة التسويق واكتساب العملاء', 'marketing_campaigns', '00000000-0000-0000-0000-000000000000');

-- إدراج بيانات أولية لمحركات التكلفة
INSERT INTO cost_drivers (driver_code, driver_name, measurement_unit, driver_type, tenant_id) VALUES
('DRV-001', 'ساعات الصيانة', 'ساعة', 'time', '00000000-0000-0000-0000-000000000000'),
('DRV-002', 'كيلومترات القيادة', 'كيلومتر', 'volume', '00000000-0000-0000-0000-000000000000'),
('DRV-003', 'عدد التفاعلات', 'تفاعل', 'volume', '00000000-0000-0000-0000-000000000000'),
('DRV-004', 'نسبة الإيراد', 'نسبة مئوية', 'percentage', '00000000-0000-0000-0000-000000000000'),
('DRV-005', 'عدد الحملات', 'حملة', 'volume', '00000000-0000-0000-0000-000000000000');

-- إدراج بيانات أولية للنماذج التنبؤية
INSERT INTO predictive_models (model_code, model_name, model_type, model_purpose, algorithm_used, training_data_size, accuracy_score, model_version, tenant_id) VALUES
('ML-001', 'نموذج التنبؤ بالإيرادات', 'time_series', 'التنبؤ بالإيرادات الشهرية', 'ARIMA', 365, 87.5, 'v1.0', '00000000-0000-0000-0000-000000000000'),
('ML-002', 'نموذج تحليل سلوك العملاء', 'classification', 'تحليل احتمالية فقدان العملاء', 'Random Forest', 10000, 92.3, 'v1.0', '00000000-0000-0000-0000-000000000000'),
('ML-003', 'نموذج كشف الاحتيال', 'classification', 'كشف المعاملات المشبوهة', 'Neural Network', 50000, 94.1, 'v1.0', '00000000-0000-0000-0000-000000000000'),
('ML-004', 'نموذج تحسين الأسعار', 'regression', 'تحديد الأسعار المثلى', 'XGBoost', 25000, 89.7, 'v1.0', '00000000-0000-0000-0000-000000000000');

-- إدراج تكوينات التقارير الأساسية
INSERT INTO report_configurations (report_code, report_name, report_type, report_category, report_description, data_sources, schedule_frequency, auto_generate, tenant_id) VALUES
('RPT-001', 'تقرير الأداء المالي الشهري', 'financial', 'performance', 'تقرير شامل للأداء المالي الشهري', 'budgets,budget_items,financial_forecasts', 'monthly', true, '00000000-0000-0000-0000-000000000000'),
('RPT-002', 'تقرير تحليل المخاطر', 'management', 'risk', 'تقرير مفصل عن المخاطر المالية والتشغيلية', 'financial_risks,credit_risk_assessments,liquidity_monitoring', 'weekly', true, '00000000-0000-0000-0000-000000000000'),
('RPT-003', 'تقرير تحليل التكاليف ABC', 'operational', 'costing', 'تقرير التكاليف المبنية على الأنشطة', 'activities,cost_allocations,cost_drivers', 'monthly', true, '00000000-0000-0000-0000-000000000000'),
('RPT-004', 'تقرير التحليلات التنبؤية', 'management', 'analytics', 'تقرير التحليلات والتنبؤات الذكية', 'predictive_analytics,customer_behavior_analysis,demand_analysis', 'weekly', true, '00000000-0000-0000-0000-000000000000');

COMMENT ON TABLE activities IS 'جدول الأنشطة للتكاليف المبنية على الأنشطة';
COMMENT ON TABLE cost_drivers IS 'جدول محركات التكلفة';
COMMENT ON TABLE cost_allocations IS 'جدول تخصيص التكاليف';
COMMENT ON TABLE budgets IS 'جدول الموازنات الرئيسية';
COMMENT ON TABLE budget_items IS 'جدول بنود الموازنة التفصيلية';
COMMENT ON TABLE financial_risks IS 'جدول المخاطر المالية';
COMMENT ON TABLE credit_risk_assessments IS 'جدول تقييم المخاطر الائتمانية';
COMMENT ON TABLE predictive_models IS 'جدول النماذج التنبؤية للذكاء الاصطناعي';
COMMENT ON TABLE predictive_analytics IS 'جدول التحليلات التنبؤية';
COMMENT ON TABLE customer_behavior_analysis IS 'جدول تحليل سلوك العملاء';
COMMENT ON TABLE intelligent_alerts IS 'جدول التنبيهات الذكية';
COMMENT ON TABLE report_configurations IS 'جدول تكوين التقارير المتقدمة'; 