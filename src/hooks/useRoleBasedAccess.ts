import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

// تعريف الأذونات المتاحة
export const PERMISSIONS = {
  // إدارة النظام
  SYSTEM_ADMIN: 'system.admin',
  SYSTEM_MAINTENANCE: 'system.maintenance',
  SYSTEM_BACKUP: 'system.backup',
  SYSTEM_LOGS: 'system.logs',
  SYSTEM_SETTINGS: 'system.settings',
  
  // إدارة المؤسسات
  TENANT_VIEW: 'tenant.view',
  TENANT_CREATE: 'tenant.create',
  TENANT_EDIT: 'tenant.edit',
  TENANT_DELETE: 'tenant.delete',
  TENANT_IMPERSONATE: 'tenant.impersonate',
  
  // إدارة المستخدمين
  USER_VIEW: 'user.view',
  USER_CREATE: 'user.create',
  USER_EDIT: 'user.edit',
  USER_DELETE: 'user.delete',
  
  // إدارة الأدوار والصلاحيات
  ROLE_VIEW: 'role.view',
  ROLE_CREATE: 'role.create',
  ROLE_EDIT: 'role.edit',
  ROLE_DELETE: 'role.delete',
  PERMISSION_MANAGE: 'permission.manage',
  
  // الدعم الفني
  SUPPORT_VIEW: 'support.view',
  SUPPORT_CREATE: 'support.create',
  SUPPORT_MANAGE: 'support.manage',
  SUPPORT_ADMIN: 'support.admin',
  
  // محرر الصفحات
  LANDING_VIEW: 'landing.view',
  LANDING_CREATE: 'landing.create',
  LANDING_EDIT: 'landing.edit',
  LANDING_PUBLISH: 'landing.publish',
  LANDING_DELETE: 'landing.delete',
  
  // المالية والفوترة
  BILLING_VIEW: 'billing.view',
  BILLING_MANAGE: 'billing.manage',
  INVOICE_CREATE: 'invoice.create',
  PAYMENT_PROCESS: 'payment.process',
  
  // التقارير والتحليلات
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  ANALYTICS_VIEW: 'analytics.view'
} as const;

// تعريف الأدوار وصلاحياتها
export const ROLE_PERMISSIONS = {
  'super-admin': [
    // Super Admin له جميع الصلاحيات
    ...Object.values(PERMISSIONS)
  ],
  'tenant-admin': [
    // مدير المؤسسة
    PERMISSIONS.TENANT_VIEW,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.ROLE_VIEW,
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_CREATE,
    PERMISSIONS.LANDING_VIEW,
    PERMISSIONS.LANDING_CREATE,
    PERMISSIONS.LANDING_EDIT,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ],
  'manager': [
    // مدير
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_CREATE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.BILLING_VIEW
  ],
  'accountant': [
    // محاسب
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT
  ],
  'support': [
    // موظف دعم
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_CREATE,
    PERMISSIONS.SUPPORT_MANAGE,
    PERMISSIONS.USER_VIEW
  ],
  'user': [
    // مستخدم عادي
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_CREATE
  ]
} as const;

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId?: string;
  isActive: boolean;
  permissions?: string[];
}

interface RoleBasedAccessContextType {
  currentUser: User | null;
  impersonatedUser: User | null;
  isImpersonating: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canAccessModule: (module: string) => boolean;
  startImpersonation: (user: User) => void;
  stopImpersonation: () => void;
  checkCriticalAccess: (action: string) => boolean;
  getEffectiveUser: () => User | null;
}

const RoleBasedAccessContext = createContext<RoleBasedAccessContextType | null>(null);

export const useRoleBasedAccess = () => {
  const context = useContext(RoleBasedAccessContext);
  if (!context) {
    throw new Error('useRoleBasedAccess must be used within a RoleBasedAccessProvider');
  }
  return context;
};

interface RoleBasedAccessProviderProps {
  children: ReactNode;
  currentUser: User | null;
}

