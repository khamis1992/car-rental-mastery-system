import { useTenant } from '@/contexts/TenantContext';

export interface TenantPermissions {
  canCreateTenants: boolean;
  canManageUsers: boolean;
  canManageVehicles: boolean;
  canManageContracts: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canManageAccounting: boolean;
  canDeleteData: boolean;
  canExportData: boolean;
  canManageBilling: boolean;
}

export const useTenantPermissions = (): TenantPermissions => {
  const { currentUserRole } = useTenant();

  // استخدام النظام الجديد مع fallback للنظام القديم
  const isSuperAdmin = currentUserRole === 'super_admin';
  const isTenantAdmin = currentUserRole === 'tenant_admin';
  const isManager = currentUserRole === 'manager';
  const isAccountant = currentUserRole === 'accountant';
  const isReceptionist = currentUserRole === 'receptionist';
  const isUser = currentUserRole === 'user';

  return {
    // Super admin permissions
    canCreateTenants: isSuperAdmin,
    
    // Admin and manager permissions
    canManageUsers: isSuperAdmin || isTenantAdmin || isManager,
    canManageVehicles: isSuperAdmin || isTenantAdmin || isManager,
    canManageSettings: isSuperAdmin || isTenantAdmin || isManager,
    canDeleteData: isSuperAdmin || isTenantAdmin,
    canExportData: isSuperAdmin || isTenantAdmin || isManager || isAccountant,
    canManageBilling: isSuperAdmin || isTenantAdmin,
    
    // Contract management
    canManageContracts: isSuperAdmin || isTenantAdmin || isManager || isReceptionist,
    
    // Reporting access
    canViewReports: isSuperAdmin || isTenantAdmin || isManager || isAccountant,
    
    // Accounting permissions
    canManageAccounting: isSuperAdmin || isTenantAdmin || isManager || isAccountant,
  };
};

export const useTenantRoleCheck = () => {
  const { currentUserRole } = useTenant();

  return {
    isSuperAdmin: currentUserRole === 'super_admin',
    isTenantAdmin: currentUserRole === 'tenant_admin',
    isManager: currentUserRole === 'manager',
    isAccountant: currentUserRole === 'accountant',
    isReceptionist: currentUserRole === 'receptionist',
    isUser: currentUserRole === 'user',
    hasAdminAccess: ['super_admin', 'tenant_admin'].includes(currentUserRole || ''),
    hasManagerAccess: ['super_admin', 'tenant_admin', 'manager'].includes(currentUserRole || ''),
    hasAccountingAccess: ['super_admin', 'tenant_admin', 'manager', 'accountant'].includes(currentUserRole || ''),
    hasStaffAccess: ['super_admin', 'tenant_admin', 'manager', 'accountant', 'receptionist'].includes(currentUserRole || ''),
    currentRole: currentUserRole,
  };
};