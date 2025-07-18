import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useCheckPermission, useUserRole } from '@/hooks/usePermissions';

/**
 * Hook للتحقق من صلاحية واحدة
 */
export const useCanAccess = (permission: string) => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  const permissionCheck = useCheckPermission(permission, user?.id, currentTenant?.id);
  
  return {
    canAccess: permissionCheck.data === true,
    isLoading: permissionCheck.isLoading,
    error: permissionCheck.error
  };
};

/**
 * Hook للتحقق من عدة صلاحيات
 */
export const useCanAccessMultiple = (permissions: string[], requireAll: boolean = true) => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  const permissionChecks = permissions.map(permission => 
    useCheckPermission(permission, user?.id, currentTenant?.id)
  );
  
  const isLoading = permissionChecks.some(check => check.isLoading);
  const results = permissionChecks.map(check => check.data === true);
  
  const canAccess = requireAll 
    ? results.every(result => result)
    : results.some(result => result);
  
  return {
    canAccess,
    isLoading,
    results: Object.fromEntries(
      permissions.map((permission, index) => [permission, results[index]])
    )
  };
};

/**
 * Hook للتحقق من الدور الحالي
 */
export const useCurrentRole = () => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  const roleQuery = useUserRole(user?.id, currentTenant?.id);
  
  return {
    role: roleQuery.data,
    isLoading: roleQuery.isLoading,
    error: roleQuery.error,
    // Shortcuts للأدوار الشائعة
    isSuperAdmin: roleQuery.data?.name === 'super_admin',
    isTenantAdmin: roleQuery.data?.name === 'tenant_admin',
    isManager: roleQuery.data?.name === 'manager',
    isAccountant: roleQuery.data?.name === 'accountant',
    isReceptionist: roleQuery.data?.name === 'receptionist',
    // مستوى الدور
    level: roleQuery.data?.level,
    // التحقق من مستوى الإدارة
    canManageSystem: roleQuery.data?.level !== undefined && roleQuery.data.level <= 0,
    canManageTenant: roleQuery.data?.level !== undefined && roleQuery.data.level <= 10,
    canManageUsers: roleQuery.data?.level !== undefined && roleQuery.data.level <= 20,
  };
};

/**
 * صلاحيات شائعة للاستخدام المباشر
 */
export const useCommonPermissions = () => {
  const canManageUsers = useCanAccess('users.manage');
  const canViewUsers = useCanAccess('users.view');
  const canManageVehicles = useCanAccess('fleet.vehicles.manage');
  const canViewVehicles = useCanAccess('fleet.vehicles.view');
  const canManageContracts = useCanAccess('business.contracts.manage');
  const canViewContracts = useCanAccess('business.contracts.view');
  const canManageAccounting = useCanAccess('finance.accounting.manage');
  const canManageSystem = useCanAccess('system.settings');
  
  return {
    // إدارة المستخدمين
    canManageUsers: canManageUsers.canAccess,
    canViewUsers: canViewUsers.canAccess,
    
    // إدارة المركبات
    canManageVehicles: canManageVehicles.canAccess,
    canViewVehicles: canViewVehicles.canAccess,
    
    // إدارة العقود
    canManageContracts: canManageContracts.canAccess,
    canViewContracts: canViewContracts.canAccess,
    
    // إدارة المحاسبة
    canManageAccounting: canManageAccounting.canAccess,
    
    // إدارة النظام
    canManageSystem: canManageSystem.canAccess,
    
    // حالة التحميل
    isLoading: [
      canManageUsers, canViewUsers, canManageVehicles, canViewVehicles,
      canManageContracts, canViewContracts, canManageAccounting, canManageSystem
    ].some(check => check.isLoading)
  };
}; 