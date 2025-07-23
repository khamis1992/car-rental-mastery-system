
import React, { useEffect, useState } from 'react';
import { Building2, Users, Settings, Crown, ArrowLeft, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import TenantLimitChecker from '@/components/Tenants/TenantLimitChecker';
import TrialStatusAlert from '@/components/Tenants/TrialStatusAlert';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const Tenants: React.FC = () => {
  const { 
    currentTenant, 
    currentUserRole, 
    loading, 
    error, 
    debugInfo, 
    clearError, 
    refreshTenant 
  } = useTenant();
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // إعادة توجيه مديري النظام العام إلى صفحة Super Admin
  useEffect(() => {
    if (currentUserRole === 'super_admin' && user?.email === 'admin@admin.com') {
      navigate('/super-admin');
    }
  }, [currentUserRole, user, navigate]);

  // معالجة الأخطاء المتكررة
  useEffect(() => {
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`🔄 محاولة إعادة التحميل رقم ${retryCount + 1}`);
        setRetryCount(prev => prev + 1);
        refreshTenant();
      }, 2000 * (retryCount + 1)); // تأخير متزايد

      return () => clearTimeout(timer);
    }
  }, [error, retryCount, refreshTenant]);

  const handleRetry = async () => {
    clearError();
    setRetryCount(0);
    try {
      await refreshTenant();
      toast({
        title: "تم التحديث",
        description: "تم إعادة تحميل بيانات المؤسسة بنجاح",
      });
    } catch (err) {
      toast({
        title: "خطأ",
        description: "فشل في إعادة تحميل البيانات",
        variant: "destructive",
      });
    }
  };

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
          {retryCount > 0 && (
            <p className="text-sm text-orange-600 mt-2">
              محاولة إعادة التحميل ({retryCount}/3)
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-soft p-6 flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-2xl border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2 text-destructive">خطأ في تحميل البيانات</h3>
            <p className="text-muted-foreground text-center mb-6">{error}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <Button 
                onClick={handleRetry} 
                className="flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                إعادة المحاولة
              </Button>
              
              <Button 
                onClick={() => navigate('/')} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                العودة للرئيسية
              </Button>
            </div>

            {debugInfo && (
              <div className="mt-6 w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="flex items-center gap-2 text-sm"
                >
                  <Info className="w-4 h-4" />
                  {showDebugInfo ? 'إخفاء' : 'عرض'} معلومات التشخيص
                </Button>
                
                {showDebugInfo && (
                  <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
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
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleRetry}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
            
            <Button 
              onClick={() => navigate(-1)}
              variant="outline" 
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة
            </Button>
          </div>
        </div>

        {/* رسالة تحذيرية إذا كان هناك مشاكل في التحميل */}
        {retryCount > 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              تم إعادة تحميل البيانات {retryCount} مرة. إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني.
            </AlertDescription>
          </Alert>
        )}

        {currentTenant && <TrialStatusAlert tenant={currentTenant} />}

        {currentTenant ? (
          <>
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
                      {currentTenant.contact_email || 'غير محدد'}
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
                      {currentTenant.city || 'غير محدد'}, {currentTenant.country || 'غير محدد'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentTenant.timezone || 'غير محدد'}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                {/* Additional tenant management features can go here */}
                {debugInfo && showDebugInfo && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        معلومات التشخيص
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-left">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(debugInfo, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              <div>
                <TenantLimitChecker />
              </div>
            </div>
          </>
        ) : (
          <Card className="border-dashed border-2 border-muted-foreground/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد مؤسسة محددة</h3>
              <p className="text-muted-foreground text-center mb-6">
                يرجى التواصل مع مدير النظام لإضافتك إلى مؤسسة
              </p>
              
              {user && (
                <div className="text-sm text-muted-foreground mb-4">
                  المستخدم: {user.email}
                </div>
              )}
              
              <div className="flex gap-4">
                <Button onClick={handleRetry} variant="outline">
                  <RefreshCw className="w-4 h-4 ml-2" />
                  إعادة المحاولة
                </Button>
                
                <Button 
                  onClick={() => setShowDebugInfo(!showDebugInfo)} 
                  variant="ghost"
                  size="sm"
                >
                  <Info className="w-4 h-4 ml-2" />
                  {showDebugInfo ? 'إخفاء' : 'عرض'} التفاصيل
                </Button>
              </div>

              {showDebugInfo && debugInfo && (
                <div className="mt-6 w-full max-w-2xl">
                  <div className="bg-muted p-4 rounded-lg text-left">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Tenants;
