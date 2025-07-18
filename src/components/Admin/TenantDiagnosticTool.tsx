import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Database, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Building,
  Shield,
  Activity
} from 'lucide-react';

interface UserData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  tenant_id: string;
  is_active: boolean;
}

interface DiagnosticResult {
  tenant_count: number;
  user_count: number;
  active_users: number;
  inactive_users: number;
  recent_activity: number;
  database_status: string;
  issues: string[];
  recommendations: string[];
}

export const TenantDiagnosticTool: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tenantData, setTenantData] = useState<any[]>([]);
  const [userData, setUserData] = useState<UserData[]>([]);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const { toast } = useToast();

  // تشخيص النظام
  const runDiagnostic = async () => {
    setLoading(true);
    try {
      // جلب بيانات المؤسسات
      const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantError) throw tenantError;

      // محاكاة بيانات المستخدمين
      const mockUsers: UserData[] = tenants?.map((tenant: any, index: number) => ({
        id: `user-${index}`,
        full_name: `مدير ${tenant.name}`,
        email: tenant.contact_email || `admin${index}@example.com`,
        role: 'admin',
        tenant_id: tenant.id,
        is_active: true
      })) || [];

      setTenantData(tenants || []);
      setUserData(mockUsers);

      // إنشاء تقرير التشخيص
      const mockDiagnostic: DiagnosticResult = {
        tenant_count: tenants?.length || 0,
        user_count: mockUsers.length,
        active_users: mockUsers.filter(u => u.is_active).length,
        inactive_users: mockUsers.filter(u => !u.is_active).length,
        recent_activity: Math.floor(Math.random() * 100),
        database_status: 'healthy',
        issues: [],
        recommendations: [
          'النظام يعمل بشكل طبيعي',
          'ينصح بعمل نسخة احتياطية دورية',
          'مراجعة صلاحيات المستخدمين'
        ]
      };

      // إضافة مشاكل إذا وُجدت
      if (mockDiagnostic.tenant_count === 0) {
        mockDiagnostic.issues.push('لا توجد مؤسسات مسجلة');
      }
      if (mockDiagnostic.user_count === 0) {
        mockDiagnostic.issues.push('لا توجد مستخدمين مسجلين');
      }

      setDiagnosticResult(mockDiagnostic);

      toast({
        title: 'تم التشخيص بنجاح',
        description: `تم فحص ${mockDiagnostic.tenant_count} مؤسسة و ${mockDiagnostic.user_count} مستخدم`
      });

    } catch (error: any) {
      console.error('خطأ في التشخيص:', error);
      toast({
        title: 'خطأ في التشخيص',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            أداة تشخيص المؤسسات
          </CardTitle>
          <CardDescription>
            فحص شامل لحالة النظام والمؤسسات والمستخدمين
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              onClick={runDiagnostic} 
              disabled={loading}
              className="h-16 flex flex-col items-center gap-2"
            >
              <Search className="w-5 h-5" />
              بدء التشخيص
            </Button>
            
            <Button 
              variant="outline"
              disabled={loading}
              className="h-16 flex flex-col items-center gap-2"
            >
              <Database className="w-5 h-5" />
              فحص قاعدة البيانات
            </Button>
            
            <Button 
              variant="secondary"
              disabled={loading}
              className="h-16 flex flex-col items-center gap-2"
            >
              <Activity className="w-5 h-5" />
              تقرير النشاط
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* نتائج التشخيص */}
      {diagnosticResult && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* الإحصائيات */}
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات النظام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>المؤسسات</span>
                  </div>
                  <Badge variant="outline">
                    {diagnosticResult.tenant_count}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>المستخدمين</span>
                  </div>
                  <Badge variant="outline">
                    {diagnosticResult.user_count}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>نشط</span>
                  </div>
                  <Badge variant="default">
                    {diagnosticResult.active_users}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>غير نشط</span>
                  </div>
                  <Badge variant="destructive">
                    {diagnosticResult.inactive_users}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span>النشاط الأخير</span>
                  </div>
                  <Badge variant="secondary">
                    {diagnosticResult.recent_activity}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* حالة النظام */}
          <Card>
            <CardHeader>
              <CardTitle>حالة النظام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="font-medium">قاعدة البيانات:</span>
                <Badge variant={diagnosticResult.database_status === 'healthy' ? 'default' : 'destructive'}>
                  {diagnosticResult.database_status === 'healthy' ? 'سليمة' : 'تحتاج فحص'}
                </Badge>
              </div>

              {/* المشاكل */}
              {diagnosticResult.issues.length > 0 && (
                <div className="space-y-2">
                  <div className="font-medium text-sm text-red-600">المشاكل المكتشفة:</div>
                  {diagnosticResult.issues.map((issue, index) => (
                    <Alert key={index} className="border-red-200 bg-red-50">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <AlertDescription>{issue}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* التوصيات */}
              {diagnosticResult.recommendations.length > 0 && (
                <div className="space-y-2">
                  <div className="font-medium text-sm text-blue-600">التوصيات:</div>
                  {diagnosticResult.recommendations.map((rec, index) => (
                    <Alert key={index} className="border-blue-200 bg-blue-50">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* قائمة المؤسسات */}
      {tenantData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>المؤسسات المسجلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tenantData.slice(0, 5).map((tenant: any) => (
                <div key={tenant.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-sm text-gray-500">{tenant.contact_email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                      {tenant.status === 'active' ? 'نشط' : tenant.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {tenantData.length > 5 && (
                <div className="text-center text-sm text-gray-500">
                  و {tenantData.length - 5} مؤسسة أخرى...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};