export const RoleBasedAccessProvider = ({ children, currentUser }: RoleBasedAccessProviderProps) => {
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const { toast } = useToast();

  const isImpersonating = impersonatedUser !== null;
  const effectiveUser = impersonatedUser || currentUser;

  // الحصول على صلاحيات المستخدم
  const getUserPermissions = (user: User | null): string[] => {
    if (!user) return [];
    
    // صلاحيات مخصصة للمستخدم
    if (user.permissions) {
      return user.permissions;
    }
    
    // صلاحيات الدور
    const rolePermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS];
    return rolePermissions || [];
  };

  // فحص صلاحية واحدة
  const hasPermission = (permission: string): boolean => {
    const permissions = getUserPermissions(effectiveUser);
    return permissions.includes(permission);
  };

  // فحص أي من الصلاحيات
  const hasAnyPermission = (permissions: string[]): boolean => {
    const userPermissions = getUserPermissions(effectiveUser);
    return permissions.some(permission => userPermissions.includes(permission));
  };

  // فحص جميع الصلاحيات
  const hasAllPermissions = (permissions: string[]): boolean => {
    const userPermissions = getUserPermissions(effectiveUser);
    return permissions.every(permission => userPermissions.includes(permission));
  };

  // فحص الوصول للوحات الرئيسية
  const canAccessModule = (module: string): boolean => {
    const modulePermissions = {
      'tenant-management': [PERMISSIONS.TENANT_VIEW],
      'user-management': [PERMISSIONS.USER_VIEW],
      'role-management': [PERMISSIONS.ROLE_VIEW],
      'support-tools': [PERMISSIONS.SUPPORT_VIEW],
      'maintenance-tools': [PERMISSIONS.SYSTEM_MAINTENANCE],
      'landing-page-editor': [PERMISSIONS.LANDING_VIEW],
      'billing-management': [PERMISSIONS.BILLING_VIEW],
      'system-settings': [PERMISSIONS.SYSTEM_SETTINGS],
      'system-logs': [PERMISSIONS.SYSTEM_LOGS],
      'backup-tools': [PERMISSIONS.SYSTEM_BACKUP]
    };

    const requiredPermissions = modulePermissions[module as keyof typeof modulePermissions];
    if (!requiredPermissions) return true; // إذا لم تكن هناك صلاحيات محددة، السماح بالوصول

    return hasAnyPermission(requiredPermissions);
  };

  // فحص الوصول للعمليات الحرجة
  const checkCriticalAccess = (action: string): boolean => {
    const criticalActions = {
      'delete-tenant': [PERMISSIONS.TENANT_DELETE],
      'backup-system': [PERMISSIONS.SYSTEM_BACKUP],
      'maintenance-mode': [PERMISSIONS.SYSTEM_MAINTENANCE],
      'publish-landing': [PERMISSIONS.LANDING_PUBLISH],
      'manage-permissions': [PERMISSIONS.PERMISSION_MANAGE],
      'process-payment': [PERMISSIONS.PAYMENT_PROCESS],
      'view-system-logs': [PERMISSIONS.SYSTEM_LOGS]
    };

    const requiredPermissions = criticalActions[action as keyof typeof criticalActions];
    if (!requiredPermissions) return false;

    return hasAllPermissions(requiredPermissions);
  };

  // بدء انتحال الهوية
  const startImpersonation = (user: User) => {
    // فقط Super Admin يمكنه انتحال الهويات
    if (!hasPermission(PERMISSIONS.TENANT_IMPERSONATE)) {
      toast({
        title: 'غير مسموح',
        description: 'ليس لديك صلاحية لانتحال هوية المستخدمين',
        variant: 'destructive'
      });
      return;
    }

    // منع انتحال هوية Super Admin آخر
    if (user.role === 'super-admin' && currentUser?.role !== 'super-admin') {
      toast({
        title: 'غير مسموح',
        description: 'لا يمكن انتحال هوية مدير النظام',
        variant: 'destructive'
      });
      return;
    }

    setImpersonatedUser(user);
    toast({
      title: 'تم بدء انتحال الهوية',
      description: `أنت الآن تتصفح بهوية ${user.name}`,
      variant: 'default'
    });
  };

  // إيقاف انتحال الهوية
  const stopImpersonation = () => {
    setImpersonatedUser(null);
    toast({
      title: 'تم إيقاف انتحال الهوية',
      description: 'عدت إلى هويتك الأصلية',
      variant: 'default'
    });
  };

  // الحصول على المستخدم الفعال
  const getEffectiveUser = (): User | null => {
    return effectiveUser;
  };

  const contextValue: RoleBasedAccessContextType = {
    currentUser,
    impersonatedUser,
    isImpersonating,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule,
    startImpersonation,
    stopImpersonation,
    checkCriticalAccess,
    getEffectiveUser
  };

  return (
    <RoleBasedAccessContext.Provider value={contextValue}>
      {children}
    </RoleBasedAccessContext.Provider>
  );
};

// Hook لفحص الصلاحيات بسهولة
export const usePermissions = () => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, checkCriticalAccess } = useRoleBasedAccess();
  
  return {
    canView: (resource: string) => hasPermission(`${resource}.view`),
    canCreate: (resource: string) => hasPermission(`${resource}.create`),
    canEdit: (resource: string) => hasPermission(`${resource}.edit`),
    canDelete: (resource: string) => hasPermission(`${resource}.delete`),
    canManage: (resource: string) => hasPermission(`${resource}.manage`),
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkCriticalAccess
  };
};

// Component للحماية بناءً على الصلاحيات
interface ProtectedComponentProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  module?: string;
}

export const ProtectedComponent = ({ 
  children, 
  permission, 
  permissions = [], 
  requireAll = false,
  fallback = null,
  module
}: ProtectedComponentProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccessModule } = useRoleBasedAccess();

  let hasAccess = true;

  if (module) {
    hasAccess = canAccessModule(module);
  } else if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default useRoleBasedAccess; 