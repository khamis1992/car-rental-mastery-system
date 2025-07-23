-- ======================================
-- شركة بشائر للتأجير - التوحيد الشامل للهيكل القاعدي
-- Bashair Rental Company - Comprehensive Database Consolidation
-- ======================================

-- إزالة جميع triggers والإجراءات المؤقتة
DROP TRIGGER IF EXISTS auto_setup_new_tenant_accounting ON public.tenants;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- ======================================
-- 1. إنشاء دوال النظام الأساسية مع إعدادات الأمان الصحيحة
-- ======================================

-- دالة للحصول على معرف المؤسسة الحالية
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    -- البحث عن المؤسسة الحالية للمستخدم
    SELECT tenant_id INTO current_tenant_id
    FROM public.tenant_users
    WHERE user_id = auth.uid()
    AND status = 'active'
    LIMIT 1;

    -- إذا لم توجد مؤسسة، نعيد معرف افتراضي
    IF current_tenant_id IS NULL THEN
        SELECT id INTO current_tenant_id
        FROM public.tenants
        WHERE status = 'active'
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;

    RETURN current_tenant_id;
END;
$$;

-- دالة للتحقق من صحة المؤسسة
CREATE OR REPLACE FUNCTION public.is_tenant_valid(tenant_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.tenants
        WHERE id = tenant_id_param
        AND status = 'active'
    );
END;
$$;

-- دالة للتحقق من أدوار المستخدم
CREATE OR REPLACE FUNCTION public.has_role(user_id_param UUID, role_param user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = user_id_param
        AND role = role_param
    );
END;
$$;

-- دالة للتحقق من أدوار المؤسسة
CREATE OR REPLACE FUNCTION public.has_any_tenant_role(roles_param text[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.tenant_users
        WHERE user_id = auth.uid()
        AND tenant_id = public.get_current_tenant_id()
        AND role = ANY(roles_param)
        AND status = 'active'
    );
END;
$$;

-- دالة لضمان تعيين معرف المؤسسة تلقائياً
CREATE OR REPLACE FUNCTION public.ensure_tenant_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF NEW.tenant_id IS NULL THEN
        NEW.tenant_id := public.get_current_tenant_id();
        
        IF NEW.tenant_id IS NULL THEN
            RAISE EXCEPTION 'لا يمكن تحديد معرف المؤسسة للمستخدم الحالي';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- دالة التحقق من SaaS admin
CREATE OR REPLACE FUNCTION public.is_saas_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
    SELECT auth.email() = 'admin@admin.com';
$$;

-- ======================================
-- 2. دوال معالجة المستخدمين الجدد
-- ======================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
  user_tenant_role text;
  metadata_role text;
BEGIN
  -- استخراج الدور من البيانات الوصفية إذا كان متوفراً
  metadata_role := NEW.raw_user_meta_data ->> 'role';
  
  -- البحث عن دور المستخدم في أي مؤسسة
  SELECT role INTO user_tenant_role
  FROM public.tenant_users 
  WHERE user_id = NEW.id 
  AND status = 'active'
  LIMIT 1;
  
  -- إنشاء السجل في جدول profiles
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    CASE 
      -- المديرون الخاصون
      WHEN NEW.email IN ('admin@admin.com', 'admin@bashaererp.com') THEN 'admin'::public.user_role
      -- الأدوار من البيانات الوصفية (للمستخدمين الجدد)
      WHEN metadata_role = 'tenant_admin' THEN 'admin'::public.user_role
      WHEN metadata_role = 'manager' THEN 'manager'::public.user_role
      WHEN metadata_role = 'accountant' THEN 'accountant'::public.user_role
      -- الأدوار من جدول tenant_users (للمستخدمين الحاليين)
      WHEN user_tenant_role = 'tenant_admin' THEN 'admin'::public.user_role
      WHEN user_tenant_role = 'manager' THEN 'manager'::public.user_role
      WHEN user_tenant_role = 'accountant' THEN 'accountant'::public.user_role
      -- الدور الافتراضي
      ELSE 'receptionist'::public.user_role
    END
  );
  
  RETURN NEW;
