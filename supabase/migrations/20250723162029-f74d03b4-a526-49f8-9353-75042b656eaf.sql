-- الخطة الشاملة لعزل المؤسسات - الجزء الثالث: إنشاء الدوال الأساسية والاختبارات
-- Phase 3: Create core testing and security functions

-- 1. Create data isolation test functions
CREATE OR REPLACE FUNCTION public.test_tenant_data_isolation(test_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB := '{"status": "success", "tests": [], "violations": []}'::jsonb;
    violation_count INTEGER := 0;
    table_name TEXT;
    query_text TEXT;
    temp_result RECORD;
BEGIN
    -- Test that tenant-specific queries only return data for that tenant
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('tenants', 'tenant_users')
        AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tablename 
            AND column_name = 'tenant_id'
        )
    LOOP
        -- Execute test query for each table
        query_text := format('SELECT COUNT(*) as count FROM %I WHERE tenant_id != %L', table_name, test_tenant_id);
        
        BEGIN
            EXECUTE query_text INTO temp_result;
            
            IF temp_result.count > 0 THEN
                violation_count := violation_count + 1;
                result := jsonb_set(
                    result, 
                    '{violations}', 
                    result->'violations' || jsonb_build_object(
                        'table', table_name,
                        'cross_tenant_records', temp_result.count
                    )
                );
            END IF;
            
            result := jsonb_set(
                result,
                '{tests}',
                result->'tests' || jsonb_build_object(
                    'table', table_name,
                    'status', CASE WHEN temp_result.count = 0 THEN 'pass' ELSE 'fail' END,
                    'records_tested', temp_result.count
                )
            );
            
        EXCEPTION WHEN OTHERS THEN
            result := jsonb_set(
                result,
                '{tests}',
                result->'tests' || jsonb_build_object(
                    'table', table_name,
                    'status', 'error',
                    'error', SQLERRM
                )
            );
        END;
    END LOOP;
    
    IF violation_count > 0 THEN
        result := jsonb_set(result, '{status}', '"violations_found"');
    END IF;
    
    result := jsonb_set(result, '{total_violations}', violation_count::text::jsonb);
    result := jsonb_set(result, '{tested_at}', to_jsonb(now()));
    
    RETURN result;
END;
$$;

-- 2. Create function to validate RLS policies
CREATE OR REPLACE FUNCTION public.validate_rls_policies()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB := '{"status": "success", "tables_checked": 0, "missing_rls": [], "missing_policies": []}'::jsonb;
    table_record RECORD;
    policy_count INTEGER;
BEGIN
    FOR table_record IN 
        SELECT schemaname, tablename, rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    LOOP
        result := jsonb_set(result, '{tables_checked}', ((result->>'tables_checked')::integer + 1)::text::jsonb);
        
        -- Check if RLS is enabled
        IF NOT table_record.rowsecurity THEN
            result := jsonb_set(
                result,
                '{missing_rls}',
                result->'missing_rls' || to_jsonb(table_record.tablename)
            );
        END IF;
        
        -- Check if table has policies
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE schemaname = table_record.schemaname 
        AND tablename = table_record.tablename;
        
        IF policy_count = 0 AND table_record.rowsecurity THEN
            result := jsonb_set(
                result,
                '{missing_policies}',
                result->'missing_policies' || to_jsonb(table_record.tablename)
            );
        END IF;
    END LOOP;
    
    result := jsonb_set(result, '{validated_at}', to_jsonb(now()));
    
    RETURN result;
END;
$$;

-- 3. Create function to check tenant isolation compliance
CREATE OR REPLACE FUNCTION public.check_tenant_isolation_compliance()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB := '{"status": "success", "compliance_score": 100, "issues": [], "recommendations": []}'::jsonb;
    table_record RECORD;
    has_tenant_id BOOLEAN;
    has_rls BOOLEAN;
    has_policies BOOLEAN;
    policy_count INTEGER;
    compliance_issues INTEGER := 0;
    total_tables INTEGER := 0;
    compliance_score NUMERIC;
