
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Building2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TenantGuardProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'tenant_admin' | 'manager' | 'accountant' | 'receptionist' | 'user';
}

const TenantGuard: React.FC<TenantGuardProps> = ({ children, requiredRole }) => {
  const { currentTenant, currentUserRole, loading, error, refreshTenant } = useTenant();
  const { isSaasAdmin, user } = useAuth();

  // تخطي فحص المؤسسة لمدير النظام العام
  if (isSaasAdmin || (user?.email === 'admin@admin.com' && currentUserRole === 'super_admin')) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft p-6" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // إذا كان هناك خطأ، عرض صفحة خطأ بدلاً من إعادة التوجيه
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6" dir="rtl">
        <Card className="w-full max-w-md border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2 text-destructive">خطأ في تحميل البيانات</h3>
            <p className="text-muted-foreground text-center mb-6">{error}</p>
            <div className="flex gap-4">
              <Button 
                onClick={() => refreshTenant()} 
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </Button>
              <Button 
                onClick={() => window.location.href = '/tenants'} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                صفحة المؤسسات
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentTenant) {
    return <Navigate to="/tenants" replace />;
  }

  // فحص الصلاحيات المطلوبة
  if (requiredRole && currentUserRole && currentUserRole !== requiredRole && currentUserRole !== 'super_admin') {
    // التحقق من التسلسل الهرمي للصلاحيات
    const roleHierarchy = {
      'super_admin': 7,
      'tenant_admin': 6,
      'manager': 5,
      'accountant': 4,
      'receptionist': 3,
      'user': 2
    };

    const currentRoleLevel = roleHierarchy[currentUserRole] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (currentRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6" dir="rtl">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="w-16 h-16 text-orange-500 mb-4" />
              <h1 className="text-2xl font-bold text-destructive mb-4">
                غير مصرح لك بالوصول
              </h1>
              <p className="text-muted-foreground text-center mb-6">
                تحتاج إلى صلاحية {requiredRole} أو أعلى للوصول إلى هذه الصفحة.
                صلاحيتك الحالية: {currentUserRole}
              </p>
              <Button 
                onClick={() => window.history.back()} 
                variant="outline"
                className="flex items-center gap-2"
              >
                العودة
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default TenantGuard;
