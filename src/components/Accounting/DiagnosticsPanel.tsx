import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { accountingService } from '@/services/accountingService';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DiagnosticsResult {
  authStatus: boolean;
  tenantStatus: boolean;
  permissionsStatus: boolean;
  journalEntriesCount: number;
  errors: string[];
}

export const DiagnosticsPanel: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, session } = useAuth();
  const { currentTenant, currentUserRole } = useTenant();

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      const result = await accountingService.runDiagnostics();
      // Transform result to match DiagnosticsResult interface
      const transformedResult = {
        authStatus: result.status === 'success',
        tenantStatus: result.status === 'success',
        permissionsStatus: result.status === 'success',
        journalEntriesCount: 0,
        errors: result.issues || []
      };
      setDiagnostics(transformedResult);
      
      if (transformedResult.errors.length === 0) {
        toast.success('تم التشخيص بنجاح - لا توجد مشاكل');
      } else {
        toast.warning(`تم اكتشاف ${transformedResult.errors.length} مشكلة`);
      }
    } catch (error) {
      console.error('خطأ في التشخيص:', error);
      toast.error('فشل في تشغيل التشخيص');
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <AlertCircle className="w-5 h-5 text-red-500" />
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="rtl-flex">
        <CardTitle className="rtl-title flex items-center gap-2">
          <Activity className="w-5 h-5" />
          تشخيص النظام
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={loading}
          className="rtl-flex"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Activity className="w-4 h-4" />
          )}
          تشغيل التشخيص
        </Button>

        {/* معلومات المصادقة */}
        <div className="space-y-2">
          <h4 className="font-semibold">حالة المصادقة:</h4>
          <div className="rtl-flex">
            <StatusIcon status={!!user} />
            <span>{user ? `مصادق عليه: ${user.email}` : 'غير مصادق عليه'}</span>
          </div>
          <div className="rtl-flex">
            <StatusIcon status={!!session} />
            <span>{session ? 'الجلسة نشطة' : 'لا توجد جلسة'}</span>
          </div>
        </div>

        {/* معلومات المؤسسة */}
        <div className="space-y-2">
          <h4 className="font-semibold">حالة المؤسسة:</h4>
          <div className="rtl-flex">
            <StatusIcon status={!!currentTenant} />
            <span>{currentTenant ? `المؤسسة: ${currentTenant.name}` : 'لا توجد مؤسسة'}</span>
          </div>
          <div className="rtl-flex">
            <StatusIcon status={!!currentUserRole} />
            <span>{currentUserRole ? `الدور: ${currentUserRole}` : 'لا يوجد دور'}</span>
          </div>
        </div>

        {/* نتائج التشخيص */}
        {diagnostics && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-semibold">نتائج التشخيص:</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="rtl-flex">
                <StatusIcon status={diagnostics.authStatus} />
                <span>المصادقة</span>
              </div>
              
              <div className="rtl-flex">
                <StatusIcon status={diagnostics.tenantStatus} />
                <span>المؤسسة</span>
              </div>
              
              <div className="rtl-flex">
                <StatusIcon status={diagnostics.permissionsStatus} />
                <span>الصلاحيات</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {diagnostics.journalEntriesCount} قيد محاسبي
                </Badge>
              </div>
            </div>

            {/* عرض الأخطاء */}
            {diagnostics.errors.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-red-600">المشاكل المكتشفة:</h5>
                <ul className="list-disc list-inside space-y-1">
                  {diagnostics.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600">{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};