
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Database, 
  User, 
  Building2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

const TenantDiagnostics: React.FC = () => {
  const { currentTenant, currentUserRole, debugInfo } = useTenant();
  const { user, session } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: DiagnosticResult[] = [];

    try {
      // Test 1: User Authentication
      results.push({
        test: 'المصادقة',
        status: user && session ? 'success' : 'error',
        message: user && session ? 'المستخدم مسجل دخول بنجاح' : 'المستخدم غير مسجل دخول',
        details: { userId: user?.id, email: user?.email, hasSession: !!session }
      });

      // Test 2: Database Connection
      try {
        const { error: dbError } = await supabase.from('tenants').select('id').limit(1);
        results.push({
          test: 'اتصال قاعدة البيانات',
          status: dbError ? 'error' : 'success',
          message: dbError ? `خطأ في الاتصال: ${dbError.message}` : 'الاتصال سليم',
          details: { error: dbError }
        });
      } catch (error: any) {
        results.push({
          test: 'اتصال قاعدة البيانات',
          status: 'error',
          message: `خطأ في الاتصال: ${error.message}`,
          details: { error }
        });
      }

      // Test 3: Tenant Data
      results.push({
        test: 'بيانات المؤسسة',
        status: currentTenant ? 'success' : 'warning',
        message: currentTenant ? `المؤسسة محملة: ${currentTenant.name}` : 'لا توجد مؤسسة محملة',
        details: { 
          tenantId: currentTenant?.id, 
          tenantName: currentTenant?.name,
          tenantStatus: currentTenant?.status,
          userRole: currentUserRole
        }
      });

      // Test 4: User Permissions
      if (user) {
        try {
          const { data: userTenants, error: permError } = await supabase
            .from('tenant_users')
            .select('tenant_id, role, status')
            .eq('user_id', user.id);

          results.push({
            test: 'صلاحيات المستخدم',
            status: permError ? 'error' : userTenants && userTenants.length > 0 ? 'success' : 'warning',
            message: permError 
              ? `خطأ في جلب الصلاحيات: ${permError.message}`
              : userTenants && userTenants.length > 0 
                ? `المستخدم منتمي لـ ${userTenants.length} مؤسسة`
                : 'المستخدم غير منتمي لأي مؤسسة',
            details: { userTenants, error: permError }
          });
        } catch (error: any) {
          results.push({
            test: 'صلاحيات المستخدم',
            status: 'error',
            message: `خطأ في فحص الصلاحيات: ${error.message}`,
            details: { error }
          });
        }
      }

      // Test 5: Debug Information
      results.push({
        test: 'معلومات التشخيص',
        status: debugInfo ? 'success' : 'warning',
        message: debugInfo ? 'معلومات التشخيص متوفرة' : 'معلومات التشخيص غير متوفرة',
        details: debugInfo
      });

    } catch (error: any) {
      results.push({
        test: 'التشخيص العام',
        status: 'error',
        message: `خطأ في التشخيص: ${error.message}`,
        details: { error }
      });
    }

    setDiagnostics(results);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, [currentTenant, user]);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">نجح</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">تحذير</Badge>;
      case 'error':
        return <Badge variant="destructive">خطأ</Badge>;
    }
  };

  const hasErrors = diagnostics.some(d => d.status === 'error');
  const hasWarnings = diagnostics.some(d => d.status === 'warning');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            تشخيص النظام
          </CardTitle>
          <Button
            onClick={runDiagnostics}
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            فحص
          </Button>
        </div>
        <CardDescription>
          فحص شامل لحالة النظام والاتصالات
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <span className="font-medium">الحالة العامة:</span>
          </div>
          {hasErrors ? (
            <Badge variant="destructive">يوجد أخطاء</Badge>
          ) : hasWarnings ? (
            <Badge className="bg-yellow-500">يوجد تحذيرات</Badge>
          ) : (
            <Badge className="bg-green-500">سليم</Badge>
          )}
        </div>

        {/* Diagnostic Results */}
        <div className="space-y-3">
          {diagnostics.map((result, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div>
                  <p className="font-medium">{result.test}</p>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                </div>
              </div>
              {getStatusBadge(result.status)}
            </div>
          ))}
        </div>

        {/* Debug Details */}
        <div className="border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 w-full justify-center"
          >
            <Info className="w-4 h-4" />
            {showDetails ? 'إخفاء' : 'عرض'} التفاصيل التقنية
          </Button>
          
          {showDetails && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="space-y-4">
                {diagnostics.map((result, index) => (
                  result.details && (
                    <div key={index} className="space-y-2">
                      <h4 className="font-medium text-sm">{result.test}:</h4>
                      <pre className="text-xs bg-background p-2 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TenantDiagnostics;
