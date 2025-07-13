-- جداول نظام التقارير المحاسبية والتحليلية
-- تم إنشاء هذا الملف لدعم وحدة التقارير المحاسبية المتقدمة

-- جدول القيود المحاسبية التلقائية
CREATE TABLE IF NOT EXISTS automated_journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL,
    reference VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    debit_account VARCHAR(7) NOT NULL,
    credit_account VARCHAR(7) NOT NULL,
    debit_amount DECIMAL(15,3) NOT NULL DEFAULT 0,
    credit_amount DECIMAL(15,3) NOT NULL DEFAULT 0,
    source_type VARCHAR(50) NOT NULL, -- 'invoice', 'payment', 'penalty', 'depreciation', 'contract_completion'
    source_id UUID NOT NULL,
    contract_id UUID REFERENCES contracts(id),
    customer_id UUID REFERENCES customers(id),
    vehicle_id UUID REFERENCES vehicles(id),
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES tenants(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'posted', 'reversed'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- فهارس للأداء
    INDEX idx_automated_journal_entries_tenant_id (tenant_id),
    INDEX idx_automated_journal_entries_entry_date (entry_date),
    INDEX idx_automated_journal_entries_source_type (source_type),
    INDEX idx_automated_journal_entries_status (status),
    INDEX idx_automated_journal_entries_debit_account (debit_account),
    INDEX idx_automated_journal_entries_credit_account (credit_account),
    INDEX idx_automated_journal_entries_contract_id (contract_id),
    INDEX idx_automated_journal_entries_customer_id (customer_id),
    INDEX idx_automated_journal_entries_vehicle_id (vehicle_id),
    
    -- قيود التحقق
    CONSTRAINT chk_automated_journal_entries_debit_credit_balance 
        CHECK (debit_amount = credit_amount),
    CONSTRAINT chk_automated_journal_entries_positive_amounts 
        CHECK (debit_amount >= 0 AND credit_amount >= 0),
    CONSTRAINT chk_automated_journal_entries_account_format 
        CHECK (debit_account ~ '^\d{7}$' AND credit_account ~ '^\d{7}$'),
    CONSTRAINT chk_automated_journal_entries_valid_status 
        CHECK (status IN ('pending', 'posted', 'reversed')),
    CONSTRAINT chk_automated_journal_entries_valid_source_type 
        CHECK (source_type IN ('invoice', 'payment', 'penalty', 'depreciation', 'contract_completion'))
);

-- جدول تفاصيل الإهلاك للمركبات
CREATE TABLE IF NOT EXISTS vehicle_depreciation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    depreciation_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00, -- معدل الإهلاك السنوي بالنسبة المئوية
    last_depreciation_date DATE,
    accumulated_depreciation DECIMAL(15,3) NOT NULL DEFAULT 0,
    tenant_id UUID REFERENCES tenants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- فهارس للأداء
    INDEX idx_vehicle_depreciation_vehicle_id (vehicle_id),
    INDEX idx_vehicle_depreciation_tenant_id (tenant_id),
    
    -- قيود التحقق
    CONSTRAINT chk_vehicle_depreciation_positive_rate 
        CHECK (depreciation_rate > 0 AND depreciation_rate <= 100),
    CONSTRAINT chk_vehicle_depreciation_positive_accumulated 
        CHECK (accumulated_depreciation >= 0),
    
    -- منع التكرار
    UNIQUE(vehicle_id, tenant_id)
);

