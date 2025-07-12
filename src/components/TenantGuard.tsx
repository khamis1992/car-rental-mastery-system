import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface TenantGuardProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'tenant_admin' | 'manager' | 'accountant' | 'receptionist' | 'user';
}

const TenantGuard: React.FC<TenantGuardProps> = ({ children, requiredRole }) => {
  const { currentTenant, currentUserRole, loading } = useTenant();
  const { isSaasAdmin } = useAuth();

  // تخطي فحص المؤسسة لمدير النظام العام
  if (isSaasAdmin) {
    return <>{children}</>;
  }

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
        </div>
      </div>
    );
  }

  if (!currentTenant) {
    return <Navigate to="/tenants" replace />;
  }

  if (requiredRole && currentUserRole && currentUserRole !== requiredRole && currentUserRole !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            غير مصرح لك بالوصول
          </h1>
          <p className="text-muted-foreground">
            تحتاج إلى صلاحية {requiredRole} للوصول إلى هذه الصفحة
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default TenantGuard;