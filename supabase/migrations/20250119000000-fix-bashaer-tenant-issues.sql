-- إصلاح مشاكل مؤسسة البشائر وربط المستخدمين بها
-- Fix Bashaer tenant issues and user linking

-- دالة شاملة لإصلاح مشاكل مؤسسة البشائر
CREATE OR REPLACE FUNCTION public.fix_bashaer_tenant_issues()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    bashaer_tenant_id UUID;
    bashaer_admin_user_id UUID;
    result JSONB;
    issues_found INTEGER := 0;
    fixes_applied INTEGER := 0;
    error_messages TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- البحث عن مؤسسة البشائر
    SELECT id INTO bashaer_tenant_id 
    FROM public.tenants 
    WHERE name ILIKE '%البشائر%' 
       OR contact_email ILIKE '%bashaer%'
       OR slug ILIKE '%bashaer%'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- إذا لم توجد مؤسسة البشائر، أنشئها
    IF bashaer_tenant_id IS NULL THEN
        INSERT INTO public.tenants (
            name,
            slug,
            contact_email,
            contact_phone,
            address,
            city,
            country,
            timezone,
            currency,
            subscription_plan,
            status,
            max_users,
            max_vehicles,
            max_contracts,
            trial_ends_at
        ) VALUES (
            'شركة البشائر للتأجير',
            'bashaer-rental',
            'admin@bashaererp.com',
            '',
            '',
            'الكويت',
            'Kuwait',
            'Asia/Kuwait',
            'KWD',
            'premium',
            'active',
            100,
            500,
            1000,
            CURRENT_DATE + INTERVAL '365 days'
        ) RETURNING id INTO bashaer_tenant_id;
        
        fixes_applied := fixes_applied + 1;
        RAISE NOTICE 'تم إنشاء مؤسسة البشائر الجديدة: %', bashaer_tenant_id;
    END IF;
    
    -- البحث عن مستخدم admin@bashaererp.com
    SELECT id INTO bashaer_admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@bashaererp.com';
    
    -- إذا لم يوجد المستخدم، سجل تحذير
    IF bashaer_admin_user_id IS NULL THEN
        error_messages := array_append(error_messages, 'المستخدم admin@bashaererp.com غير موجود في جدول auth.users');
        issues_found := issues_found + 1;
    ELSE
        -- التحقق من وجود profile للمستخدم
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = bashaer_admin_user_id) THEN
            INSERT INTO public.profiles (
                id,
                email,
                full_name,
                role,
                tenant_id,
                is_active,
                created_at,
                updated_at
            ) VALUES (
                bashaer_admin_user_id,
                'admin@bashaererp.com',
                'مدير البشائر',
                'admin',
                bashaer_tenant_id,
                true,
                now(),
                now()
            );
            
            fixes_applied := fixes_applied + 1;
            RAISE NOTICE 'تم إنشاء profile للمستخدم admin@bashaererp.com';
        ELSE
            -- تحديث profile إذا كان موجوداً
            UPDATE public.profiles 
            SET 
                tenant_id = bashaer_tenant_id,
                role = 'admin',
                is_active = true,
                updated_at = now()
            WHERE id = bashaer_admin_user_id;
            
            fixes_applied := fixes_applied + 1;
            RAISE NOTICE 'تم تحديث profile للمستخدم admin@bashaererp.com';
        END IF;
        
        -- التحقق من وجود رابط في tenant_users
        IF NOT EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE user_id = bashaer_admin_user_id 
            AND tenant_id = bashaer_tenant_id
        ) THEN
            INSERT INTO public.tenant_users (
                tenant_id,
                user_id,
                role,
                status,
                joined_at
            ) VALUES (
                bashaer_tenant_id,
                bashaer_admin_user_id,
                'tenant_admin',
                'active',
                now()
            );
            
            fixes_applied := fixes_applied + 1;
            RAISE NOTICE 'تم ربط المستخدم admin@bashaererp.com بمؤسسة البشائر';
        ELSE
            -- تحديث الرابط إذا كان موجوداً
            UPDATE public.tenant_users 
            SET 
                role = 'tenant_admin',
                status = 'active',
                updated_at = now()
            WHERE user_id = bashaer_admin_user_id 
            AND tenant_id = bashaer_tenant_id;
            
            fixes_applied := fixes_applied + 1;
            RAISE NOTICE 'تم تحديث رابط المستخدم admin@bashaererp.com بمؤسسة البشائر';
        END IF;
        
        -- إنشاء Employee profile إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM public.employees 
            WHERE user_id = bashaer_admin_user_id 
            AND tenant_id = bashaer_tenant_id
        ) THEN
            INSERT INTO public.employees (
                tenant_id,
                user_id,
                employee_number,
                name,
                email,
                position,
                department,
                hire_date,
                employment_type,
                salary,
                is_active,
                notes,
                created_at,
                updated_at
            ) VALUES (
                bashaer_tenant_id,
                bashaer_admin_user_id,
                'EMP-001',
                'مدير البشائر',
                'admin@bashaererp.com',
                'مدير عام',
                'الإدارة العامة',
                CURRENT_DATE,
                'دوام كامل',
                0,
                true,
                'تم إنشاء هذا الملف تلقائياً عند إصلاح النظام',
                now(),
                now()
            );
            
            fixes_applied := fixes_applied + 1;
            RAISE NOTICE 'تم إنشاء ملف الموظف للمستخدم admin@bashaererp.com';
        END IF;
    END IF;
    
    -- تطبيق الحسابات الافتراضية للمؤسسة
    BEGIN
        PERFORM public.setup_tenant_default_accounts(bashaer_tenant_id);
        fixes_applied := fixes_applied + 1;
        RAISE NOTICE 'تم تطبيق الحسابات الافتراضية لمؤسسة البشائر';
    EXCEPTION WHEN OTHERS THEN
        error_messages := array_append(error_messages, 'فشل في تطبيق الحسابات الافتراضية: ' || SQLERRM);
        issues_found := issues_found + 1;
    END;
    
    -- بناء النتيجة
    result := jsonb_build_object(
        'success', true,
        'tenant_id', bashaer_tenant_id,
        'user_id', bashaer_admin_user_id,
        'issues_found', issues_found,
        'fixes_applied', fixes_applied,
        'error_messages', error_messages,
        'message', 'تم إصلاح مشاكل مؤسسة البشائر بنجاح'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'sqlstate', SQLSTATE,
        'message', 'حدث خطأ أثناء إصلاح مشاكل مؤسسة البشائر'
    );
END;
$$;

-- دالة لتشخيص حالة مؤسسة البشائر
CREATE OR REPLACE FUNCTION public.diagnose_bashaer_tenant()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    bashaer_tenant_id UUID;
    bashaer_admin_user_id UUID;
    tenant_info RECORD;
    profile_info RECORD;
    tenant_user_info RECORD;
    employee_info RECORD;
    issues TEXT[] := ARRAY[]::TEXT[];
    status_info JSONB;
BEGIN
    -- البحث عن مؤسسة البشائر
    SELECT * INTO tenant_info 
    FROM public.tenants 
    WHERE name ILIKE '%البشائر%' 
       OR contact_email ILIKE '%bashaer%'
       OR slug ILIKE '%bashaer%'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF tenant_info IS NULL THEN
        issues := array_append(issues, 'مؤسسة البشائر غير موجودة');
        bashaer_tenant_id := NULL;
    ELSE
        bashaer_tenant_id := tenant_info.id;
    END IF;
    
    -- البحث عن المستخدم
    SELECT id INTO bashaer_admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@bashaererp.com';
    
    IF bashaer_admin_user_id IS NULL THEN
        issues := array_append(issues, 'مستخدم admin@bashaererp.com غير موجود في Auth');
    ELSE
        -- فحص الـ profile
        SELECT * INTO profile_info 
        FROM public.profiles 
        WHERE id = bashaer_admin_user_id;
        
        IF profile_info IS NULL THEN
            issues := array_append(issues, 'لا يوجد profile للمستخدم admin@bashaererp.com');
        END IF;
        
        -- فحص رابط tenant_users
        SELECT * INTO tenant_user_info 
        FROM public.tenant_users 
        WHERE user_id = bashaer_admin_user_id 
        AND tenant_id = bashaer_tenant_id;
        
        IF tenant_user_info IS NULL THEN
            issues := array_append(issues, 'المستخدم غير مرتبط بمؤسسة البشائر في tenant_users');
        END IF;
        
        -- فحص ملف الموظف
        SELECT * INTO employee_info 
        FROM public.employees 
        WHERE user_id = bashaer_admin_user_id 
        AND tenant_id = bashaer_tenant_id;
        
        IF employee_info IS NULL THEN
            issues := array_append(issues, 'لا يوجد ملف موظف للمستخدم');
        END IF;
    END IF;
    
    -- بناء النتيجة
    result := jsonb_build_object(
        'tenant_exists', tenant_info IS NOT NULL,
        'tenant_info', to_jsonb(tenant_info),
        'user_exists', bashaer_admin_user_id IS NOT NULL,
        'user_id', bashaer_admin_user_id,
        'profile_exists', profile_info IS NOT NULL,
        'profile_info', to_jsonb(profile_info),
        'tenant_user_link_exists', tenant_user_info IS NOT NULL,
        'tenant_user_info', to_jsonb(tenant_user_info),
        'employee_profile_exists', employee_info IS NOT NULL,
        'employee_info', to_jsonb(employee_info),
        'issues_found', array_length(issues, 1),
        'issues', issues,
        'needs_fixing', array_length(issues, 1) > 0
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'sqlstate', SQLSTATE
    );
END;
$$;

-- تشغيل التشخيص والإصلاح فوراً
DO $$
DECLARE
    diagnostic_result JSONB;
    fix_result JSONB;
BEGIN
    -- تشغيل التشخيص
    SELECT public.diagnose_bashaer_tenant() INTO diagnostic_result;
    RAISE NOTICE 'نتيجة التشخيص: %', diagnostic_result;
    
    -- إذا كانت هناك مشاكل، قم بالإصلاح
    IF (diagnostic_result->>'needs_fixing')::boolean THEN
        SELECT public.fix_bashaer_tenant_issues() INTO fix_result;
        RAISE NOTICE 'نتيجة الإصلاح: %', fix_result;
    ELSE
        RAISE NOTICE 'لا توجد مشاكل تحتاج إصلاح في مؤسسة البشائر';
    END IF;
END $$; 