-- جدول العمليات المالية للعقود
CREATE TABLE IF NOT EXISTS contract_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id),
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- 'invoice', 'payment', 'penalty', 'discount'
    amount DECIMAL(15,3) NOT NULL,
    paid_amount DECIMAL(15,3) NOT NULL DEFAULT 0,
    balance DECIMAL(15,3) NOT NULL DEFAULT 0,
    description TEXT,
    reference VARCHAR(100),
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES tenants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- فهارس للأداء
    INDEX idx_contract_transactions_contract_id (contract_id),
    INDEX idx_contract_transactions_tenant_id (tenant_id),
    INDEX idx_contract_transactions_transaction_date (transaction_date),
    INDEX idx_contract_transactions_transaction_type (transaction_type),
    INDEX idx_contract_transactions_user_id (user_id),
    
    -- قيود التحقق
    CONSTRAINT chk_contract_transactions_positive_amount CHECK (amount > 0),
    CONSTRAINT chk_contract_transactions_positive_paid_amount CHECK (paid_amount >= 0),
    CONSTRAINT chk_contract_transactions_valid_type 
        CHECK (transaction_type IN ('invoice', 'payment', 'penalty', 'discount'))
);

-- جدول إعدادات التقارير المحاسبية
CREATE TABLE IF NOT EXISTS accounting_report_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    company_name VARCHAR(255) NOT NULL DEFAULT 'شركة تأجير السيارات',
    company_logo TEXT, -- Base64 encoded logo
    company_address TEXT NOT NULL DEFAULT 'الرياض، المملكة العربية السعودية',
    company_phone VARCHAR(20) NOT NULL DEFAULT '+966 11 234 5678',
    company_email VARCHAR(255) NOT NULL DEFAULT 'info@car-rental.com',
    accountant_name VARCHAR(255) NOT NULL DEFAULT 'المحاسب الرئيسي',
    manager_name VARCHAR(255) NOT NULL DEFAULT 'المدير المالي',
    default_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    auto_post_entries BOOLEAN NOT NULL DEFAULT false,
    enable_depreciation BOOLEAN NOT NULL DEFAULT true,
    depreciation_day INTEGER NOT NULL DEFAULT 1, -- يوم الشهر لتطبيق الإهلاك
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- فهارس للأداء
    INDEX idx_accounting_report_settings_tenant_id (tenant_id),
    
    -- قيود التحقق
    CONSTRAINT chk_accounting_report_settings_valid_day 
        CHECK (depreciation_day >= 1 AND depreciation_day <= 28),
    
    -- منع التكرار
    UNIQUE(tenant_id)
);

-- جدول تتبع حالة التقارير
CREATE TABLE IF NOT EXISTS report_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    report_type VARCHAR(50) NOT NULL, -- 'customer_statement', 'customer_analytics', 'customers_overview', 'fixed_assets'
    report_parameters JSONB,
    generation_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generation_completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    error_message TEXT,
    file_path TEXT,
    user_id UUID REFERENCES auth.users(id),
    
    -- فهارس للأداء
    INDEX idx_report_generation_logs_tenant_id (tenant_id),
    INDEX idx_report_generation_logs_report_type (report_type),
    INDEX idx_report_generation_logs_status (status),
    INDEX idx_report_generation_logs_user_id (user_id),
    
    -- قيود التحقق
    CONSTRAINT chk_report_generation_logs_valid_status 
        CHECK (status IN ('pending', 'completed', 'failed')),
    CONSTRAINT chk_report_generation_logs_valid_report_type 
        CHECK (report_type IN ('customer_statement', 'customer_analytics', 'customers_overview', 'fixed_assets'))
);

-- Views للتقارير المحاسبية

-- عرض ملخص العملاء
CREATE OR REPLACE VIEW customer_financial_summary AS
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.code as customer_code,
    c.phone,
    c.email,
    c.tenant_id,
    COUNT(DISTINCT con.id) as contracts_count,
    COALESCE(SUM(CASE WHEN ct.transaction_type = 'invoice' THEN ct.amount ELSE 0 END), 0) as total_invoices,
    COALESCE(SUM(CASE WHEN ct.transaction_type = 'payment' THEN ct.amount ELSE 0 END), 0) as total_payments,
    COALESCE(SUM(CASE WHEN ct.transaction_type = 'penalty' THEN ct.amount ELSE 0 END), 0) as total_penalties,
    COALESCE(SUM(CASE WHEN ct.transaction_type IN ('invoice', 'penalty') THEN ct.amount ELSE 0 END) - 
             SUM(CASE WHEN ct.transaction_type = 'payment' THEN ct.amount ELSE 0 END), 0) as current_balance,
    CASE 
        WHEN SUM(CASE WHEN ct.transaction_type = 'invoice' THEN ct.amount ELSE 0 END) = 0 THEN 0
        ELSE (SUM(CASE WHEN ct.transaction_type = 'payment' THEN ct.amount ELSE 0 END) / 
              SUM(CASE WHEN ct.transaction_type = 'invoice' THEN ct.amount ELSE 0 END)) * 100
    END as collection_rate,
    COUNT(CASE WHEN ct.transaction_type = 'penalty' THEN 1 END) as penalties_count,
    MAX(CASE WHEN ct.transaction_type = 'payment' THEN ct.transaction_date END) as last_payment_date,
    CASE 
        WHEN MAX(CASE WHEN ct.transaction_type = 'payment' THEN ct.transaction_date END) IS NULL THEN 0
        ELSE CURRENT_DATE - MAX(CASE WHEN ct.transaction_type = 'payment' THEN ct.transaction_date END)
    END as days_since_last_payment
FROM customers c
LEFT JOIN contracts con ON c.id = con.customer_id
LEFT JOIN contract_transactions ct ON con.id = ct.contract_id
WHERE c.status = 'active'
GROUP BY c.id, c.name, c.code, c.phone, c.email, c.tenant_id;

-- عرض تفاصيل الأصول الثابتة
CREATE OR REPLACE VIEW fixed_assets_details AS
SELECT 
    v.id as vehicle_id,
    v.code as asset_code,
    v.type as vehicle_type,
    v.plate_number,
    v.model,
    v.year,
    v.purchase_date,
    v.purchase_price as purchase_value,
    v.status,
    v.tenant_id,
    COALESCE(vd.depreciation_rate, 10.00) as depreciation_rate,
    COALESCE(vd.accumulated_depreciation, 0) as accumulated_depreciation,
    vd.last_depreciation_date,
    -- حساب الإهلاك الشهري
    CASE 
        WHEN v.purchase_price IS NULL OR v.purchase_price = 0 THEN 0
        ELSE (v.purchase_price * COALESCE(vd.depreciation_rate, 10.00)) / 1200
    END as monthly_depreciation,
    -- حساب القيمة الدفترية
    CASE 
        WHEN v.purchase_price IS NULL OR v.purchase_price = 0 THEN 0
        ELSE v.purchase_price - COALESCE(vd.accumulated_depreciation, 0)
    END as book_value,
    -- حساب نسبة الإهلاك
    CASE 
        WHEN v.purchase_price IS NULL OR v.purchase_price = 0 THEN 0
        ELSE (COALESCE(vd.accumulated_depreciation, 0) / v.purchase_price) * 100
    END as depreciation_percentage
FROM vehicles v
LEFT JOIN vehicle_depreciation vd ON v.id = vd.vehicle_id
WHERE v.status IN ('active', 'maintenance');

-- عرض القيود المحاسبية المفصلة
CREATE OR REPLACE VIEW journal_entries_detailed AS
SELECT 
    aje.id,
    aje.entry_date,
    aje.reference,
    aje.description,
    aje.debit_account,
    aje.credit_account,
    aje.debit_amount,
    aje.credit_amount,
    aje.source_type,
    aje.source_id,
    aje.status,
    aje.tenant_id,
    aje.user_id,
    aje.created_at,
    -- معلومات إضافية
    CASE 
        WHEN aje.contract_id IS NOT NULL THEN con.contract_number
        ELSE NULL
    END as contract_number,
    CASE 
        WHEN aje.customer_id IS NOT NULL THEN cust.name
        ELSE NULL
    END as customer_name,
    CASE 
        WHEN aje.vehicle_id IS NOT NULL THEN veh.plate_number
        ELSE NULL
    END as vehicle_plate,
    up.full_name as user_name