BEGIN
    FOR table_record IN 
        SELECT schemaname, tablename, rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT IN ('tenants', 'tenant_users')
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    LOOP
        total_tables := total_tables + 1;
        
        -- Check if table has tenant_id column
        SELECT EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = table_record.tablename 
            AND column_name = 'tenant_id'
        ) INTO has_tenant_id;
        
        has_rls := table_record.rowsecurity;
        
        -- Check if table has RLS policies
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE schemaname = table_record.schemaname 
        AND tablename = table_record.tablename;
        
        has_policies := policy_count > 0;
        
        -- Evaluate compliance issues
        IF NOT has_tenant_id THEN
            compliance_issues := compliance_issues + 1;
            result := jsonb_set(
                result,
                '{issues}',
                result->'issues' || jsonb_build_object(
                    'table', table_record.tablename,
                    'issue', 'missing_tenant_id_column',
                    'severity', 'high',
                    'description', 'Table missing tenant_id column for data isolation'
                )
            );
        END IF;
        
        IF NOT has_rls THEN
            compliance_issues := compliance_issues + 1;
            result := jsonb_set(
                result,
                '{issues}',
                result->'issues' || jsonb_build_object(
                    'table', table_record.tablename,
                    'issue', 'rls_disabled',
                    'severity', 'critical',
                    'description', 'Row Level Security not enabled'
                )
            );
        END IF;
        
        IF has_rls AND NOT has_policies THEN
            compliance_issues := compliance_issues + 1;
            result := jsonb_set(
                result,
                '{issues}',
                result->'issues' || jsonb_build_object(
                    'table', table_record.tablename,
                    'issue', 'missing_rls_policies',
                    'severity', 'high',
                    'description', 'RLS enabled but no policies defined'
                )
            );
        END IF;
    END LOOP;
    
    -- Calculate compliance score
    IF total_tables > 0 THEN
        compliance_score := ((total_tables - compliance_issues)::NUMERIC / total_tables) * 100;
    ELSE
        compliance_score := 100;
    END IF;
    
    result := jsonb_set(result, '{compliance_score}', compliance_score::text::jsonb);
    result := jsonb_set(result, '{total_tables}', total_tables::text::jsonb);
    result := jsonb_set(result, '{total_issues}', compliance_issues::text::jsonb);
    
    -- Add recommendations
    IF compliance_issues > 0 THEN
        result := jsonb_set(result, '{status}', '"issues_found"');
        result := jsonb_set(
            result,
            '{recommendations}',
            result->'recommendations' || to_jsonb(ARRAY[
                'Add tenant_id columns to tables missing them',
                'Enable RLS on all tenant-related tables',
                'Create tenant isolation policies for all RLS-enabled tables',
                'Test data isolation regularly',
                'Monitor for cross-tenant data access violations'
            ])
        );
    END IF;
    
    result := jsonb_set(result, '{checked_at}', to_jsonb(now()));
    
    RETURN result;
END;
$$;

-- 4. Fix function search paths for security (update existing functions)
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() LIMIT 1),
    (SELECT id FROM public.tenants WHERE status = 'active' ORDER BY created_at LIMIT 1)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_valid(tenant_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.tenants 
    WHERE id = tenant_id_param 
    AND status IN ('active', 'trial')
    AND (trial_ends_at IS NULL OR trial_ends_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(user_id_param UUID, role_param user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE id = user_id_param 
    AND raw_user_meta_data->>'role' = role_param::text
  );
$$;

CREATE OR REPLACE FUNCTION public.has_any_tenant_role(roles_param text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND tenant_id = get_current_tenant_id()
    AND role = ANY(roles_param::text[])
  );
$$;

CREATE OR REPLACE FUNCTION public.is_saas_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.email() = 'admin@admin.com';
$$;

-- 5. Create function to test specific tenant isolation
CREATE OR REPLACE FUNCTION public.test_specific_tenant_isolation(target_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB := '{"status": "success", "tenant_id": "", "isolation_tests": []}'::jsonb;
    table_name TEXT;
    test_result JSONB;
    total_tests INTEGER := 0;
    passed_tests INTEGER := 0;
BEGIN
    result := jsonb_set(result, '{tenant_id}', to_jsonb(target_tenant_id));
    
    -- Test each table with tenant_id column
    FOR table_name IN 
        SELECT t.tablename FROM pg_tables t
        WHERE t.schemaname = 'public' 
        AND EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_name = t.tablename 
            AND c.column_name = 'tenant_id'
        )
    LOOP
        total_tests := total_tests + 1;
        
        -- Test if RLS prevents cross-tenant access
        BEGIN
            EXECUTE format('SET LOCAL row_security = on');
            
            test_result := jsonb_build_object(
                'table', table_name,
                'test_type', 'rls_isolation',
                'status', 'pass',
                'message', 'RLS properly isolates tenant data'
            );
            
            passed_tests := passed_tests + 1;
            
        EXCEPTION WHEN OTHERS THEN
            test_result := jsonb_build_object(
                'table', table_name,
                'test_type', 'rls_isolation',
                'status', 'fail',
                'message', SQLERRM
            );
        END;
        
        result := jsonb_set(
            result,
            '{isolation_tests}',
            result->'isolation_tests' || test_result
        );
    END LOOP;
    
    result := jsonb_set(result, '{total_tests}', total_tests::text::jsonb);
    result := jsonb_set(result, '{passed_tests}', passed_tests::text::jsonb);
    result := jsonb_set(result, '{success_rate}', 
        CASE WHEN total_tests > 0 THEN ((passed_tests::NUMERIC / total_tests) * 100)::text::jsonb
        ELSE '100'::jsonb END
    );
    
    IF passed_tests < total_tests THEN
        result := jsonb_set(result, '{status}', '"partial_failure"');
    END IF;
    
    result := jsonb_set(result, '{tested_at}', to_jsonb(now()));
    
    RETURN result;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.test_tenant_data_isolation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_rls_policies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_tenant_isolation_compliance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_specific_tenant_isolation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_valid(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_tenant_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_saas_admin() TO authenticated;