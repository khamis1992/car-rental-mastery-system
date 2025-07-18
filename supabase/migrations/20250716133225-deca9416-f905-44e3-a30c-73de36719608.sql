-- إضافة trigger لتطبيق دليل الحسابات الكامل تلقائياً عند إنشاء مؤسسة جديدة
-- والتأكد من تطبيق دليل الحسابات على جميع المؤسسات الموجودة

-- إنشاء trigger لتطبيق دليل الحسابات تلقائياً عند إنشاء مؤسسة جديدة
CREATE OR REPLACE TRIGGER auto_setup_chart_of_accounts_trigger
    AFTER INSERT ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_setup_new_tenant_comprehensive_accounting();

-- تطبيق دليل الحسابات الكامل على جميع المؤسسات الموجودة التي لا تحتوي على حسابات كاملة
DO $$
DECLARE
    tenant_record RECORD;
    accounts_count INTEGER;
    accounts_created_part1 INTEGER := 0;
    accounts_created_part2 INTEGER := 0;
BEGIN
    -- معالجة جميع المؤسسات النشطة الموجودة
    FOR tenant_record IN 
        SELECT id, name FROM public.tenants 
        WHERE status = 'active' 
        AND id != '00000000-0000-0000-0000-000000000000'
    LOOP
        -- التحقق من عدد الحسابات الحالية للمؤسسة
        SELECT COUNT(*) INTO accounts_count
        FROM public.chart_of_accounts
        WHERE tenant_id = tenant_record.id;
        
        -- إذا كانت المؤسسة تحتوي على أقل من 100 حساب، تطبيق دليل الحسابات الكامل
        IF accounts_count < 100 THEN
            BEGIN
                -- تطبيق الجزء الأول من دليل الحسابات
                SELECT public.setup_comprehensive_chart_of_accounts(tenant_record.id) INTO accounts_created_part1;
                
                -- تطبيق الجزء الثاني من دليل الحسابات
                SELECT public.complete_liabilities_equity_revenue_expenses(tenant_record.id) INTO accounts_created_part2;
                
                RAISE NOTICE 'تم تطبيق دليل الحسابات للمؤسسة: % - الحسابات المضافة: %', 
                    tenant_record.name, (accounts_created_part1 + accounts_created_part2);
                    
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'خطأ في تطبيق دليل الحسابات للمؤسسة: % - الخطأ: %', 
                    tenant_record.name, SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'المؤسسة % تحتوي بالفعل على دليل حسابات كامل (% حساب)', 
                tenant_record.name, accounts_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'تم الانتهاء من تطبيق دليل الحسابات على جميع المؤسسات';
END $$;