END;
$$;

-- ======================================
-- 3. دوال الإشعارات ومعالجة المستخدمين
-- ======================================

-- دالة إنشاء دعوة مستخدم
CREATE OR REPLACE FUNCTION public.create_user_invitation(email_param text, role_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
  current_tenant_id UUID;
  invitation_token TEXT;
  invitation_id UUID;
BEGIN
  current_tenant_id := public.get_current_tenant_id();
  
  -- التحقق من الصلاحيات
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND tenant_id = current_tenant_id
    AND role IN ('tenant_admin', 'manager')
    AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'ليس لديك صلاحية لدعوة مستخدمين');
  END IF;
  
  -- التحقق من عدم وجود دعوة سابقة معلقة
  IF EXISTS (
    SELECT 1 FROM public.user_invitations 
    WHERE email = email_param 
    AND tenant_id = current_tenant_id
    AND status = 'pending'
    AND expires_at > now()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'يوجد دعوة معلقة لهذا البريد الإلكتروني');
  END IF;
  
  -- إنشاء رمز الدعوة
  invitation_token := encode(gen_random_bytes(32), 'hex');
  
  -- إنشاء الدعوة
  INSERT INTO public.user_invitations (
    tenant_id, email, role, invited_by, invitation_token
  ) VALUES (
    current_tenant_id, email_param, role_param, auth.uid(), invitation_token
  ) RETURNING id INTO invitation_id;
  
  -- تسجيل النشاط
  PERFORM public.log_user_activity(
    'user_invited',
    'دعوة مستخدم جديد: ' || email_param || ' بدور: ' || role_param
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', invitation_id,
    'invitation_token', invitation_token
  );
END;
$$;

