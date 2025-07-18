import React, { useEffect } from 'react';
import { Building2, Users, Settings, Crown, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import TenantLimitChecker from '@/components/Tenants/TenantLimitChecker';
import TrialStatusAlert from '@/components/Tenants/TrialStatusAlert';
import { useNavigate } from 'react-router-dom';

const Tenants: React.FC = () => {
  const { currentTenant, currentUserRole, loading, error } = useTenant();
  const { profile } = useAuth();
  const navigate = useNavigate();

  // إعادة توجيه مديري النظام العام إلى صفحة Super Admin
  useEffect(() => {
    if (currentUserRole === 'super_admin') {
      navigate('/super-admin');
    }
  }, [currentUserRole, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'trial':
        return 'bg-blue-500';
      case 'suspended':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'trial':
        return 'تجريبي';
      case 'suspended':
        return 'معلق';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'مدير النظام';
      case 'tenant_admin':
        return 'مدير المؤسسة';
      case 'manager':
        return 'مدير';
      case 'accountant':
        return 'محاسب';
      case 'receptionist':
        return 'موظف استقبال';
      case 'user':
        return 'مستخدم';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft p-6 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-medium mb-2">جاري تحميل بيانات المؤسسات...</h3>
          <p className="text-muted-foreground">يرجى الانتظار قليلاً</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-soft p-6 flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2 text-destructive">خطأ في تحميل البيانات</h3>
            <p className="text-muted-foreground text-center mb-6">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="flex items-center gap-2"
            >
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">معلومات المؤسسة</h1>
            <p className="text-muted-foreground">
              عرض معلومات المؤسسة والحدود المسموحة
            </p>
          </div>
          
          <Button 
            onClick={() => navigate(-1)}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
        </div>

        {currentTenant && <TrialStatusAlert tenant={currentTenant} />}

        {currentTenant && (
          <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">{currentTenant.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge className={`text-white ${getStatusColor(currentTenant.status)}`}>
                        {getStatusLabel(currentTenant.status)}
                      </Badge>
                      {currentTenant.status === 'trial' && currentTenant.trial_ends_at && (
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                          ينتهي في {new Date(currentTenant.trial_ends_at).toLocaleDateString('ar-SA')}
                        </Badge>
                      )}
                      {currentUserRole && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          {currentUserRole === 'super_admin' && <Crown className="w-3 h-3" />}
                          {getRoleLabel(currentUserRole)}
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{currentTenant.max_users} مستخدم</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    <span>{currentTenant.max_vehicles} مركبة</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-background/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">معلومات الاتصال</h4>
                  <p className="text-sm text-muted-foreground">
                    {currentTenant.contact_email}
                  </p>
                  {currentTenant.contact_phone && (
                    <p className="text-sm text-muted-foreground">
                      {currentTenant.contact_phone}
                    </p>
                  )}
                </div>
                
                <div className="bg-background/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">الموقع</h4>
                  <p className="text-sm text-muted-foreground">
                    {currentTenant.city}, {currentTenant.country}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentTenant.timezone}
                  </p>
                </div>
                
                <div className="bg-background/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">الاشتراك</h4>
                  <p className="text-sm text-muted-foreground">
                    خطة {currentTenant.subscription_plan}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    حالة: {getStatusLabel(currentTenant.subscription_status)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentTenant && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              {/* Additional tenant management features can go here */}
            </div>
            <div>
              <TenantLimitChecker />
            </div>
          </div>
        )}

        {!currentTenant && (
          <Card className="border-dashed border-2 border-muted-foreground/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد مؤسسة محددة</h3>
              <p className="text-muted-foreground text-center">
                يرجى التواصل مع مدير النظام لإضافتك إلى مؤسسة
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Tenants;