
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Crown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'tenant_admin' | 'manager' | 'accountant' | 'receptionist' | 'user';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, profile, loading: authLoading, isSaasAdmin } = useAuth();
  const { currentTenant, currentUserRole, loading: tenantLoading, error: tenantError } = useTenant();
  const location = useLocation();

  const loading = authLoading || tenantLoading;

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
  if (isSaasAdmin || currentUserRole === 'super_admin') {
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
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Crown className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2 text-destructive">غير مصرح بالوصول</h3>
            <p className="text-muted-foreground text-center">
              تحتاج إلى صلاحية مدير النظام للوصول إلى هذه الصفحة
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // منع المستخدمين العاديين من الوصول إلى صفحات super-admin
  if (location.pathname.startsWith('/super-admin') && !isSaasAdmin && currentUserRole !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Crown className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2 text-destructive">غير مصرح بالوصول</h3>
            <p className="text-muted-foreground text-center">
              هذه الصفحة مخصصة لمديري النظام العام فقط
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // التعامل مع أخطاء تحميل بيانات المؤسسة
  if (tenantError) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6" dir="rtl">
        <Card className="w-full max-w-md border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2 text-destructive">خطأ في تحميل البيانات</h3>
            <p className="text-muted-foreground text-center mb-6">{tenantError}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="w-full"
            >
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // التعامل مع المستخدمين الذين لا يملكون مؤسسة
  if (!currentTenant && currentUserRole === 'user') {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">مرحباً بك</h3>
            <p className="text-muted-foreground text-center mb-6">
              لم يتم ربطك بأي مؤسسة بعد. يرجى التواصل مع مدير النظام لإضافتك إلى مؤسسة.
            </p>
            <div className="flex gap-2 w-full">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="flex-1"
              >
                إعادة التحديث
              </Button>
              <Button 
                onClick={() => {
                  // يمكن إضافة منطق للتواصل مع الدعم
                  console.log('Contact support requested');
                }}
                className="flex-1"
              >
                طلب المساعدة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