FROM automated_journal_entries aje
LEFT JOIN contracts con ON aje.contract_id = con.id
LEFT JOIN customers cust ON aje.customer_id = cust.id
LEFT JOIN vehicles veh ON aje.vehicle_id = veh.id
LEFT JOIN user_profiles up ON aje.user_id = up.user_id;

-- دالة لحساب رصيد الحساب
CREATE OR REPLACE FUNCTION get_account_balance(
    account_number VARCHAR(7),
    tenant_uuid UUID,
    as_of_date DATE DEFAULT CURRENT_DATE
) RETURNS DECIMAL(15,3) AS $$
DECLARE
    balance DECIMAL(15,3) := 0;
BEGIN
    SELECT 
        COALESCE(SUM(CASE WHEN debit_account = account_number THEN debit_amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN credit_account = account_number THEN credit_amount ELSE 0 END), 0)
    INTO balance
    FROM automated_journal_entries
    WHERE tenant_id = tenant_uuid
      AND entry_date <= as_of_date
      AND status = 'posted';
    
    RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- دالة لتطبيق الإهلاك الشهري
CREATE OR REPLACE FUNCTION process_monthly_depreciation(
    tenant_uuid UUID,
    target_month DATE DEFAULT CURRENT_DATE
) RETURNS INTEGER AS $$
DECLARE
    vehicle_record RECORD;
    depreciation_amount DECIMAL(15,3);
    processed_count INTEGER := 0;
    target_month_start DATE;
    target_month_end DATE;
BEGIN
    -- تحديد بداية ونهاية الشهر المطلوب
    target_month_start := DATE_TRUNC('month', target_month);
    target_month_end := target_month_start + INTERVAL '1 month' - INTERVAL '1 day';
    
    -- المرور على جميع المركبات النشطة
    FOR vehicle_record IN 
        SELECT v.id, v.code, v.plate_number, v.type, v.purchase_price, v.purchase_date,
               COALESCE(vd.depreciation_rate, 10.00) as depreciation_rate,
               COALESCE(vd.accumulated_depreciation, 0) as accumulated_depreciation
        FROM vehicles v
        LEFT JOIN vehicle_depreciation vd ON v.id = vd.vehicle_id
        WHERE v.tenant_id = tenant_uuid
          AND v.status IN ('active', 'maintenance')
          AND v.purchase_price > 0
    LOOP
        -- التحقق من عدم تطبيق الإهلاك مسبقاً لهذا الشهر
        IF NOT EXISTS (
            SELECT 1 FROM automated_journal_entries
            WHERE tenant_id = tenant_uuid
              AND vehicle_id = vehicle_record.id
              AND source_type = 'depreciation'
              AND entry_date BETWEEN target_month_start AND target_month_end
              AND status IN ('pending', 'posted')
        ) THEN
            -- حساب مبلغ الإهلاك الشهري
            depreciation_amount := (vehicle_record.purchase_price * vehicle_record.depreciation_rate) / 1200;
            
            -- التأكد من عدم تجاوز 80% من القيمة الأصلية
            IF (vehicle_record.accumulated_depreciation + depreciation_amount) > (vehicle_record.purchase_price * 0.8) THEN
                depreciation_amount := (vehicle_record.purchase_price * 0.8) - vehicle_record.accumulated_depreciation;
            END IF;
            
            -- تطبيق الإهلاك فقط إذا كان المبلغ أكبر من صفر
            IF depreciation_amount > 0 THEN
                -- إنشاء قيد الإهلاك
                INSERT INTO automated_journal_entries (
                    entry_date, reference, description,
                    debit_account, credit_account, debit_amount, credit_amount,
                    source_type, source_id, vehicle_id, user_id, tenant_id, status
                ) VALUES (
                    target_month_start,
                    'DEP-' || vehicle_record.plate_number || '-' || TO_CHAR(target_month, 'YYYY-MM'),
                    'إهلاك شهري - ' || vehicle_record.plate_number || ' - ' || TO_CHAR(target_month, 'YYYY-MM'),
                    CASE 
                        WHEN vehicle_record.type = 'bus' THEN '5130102'
                        WHEN vehicle_record.type = 'truck' THEN '5130103'
                        ELSE '5130101'
                    END,
                    CASE 
                        WHEN vehicle_record.type = 'bus' THEN '1210102'
                        WHEN vehicle_record.type = 'truck' THEN '1210103'
                        ELSE '1210101'
                    END,
                    depreciation_amount,
                    depreciation_amount,
                    'depreciation',
                    vehicle_record.id,
                    vehicle_record.id,
                    (SELECT user_id FROM user_profiles WHERE tenant_id = tenant_uuid LIMIT 1),
                    tenant_uuid,
                    'pending'
                );
                
                -- تحديث الإهلاك المجمع
                INSERT INTO vehicle_depreciation (vehicle_id, tenant_id, depreciation_rate, accumulated_depreciation, last_depreciation_date)
                VALUES (vehicle_record.id, tenant_uuid, vehicle_record.depreciation_rate, 
                        vehicle_record.accumulated_depreciation + depreciation_amount, target_month_start)
                ON CONFLICT (vehicle_id, tenant_id) 
                DO UPDATE SET 
                    accumulated_depreciation = vehicle_depreciation.accumulated_depreciation + depreciation_amount,
                    last_depreciation_date = target_month_start,
                    updated_at = CURRENT_TIMESTAMP;
                
                processed_count := processed_count + 1;
            END IF;
        END IF;
    END LOOP;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- إنشاء الفهارس الإضافية للأداء
