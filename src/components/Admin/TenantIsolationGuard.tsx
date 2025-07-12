import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { tenantIsolationService } from '@/services/BusinessServices/TenantIsolationService';
import { useTenantIsolationStatus } from '@/hooks/useSecureSupabase';
import { toast } from 'sonner';

interface IsolationViolation {
  table: string;
  issue: string;
  count: number;
}

interface IntegrityReport {
  is_secure: boolean;
  violations: IsolationViolation[];
  checked_at: string;
}

/**
 * مكون حماية وفحص العزل التلقائي
 */
export function TenantIsolationGuard() {
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const isolationStatus = useTenantIsolationStatus();

  // فحص سلامة العزل
  const checkIntegrity = async () => {
    try {
      console.log('🔍 بدء فحص سلامة عزل البيانات...');
      
      const report = await tenantIsolationService.checkIsolationIntegrity();
      
      // تحويل البيانات للتنسيق المطلوب
      const formattedReport: IntegrityReport = {
        is_secure: report.is_secure,
        violations: report.issues?.map((issue: string, index: number) => ({
          table: `issue_${index}`,
          issue: issue,
          count: 1
        })) || [],
        checked_at: new Date().toISOString()
      };
      
      setIntegrityReport(formattedReport);
      setLastCheckTime(new Date().toISOString());

      if (!formattedReport.is_secure && formattedReport.violations.length > 0) {
        const violationCount = formattedReport.violations.reduce((sum, v) => sum + v.count, 0);
        toast.error(`⚠️ تم اكتشاف ${violationCount} انتهاك أمني في عزل البيانات!`);
        
        // تسجيل الانتهاكات للمراقبة
        await tenantIsolationService.logAccess(
          isolationStatus.currentTenantId || '',
          'integrity_check',
          'security_violation_detected',
          false
        );
      } else {
        console.log('✅ فحص العزل: جميع البيانات آمنة');
      }
    } catch (error) {
      console.error('خطأ في فحص سلامة العزل:', error);
      toast.error('خطأ في فحص سلامة العزل');
    }
  };

  // تفعيل الفحص التلقائي
  useEffect(() => {
    if (autoCheckEnabled && isolationStatus.isReady) {
      // فحص فوري عند التحميل
      checkIntegrity();
      
      // فحص دوري كل 5 دقائق
      const interval = setInterval(checkIntegrity, 5 * 60 * 1000);
      setCheckInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (checkInterval) {
      clearInterval(checkInterval);
      setCheckInterval(null);
    }
  }, [autoCheckEnabled, isolationStatus.isReady]);

  // فحص يدوي
  const handleManualCheck = async () => {
    toast.loading('جاري فحص سلامة العزل...');
    await checkIntegrity();
    toast.dismiss();
  };

  // إذا لم يكن العزل جاهزاً، لا نعرض شيئاً
  if (!isolationStatus.isIsolated) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex flex-row-reverse items-center justify-between">
          <div className="flex flex-row-reverse items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg rtl-title">حارس عزل البيانات</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualCheck}
              className="flex items-center gap-2 flex-row-reverse"
            >
              <RefreshCw className="h-4 w-4" />
              فحص يدوي
            </Button>
          </div>
        </div>
        <CardDescription>
          مراقبة مستمرة لضمان عزل البيانات بين المؤسسات
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* حالة العزل */}
        <div className="flex flex-row-reverse items-center justify-between p-3 bg-background/50 rounded-lg">
          <div className="flex flex-row-reverse items-center gap-2">
            {integrityReport?.is_secure ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-700">العزل آمن</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  يحتاج مراجعة ({integrityReport?.violations.length || 0} مشكلة)
                </span>
              </>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            آخر فحص: {lastCheckTime ? new Date(lastCheckTime).toLocaleString('ar-SA') : 'لم يتم بعد'}
          </div>
        </div>

        {/* عرض الانتهاكات إذا وجدت */}
        {integrityReport?.violations && integrityReport.violations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-destructive rtl-title">
              انتهاكات مكتشفة:
            </h4>
            {integrityReport.violations.map((violation, index) => (
              <Alert key={index} variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>{violation.table}:</strong> {violation.count} سجل يحتوي على {violation.issue}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* معلومات المؤسسة الحالية */}
        <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
          <div className="flex flex-row-reverse items-center justify-between">
            <span>المؤسسة الحالية:</span>
            <code className="text-xs bg-background px-1 rounded">
              {isolationStatus.currentTenantId?.slice(0, 8)}...
            </code>
          </div>
        </div>

        {/* تفعيل/إلغاء الفحص التلقائي */}
        <div className="flex flex-row-reverse items-center justify-between text-sm">
          <span>الفحص التلقائي (كل 5 دقائق)</span>
          <Button
            variant={autoCheckEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoCheckEnabled(!autoCheckEnabled)}
          >
            {autoCheckEnabled ? 'مُفعل' : 'مُعطل'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}