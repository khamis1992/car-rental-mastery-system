-- إصلاح العلاقات المفقودة بين المستخدمين والمستأجرين
-- هذا الملف يصلح المشاكل الشائعة في نظام المستأجرين

-- 1. إنشاء جدول مؤقت لتتبع الإصلاحات
CREATE TABLE IF NOT EXISTS tenant_repair_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    repair_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إنشاء وظيفة لإصلاح العلاقات المفقودة
CREATE OR REPLACE FUNCTION fix_missing_tenant_relationships()
RETURNS TABLE(
    tenant_id UUID,
    tenant_name TEXT,
    repairs_made INTEGER,
    errors TEXT[]
) AS $$
DECLARE
    tenant_record RECORD;
    user_record RECORD;
    employee_record RECORD;
    repair_count INTEGER := 0;
    error_list TEXT[] := '{}';
    admin_user_id UUID;
BEGIN
    -- إصلاح المستخدمين بدون علاقات مستأجر
    FOR user_record IN 
        SELECT u.id, u.email, u.user_metadata
        FROM auth.users u
        WHERE u.id NOT IN (SELECT user_id FROM tenant_users WHERE user_id IS NOT NULL)
        AND u.email_confirmed_at IS NOT NULL
    LOOP
        BEGIN
            -- البحث عن مستأجر مناسب أو إنشاء واحد جديد
            SELECT id INTO tenant_record 
            FROM tenants 
            WHERE domain IS NULL OR domain = '' 
            LIMIT 1;
            
            IF tenant_record.id IS NULL THEN
                -- إنشاء مستأجر جديد للمستخدم
                INSERT INTO tenants (name, domain, status, subscription_plan)
                VALUES (
                    COALESCE(user_record.user_metadata->>'company_name', 'مؤسسة جديدة'),
                    NULL,
                    'active',
                    'basic'
                ) RETURNING id INTO tenant_record.id;
            END IF;
            
            -- إنشاء علاقة المستخدم بالمستأجر
            INSERT INTO tenant_users (tenant_id, user_id, role, created_at)
            VALUES (
                tenant_record.id,
                user_record.id,
                CASE 
                    WHEN user_record.user_metadata->>'role' = 'admin' THEN 'admin'
                    ELSE 'user'
                END,
                NOW()
            );
            
            repair_count := repair_count + 1;
            
            -- تسجيل الإصلاح
            INSERT INTO tenant_repair_log (tenant_id, repair_type, description)
            VALUES (tenant_record.id, 'missing_tenant_user', 
                   'تم إنشاء علاقة للمستخدم ' || user_record.email);
            
        EXCEPTION WHEN OTHERS THEN
            error_list := array_append(error_list, 'خطأ في إصلاح المستخدم ' || user_record.email || ': ' || SQLERRM);
        END;
    END LOOP;
    
    -- إصلاح المديرين بدون ملفات موظفين
    FOR tenant_record IN SELECT id, name FROM tenants WHERE status = 'active'
    LOOP
        BEGIN
            -- البحث عن المديرين
            FOR user_record IN 
                SELECT tu.user_id, u.email, u.user_metadata
                FROM tenant_users tu
                JOIN auth.users u ON u.id = tu.user_id
                WHERE tu.tenant_id = tenant_record.id 
                AND tu.role = 'admin'
                AND tu.user_id NOT IN (
                    SELECT user_id FROM employees 
                    WHERE tenant_id = tenant_record.id AND user_id IS NOT NULL
                )
            LOOP
                BEGIN
                    -- إنشاء ملف موظف للمدير
                    INSERT INTO employees (
                        tenant_id,
                        user_id,
                        first_name,
                        last_name,
                        email,
                        position,
                        department,
                        hire_date,
                        status,
                        employee_number
                    ) VALUES (
                        tenant_record.id,
                        user_record.user_id,
                        COALESCE(user_record.user_metadata->>'first_name', 'مدير'),
                        COALESCE(user_record.user_metadata->>'last_name', 'النظام'),
                        user_record.email,
                        'مدير النظام',
                        'الإدارة',
                        NOW(),
                        'active',
                        'EMP' || EXTRACT(EPOCH FROM NOW())::TEXT || floor(random() * 100000)::TEXT
                    );
                    
                    repair_count := repair_count + 1;
                    
                    -- تسجيل الإصلاح
                    INSERT INTO tenant_repair_log (tenant_id, repair_type, description)
                    VALUES (tenant_record.id, 'missing_admin_employee', 
                           'تم إنشاء ملف موظف للمدير ' || user_record.email);
                    
                EXCEPTION WHEN OTHERS THEN
                    error_list := array_append(error_list, 'خطأ في إنشاء ملف موظف للمدير ' || user_record.email || ': ' || SQLERRM);
                END;
            END LOOP;
            
        EXCEPTION WHEN OTHERS THEN
            error_list := array_append(error_list, 'خطأ في معالجة المستأجر ' || tenant_record.name || ': ' || SQLERRM);
        END;
    END LOOP;
    
    -- إصلاح الموظفين بدون حسابات مستخدمين
    FOR employee_record IN 
        SELECT e.id, e.tenant_id, e.first_name, e.last_name, e.email, t.name as tenant_name
        FROM employees e
        JOIN tenants t ON t.id = e.tenant_id
        WHERE e.user_id IS NULL AND e.email IS NOT NULL
    LOOP
        BEGIN
            -- إنشاء حساب مستخدم للموظف
            INSERT INTO auth.users (
                email,
                encrypted_password,
                email_confirmed_at,
                user_metadata,
                created_at,
                updated_at
            ) VALUES (
                employee_record.email,
                crypt('temp123456', gen_salt('bf')),
                NOW(),
                jsonb_build_object(
                    'full_name', employee_record.first_name || ' ' || employee_record.last_name,
                    'role', 'employee'
                ),
                NOW(),
                NOW()
            ) RETURNING id INTO admin_user_id;
            
            -- ربط المستخدم بالمستأجر
            INSERT INTO tenant_users (tenant_id, user_id, role, created_at)
            VALUES (
                employee_record.tenant_id,
                admin_user_id,
                'employee',
                NOW()
            );
            
            -- تحديث ملف الموظف
            UPDATE employees 
            SET user_id = admin_user_id
            WHERE id = employee_record.id;
            
            repair_count := repair_count + 1;
            
            -- تسجيل الإصلاح
            INSERT INTO tenant_repair_log (tenant_id, repair_type, description)
            VALUES (employee_record.tenant_id, 'missing_employee_user', 
                   'تم إنشاء حساب مستخدم للموظف ' || employee_record.email);
            
        EXCEPTION WHEN OTHERS THEN
            error_list := array_append(error_list, 'خطأ في إنشاء حساب للموظف ' || employee_record.email || ': ' || SQLERRM);
        END;
    END LOOP;
    
    -- إرجاع النتائج
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        repair_count,
        error_list
    FROM tenants t
    WHERE t.id IN (SELECT DISTINCT tenant_id FROM tenant_repair_log WHERE created_at > NOW() - INTERVAL '1 hour');
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. إنشاء وظيفة لتطبيق دليل الحسابات الافتراضي
CREATE OR REPLACE FUNCTION apply_default_chart_of_accounts(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    account_record RECORD;
    parent_id UUID;
BEGIN
    -- التحقق من وجود دليل حسابات
    IF EXISTS (SELECT 1 FROM chart_of_accounts WHERE tenant_id = tenant_uuid LIMIT 1) THEN
        RETURN TRUE; -- دليل الحسابات موجود بالفعل
    END IF;
    
    -- إنشاء الحسابات الرئيسية
    INSERT INTO chart_of_accounts (tenant_id, code, name, type, parent_id, is_active)
    VALUES 
        (tenant_uuid, '1000', 'الأصول المتداولة', 'asset', NULL, TRUE),
        (tenant_uuid, '2000', 'الخصوم المتداولة', 'liability', NULL, TRUE),
        (tenant_uuid, '3000', 'حقوق الملكية', 'equity', NULL, TRUE),
        (tenant_uuid, '4000', 'الإيرادات', 'revenue', NULL, TRUE),
        (tenant_uuid, '5000', 'المصروفات', 'expense', NULL, TRUE)
    RETURNING id INTO parent_id;
    
    -- إنشاء الحسابات الفرعية
    INSERT INTO chart_of_accounts (tenant_id, code, name, type, parent_id, is_active)
    SELECT 
        tenant_uuid,
        code,
        name,
        type,
        (SELECT id FROM chart_of_accounts WHERE tenant_id = tenant_uuid AND code = parent_code),
        TRUE
    FROM (VALUES
        ('1100', 'النقد وما في حكمه', 'asset', '1000'),
        ('1200', 'الذمم المدينة', 'asset', '1000'),
        ('1300', 'المخزون', 'asset', '1000'),
        ('2100', 'الذمم الدائنة', 'liability', '2000'),
        ('2200', 'الضرائب المستحقة', 'liability', '2000'),
        ('3100', 'رأس المال', 'equity', '3000'),
        ('3200', 'الأرباح المحتجزة', 'equity', '3000'),
        ('4100', 'إيرادات الإيجار', 'revenue', '4000'),
        ('4200', 'إيرادات الخدمات', 'revenue', '4000'),
        ('5100', 'مصروفات التشغيل', 'expense', '5000'),
        ('5200', 'مصروفات الإدارة', 'expense', '5000'),
        ('5300', 'مصروفات الصيانة', 'expense', '5000')
    ) AS accounts(code, name, type, parent_code);
    
    -- تسجيل الإصلاح
    INSERT INTO tenant_repair_log (tenant_id, repair_type, description)
    VALUES (tenant_uuid, 'chart_of_accounts', 'تم إنشاء دليل حسابات افتراضي');
    
    RETURN TRUE;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'خطأ في إنشاء دليل الحسابات: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. إنشاء وظيفة لإصلاح مستأجر البشائر تحديداً
CREATE OR REPLACE FUNCTION fix_bashaer_tenant()
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    repairs_made INTEGER
) AS $$
DECLARE
    bashaer_tenant_id UUID;
    repair_count INTEGER := 0;