CREATE INDEX IF NOT EXISTS idx_customers_tenant_status ON customers(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_tenant ON contracts(customer_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_status ON vehicles(tenant_id, status);

-- إدراج الإعدادات الافتراضية
INSERT INTO accounting_report_settings (tenant_id, company_name, company_address, company_phone, company_email, accountant_name, manager_name)
SELECT id, 'شركة تأجير السيارات', 'الرياض، المملكة العربية السعودية', '+966 11 234 5678', 'info@car-rental.com', 'المحاسب الرئيسي', 'المدير المالي'
FROM tenants 
WHERE id NOT IN (SELECT tenant_id FROM accounting_report_settings);

-- إعداد RLS (Row Level Security)
ALTER TABLE automated_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_depreciation ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_report_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_generation_logs ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can access their tenant's journal entries" ON automated_journal_entries
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's vehicle depreciation" ON vehicle_depreciation
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's contract transactions" ON contract_transactions
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's accounting settings" ON accounting_report_settings
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's report logs" ON report_generation_logs
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

-- تعليقات للتوثيق
COMMENT ON TABLE automated_journal_entries IS 'جدول القيود المحاسبية التلقائية المرتبطة بالعمليات المالية';
COMMENT ON TABLE vehicle_depreciation IS 'جدول تتبع الإهلاك للمركبات والأصول الثابتة';
COMMENT ON TABLE contract_transactions IS 'جدول العمليات المالية للعقود (فواتير، مدفوعات، غرامات)';
COMMENT ON TABLE accounting_report_settings IS 'جدول إعدادات التقارير المحاسبية لكل مؤسسة';
COMMENT ON TABLE report_generation_logs IS 'جدول تتبع حالة إنشاء التقارير';

COMMENT ON VIEW customer_financial_summary IS 'عرض ملخص البيانات المالية للعملاء';
COMMENT ON VIEW fixed_assets_details IS 'عرض تفاصيل الأصول الثابتة مع حسابات الإهلاك';
COMMENT ON VIEW journal_entries_detailed IS 'عرض القيود المحاسبية مع التفاصيل المرتبطة';

COMMENT ON FUNCTION get_account_balance IS 'دالة لحساب رصيد حساب محاسبي محدد';
COMMENT ON FUNCTION process_monthly_depreciation IS 'دالة لتطبيق الإهلاك الشهري على جميع المركبات'; 