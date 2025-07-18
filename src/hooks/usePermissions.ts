import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { permissionsService, type Permission, type Role, type PermissionCategory, type PermissionAuditLog } from '@/services/permissionsService';
import { useToast } from '@/hooks/use-toast';

// ==========================================
// Permission Categories Hooks
// ==========================================

export const usePermissionCategories = () => {
  return useQuery({
    queryKey: ['permission-categories'],
    queryFn: () => permissionsService.getCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // لا تعيد المحاولة إذا كان السبب عدم وجود الجداول
      if (error && error.message && error.message.includes('does not exist')) {
        return false;
      }
      return failureCount < 2;
    }
  });
};

// ==========================================
// Permissions Hooks
// ==========================================

export const usePermissions = (categoryId?: string) => {
  return useQuery({
    queryKey: ['permissions', categoryId],
    queryFn: () => permissionsService.getPermissions(categoryId),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error && error.message && error.message.includes('does not exist')) {
        return false;
      }
      return failureCount < 2;
    }
  });
};

export const usePermissionsByCategory = () => {
  return useQuery({
    queryKey: ['permissions-by-category'],
    queryFn: () => permissionsService.getPermissionsByCategory(),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error && error.message && error.message.includes('does not exist')) {
        return false;
      }
      return failureCount < 2;
    }
  });
};

export const useCreatePermission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (permission: Omit<Permission, 'id' | 'category'>) => 
      permissionsService.createPermission(permission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['permissions-by-category'] });
      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء الصلاحية الجديدة',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إنشاء الصلاحية',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdatePermission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Permission> }) =>
      permissionsService.updatePermission(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['permissions-by-category'] });
      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث الصلاحية',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث الصلاحية',
        variant: 'destructive',
      });
    },
  });
};

// ==========================================
// Roles Hooks
// ==========================================

export const useRoles = (tenantId?: string, includeGlobal: boolean = true) => {
  return useQuery({
    queryKey: ['roles', tenantId, includeGlobal],
    queryFn: () => permissionsService.getRoles(tenantId, includeGlobal),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      if (error && error.message && error.message.includes('does not exist')) {
        return false;
      }
      return failureCount < 2;
    }
  });
};

export const useRole = (id: string) => {
  return useQuery({
    queryKey: ['role', id],
    queryFn: () => permissionsService.getRoleById(id),
    enabled: !!id,
    retry: (failureCount, error) => {
      if (error && error.message && error.message.includes('does not exist')) {
        return false;
      }
      return failureCount < 2;
    }
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (role: Omit<Role, 'id' | 'user_count' | 'permissions'>) =>
      permissionsService.createRole(role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء الدور الجديد',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إنشاء الدور',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Role> }) =>
      permissionsService.updateRole(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role'] });
      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث الدور',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث الدور',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => permissionsService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الدور',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حذف الدور',
        variant: 'destructive',
      });
    },
  });
};

// ==========================================
// Role Permissions Hooks
// ==========================================

export const useRolePermissions = (roleId: string) => {
  return useQuery({
    queryKey: ['role-permissions', roleId],
    queryFn: () => permissionsService.getRolePermissions(roleId),
    enabled: !!roleId,
    retry: (failureCount, error) => {
      if (error && error.message && error.message.includes('does not exist')) {
        return false;
      }
      return failureCount < 2;
    }
  });
};

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      permissionsService.updateRolePermissions(roleId, permissionIds),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', roleId] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', roleId] });
      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث صلاحيات الدور',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث صلاحيات الدور',
        variant: 'destructive',
      });
    },
  });
};

// ==========================================
// User Permission Hooks
// ==========================================

export const useUserPermissions = (userId?: string, tenantId?: string) => {
  return useQuery({
    queryKey: ['user-permissions', userId, tenantId],
    queryFn: () => permissionsService.getUserPermissions(userId!, tenantId),
    enabled: !!userId,
    retry: (failureCount, error) => {
      if (error && error.message && error.message.includes('does not exist')) {
        return false;
      }
      return failureCount < 2;
    }
  });
};