BEGIN
    -- البحث عن مستأجر البشائر
    SELECT id INTO bashaer_tenant_id
    FROM tenants 
    WHERE name ILIKE '%بشائر%' OR name ILIKE '%bashaer%'
    LIMIT 1;
    
    IF bashaer_tenant_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'لم يتم العثور على مستأجر البشائر', 0;
        RETURN;
    END IF;
    
    -- إصلاح العلاقات المفقودة
    PERFORM fix_missing_tenant_relationships();
    
    -- تطبيق دليل الحسابات
    PERFORM apply_default_chart_of_accounts(bashaer_tenant_id);
    
    -- حساب الإصلاحات المنجزة
    SELECT COUNT(*) INTO repair_count
    FROM tenant_repair_log 
    WHERE tenant_id = bashaer_tenant_id 
    AND created_at > NOW() - INTERVAL '1 hour';
    
    RETURN QUERY SELECT TRUE, 'تم إصلاح مستأجر البشائر بنجاح', repair_count;
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 'خطأ في إصلاح مستأجر البشائر: ' || SQLERRM, 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. إنشاء وظيفة لمراقبة صحة المستأجرين
CREATE OR REPLACE FUNCTION get_tenant_health_status()
RETURNS TABLE(
    tenant_id UUID,
    tenant_name TEXT,
    status TEXT,
    user_count INTEGER,
    employee_count INTEGER,
    admin_count INTEGER,
    issues TEXT[]
) AS $$
DECLARE
    tenant_record RECORD;
    issue_list TEXT[];
    user_count_val INTEGER;
    employee_count_val INTEGER;
    admin_count_val INTEGER;
BEGIN
    FOR tenant_record IN SELECT id, name, status FROM tenants WHERE status = 'active'
    LOOP
        issue_list := '{}';
        
        -- حساب الإحصائيات
        SELECT COUNT(*) INTO user_count_val FROM tenant_users WHERE tenant_id = tenant_record.id;
        SELECT COUNT(*) INTO employee_count_val FROM employees WHERE tenant_id = tenant_record.id;
        SELECT COUNT(*) INTO admin_count_val FROM tenant_users WHERE tenant_id = tenant_record.id AND role = 'admin';
        
        -- التحقق من المشاكل
        IF admin_count_val = 0 THEN
            issue_list := array_append(issue_list, 'لا يوجد مديرين');
        END IF;
        
        IF user_count_val = 0 THEN
            issue_list := array_append(issue_list, 'لا يوجد مستخدمين');
        END IF;
        
        IF employee_count_val = 0 THEN
            issue_list := array_append(issue_list, 'لا يوجد موظفين');
        END IF;
        
        -- التحقق من المديرين بدون ملفات موظفين
        IF EXISTS (
            SELECT 1 FROM tenant_users tu
            WHERE tu.tenant_id = tenant_record.id 
            AND tu.role = 'admin'
            AND tu.user_id NOT IN (
                SELECT user_id FROM employees 
                WHERE tenant_id = tenant_record.id AND user_id IS NOT NULL
            )
        ) THEN
            issue_list := array_append(issue_list, 'مديرين بدون ملفات موظفين');
        END IF;
        
        -- تحديد الحالة
        RETURN QUERY SELECT 
            tenant_record.id,
            tenant_record.name,
            CASE 
                WHEN array_length(issue_list, 1) IS NULL THEN 'صحي'
                WHEN array_length(issue_list, 1) <= 2 THEN 'تحذير'
                ELSE 'حرج'
            END,
            user_count_val,
            employee_count_val,
            admin_count_val,
            issue_list;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_repair_log_tenant_id ON tenant_repair_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_repair_log_created_at ON tenant_repair_log(created_at);

-- 7. إضافة تعليقات توضيحية
COMMENT ON FUNCTION fix_missing_tenant_relationships() IS 'إصلاح العلاقات المفقودة بين المستخدمين والمستأجرين';
COMMENT ON FUNCTION apply_default_chart_of_accounts(UUID) IS 'تطبيق دليل الحسابات الافتراضي على مستأجر معين';
COMMENT ON FUNCTION fix_bashaer_tenant() IS 'إصلاح خاص لمستأجر البشائر';
COMMENT ON FUNCTION get_tenant_health_status() IS 'مراقبة صحة المستأجرين واكتشاف المشاكل';
COMMENT ON TABLE tenant_repair_log IS 'سجل الإصلاحات المنجزة على المستأجرين'; 