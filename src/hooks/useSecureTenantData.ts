
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TenantService } from '@/services/TenantService';
import { useTenant } from '@/contexts/TenantContext';

/**
 * Hook آمن لجلب البيانات مع ضمان عزل المؤسسة
 */
export function useSecureTenantData() {
  const { currentTenant } = useTenant();

  /**
   * جلب الموظفين الخاصين بالمؤسسة الحالية فقط
   */
  const useSecureEmployees = () => {
    return useQuery({
      queryKey: ['secure-employees', currentTenant?.id],
      queryFn: async () => {
        // التأكد من وجود مؤسسة حالية
        if (!currentTenant?.id) {
          console.warn('⚠️ لا توجد مؤسسة حالية - تم إرجاع قائمة فارغة');
          return [];
        }

        console.log('🔍 جلب موظفي المؤسسة:', currentTenant.name);

        const { data, error } = await supabase
          .from('employees')
          .select('id, first_name, last_name, employee_number, position, status, tenant_id')
          .eq('tenant_id', currentTenant.id)
          .eq('status', 'active')
          .order('first_name', { ascending: true });

        if (error) {
          console.error('❌ خطأ في جلب الموظفين:', error);
          throw error;
        }

        // التحقق من سلامة البيانات
        const validEmployees = (data || []).filter(emp => {
          if (emp.tenant_id !== currentTenant.id) {
            console.warn('⚠️ تم العثور على موظف من مؤسسة أخرى:', emp.first_name, emp.last_name);
            return false;
          }
          return true;
        });

        console.log(`✅ تم جلب ${validEmployees.length} موظف من المؤسسة الحالية`);
        return validEmployees;
      },
      enabled: !!currentTenant?.id,
      staleTime: 5 * 60 * 1000, // 5 دقائق
    });
  };

  /**
   * جلب الأقسام الخاصة بالمؤسسة الحالية فقط
   */
  const useSecureDepartments = () => {
    return useQuery({
      queryKey: ['secure-departments', currentTenant?.id],
      queryFn: async () => {
        if (!currentTenant?.id) {
          console.warn('⚠️ لا توجد مؤسسة حالية - تم إرجاع قائمة فارغة');
          return [];
        }

        console.log('🔍 جلب أقسام المؤسسة:', currentTenant.name);

        const { data, error } = await supabase
          .from('departments')
          .select('id, department_name, is_active, tenant_id')
          .eq('tenant_id', currentTenant.id)
          .eq('is_active', true)
          .order('department_name');

        if (error) {
          console.error('❌ خطأ في جلب الأقسام:', error);
          throw error;
        }

        // التحقق من سلامة البيانات
        const validDepartments = (data || []).filter(dept => {
          if (dept.tenant_id !== currentTenant.id) {
            console.warn('⚠️ تم العثور على قسم من مؤسسة أخرى:', dept.department_name);
            return false;
          }
          return true;
        });

        console.log(`✅ تم جلب ${validDepartments.length} قسم من المؤسسة الحالية`);
        return validDepartments;
      },
      enabled: !!currentTenant?.id,
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    useSecureEmployees,
    useSecureDepartments,
  };
}
