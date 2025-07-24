import { useTenant } from '@/contexts/TenantContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

interface UserTenantContext {
  user_id: string;
  email: string;
  role: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  tenant_status: string;
  is_super_admin: boolean;
  permissions: {
    can_manage_users: boolean;
    can_manage_accounting: boolean;
    can_manage_vehicles: boolean;
    can_view_reports: boolean;
    can_manage_contracts: boolean;
  };
}

export const useTenantPermissions = (): TenantPermissions => {
  const { currentUserRole } = useTenant();
  const [secureContext, setSecureContext] = useState<UserTenantContext | null>(null);

  // جلب السياق الآمن من النظام المحدث
  useEffect(() => {
    const fetchSecureContext = async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_tenant_context');
        if (!error && data) {
          setSecureContext(data as unknown as UserTenantContext);
        } else if (error) {
          console.warn('تحذير أمني: فشل في جلب السياق الآمن:', error);
        }
      } catch (error) {
        console.error('خطأ في جلب السياق الآمن:', error);
      }
    };

    fetchSecureContext();
  }, [currentUserRole]);

  // استخدام النظام الجديد مع fallback للنظام القديم
  const effectiveRole = secureContext?.role || currentUserRole;
  const isSuperAdmin = effectiveRole === 'super_admin' || secureContext?.is_super_admin;
  const isTenantAdmin = effectiveRole === 'tenant_admin';
  const isManager = effectiveRole === 'manager';
  const isAccountant = effectiveRole === 'accountant';
  const isReceptionist = effectiveRole === 'receptionist';
  const isUser = effectiveRole === 'user';

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
  const [secureContext, setSecureContext] = useState<UserTenantContext | null>(null);

  // جلب السياق الآمن من النظام الجديد
  useEffect(() => {
    const fetchSecureContext = async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_tenant_context');
        if (!error && data) {
          setSecureContext(data as unknown as UserTenantContext);
        }
      } catch (error) {
        console.error('Error fetching secure context:', error);
      }
    };

    fetchSecureContext();
  }, [currentUserRole]);

  // استخدام النظام الجديد مع fallback للنظام القديم
  const effectiveRole = secureContext?.role || currentUserRole;

  return {
    isSuperAdmin: effectiveRole === 'super_admin' || secureContext?.is_super_admin,
    isTenantAdmin: effectiveRole === 'tenant_admin',
    isManager: effectiveRole === 'manager',
    isAccountant: effectiveRole === 'accountant',
    isReceptionist: effectiveRole === 'receptionist',
    isUser: effectiveRole === 'user',
    hasAdminAccess: ['super_admin', 'tenant_admin'].includes(effectiveRole || ''),
    hasManagerAccess: ['super_admin', 'tenant_admin', 'manager'].includes(effectiveRole || ''),
    hasAccountingAccess: ['super_admin', 'tenant_admin', 'manager', 'accountant'].includes(effectiveRole || ''),
    hasStaffAccess: ['super_admin', 'tenant_admin', 'manager', 'accountant', 'receptionist'].includes(effectiveRole || ''),
    currentRole: effectiveRole,
    secureContext,
  };
};