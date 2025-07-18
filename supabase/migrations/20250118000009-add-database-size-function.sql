-- ==========================================
-- إضافة دالة للحصول على حجم قاعدة البيانات
-- ==========================================

-- دالة للحصول على حجم قاعدة البيانات الحالية مع فحص الصلاحيات
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS TABLE (
  database_size bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- التحقق من أن المستخدم مشرف عام
  IF NOT EXISTS (
    SELECT 1 FROM tenant_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بالوصول لهذه المعلومات';
  END IF;

  RETURN QUERY
  SELECT pg_database_size(current_database())::bigint;
END;
$$;

-- دالة مساعدة للحصول على إحصائيات قاعدة البيانات المتقدمة
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE (
  database_size bigint,
  table_count bigint,
  total_rows bigint,
  connections_count integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- التحقق من أن المستخدم مشرف عام
  IF NOT EXISTS (
    SELECT 1 FROM tenant_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بالوصول لهذه المعلومات';
  END IF;

  RETURN QUERY
  SELECT 
    pg_database_size(current_database())::bigint as database_size,
    (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public')::bigint as table_count,
    COALESCE((
      SELECT sum(n_tup_ins + n_tup_upd + n_tup_del) 
      FROM pg_stat_user_tables
    ), 0)::bigint as total_rows,
    (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database())::integer as connections_count;
END;
$$;

-- منح صلاحيات تنفيذ الدوال للمستخدمين المعتمدين
GRANT EXECUTE ON FUNCTION get_database_size() TO authenticated;
GRANT EXECUTE ON FUNCTION get_database_stats() TO authenticated;

-- تعليق للتوضيح
COMMENT ON FUNCTION get_database_size() IS 'إرجاع حجم قاعدة البيانات الحالية بالبايت - مقتصر على المشرفين العامين';
COMMENT ON FUNCTION get_database_stats() IS 'إرجاع إحصائيات شاملة لقاعدة البيانات - مقتصر على المشرفين العامين'; 