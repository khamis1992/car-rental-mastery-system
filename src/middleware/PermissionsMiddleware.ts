import { permissionsService } from '@/services/permissionsService';
import { supabase } from '@/integrations/supabase/client';

export interface PermissionContext {
  userId: string;
  tenantId?: string;
  userRole?: string;
}

export class PermissionsMiddleware {
  
  /**
   * التحقق من صلاحية واحدة
   */
  static async checkPermission(
    context: PermissionContext,
    permission: string
  ): Promise<boolean> {
    try {
      return await permissionsService.checkUserPermission(
        context.userId,
        permission,
        context.tenantId
      );
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * التحقق من عدة صلاحيات
   */
  static async checkPermissions(
    context: PermissionContext,
    permissions: string[],
    requireAll: boolean = true
  ): Promise<{ hasAccess: boolean; results: Record<string, boolean> }> {
    try {
      const results = await Promise.all(
        permissions.map(async (permission) => ({
          permission,
          hasAccess: await permissionsService.checkUserPermission(
            context.userId,
            permission,
            context.tenantId
          )
        }))
      );

      const resultMap = results.reduce((acc, { permission, hasAccess }) => {
        acc[permission] = hasAccess;
        return acc;
      }, {} as Record<string, boolean>);

      const hasAccess = requireAll
        ? results.every(r => r.hasAccess)
        : results.some(r => r.hasAccess);

      return { hasAccess, results: resultMap };
    } catch (error) {
      console.error('Permissions check failed:', error);
      return { 
        hasAccess: false, 
        results: permissions.reduce((acc, p) => ({ ...acc, [p]: false }), {})
      };
    }
  }

  /**
   * التحقق من مستوى الدور
   */
  static async checkRoleLevel(
    context: PermissionContext,
    minLevel: number
  ): Promise<boolean> {
    try {
      const role = await permissionsService.getUserRole(context.userId, context.tenantId);
      return role ? role.level <= minLevel : false;
    } catch (error) {
      console.error('Role level check failed:', error);
      return false;
    }
  }

  /**
   * التحقق من الدور بالاسم
   */
  static async checkRole(
    context: PermissionContext,
    roleName: string
  ): Promise<boolean> {
    try {
      const role = await permissionsService.getUserRole(context.userId, context.tenantId);
      return role ? role.name === roleName : false;
    } catch (error) {
      console.error('Role check failed:', error);
      return false;
    }
  }

  /**
   * التحقق من أي من الأدوار المحددة
   */
  static async checkAnyRole(
    context: PermissionContext,
    roleNames: string[]
  ): Promise<boolean> {
    try {
      const role = await permissionsService.getUserRole(context.userId, context.tenantId);
      return role ? roleNames.includes(role.name) : false;
    } catch (error) {
      console.error('Role check failed:', error);
      return false;
    }
  }

  /**
   * دالة شاملة للتحقق من الصلاحيات مع إرجاع تفاصيل مفيدة
   */
  static async authorize(
    context: PermissionContext,
    requirements: {
      permissions?: string[];
      requireAllPermissions?: boolean;
      minRoleLevel?: number;
      allowedRoles?: string[];
      requireSuperAdmin?: boolean;
    }
  ): Promise<{
    authorized: boolean;
    reason?: string;
    details: {
      permissions?: Record<string, boolean>;
      userRole?: string;
      roleLevel?: number;
    };
  }> {
    try {
      const details: any = {};
      let authorized = true;
      let reason = '';

      // التحقق من المشرف العام
      if (requirements.requireSuperAdmin) {
        const isSuperAdmin = await this.checkRole(context, 'super_admin');
        if (!isSuperAdmin) {
          return {
            authorized: false,
            reason: 'يتطلب صلاحيات المشرف العام',
            details
          };
        }
      }

      // الحصول على معلومات الدور
      const userRole = await permissionsService.getUserRole(context.userId, context.tenantId);
      if (userRole) {
        details.userRole = userRole.name;
        details.roleLevel = userRole.level;
      }

      // التحقق من مستوى الدور
      if (requirements.minRoleLevel !== undefined) {
        const hasRequiredLevel = await this.checkRoleLevel(context, requirements.minRoleLevel);
        if (!hasRequiredLevel) {
          return {
            authorized: false,
            reason: `يتطلب مستوى دور ${requirements.minRoleLevel} أو أعلى`,
            details
          };
        }
      }

      // التحقق من الأدوار المسموحة
      if (requirements.allowedRoles && requirements.allowedRoles.length > 0) {
        const hasAllowedRole = await this.checkAnyRole(context, requirements.allowedRoles);
        if (!hasAllowedRole) {
          return {
            authorized: false,
            reason: `يتطلب أحد الأدوار التالية: ${requirements.allowedRoles.join(', ')}`,
            details
          };
        }
      }

      // التحقق من الصلاحيات
      if (requirements.permissions && requirements.permissions.length > 0) {
        const permissionCheck = await this.checkPermissions(
          context,
          requirements.permissions,
          requirements.requireAllPermissions ?? true
        );
        
        details.permissions = permissionCheck.results;
        
        if (!permissionCheck.hasAccess) {
          const missingPermissions = Object.entries(permissionCheck.results)
            .filter(([_, hasAccess]) => !hasAccess)
            .map(([permission]) => permission);
            
          return {
            authorized: false,
            reason: `صلاحيات مفقودة: ${missingPermissions.join(', ')}`,
            details
          };
        }
      }

      return { authorized: true, details };
    } catch (error) {
      console.error('Authorization failed:', error);
      return {
        authorized: false,
        reason: 'خطأ في التحقق من الصلاحيات',
        details: {}
      };
    }
  }

  /**
   * Decorator لحماية الدوال
   */
  static requirePermission(permission: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        // محاولة استخراج context من المعاملات
        const context = this.getPermissionContext?.() || args.find(arg => 
          arg && typeof arg === 'object' && arg.userId
        );

        if (!context) {
          throw new Error('Permission context not available');
        }

        const hasPermission = await PermissionsMiddleware.checkPermission(context, permission);
        if (!hasPermission) {
          throw new Error(`Access denied: Missing permission '${permission}'`);
        }

        return method.apply(this, args);
      };
    };
  }