export const useUserRole = (userId?: string, tenantId?: string) => {
  return useQuery({
    queryKey: ['user-role', userId, tenantId],
    queryFn: () => permissionsService.getUserRole(userId!, tenantId),
    enabled: !!userId,
    retry: (failureCount, error) => {
      if (error && error.message && error.message.includes('does not exist')) {
        return false;
      }
      return failureCount < 2;
    }
  });
};

export const useCheckPermission = (permissionName: string, userId?: string, tenantId?: string) => {
  return useQuery({
    queryKey: ['check-permission', permissionName, userId, tenantId],
    queryFn: () => permissionsService.checkUserPermission(userId!, permissionName, tenantId),
    enabled: !!userId && !!permissionName,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      if (error && error.message && error.message.includes('does not exist')) {
        return false;
      }
      return failureCount < 2;
    }
  });
};

// ==========================================
// Current User Permission Hooks
// ==========================================

export const useCurrentUserPermissions = () => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  return useUserPermissions(user?.id, currentTenant?.id);
};

export const useCurrentUserRole = () => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  return useUserRole(user?.id, currentTenant?.id);
};

export const useHasPermission = (permissionName: string) => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  return useCheckPermission(permissionName, user?.id, currentTenant?.id);
};

// ==========================================
// Audit Logs Hooks - with fallback
// ==========================================

export const useAuditLogs = (tenantId?: string, userId?: string, limit: number = 100, offset: number = 0) => {
  return useQuery({
    queryKey: ['audit-logs', tenantId, userId, limit, offset],
    queryFn: () => permissionsService.getAuditLogs(),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: false // لا تعيد المحاولة للحصول على سجلات التتبع
  });
};

// ==========================================
// System Stats Hooks
// ==========================================

export const usePermissionSystemStats = () => {
  return useQuery({
    queryKey: ['permission-system-stats'],
    queryFn: () => permissionsService.getSystemStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error && error.message && error.message.includes('does not exist')) {
        return false;
      }
      return failureCount < 2;
    }
  });
};

// ==========================================
// Bulk Operations Hooks
// ==========================================

export const useBulkAssignRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userIds, roleId, tenantId }: { userIds: string[]; roleId: string; tenantId: string }) =>
      permissionsService.bulkAssignRole(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      toast({
        title: 'تم بنجاح',
        description: 'تم تعيين الأدوار للمستخدمين',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تعيين الأدوار',
        variant: 'destructive',
      });
    },
  });
};

// ==========================================
// Permission Guards (Custom Hooks for Components)
// ==========================================

/**
 * Hook لحماية المكونات بناءً على الصلاحيات
 * يُرجع true إذا كان المستخدم لديه الصلاحية المطلوبة
 */
export const usePermissionGuard = (requiredPermission: string | string[]) => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
  
  const permissionChecks = permissions.map(permission => 
    useCheckPermission(permission, user?.id, currentTenant?.id)
  );
  
  const isLoading = permissionChecks.some(check => check.isLoading);
  const hasAllPermissions = permissionChecks.every(check => check.data === true);
  const hasAnyPermission = permissionChecks.some(check => check.data === true);
  
  return {
    isLoading,
    hasAllPermissions,
    hasAnyPermission,
    canAccess: hasAllPermissions, // Default to requiring all permissions
  };
};

/**
 * Hook للتحقق من مستوى الدور
 */
export const useRoleLevel = () => {
  const currentRole = useCurrentUserRole();
  
  return {
    isLoading: currentRole.isLoading,
    roleLevel: currentRole.data?.level,
    isSuperAdmin: currentRole.data?.name === 'super_admin',
    isTenantAdmin: currentRole.data?.name === 'tenant_admin',
    isManager: currentRole.data?.name === 'manager',
    isAccountant: currentRole.data?.name === 'accountant',
    canManageUsers: currentRole.data?.level !== undefined && currentRole.data.level <= 20,
    canManageSystem: currentRole.data?.level !== undefined && currentRole.data.level <= 10,
  };
};

/**
 * Hook لحماية الصفحات بناءً على مستوى الدور
 */
export const useRoleGuard = (minLevel: number) => {
  const { roleLevel, isLoading } = useRoleLevel();
  
  return {
    isLoading,
    canAccess: roleLevel !== undefined && roleLevel <= minLevel,
    roleLevel,
  };
}; 