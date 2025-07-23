import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, User, Shield, Database, Settings } from 'lucide-react';

const DiagnosticsPage: React.FC = () => {
  const { diagnosticResult, loading, runDiagnostics } = useDiagnostics();
  const { user, session, profile } = useAuth();
  const { currentTenant, currentUserRole, debugInfo } = useTenant();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [running, setRunning] = useState(false);

  // تشغيل الفحص عند تحميل الصفحة
  useEffect(() => {
    console.log('🔍 تحميل صفحة التشخيص - بدء الفحص التلقائي');
    runDiagnostics();
  }, [runDiagnostics]);

  const runAdvancedTests = async () => {
    setRunning(true);
    console.log('🧪 بدء الاختبارات المتقدمة...');
    
    const tests = [];

    // اختبار 1: فحص دالة get_current_tenant_id
    try {
      console.log('🔍 اختبار دالة get_current_tenant_id...');
      const { data: tenantIdTest, error: tenantIdError } = await supabase.rpc('get_current_tenant_id');
      tests.push({
        name: 'دالة get_current_tenant_id',
        status: tenantIdError ? 'error' : 'success',
        message: tenantIdError ? tenantIdError.message : `معرف المؤسسة: ${tenantIdTest}`,
        data: tenantIdTest
      });
    } catch (error: any) {
      tests.push({
        name: 'دالة get_current_tenant_id',
        status: 'error',
        message: error.message || 'خطأ غير معروف'
      });
    }

    // اختبار 2: فحص الوصول لجدول مراكز التكلفة
    try {
      console.log('🔍 اختبار الوصول لجدول مراكز التكلفة...');
      const { data: costCentersTest, error: costCentersError } = await supabase
        .from('cost_centers')
        .select('id, cost_center_name')
        .limit(1);
      
      tests.push({
        name: 'الوصول لمراكز التكلفة',
        status: costCentersError ? 'error' : 'success',
        message: costCentersError ? costCentersError.message : `عدد السجلات: ${costCentersTest?.length || 0}`,
        data: costCentersTest
      });
    } catch (error: any) {
      tests.push({
        name: 'الوصول لمراكز التكلفة',
        status: 'error',
        message: error.message || 'خطأ غير معروف'
      });
    }

    // اختبار 3: فحص الوصول لجدول الأصول الثابتة
    try {
      console.log('🔍 اختبار الوصول لجدول الأصول الثابتة...');
      const { data: assetsTest, error: assetsError } = await supabase
        .from('fixed_assets')
        .select('id, asset_name')
        .limit(1);
      
      tests.push({
        name: 'الوصول للأصول الثابتة',
        status: assetsError ? 'error' : 'success',
        message: assetsError ? assetsError.message : `عدد السجلات: ${assetsTest?.length || 0}`,
        data: assetsTest
      });
    } catch (error: any) {
      tests.push({
        name: 'الوصول للأصول الثابتة',
        status: 'error',
        message: error.message || 'خطأ غير معروف'
      });
    }

    // اختبار 4: اختبار إدراج مركز تكلفة تجريبي
    try {
      console.log('🔍 اختبار إدراج مركز تكلفة تجريبي...');
      
      // أولاً نحصل على tenant_id الحالي
      const { data: currentTenantId } = await supabase.rpc('get_current_tenant_id');
      
      if (!currentTenantId) {
        tests.push({
          name: 'إدراج مركز التكلفة',
          status: 'error',
          message: 'لا يمكن الحصول على معرف المؤسسة للاختبار'
        });
        return;
      }

      const testData = {
        cost_center_code: 'TEST001',
        cost_center_name: 'مركز تكلفة تجريبي',
        description: 'مركز تكلفة للاختبار - سيتم حذفه',
        cost_center_type: 'department',
        level: 1,
        is_active: true,
        tenant_id: currentTenantId
      };

      const { data: insertTest, error: insertError } = await supabase
        .from('cost_centers')
        .insert(testData)
        .select('id')
        .single();

      if (!insertError && insertTest?.id) {
        // حذف السجل التجريبي
        await supabase
          .from('cost_centers')
          .delete()
          .eq('id', insertTest.id);

        tests.push({
          name: 'إدراج مركز التكلفة',
          status: 'success',
          message: 'تم إنشاء وحذف مركز التكلفة التجريبي بنجاح',
          data: insertTest
        });
      } else {
        tests.push({
          name: 'إدراج مركز التكلفة',
          status: 'error',
          message: insertError?.message || 'فشل الإدراج',
          error: insertError
        });
      }
    } catch (error: any) {
      tests.push({
        name: 'إدراج مركز التكلفة',
        status: 'error',
        message: error.message || 'خطأ غير معروف'
      });
    }

    // اختبار 5: فحص صلاحيات RLS
    try {
      console.log('🔍 اختبار صلاحيات RLS...');
      const { data: roleCheck, error: roleError } = await supabase
        .from('tenant_user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('is_active', true);
      
      tests.push({
        name: 'فحص صلاحيات RLS',
        status: roleError ? 'error' : 'success',
        message: roleError ? roleError.message : `الأدوار: ${roleCheck?.map(r => r.role).join(', ') || 'لا توجد أدوار'}`,
        data: roleCheck
      });
    } catch (error: any) {
      tests.push({
        name: 'فحص صلاحيات RLS',
        status: 'error',
        message: error.message || 'خطأ غير معروف'
      });
    }

    setTestResults(tests);
    setRunning(false);
    console.log('✅ انتهت الاختبارات المتقدمة:', tests);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">نجح</Badge>;
      case 'error':
        return <Badge variant="destructive">فشل</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">تحذير</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold">تشخيص النظام المتقدم</h1>
      </div>

      {/* معلومات المستخدم الأساسية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            معلومات المستخدم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">البريد الإلكتروني:</span>
              <span className="mr-2">{user?.email || 'غير محدد'}</span>
            </div>
            <div>
              <span className="font-semibold">معرف المستخدم:</span>
              <span className="mr-2 text-sm text-muted-foreground">{user?.id || 'غير محدد'}</span>
            </div>
            <div>
              <span className="font-semibold">الدور:</span>
              <span className="mr-2">{profile?.role || currentUserRole || 'غير محدد'}</span>
            </div>
            <div>
              <span className="font-semibold">المؤسسة:</span>
              <span className="mr-2">{currentTenant?.name || 'غير محدد'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نتائج التشخيص الأساسي */}
      {diagnosticResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              نتائج التشخيص الأساسي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                {diagnosticResult.isAuthenticated ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span>حالة المصادقة: {diagnosticResult.isAuthenticated ? 'مصادق عليه' : 'غير مصادق عليه'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {diagnosticResult.sessionValid ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span>صلاحية الجلسة: {diagnosticResult.sessionValid ? 'صالحة' : 'منتهية الصلاحية'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {diagnosticResult.tenantId ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span>معرف المؤسسة: {diagnosticResult.tenantId || 'غير محدد'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {diagnosticResult.permissions.length > 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span>الصلاحيات: {diagnosticResult.permissions.join(', ') || 'لا توجد صلاحيات'}</span>
              </div>
            </div>

            {diagnosticResult.errors.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-600 mb-2">الأخطاء المكتشفة:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {diagnosticResult.errors.map((error, index) => (
                    <li key={index} className="text-red-600">{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* الاختبارات المتقدمة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            الاختبارات المتقدمة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={runDiagnostics} 
              disabled={loading}
              variant="outline"
            >
              {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              إعادة فحص أساسي
            </Button>
            
            <Button 
              onClick={runAdvancedTests} 
              disabled={running}
            >
              {running && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              تشغيل الاختبارات المتقدمة
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <h4 className="font-semibold">نتائج الاختبارات المتقدمة:</h4>
              {testResults.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <div className="font-medium">{test.name}</div>
                      <div className="text-sm text-muted-foreground">{test.message}</div>
                    </div>
                  </div>
                  {getStatusBadge(test.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* معلومات التشخيص الإضافية */}
      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>معلومات التشخيص الإضافية</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DiagnosticsPage;