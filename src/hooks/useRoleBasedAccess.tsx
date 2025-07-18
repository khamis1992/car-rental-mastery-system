import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
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
  
  // تحليلات النظام
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',
  
  // الأمان
  SECURITY_VIEW: 'security.view',
  SECURITY_MANAGE: 'security.manage',
  
  // التقارير
  REPORTS_VIEW: 'reports.view',
  REPORTS_CREATE: 'reports.create',
} as const;

// تعريف الأدوار
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  MANAGER: 'manager',
  ACCOUNTANT: 'accountant',
  RECEPTIONIST: 'receptionist',
  USER: 'user',
} as const;

// ربط الأدوار بالأذونات
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.SYSTEM_ADMIN,
    PERMISSIONS.SYSTEM_MAINTENANCE,
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.SYSTEM_LOGS,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.TENANT_VIEW,
    PERMISSIONS.TENANT_CREATE,
    PERMISSIONS.TENANT_EDIT,
    PERMISSIONS.TENANT_DELETE,
    PERMISSIONS.TENANT_IMPERSONATE,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.ROLE_VIEW,
    PERMISSIONS.ROLE_CREATE,
    PERMISSIONS.ROLE_EDIT,
    PERMISSIONS.ROLE_DELETE,
    PERMISSIONS.PERMISSION_MANAGE,
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_CREATE,
    PERMISSIONS.SUPPORT_MANAGE,
    PERMISSIONS.SUPPORT_ADMIN,
    PERMISSIONS.LANDING_VIEW,
    PERMISSIONS.LANDING_CREATE,
    PERMISSIONS.LANDING_EDIT,
    PERMISSIONS.LANDING_PUBLISH,
    PERMISSIONS.LANDING_DELETE,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.PAYMENT_PROCESS,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.SECURITY_VIEW,
    PERMISSIONS.SECURITY_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_CREATE,
  ],
  [ROLES.TENANT_ADMIN]: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.ROLE_VIEW,
    PERMISSIONS.ROLE_CREATE,
    PERMISSIONS.ROLE_EDIT,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.SECURITY_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  [ROLES.RECEPTIONIST]: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_CREATE,
  ],
  [ROLES.USER]: [
    // أذونات أساسية فقط
  ],
};

// أنواع البيانات
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: string[];
  tenant_id?: string;
  tenantId?: string;
  isActive: boolean;
  avatar?: string;
}

export interface RoleBasedAccessContextType {
  currentUser: User | null;
  impersonatedUser: User | null;
  isImpersonating: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canAccessModule: (module: string) => boolean;
  startImpersonation: (user: User) => Promise<void>;
  stopImpersonation: () => void;
  checkCriticalAccess: (action: string) => boolean;
  getEffectiveUser: () => User | null;
}

const RoleBasedAccessContext = createContext<RoleBasedAccessContextType | undefined>(undefined);

// مقدم السياق (Provider)  
interface RoleBasedAccessProviderProps {
  children: ReactNode;
  currentUser?: User;
}

export const RoleBasedAccessProvider: React.FC<RoleBasedAccessProviderProps> = ({ children, currentUser: providedUser }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const { toast } = useToast();

  // تحديد المستخدم الفعال
  const effectiveUser = impersonatedUser || currentUser;

  // تحميل بيانات المستخدم عند بدء تشغيل التطبيق
  useEffect(() => {
    if (providedUser) {
      setCurrentUser(providedUser);
    } else {
      // هنا يمكن تحميل بيانات المستخدم من API أو localStorage
      // مؤقتاً سنضع مستخدم افتراضي
      const mockUser: User = {
        id: '1',
        email: 'admin@system.com',
        name: 'مدير النظام',
        role: ROLES.SUPER_ADMIN,
        permissions: ROLE_PERMISSIONS[ROLES.SUPER_ADMIN],
        isActive: true
      };
      setCurrentUser(mockUser);
    }
  }, [providedUser]);

  // فحص الصلاحية الواحدة
  const hasPermission = (permission: string): boolean => {
    if (!effectiveUser) return false;
    
    // Super Admin لديه جميع الصلاحيات
    if (effectiveUser.role === ROLES.SUPER_ADMIN) return true;
    
    // فحص الصلاحيات المخصصة للمستخدم
    if (effectiveUser.permissions?.includes(permission)) return true;
    
    // فحص صلاحيات الدور
    const rolePermissions = ROLE_PERMISSIONS[effectiveUser.role] || [];
    return rolePermissions.includes(permission);
  };

  // فحص وجود أي من الصلاحيات
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  // فحص وجود جميع الصلاحيات
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  // فحص إمكانية الوصول للوحدة
  const canAccessModule = (module: string): boolean => {
    switch (module) {
      case 'system':
        return hasAnyPermission([
          PERMISSIONS.SYSTEM_ADMIN,
          PERMISSIONS.SYSTEM_MAINTENANCE,
          PERMISSIONS.SYSTEM_SETTINGS
        ]);
      case 'tenants':
        return hasAnyPermission([
          PERMISSIONS.TENANT_VIEW,
          PERMISSIONS.TENANT_CREATE,
          PERMISSIONS.TENANT_EDIT
        ]);
      case 'users':
        return hasAnyPermission([
          PERMISSIONS.USER_VIEW,
          PERMISSIONS.USER_CREATE,
          PERMISSIONS.USER_EDIT
        ]);
      case 'roles':
        return hasAnyPermission([
          PERMISSIONS.ROLE_VIEW,
          PERMISSIONS.ROLE_CREATE,
          PERMISSIONS.ROLE_EDIT
        ]);
      case 'support':
        return hasAnyPermission([
          PERMISSIONS.SUPPORT_VIEW,
          PERMISSIONS.SUPPORT_CREATE,
          PERMISSIONS.SUPPORT_MANAGE
        ]);
      case 'landing':
        return hasAnyPermission([
          PERMISSIONS.LANDING_VIEW,
          PERMISSIONS.LANDING_CREATE,
          PERMISSIONS.LANDING_EDIT
        ]);
      case 'billing':
        return hasAnyPermission([
          PERMISSIONS.BILLING_VIEW,
          PERMISSIONS.BILLING_MANAGE
        ]);
      case 'analytics':
        return hasPermission(PERMISSIONS.ANALYTICS_VIEW);
      case 'security':
        return hasAnyPermission([
          PERMISSIONS.SECURITY_VIEW,
          PERMISSIONS.SECURITY_MANAGE
        ]);
      default:
        return false;
    }
  };

  // بدء انتحال الهوية
  const startImpersonation = async (user: User): Promise<void> => {
    if (!hasPermission(PERMISSIONS.TENANT_IMPERSONATE)) {
      toast({
        title: 'غير مصرح',
        description: 'ليس لديك صلاحية انتحال هوية المستخدمين',
        variant: 'destructive'
      });
      return;
    }

    setImpersonatedUser(user);
    setIsImpersonating(true);
    
    toast({
      title: 'تم انتحال الهوية',
      description: `أصبحت تعمل باسم: ${user.email}`,
      variant: 'default'
    });

    // تسجيل هذا الإجراء في نظام التدقيق
    console.log(`User ${currentUser?.email} started impersonating ${user.email}`);
  };

  // إيقاف انتحال الهوية
  const stopImpersonation = (): void => {
    setImpersonatedUser(null);
    setIsImpersonating(false);
    
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

  // فحص الوصول للأعمال الحرجة
  const checkCriticalAccess = (action: string): boolean => {
    if (!effectiveUser) return false;
    
    // الأعمال الحرجة تتطلب Super Admin فقط
    const criticalActions = [
      'delete_tenant',
      'system_maintenance',
      'backup_system',
      'modify_roles'
    ];
    
    if (criticalActions.includes(action)) {
      return effectiveUser.role === ROLES.SUPER_ADMIN;
    }
    
    return true;
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
    isCriticalAction: (action: string) => checkCriticalAccess(action),
    hasMultiple: (permissions: string[]) => hasAllPermissions(permissions),
    hasAny: (permissions: string[]) => hasAnyPermission(permissions)
  };
};

// Hook الرئيسي
export const useRoleBasedAccess = (): RoleBasedAccessContextType => {
  const context = useContext(RoleBasedAccessContext);
  if (context === undefined) {
    throw new Error('useRoleBasedAccess must be used within a RoleBasedAccessProvider');
  }
  return context;
};

// Hook لفحص صلاحية واحدة
export const usePermission = (permission: string): boolean => {
  const { hasPermission } = useRoleBasedAccess();
  return hasPermission(permission);
};

// Hook لفحص الوصول للوحدة
export const useModuleAccess = (module: string): boolean => {
  const { canAccessModule } = useRoleBasedAccess();
  return canAccessModule(module);
};

// Additional hooks for API operations
export const useRoles = (tenantId?: string) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock data for now
      setRoles([
        { 
          id: '1', 
          name: 'super_admin',
          display_name: 'Super Admin', 
          description: 'مدير النظام العام',
          level: 1000,
          permissions: ROLE_PERMISSIONS[ROLES.SUPER_ADMIN], 
          is_active: true, 
          is_system: true, 
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tenant_id: tenantId
        },
        { 
          id: '2', 
          name: 'tenant_admin',
          display_name: 'Tenant Admin', 
          description: 'مدير المؤسسة',
          level: 900,
          permissions: ROLE_PERMISSIONS[ROLES.TENANT_ADMIN], 
          is_active: true, 
          is_system: true, 
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tenant_id: tenantId
        },
        { 
          id: '3', 
          name: 'manager',
          display_name: 'Manager', 
          description: 'مدير',
          level: 500,
          permissions: ROLE_PERMISSIONS[ROLES.MANAGER], 
          is_active: true, 
          is_system: true, 
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tenant_id: tenantId
        },
        { 
          id: '4', 
          name: 'accountant',
          display_name: 'Accountant', 
          description: 'محاسب',
          level: 300,
          permissions: ROLE_PERMISSIONS[ROLES.ACCOUNTANT], 
          is_active: true, 
          is_system: true, 
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tenant_id: tenantId
        },
        { 
          id: '5', 
          name: 'receptionist',
          display_name: 'Receptionist', 
          description: 'موظف استقبال',
          level: 200,
          permissions: ROLE_PERMISSIONS[ROLES.RECEPTIONIST], 
          is_active: true, 
          is_system: true, 
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tenant_id: tenantId
        },
        { 
          id: '6', 
          name: 'user',
          display_name: 'User', 
          description: 'مستخدم عادي',
          level: 100,
          permissions: ROLE_PERMISSIONS[ROLES.USER], 
          is_active: true, 
          is_system: true, 
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tenant_id: tenantId
        },
      ]);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [tenantId]);

  return { data: roles, isLoading: loading, error, refetch: fetchRoles };
};

export const usePermissionsByCategory = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    try {
      const permissions = [
        {
          category: 'إدارة النظام',
          permissions: [
            { id: PERMISSIONS.SYSTEM_ADMIN, name: 'إدارة النظام', description: 'الوصول الكامل لإعدادات النظام' },
            { id: PERMISSIONS.SYSTEM_MAINTENANCE, name: 'صيانة النظام', description: 'إجراء صيانة وتحديثات النظام' },
            { id: PERMISSIONS.SYSTEM_BACKUP, name: 'النسخ الاحتياطي', description: 'إنشاء واستعادة النسخ الاحتياطية' },
            { id: PERMISSIONS.SYSTEM_LOGS, name: 'سجلات النظام', description: 'عرض وإدارة سجلات النظام' },
            { id: PERMISSIONS.SYSTEM_SETTINGS, name: 'إعدادات النظام', description: 'تعديل إعدادات النظام العامة' },
          ]
        },
        {
          category: 'إدارة المؤسسات',
          permissions: [
            { id: PERMISSIONS.TENANT_VIEW, name: 'عرض المؤسسات', description: 'عرض قائمة المؤسسات' },
            { id: PERMISSIONS.TENANT_CREATE, name: 'إنشاء مؤسسة', description: 'إنشاء مؤسسات جديدة' },
            { id: PERMISSIONS.TENANT_EDIT, name: 'تعديل المؤسسة', description: 'تعديل بيانات المؤسسات' },
            { id: PERMISSIONS.TENANT_DELETE, name: 'حذف المؤسسة', description: 'حذف المؤسسات' },
            { id: PERMISSIONS.TENANT_IMPERSONATE, name: 'انتحال الهوية', description: 'انتحال هوية مستخدمي المؤسسات' },
          ]
        },
        {
          category: 'إدارة المستخدمين',
          permissions: [
            { id: PERMISSIONS.USER_VIEW, name: 'عرض المستخدمين', description: 'عرض قائمة المستخدمين' },
            { id: PERMISSIONS.USER_CREATE, name: 'إنشاء مستخدم', description: 'إنشاء مستخدمين جدد' },
            { id: PERMISSIONS.USER_EDIT, name: 'تعديل المستخدم', description: 'تعديل بيانات المستخدمين' },
            { id: PERMISSIONS.USER_DELETE, name: 'حذف المستخدم', description: 'حذف المستخدمين' },
          ]
        },
        {
          category: 'إدارة الأدوار',
          permissions: [
            { id: PERMISSIONS.ROLE_VIEW, name: 'عرض الأدوار', description: 'عرض قائمة الأدوار' },
            { id: PERMISSIONS.ROLE_CREATE, name: 'إنشاء دور', description: 'إنشاء أدوار جديدة' },
            { id: PERMISSIONS.ROLE_EDIT, name: 'تعديل الدور', description: 'تعديل الأدوار الموجودة' },
            { id: PERMISSIONS.ROLE_DELETE, name: 'حذف الدور', description: 'حذف الأدوار' },
            { id: PERMISSIONS.PERMISSION_MANAGE, name: 'إدارة الصلاحيات', description: 'إدارة صلاحيات الأدوار' },
          ]
        }
      ];
      setData(permissions);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error };
};

export const usePermissionCategories = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    try {
      const categories = [
        'إدارة النظام',
        'إدارة المؤسسات', 
        'إدارة المستخدمين',
        'إدارة الأدوار',
        'الدعم الفني',
        'محرر الصفحات',
        'المالية والفوترة',
        'التحليلات',
        'الأمان'
      ];
      setData(categories);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error };
};

export const useCreateRole = () => {
  const { toast } = useToast();

  const createRole = async (roleData: any) => {
    try {
      // Mock API call
      console.log('Creating role:', roleData);
      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء الدور بنجاح',
      });
      return { success: true };
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنشاء الدور',
        variant: 'destructive'
      });
      throw error;
    }
  };

  return { mutateAsync: createRole, isPending: false };
};

export const useUpdateRole = () => {
  const { toast } = useToast();

  const updateRole = async ({ id, updates }: { id: string; updates: any }) => {
    try {
      // Mock API call
      console.log('Updating role:', id, updates);
      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث الدور بنجاح',
      });
      return { success: true };
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الدور',
        variant: 'destructive'
      });
      throw error;
    }
  };

  return { mutateAsync: updateRole, isPending: false };
};

export const useDeleteRole = () => {
  const { toast } = useToast();

  const deleteRole = async (id: string) => {
    try {
      // Mock API call
      console.log('Deleting role:', id);
      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الدور بنجاح',
      });
      return { success: true };
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الدور',
        variant: 'destructive'
      });
      throw error;
    }
  };

  return { mutateAsync: deleteRole, isPending: false };
};

export const useAuditLogs = (tenantId?: string, userId?: string, limit: number = 50) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Mock data
      setLogs([
        {
          id: '1',
          action: 'create_role',
          user: 'admin@system.com',
          timestamp: new Date().toISOString(),
          details: 'تم إنشاء دور جديد: Manager'
        },
        {
          id: '2',
          action: 'update_permissions',
          user: 'admin@system.com',
          timestamp: new Date().toISOString(),
          details: 'تم تحديث صلاحيات دور Accountant'
        }
      ]);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [tenantId, userId, limit]);

  return { data: logs, isLoading: loading };
};

export const usePermissionSystemStats = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const mockStats = {
      total_roles: 6,
      total_permissions: Object.keys(PERMISSIONS).length,
      active_users: 150,
      system_admins: 3
    };
    setStats(mockStats);
    setIsLoading(false);
  }, []);

  return { data: stats, isLoading };
};

// Protected Component
interface ProtectedComponentProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({ 
  children, 
  permission, 
  permissions = [], 
  requireAll = false, 
  fallback = null 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useRoleBasedAccess();
  
  let hasAccess = true;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

export default useRoleBasedAccess;