  /**
   * Decorator لحماية الدوال بمستوى الدور
   */
  static requireRoleLevel(minLevel: number) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const context = this.getPermissionContext?.() || args.find(arg => 
          arg && typeof arg === 'object' && arg.userId
        );

        if (!context) {
          throw new Error('Permission context not available');
        }

        const hasAccess = await PermissionsMiddleware.checkRoleLevel(context, minLevel);
        if (!hasAccess) {
          throw new Error(`Access denied: Requires role level ${minLevel} or higher`);
        }

        return method.apply(this, args);
      };
    };
  }

  /**
   * الحصول على context المستخدم من session
   */
  static async getCurrentUserContext(tenantId?: string): Promise<PermissionContext | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      return {
        userId: user.id,
        tenantId: tenantId
      };
    } catch (error) {
      console.error('Failed to get user context:', error);
      return null;
    }
  }
}

// Helper functions للاستخدام المباشر

/**
 * التحقق من صلاحية المستخدم الحالي
 */
export async function checkCurrentUserPermission(
  permission: string, 
  tenantId?: string
): Promise<boolean> {
  const context = await PermissionsMiddleware.getCurrentUserContext(tenantId);
  if (!context) return false;
  
  return PermissionsMiddleware.checkPermission(context, permission);
}

/**
 * التحقق من دور المستخدم الحالي
 */
export async function checkCurrentUserRole(
  roleName: string, 
  tenantId?: string
): Promise<boolean> {
  const context = await PermissionsMiddleware.getCurrentUserContext(tenantId);
  if (!context) return false;
  
  return PermissionsMiddleware.checkRole(context, roleName);
}

/**
 * التحقق من مستوى دور المستخدم الحالي
 */
export async function checkCurrentUserRoleLevel(
  minLevel: number, 
  tenantId?: string
): Promise<boolean> {
  const context = await PermissionsMiddleware.getCurrentUserContext(tenantId);
  if (!context) return false;
  
  return PermissionsMiddleware.checkRoleLevel(context, minLevel);
}

export default PermissionsMiddleware; 