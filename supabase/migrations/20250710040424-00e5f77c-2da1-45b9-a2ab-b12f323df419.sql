-- إنشاء دالة لتنفيذ استعلامات التحليلات بشكل آمن
CREATE OR REPLACE FUNCTION execute_analytics_query(query_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    record_data record;
    results jsonb[] := '{}';
BEGIN
    -- التحقق من أن الاستعلام آمن (قراءة فقط)
    IF query_text !~* '^[\s]*select' THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    -- منع استعلامات الحذف والتعديل
    IF query_text ~* '\b(insert|update|delete|drop|create|alter|truncate)\b' THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    -- تنفيذ الاستعلام وجمع النتائج
    FOR record_data IN EXECUTE query_text LOOP
        results := results || row_to_json(record_data)::jsonb;
    END LOOP;
    
    RETURN array_to_json(results)::jsonb;
    
EXCEPTION WHEN OTHERS THEN
    -- تسجيل الخطأ وإعادة رسالة عامة
    RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- منح الصلاحيات للدالة
GRANT EXECUTE ON FUNCTION execute_analytics_query(text) TO service_role;