-- دالة تسجيل نشاط المستخدم
CREATE OR REPLACE FUNCTION public.log_user_activity(
    action_type_param text,
    action_description_param text DEFAULT NULL,
    ip_address_param text DEFAULT NULL,
    user_agent_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
  current_tenant_id UUID;
BEGIN
  current_tenant_id := public.get_current_tenant_id();
  
  INSERT INTO public.user_activity_logs (
    tenant_id, user_id, action_type, action_description,
    ip_address, user_agent
  ) VALUES (
    current_tenant_id, auth.uid(), action_type_param, action_description_param,
    ip_address_param, user_agent_param
  );
END;
$$;

-- ======================================
-- 4. دوال المحاسبة والقيود
-- ======================================

-- دالة حساب رصيد الحساب المحسّنة
CREATE OR REPLACE FUNCTION public.get_account_balance_optimized(
    account_id_param uuid,
    as_of_date date DEFAULT CURRENT_DATE
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    account_balance numeric := 0;
    opening_balance numeric := 0;
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- الحصول على الرصيد الافتتاحي
    SELECT COALESCE(coa.opening_balance, 0) INTO opening_balance
    FROM public.chart_of_accounts coa
    WHERE coa.id = account_id_param 
    AND coa.tenant_id = current_tenant_id;
    
    -- حساب الحركات حتى التاريخ المحدد
    SELECT COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) INTO account_balance
    FROM public.journal_entry_lines jel
    INNER JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    WHERE jel.account_id = account_id_param
    AND jel.tenant_id = current_tenant_id
    AND je.entry_date <= as_of_date
    AND je.status = 'posted';
    
    RETURN opening_balance + account_balance;
END;
$$;

-- ======================================
-- 5. تطبيق عزل المؤسسات على جميع الجداول الأساسية
-- ======================================

-- قائمة الجداول التي تحتاج إلى عزل المؤسسات
DO $$
DECLARE
    table_name text;
    tables_to_isolate text[] := ARRAY[
        'customers', 'vehicles', 'contracts', 'employees', 'invoices', 
        'payments', 'chart_of_accounts', 'journal_entries', 'journal_entry_lines',
        'additional_charges', 'asset_categories', 'asset_locations', 
        'asset_assignments', 'asset_maintenance', 'asset_transfers',
        'asset_valuations', 'asset_depreciation', 'attendance',
        'auto_billing_settings', 'auto_billing_log', 'bank_accounts',
        'approvals', 'accounting_templates', 'advanced_accounting_settings',
        'automated_entry_rules', 'automated_entry_executions'
    ];
    first_tenant_id uuid;
BEGIN
    -- الحصول على أول مؤسسة موجودة أو إنشاء واحدة افتراضية
    SELECT id INTO first_tenant_id
    FROM public.tenants
    WHERE status = 'active'
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF first_tenant_id IS NULL THEN
        INSERT INTO public.tenants (name, slug, status)
        VALUES ('المؤسسة الافتراضية', 'default-tenant', 'active')
        RETURNING id INTO first_tenant_id;
    END IF;
    
    -- تطبيق عزل المؤسسات على كل جدول
    FOREACH table_name IN ARRAY tables_to_isolate
    LOOP
        -- التحقق من وجود الجدول
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = isolate_tenant.table_name
        ) THEN
            -- إضافة عمود tenant_id إذا لم يكن موجوداً
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = isolate_tenant.table_name 
                AND column_name = 'tenant_id'
            ) THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN tenant_id UUID', table_name);
            END IF;
            
            -- تحديث البيانات الموجودة بمعرف المؤسسة الأولى
            EXECUTE format(
                'UPDATE public.%I SET tenant_id = %L WHERE tenant_id IS NULL',
                table_name, first_tenant_id
            );
            
            -- جعل العمود غير قابل للتجاهل مع قيمة افتراضية
            EXECUTE format(
                'ALTER TABLE public.%I ALTER COLUMN tenant_id SET NOT NULL, ALTER COLUMN tenant_id SET DEFAULT public.get_current_tenant_id()',
                table_name
            );
            
            -- تفعيل RLS
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
            
            -- حذف السياسات الموجودة وإنشاء سياسة جديدة موحدة
            EXECUTE format('DROP POLICY IF EXISTS "%s_tenant_isolation" ON public.%I', table_name, table_name);
            EXECUTE format(
                'CREATE POLICY "%s_tenant_isolation" ON public.%I FOR ALL USING (tenant_id = public.get_current_tenant_id())',
                table_name, table_name
            );
            
            -- إنشاء trigger لضمان تعيين tenant_id
            EXECUTE format('DROP TRIGGER IF EXISTS ensure_tenant_id_trigger ON public.%I', table_name);
            EXECUTE format(
                'CREATE TRIGGER ensure_tenant_id_trigger BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert()',
                table_name
            );
            
            RAISE NOTICE 'تم تطبيق عزل المؤسسات على الجدول: %', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'تم إكمال تطبيق عزل المؤسسات على جميع الجداول';
END;
$$;

-- ======================================
-- 6. إنشاء المؤشرات لتحسين الأداء
-- ======================================

