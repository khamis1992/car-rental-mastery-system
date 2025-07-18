import React from 'react';
import { usePermissionGuard, useRoleGuard } from '@/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PermissionGuardProps {
  /** الصلاحية أو الصلاحيات المطلوبة */
  permissions?: string | string[];
  /** مستوى الدور المطلوب (أقل رقم = صلاحيات أكثر) */
  minRoleLevel?: number;
  /** نوع التحقق: 'all' يتطلب جميع الصلاحيات، 'any' يتطلب أي صلاحية واحدة */
  checkType?: 'all' | 'any';
  /** عنصر بديل للعرض في حال عدم وجود صلاحية */
  fallback?: React.ReactNode;
  /** إخفاء العنصر بدلاً من عرض رسالة الخطأ */
  hideOnNoAccess?: boolean;
  /** الأطفال المراد حمايتهم */
  children: React.ReactNode;
  /** رسالة خطأ مخصصة */
  accessDeniedMessage?: string;
}

/**
 * مكون حماية بناءً على الصلاحيات
 * يعرض المحتوى فقط إذا كان المستخدم لديه الصلاحيات المطلوبة
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permissions,
  minRoleLevel,
  checkType = 'all',
  fallback,
  hideOnNoAccess = false,
  children,
  accessDeniedMessage = 'ليس لديك الصلاحية للوصول إلى هذا المحتوى'
}) => {
  // التحقق من الصلاحيات
  const permissionCheck = usePermissionGuard(permissions || []);
  
  // التحقق من مستوى الدور
  const roleCheck = useRoleGuard(minRoleLevel || 999);

  // إذا كان التحميل جارياً
  if (permissionCheck.isLoading || roleCheck.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  // تحديد نوع التحقق من الصلاحيات
  let hasPermissionAccess = true;
  if (permissions && permissions.length > 0) {
    hasPermissionAccess = checkType === 'all' 
      ? permissionCheck.hasAllPermissions 
      : permissionCheck.hasAnyPermission;
  }

  // التحقق من مستوى الدور
  const hasRoleAccess = minRoleLevel !== undefined ? roleCheck.canAccess : true;

  // التحقق النهائي
  const hasAccess = hasPermissionAccess && hasRoleAccess;

  if (!hasAccess) {
    // إخفاء المحتوى
    if (hideOnNoAccess) {
      return null;
    }

    // عرض عنصر بديل مخصص
    if (fallback) {
      return <>{fallback}</>;
    }

    // عرض رسالة الخطأ الافتراضية
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <Lock className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          {accessDeniedMessage}
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

interface RoleGuardProps {
  /** الأدوار المسموحة */
  allowedRoles: string[];
  /** عنصر بديل للعرض في حال عدم وجود دور مناسب */
  fallback?: React.ReactNode;
  /** إخفاء العنصر بدلاً من عرض رسالة الخطأ */
  hideOnNoAccess?: boolean;
  /** الأطفال المراد حمايتهم */
  children: React.ReactNode;
}

/**
 * مكون حماية بناءً على الأدوار
 * يعرض المحتوى فقط إذا كان المستخدم لديه دور من الأدوار المسموحة
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  fallback,
  hideOnNoAccess = false,
  children
}) => {
  return (
    <PermissionGuard
      permissions={allowedRoles.map(role => `role.${role}`)}
      checkType="any"
      fallback={fallback}
      hideOnNoAccess={hideOnNoAccess}
      accessDeniedMessage="دورك الحالي لا يسمح بالوصول إلى هذا المحتوى"
    >
      {children}
    </PermissionGuard>
  );
};

interface AdminOnlyProps {
  /** المستوى الإداري المطلوب: 'super' للمشرف العام، 'tenant' لمدير المؤسسة، 'manager' للمدير */
  level?: 'super' | 'tenant' | 'manager';
  /** عنصر بديل للعرض */
  fallback?: React.ReactNode;
  /** إخفاء العنصر بدلاً من عرض رسالة الخطأ */
  hideOnNoAccess?: boolean;
  /** الأطفال المراد حمايتهم */
  children: React.ReactNode;
}

/**
 * مكون حماية للمحتوى الإداري فقط
 */
export const AdminOnly: React.FC<AdminOnlyProps> = ({
  level = 'manager',
  fallback,
  hideOnNoAccess = false,
  children
}) => {
  const levelMapping = {
    super: 0,
    tenant: 10,
    manager: 20
  };

  return (
    <PermissionGuard
      minRoleLevel={levelMapping[level]}
      fallback={fallback}
      hideOnNoAccess={hideOnNoAccess}
      accessDeniedMessage={`هذا المحتوى متاح للإداريين فقط (مستوى ${level === 'super' ? 'المشرف العام' : level === 'tenant' ? 'مدير المؤسسة' : 'المدير'} وأعلى)`}
    >
      {children}
    </PermissionGuard>
  );
};

// HOC لحماية الصفحات
export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  permissions: string | string[],
  options?: {
    checkType?: 'all' | 'any';
    fallback?: React.ReactNode;
    hideOnNoAccess?: boolean;
  }
) {
  return function PermissionGuardedComponent(props: P) {
    return (
      <PermissionGuard
        permissions={permissions}
        checkType={options?.checkType}
        fallback={options?.fallback}
        hideOnNoAccess={options?.hideOnNoAccess}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

// HOC لحماية الصفحات بناءً على الأدوار
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: string[],
  options?: {
    fallback?: React.ReactNode;
    hideOnNoAccess?: boolean;
  }
) {
  return function RoleGuardedComponent(props: P) {
    return (
      <RoleGuard
        allowedRoles={allowedRoles}
        fallback={options?.fallback}
        hideOnNoAccess={options?.hideOnNoAccess}
      >
        <Component {...props} />
      </RoleGuard>
    );
  };
}

// HOC لحماية الصفحات للإداريين فقط
export function withAdminOnly<P extends object>(
  Component: React.ComponentType<P>,
  level: 'super' | 'tenant' | 'manager' = 'manager',
  options?: {
    fallback?: React.ReactNode;
    hideOnNoAccess?: boolean;
  }
) {
  return function AdminOnlyComponent(props: P) {
    return (
      <AdminOnly
        level={level}
        fallback={options?.fallback}
        hideOnNoAccess={options?.hideOnNoAccess}
      >
        <Component {...props} />
      </AdminOnly>
    );
  };
} 