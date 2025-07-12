-- إنشاء دالة لنسخ دليل الحسابات من المؤسسة الافتراضية
CREATE OR REPLACE FUNCTION copy_default_chart_of_accounts(target_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  default_tenant_id UUID;
  copied_count INTEGER := 0;
  account_record RECORD;
  new_account_id UUID;
  parent_mapping JSONB := '{}';
BEGIN
  -- الحصول على معرف المؤسسة الافتراضية
  SELECT id INTO default_tenant_id 
  FROM tenants 
  WHERE name = 'Default Organization' 
  LIMIT 1;
  
  IF default_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Default organization not found';
  END IF;
  
  -- التحقق من عدم وجود حسابات مسبقاً
  IF EXISTS (SELECT 1 FROM chart_of_accounts WHERE tenant_id = target_tenant_id) THEN
    RETURN 0; -- لا ننسخ إذا كانت الحسابات موجودة
  END IF;
  
  -- نسخ الحسابات بالترتيب الهرمي (المستوى الأول أولاً)
  FOR account_record IN (
    SELECT * FROM chart_of_accounts 
    WHERE tenant_id = default_tenant_id 
    AND is_active = true
    ORDER BY level ASC, account_code ASC
  ) LOOP
    -- إنشاء الحساب الجديد
    INSERT INTO chart_of_accounts (
      account_code,
      account_name,
      account_name_en,
      account_type,
      account_category,
      parent_account_id,
      level,
      is_active,
      allow_posting,
      opening_balance,
      current_balance,
      notes,
      tenant_id,
      created_by
    ) VALUES (
      account_record.account_code,
      account_record.account_name,
      account_record.account_name_en,
      account_record.account_type,
      account_record.account_category,
      CASE 
        WHEN account_record.parent_account_id IS NOT NULL 
        THEN (parent_mapping->>account_record.parent_account_id::text)::UUID
        ELSE NULL 
      END,
      account_record.level,
      account_record.is_active,
      account_record.allow_posting,
      account_record.opening_balance,
      account_record.current_balance,
      account_record.notes,
      target_tenant_id,
      auth.uid()
    ) RETURNING id INTO new_account_id;
    
    -- حفظ تطابق الهوية للحسابات الفرعية
    parent_mapping := parent_mapping || jsonb_build_object(account_record.id::text, new_account_id::text);
    copied_count := copied_count + 1;
  END LOOP;
  
  RETURN copied_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء دالة لنسخ مراكز التكلفة من المؤسسة الافتراضية
CREATE OR REPLACE FUNCTION copy_default_cost_centers(target_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  default_tenant_id UUID;
  copied_count INTEGER := 0;
  center_record RECORD;
  new_center_id UUID;
  parent_mapping JSONB := '{}';
BEGIN
  -- الحصول على معرف المؤسسة الافتراضية
  SELECT id INTO default_tenant_id 
  FROM tenants 
  WHERE name = 'Default Organization' 
  LIMIT 1;
  
  IF default_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Default organization not found';
  END IF;
  
  -- التحقق من عدم وجود مراكز تكلفة مسبقاً
  IF EXISTS (SELECT 1 FROM cost_centers WHERE tenant_id = target_tenant_id) THEN
    RETURN 0;
  END IF;
  
  -- نسخ مراكز التكلفة بالترتيب الهرمي
  FOR center_record IN (
    SELECT * FROM cost_centers 
    WHERE tenant_id = default_tenant_id 
    AND is_active = true
    ORDER BY level ASC, cost_center_code ASC
  ) LOOP
    INSERT INTO cost_centers (
      cost_center_code,
      cost_center_name,
      description,
      parent_id,
      level,
      cost_center_type,
      hierarchy_path,
      budget_amount,
      actual_spent,
      is_active,
      tenant_id,
      created_by
    ) VALUES (
      center_record.cost_center_code,
      center_record.cost_center_name,
      center_record.description,
      CASE 
        WHEN center_record.parent_id IS NOT NULL 
        THEN (parent_mapping->>center_record.parent_id::text)::UUID
        ELSE NULL 
      END,
      center_record.level,
      center_record.cost_center_type,
      center_record.hierarchy_path,
      center_record.budget_amount,
      0, -- البدء برصيد صفر للفعلي
      center_record.is_active,
      target_tenant_id,
      auth.uid()
    ) RETURNING id INTO new_center_id;
    
    parent_mapping := parent_mapping || jsonb_build_object(center_record.id::text, new_center_id::text);
    copied_count := copied_count + 1;
  END LOOP;
  
  RETURN copied_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء دالة لنسخ الفروع من المؤسسة الافتراضية
CREATE OR REPLACE FUNCTION copy_default_branches(target_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  default_tenant_id UUID;
  copied_count INTEGER := 0;
  branch_record RECORD;
BEGIN
  -- الحصول على معرف المؤسسة الافتراضية
  SELECT id INTO default_tenant_id 
  FROM tenants 
  WHERE name = 'Default Organization' 
  LIMIT 1;
  
  IF default_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Default organization not found';
  END IF;
  
  -- التحقق من عدم وجود فروع مسبقاً
  IF EXISTS (SELECT 1 FROM branches WHERE tenant_id = target_tenant_id) THEN
    RETURN 0;
  END IF;
  
  -- نسخ الفروع
  FOR branch_record IN (
    SELECT * FROM branches 
    WHERE tenant_id = default_tenant_id 
    AND is_active = true
  ) LOOP
    INSERT INTO branches (
      branch_code,
      branch_name,
      address,
      phone,
      manager_name,
      is_active,
      tenant_id,
      created_by
    ) VALUES (
      branch_record.branch_code,
      branch_record.branch_name,
      branch_record.address,
      branch_record.phone,
      branch_record.manager_name,
      branch_record.is_active,
      target_tenant_id,
      auth.uid()
    );
    
    copied_count := copied_count + 1;
  END LOOP;
  
  RETURN copied_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء دالة لنسخ الفترات المالية من المؤسسة الافتراضية
CREATE OR REPLACE FUNCTION copy_default_financial_periods(target_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  default_tenant_id UUID;
  copied_count INTEGER := 0;
  period_record RECORD;
BEGIN
  -- الحصول على معرف المؤسسة الافتراضية
  SELECT id INTO default_tenant_id 
  FROM tenants 
  WHERE name = 'Default Organization' 
  LIMIT 1;
  
  IF default_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Default organization not found';
  END IF;
  
  -- التحقق من عدم وجود فترات مالية مسبقاً
  IF EXISTS (SELECT 1 FROM financial_periods WHERE tenant_id = target_tenant_id) THEN
    RETURN 0;
  END IF;
  
  -- نسخ الفترات المالية
  FOR period_record IN (
    SELECT * FROM financial_periods 
    WHERE tenant_id = default_tenant_id
  ) LOOP
    INSERT INTO financial_periods (
      period_name,
      start_date,
      end_date,
      fiscal_year,
      is_closed,
      tenant_id,
      created_by
    ) VALUES (
      period_record.period_name,
      period_record.start_date,
      period_record.end_date,
      period_record.fiscal_year,
      period_record.is_closed,
      target_tenant_id,
      auth.uid()
    );
    
    copied_count := copied_count + 1;
  END LOOP;
  
  RETURN copied_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء دالة لنسخ العلامة التجارية من المؤسسة الافتراضية
CREATE OR REPLACE FUNCTION copy_default_company_branding(target_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  default_tenant_id UUID;
  branding_record RECORD;
BEGIN
  -- الحصول على معرف المؤسسة الافتراضية
  SELECT id INTO default_tenant_id 
  FROM tenants 
  WHERE name = 'Default Organization' 
  LIMIT 1;
  
  IF default_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Default organization not found';
  END IF;
  
  -- التحقق من عدم وجود علامة تجارية مسبقاً
  IF EXISTS (SELECT 1 FROM company_branding WHERE tenant_id = target_tenant_id) THEN
    RETURN 0;
  END IF;
  
  -- نسخ العلامة التجارية
  SELECT * INTO branding_record
  FROM company_branding 
  WHERE tenant_id = default_tenant_id 
  LIMIT 1;
  
  IF branding_record.id IS NOT NULL THEN
    INSERT INTO company_branding (
      company_name_ar,
      company_name_en,
      address_ar,
      address_en,
      phone,
      email,
      website,
      tax_number,
      commercial_registration,
      logo_url,
      header_image_url,
      footer_image_url,
      header_height,
      footer_height,
      show_header,
      show_footer,
      is_active,
      tenant_id,
      created_by
    ) VALUES (
      branding_record.company_name_ar,
      branding_record.company_name_en,
      branding_record.address_ar,
      branding_record.address_en,
      branding_record.phone,
      branding_record.email,
      branding_record.website,
      branding_record.tax_number,
      branding_record.commercial_registration,
      branding_record.logo_url,
      branding_record.header_image_url,
      branding_record.footer_image_url,
      branding_record.header_height,
      branding_record.footer_height,
      branding_record.show_header,
      branding_record.show_footer,
      branding_record.is_active,
      target_tenant_id,
      auth.uid()
    );
    
    RETURN 1;
  END IF;
  
  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء دالة شاملة لنسخ جميع البيانات الافتراضية
CREATE OR REPLACE FUNCTION setup_tenant_default_accounting_data(target_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  accounts_copied INTEGER;
  cost_centers_copied INTEGER;
  branches_copied INTEGER;
  periods_copied INTEGER;
  branding_copied INTEGER;
  result JSONB;
BEGIN
  -- نسخ دليل الحسابات
  SELECT copy_default_chart_of_accounts(target_tenant_id) INTO accounts_copied;
  
  -- نسخ مراكز التكلفة
  SELECT copy_default_cost_centers(target_tenant_id) INTO cost_centers_copied;
  
  -- نسخ الفروع
  SELECT copy_default_branches(target_tenant_id) INTO branches_copied;
  
  -- نسخ الفترات المالية
  SELECT copy_default_financial_periods(target_tenant_id) INTO periods_copied;
  
  -- نسخ العلامة التجارية
  SELECT copy_default_company_branding(target_tenant_id) INTO branding_copied;
  
  -- إرجاع تقرير النتائج
  result := jsonb_build_object(
    'tenant_id', target_tenant_id,
    'accounts_copied', accounts_copied,
    'cost_centers_copied', cost_centers_copied,
    'branches_copied', branches_copied,
    'periods_copied', periods_copied,
    'branding_copied', branding_copied,
    'total_items', accounts_copied + cost_centers_copied + branches_copied + periods_copied + branding_copied,
    'completed_at', now()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تطبيق البيانات الافتراضية على جميع المؤسسات الموجودة
DO $$
DECLARE
  tenant_record RECORD;
  setup_result JSONB;
BEGIN
  FOR tenant_record IN (
    SELECT id, name FROM tenants 
    WHERE status = 'active' 
    AND name != 'Default Organization'
  ) LOOP
    BEGIN
      SELECT setup_tenant_default_accounting_data(tenant_record.id) INTO setup_result;
      
      RAISE NOTICE 'تم إعداد البيانات المحاسبية للمؤسسة: % - النتيجة: %', 
        tenant_record.name, setup_result;
        
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'خطأ في إعداد البيانات للمؤسسة %: %', 
        tenant_record.name, SQLERRM;
    END;
  END LOOP;
END $$;

-- إنشاء دالة تلقائية للمؤسسات الجديدة
CREATE OR REPLACE FUNCTION auto_setup_new_tenant_accounting()
RETURNS TRIGGER AS $$
BEGIN
  -- تطبيق البيانات المحاسبية الافتراضية للمؤسسة الجديدة
  IF NEW.status = 'active' AND NEW.name != 'Default Organization' THEN
    PERFORM setup_tenant_default_accounting_data(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger للمؤسسات الجديدة
DROP TRIGGER IF EXISTS trigger_auto_setup_tenant_accounting ON tenants;
CREATE TRIGGER trigger_auto_setup_tenant_accounting
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION auto_setup_new_tenant_accounting();

-- دالة للتحقق من اكتمال البيانات المحاسبية
CREATE OR REPLACE FUNCTION verify_tenant_accounting_data(target_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  accounts_count INTEGER;
  cost_centers_count INTEGER;
  branches_count INTEGER;
  periods_count INTEGER;
  branding_count INTEGER;
  verification_result JSONB;
BEGIN
  -- عد البيانات في كل جدول
  SELECT COUNT(*) INTO accounts_count FROM chart_of_accounts WHERE tenant_id = target_tenant_id;
  SELECT COUNT(*) INTO cost_centers_count FROM cost_centers WHERE tenant_id = target_tenant_id;
  SELECT COUNT(*) INTO branches_count FROM branches WHERE tenant_id = target_tenant_id;
  SELECT COUNT(*) INTO periods_count FROM financial_periods WHERE tenant_id = target_tenant_id;
  SELECT COUNT(*) INTO branding_count FROM company_branding WHERE tenant_id = target_tenant_id;
  
  verification_result := jsonb_build_object(
    'tenant_id', target_tenant_id,
    'chart_of_accounts', accounts_count,
    'cost_centers', cost_centers_count,
    'branches', branches_count,
    'financial_periods', periods_count,
    'company_branding', branding_count,
    'is_complete', (accounts_count > 0 AND cost_centers_count > 0 AND branches_count > 0 AND periods_count > 0),
    'verified_at', now()
  );
  
  RETURN verification_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;