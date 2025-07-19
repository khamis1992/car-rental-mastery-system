-- تطبيق دليل الحسابات الكامل على مؤسسة البشائر
DO $$
DECLARE
    bashaer_tenant_id UUID := '235b2e88-fdfa-44f5-bf78-c000d6899182';
    accounts_created_part1 INTEGER := 0;
    accounts_created_part2 INTEGER := 0;
    total_accounts INTEGER := 0;
BEGIN
    -- التحقق من وجود المؤسسة
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = bashaer_tenant_id) THEN
        RAISE EXCEPTION 'مؤسسة البشائر غير موجودة';
    END IF;
    
    -- تطبيق الجزء الأول من دليل الحسابات (الأصول والحسابات الأساسية)
    SELECT public.setup_comprehensive_chart_of_accounts(bashaer_tenant_id) INTO accounts_created_part1;
    
    -- تطبيق الجزء الثاني من دليل الحسابات (الالتزامات وحقوق الملكية والإيرادات والمصروفات)
    SELECT public.complete_liabilities_equity_revenue_expenses(bashaer_tenant_id) INTO accounts_created_part2;
    
    total_accounts := accounts_created_part1 + accounts_created_part2;
    
    -- طباعة النتائج
    RAISE NOTICE 'تم تطبيق دليل الحسابات الكامل على مؤسسة البشائر';
    RAISE NOTICE 'الحسابات المضافة - الجزء الأول: %', accounts_created_part1;
    RAISE NOTICE 'الحسابات المضافة - الجزء الثاني: %', accounts_created_part2;
    RAISE NOTICE 'إجمالي الحسابات المضافة: %', total_accounts;
    
    -- التحقق من العدد النهائي للحسابات
    SELECT COUNT(*) INTO total_accounts 
    FROM public.chart_of_accounts 
    WHERE tenant_id = bashaer_tenant_id;
    
    RAISE NOTICE 'إجمالي عدد الحسابات لمؤسسة البشائر الآن: %', total_accounts;
    
END $$;