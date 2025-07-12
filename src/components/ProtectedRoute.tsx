import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import TenantGuard from './TenantGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'tenant_admin' | 'manager' | 'accountant' | 'receptionist' | 'user';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, profile, loading, isSaasAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // معالجة خاصة لمدير النظام العام (admin@admin.com)
  if (isSaasAdmin) {
    // السماح فقط بالوصول إلى صفحات super-admin
    if (!location.pathname.startsWith('/super-admin')) {
      console.log('🔧 SaaS Admin redirected to super-admin dashboard');
      return <Navigate to="/super-admin/main-dashboard" replace />;
    }
    // لا حاجة لـ TenantGuard بالنسبة لمدير النظام العام
    return <>{children}</>;
  }

  // For super_admin role, check the old profile system for backward compatibility
  if (requiredRole === 'super_admin' && profile && profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            غير مصرح لك بالوصول
          </h1>
          <p className="text-muted-foreground">
            تحتاج إلى صلاحية مدير النظام للوصول إلى هذه الصفحة
          </p>
        </div>
      </div>
    );
  }

  // منع المستخدمين العاديين من الوصول إلى صفحات super-admin
  if (location.pathname.startsWith('/super-admin') && !isSaasAdmin) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            غير مصرح لك بالوصول
          </h1>
          <p className="text-muted-foreground">
            هذه الصفحة مخصصة لمديري النظام العام فقط
          </p>
        </div>
      </div>
    );
  }

  return <TenantGuard>{children}</TenantGuard>;
};

export default ProtectedRoute;