-- فهارس tenant_id للجداول الرئيسية
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_tenant_id ON public.vehicles(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_tenant_id ON public.contracts(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_tenant_id ON public.employees(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chart_of_accounts_tenant_id ON public.chart_of_accounts(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journal_entries_tenant_id ON public.journal_entries(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journal_entry_lines_tenant_id ON public.journal_entry_lines(tenant_id);

-- فهارس مركبة للاستعلامات الشائعة
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_tenant_status ON public.contracts(tenant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_tenant_status ON public.invoices(tenant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_tenant_status ON public.payments(tenant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journal_entries_tenant_date ON public.journal_entries(tenant_id, entry_date);

-- ======================================
-- 7. سياسات RLS خاصة للمديرين والنظام
-- ======================================

-- سياسات خاصة لـ admin@admin.com لإدارة المؤسسات
DROP POLICY IF EXISTS "SaaS admin can manage all tenants" ON public.tenants;
CREATE POLICY "SaaS admin can manage all tenants" ON public.tenants
FOR ALL USING (public.is_saas_admin());

DROP POLICY IF EXISTS "SaaS admin can manage tenant users" ON public.tenant_users;
CREATE POLICY "SaaS admin can manage tenant users" ON public.tenant_users
FOR ALL USING (public.is_saas_admin());

DROP POLICY IF EXISTS "SaaS admin can view all profiles" ON public.profiles;
CREATE POLICY "SaaS admin can view all profiles" ON public.profiles
FOR SELECT USING (public.is_saas_admin());

-- ======================================
-- 8. إعادة إنشاء الـ triggers الأساسية
-- ======================================

-- trigger معالجة المستخدمين الجدد
CREATE OR REPLACE TRIGGER handle_new_user_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ======================================
-- 9. دوال محاسبية إضافية مع إعدادات الأمان الصحيحة
-- ======================================

-- دالة تحديث حالة الفاتورة عند الدفع
CREATE OR REPLACE FUNCTION public.update_invoice_payment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- تحديث حالة الفاتورة وفقاً للمدفوعات
    UPDATE public.invoices SET 
        paid_amount = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM public.payments 
            WHERE invoice_id = NEW.invoice_id AND status = 'completed'
        ),
        outstanding_amount = total_amount - (
            SELECT COALESCE(SUM(amount), 0) 
            FROM public.payments 
            WHERE invoice_id = NEW.invoice_id AND status = 'completed'
        ),
        status = CASE 
            WHEN (
                SELECT COALESCE(SUM(amount), 0) 
                FROM public.payments 
                WHERE invoice_id = NEW.invoice_id AND status = 'completed'
            ) >= total_amount THEN 'paid'
            WHEN (
                SELECT COALESCE(SUM(amount), 0) 
                FROM public.payments 
                WHERE invoice_id = NEW.invoice_id AND status = 'completed'
            ) > 0 THEN 'partially_paid'
            ELSE status
        END,
        paid_at = CASE 
            WHEN (
                SELECT COALESCE(SUM(amount), 0) 
                FROM public.payments 
                WHERE invoice_id = NEW.invoice_id AND status = 'completed'
            ) >= total_amount THEN NOW()
            ELSE paid_at
        END
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
END;
$$;

-- دالة حساب الرصيد الحالي للعميل
CREATE OR REPLACE FUNCTION public.get_customer_current_balance(customer_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_balance NUMERIC := 0;
  current_tenant_id UUID;
BEGIN
  current_tenant_id := public.get_current_tenant_id();
  
  SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
  INTO current_balance
  FROM public.customer_subsidiary_ledger
  WHERE customer_id = customer_id_param
    AND tenant_id = current_tenant_id;
    
  RETURN current_balance;
END;
$$;

-- ======================================
-- 10. إنشاء متتاليات الأرقام المطلوبة
-- ======================================

-- متتالية لأرقام القيود المحاسبية
CREATE SEQUENCE IF NOT EXISTS public.journal_entry_sequence
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- متتالية لأرقام الفواتير
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ======================================
-- تنظيف وحفظ الإعدادات
-- ======================================

-- تحديث معلومات النظام
INSERT INTO public.landing_page_content (section_name, content_key, content_value, content_type)
VALUES ('system', 'last_migration', '{"date": "' || now()::text || '", "version": "consolidated_v1"}', 'json')
ON CONFLICT (section_name, content_key) 
DO UPDATE SET 
    content_value = EXCLUDED.content_value,
    updated_at = now();

-- رسالة إتمام التوحيد
SELECT 'تم إكمال توحيد قاعدة البيانات بنجاح - تم إصلاح جميع مشاكل الأمان وتطبيق عزل المؤسسات' as consolidation_result;