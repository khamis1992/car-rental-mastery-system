
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TenantService } from '@/services/tenantService';
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
          console.warn('⚠️ useSecureEmployees: لا توجد مؤسسة حالية - تم إرجاع قائمة فارغة');
          return [];
        }

        console.log('🔍 useSecureEmployees: جلب موظفي المؤسسة:', currentTenant.name, 'ID:', currentTenant.id);

        try {
          // التحقق من حالة المؤسسة أولاً
          const { data: debugInfo } = await supabase.rpc('debug_user_tenant_status');
          console.log('🔧 معلومات التشخيص:', debugInfo);

          const { data, error } = await supabase
            .from('employees')
            .select(`
              id, 
              first_name, 
              last_name, 
              employee_number, 
              position, 
              status, 
              tenant_id,
              email,
              phone,
              national_id,
              department,
              department_id,
              hire_date,
              salary,
              manager_id,
              work_location_id,
              emergency_contact_name,
              emergency_contact_phone,
              bank_account_number,
              bank_name,
              address,
              created_at,
              updated_at,
              created_by,
              user_id
            `)
            .eq('tenant_id', currentTenant.id)
            .eq('status', 'active')
            .order('first_name', { ascending: true });

          if (error) {
            console.error('❌ useSecureEmployees: خطأ في جلب الموظفين:', error);
            throw new Error(`فشل في جلب الموظفين: ${error.message}`);
          }

          // التحقق من سلامة البيانات
          const validEmployees = (data || []).filter(emp => {
            if (emp.tenant_id !== currentTenant.id) {
              console.warn('⚠️ useSecureEmployees: تم العثور على موظف من مؤسسة أخرى:', emp.first_name, emp.last_name);
              return false;
            }
            return true;
          });

          console.log(`✅ useSecureEmployees: تم جلب ${validEmployees.length} موظف من المؤسسة الحالية`);
          return validEmployees;
        } catch (error) {
          console.error('❌ useSecureEmployees: خطأ عام:', error);
          throw error;
        }
      },
      enabled: !!currentTenant?.id,
      staleTime: 5 * 60 * 1000, // 5 دقائق
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
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
          console.warn('⚠️ useSecureDepartments: لا توجد مؤسسة حالية - تم إرجاع قائمة فارغة');
          return [];
        }

        console.log('🔍 useSecureDepartments: جلب أقسام المؤسسة:', currentTenant.name, 'ID:', currentTenant.id);

        try {
          const { data, error } = await supabase
            .from('departments')
            .select('id, department_name, is_active, tenant_id')
            .eq('tenant_id', currentTenant.id)
            .eq('is_active', true)
            .order('department_name');

          if (error) {
            console.error('❌ useSecureDepartments: خطأ في جلب الأقسام:', error);
            throw new Error(`فشل في جلب الأقسام: ${error.message}`);
          }

          // التحقق من سلامة البيانات
          const validDepartments = (data || []).filter(dept => {
            if (dept.tenant_id !== currentTenant.id) {
              console.warn('⚠️ useSecureDepartments: تم العثور على قسم من مؤسسة أخرى:', dept.department_name);
              return false;
            }
            return true;
          });

          console.log(`✅ useSecureDepartments: تم جلب ${validDepartments.length} قسم من المؤسسة الحالية`);
          return validDepartments;
        } catch (error) {
          console.error('❌ useSecureDepartments: خطأ عام:', error);
          throw error;
        }
      },
      enabled: !!currentTenant?.id,
      staleTime: 5 * 60 * 1000,
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
  };

  /**
   * جلب المواقع المكتبية الخاصة بالمؤسسة الحالية فقط
   */
  const useSecureOfficeLocations = () => {
    return useQuery({
      queryKey: ['secure-office-locations', currentTenant?.id],
      queryFn: async () => {
        if (!currentTenant?.id) {
          console.warn('⚠️ useSecureOfficeLocations: لا توجد مؤسسة حالية - تم إرجاع قائمة فارغة');
          return [];
        }

        console.log('🔍 useSecureOfficeLocations: جلب مواقع مكتبية للمؤسسة:', currentTenant.name, 'ID:', currentTenant.id);

        try {
          const { data, error } = await supabase
            .from('office_locations')
            .select('id, name, address, is_active, tenant_id')
            .eq('tenant_id', currentTenant.id)
            .eq('is_active', true)
            .order('name');

          if (error) {
            console.error('❌ useSecureOfficeLocations: خطأ في جلب المواقع المكتبية:', error);
            throw new Error(`فشل في جلب المواقع المكتبية: ${error.message}`);
          }

          // التحقق من سلامة البيانات
          const validLocations = (data || []).filter(location => {
            if (location.tenant_id !== currentTenant.id) {
              console.warn('⚠️ useSecureOfficeLocations: تم العثور على موقع من مؤسسة أخرى:', location.name);
              return false;
            }
            return true;
          });

          console.log(`✅ useSecureOfficeLocations: تم جلب ${validLocations.length} موقع مكتبي من المؤسسة الحالية`);
          return validLocations;
        } catch (error) {
          console.error('❌ useSecureOfficeLocations: خطأ عام:', error);
          throw error;
        }
      },
      enabled: !!currentTenant?.id,
      staleTime: 5 * 60 * 1000,
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
  };

  return {
    useSecureEmployees,
    useSecureDepartments,
    useSecureOfficeLocations,
  };
}
