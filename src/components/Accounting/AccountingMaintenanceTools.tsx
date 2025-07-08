import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Trash2, RefreshCw, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MaintenanceResults {
  orphaned_cleanup?: {
    total_cleaned: number;
    details: any[];
  };
  balance_updates?: {
    updated_accounts: number;
  };
  account_1130_correction?: {
    account_name: string;
    old_balance: number;
    new_balance: number;
    correction_amount: number;
  };
}

interface AuditResults {
  total_orphaned_amount: number;
  entries: any[];
}

export const AccountingMaintenanceTools = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [maintenanceResults, setMaintenanceResults] = useState<MaintenanceResults | null>(null);
  const [auditResults, setAuditResults] = useState<AuditResults | null>(null);
  const [lastRun, setLastRun] = useState<string>('');
  const { toast } = useToast();

  const runPeriodicMaintenance = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.rpc('periodic_accounting_maintenance');

      if (error) throw error;

      setMaintenanceResults(data as unknown as MaintenanceResults);
      setLastRun(new Date().toLocaleString('ar-KW'));
      
      const maintenanceData = data as unknown as MaintenanceResults;
      toast({
        title: 'تم تشغيل الصيانة الدورية بنجاح',
        description: `تم تنظيف ${maintenanceData?.orphaned_cleanup?.total_cleaned || 0} قيد معلق`,
      });

      // إشعار الصفحة الرئيسية بالتحديث
      window.dispatchEvent(new CustomEvent('accounting-data-updated'));

    } catch (error) {
      console.error('Error running maintenance:', error);
      toast({
        title: 'خطأ في تشغيل الصيانة',
        description: 'فشل في تشغيل أدوات الصيانة الدورية',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runAuditReport = async () => {
    try {
      const { data, error } = await supabase.rpc('audit_orphaned_entries');

      if (error) throw error;

      setAuditResults(data as unknown as AuditResults);
      
      const auditData = data as unknown as AuditResults;
      toast({
        title: 'تم إنشاء تقرير التدقيق',
        description: `تم العثور على ${auditData?.entries?.filter(e => e.status === 'orphaned').length || 0} قيد معلق`,
      });

    } catch (error) {
      console.error('Error running audit:', error);
      toast({
        title: 'خطأ في تقرير التدقيق',
        description: 'فشل في إنشاء تقرير التدقيق',
        variant: 'destructive',
      });
    }
  };

  const cleanupOrphanedEntries = async () => {
    try {
      const { data, error } = await supabase.rpc('cleanup_orphaned_journal_entries');

      if (error) throw error;

      const cleanupData = data as any;
      toast({
        title: 'تم تنظيف القيود المعلقة',
        description: `تم حذف ${cleanupData?.total_cleaned || 0} قيد معلق`,
      });

      // تحديث البيانات
      await runAuditReport();
      window.dispatchEvent(new CustomEvent('accounting-data-updated'));

    } catch (error) {
      console.error('Error cleaning orphaned entries:', error);
      toast({
        title: 'خطأ في التنظيف',
        description: 'فشل في تنظيف القيود المعلقة',
        variant: 'destructive',
      });
    }
  };

  const correctAccountBalance = async (accountCode: string) => {
    try {
      const { data, error } = await supabase.rpc('correct_account_balance', {
        account_code_param: accountCode
      });

      if (error) throw error;

      const balanceData = data as any;
      toast({
        title: 'تم تصحيح رصيد الحساب',
        description: `${balanceData.account_name}: ${balanceData.old_balance} ← ${balanceData.new_balance} د.ك`,
      });

      window.dispatchEvent(new CustomEvent('accounting-data-updated'));

    } catch (error) {
      console.error('Error correcting account balance:', error);
      toast({
        title: 'خطأ في تصحيح الرصيد',
        description: 'فشل في تصحيح رصيد الحساب',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* أدوات الصيانة الرئيسية */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <Settings className="w-5 h-5" />
            أدوات الصيانة المحاسبية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              هذه الأدوات تقوم بتنظيف وتصحيح البيانات المحاسبية. يُنصح بتشغيلها بانتظام للحفاظ على دقة التقارير المالية.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={runPeriodicMaintenance} 
              disabled={isRunning}
              className="flex items-center gap-2 h-auto p-4 flex-col"
              variant="outline"
            >
              <RefreshCw className={`w-6 h-6 ${isRunning ? 'animate-spin' : ''}`} />
              <div className="text-center">
                <div className="font-semibold">الصيانة الدورية</div>
                <div className="text-xs text-muted-foreground">تنظيف شامل للنظام</div>
              </div>
            </Button>

            <Button 
              onClick={runAuditReport}
              className="flex items-center gap-2 h-auto p-4 flex-col"
              variant="outline"
            >
              <FileText className="w-6 h-6" />
              <div className="text-center">
                <div className="font-semibold">تقرير التدقيق</div>
                <div className="text-xs text-muted-foreground">فحص القيود المعلقة</div>
              </div>
            </Button>

            <Button 
              onClick={cleanupOrphanedEntries}
              className="flex items-center gap-2 h-auto p-4 flex-col"
              variant="outline"
            >
              <Trash2 className="w-6 h-6" />
              <div className="text-center">
                <div className="font-semibold">تنظيف القيود</div>
                <div className="text-xs text-muted-foreground">حذف القيود المعلقة</div>
              </div>
            </Button>
          </div>

          {lastRun && (
            <div className="text-sm text-muted-foreground text-center">
              آخر تشغيل للصيانة: {lastRun}
            </div>
          )}
        </CardContent>
      </Card>

      {/* أدوات تصحيح الحسابات */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title">تصحيح أرصدة الحسابات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => correctAccountBalance('1130')}
              className="flex items-center gap-2"
              variant="outline"
            >
              <CheckCircle className="w-4 h-4" />
              تصحيح حساب العملاء المدينون (1130)
            </Button>
            
            <Button 
              onClick={() => correctAccountBalance('4110')}
              className="flex items-center gap-2"
              variant="outline"
            >
              <CheckCircle className="w-4 h-4" />
              تصحيح حساب إيرادات التأجير (4110)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* نتائج الصيانة */}
      {maintenanceResults && (
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">نتائج الصيانة الدورية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {maintenanceResults.orphaned_cleanup && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">
                  تم تنظيف {maintenanceResults.orphaned_cleanup.total_cleaned} قيد معلق
                </span>
              </div>
            )}
            
            {maintenanceResults.balance_updates && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">
                  تم تحديث {maintenanceResults.balance_updates.updated_accounts} حساب
                </span>
              </div>
            )}
            
            {maintenanceResults.account_1130_correction && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">
                    تصحيح حساب العملاء المدينون:
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <Badge variant="outline">
                    الرصيد السابق: {maintenanceResults.account_1130_correction.old_balance.toFixed(3)} د.ك
                  </Badge>
                  <Badge variant="outline">
                    الرصيد الجديد: {maintenanceResults.account_1130_correction.new_balance.toFixed(3)} د.ك
                  </Badge>
                  <Badge variant={maintenanceResults.account_1130_correction.correction_amount >= 0 ? 'default' : 'destructive'}>
                    التصحيح: {maintenanceResults.account_1130_correction.correction_amount.toFixed(3)} د.ك
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* تقرير التدقيق */}
      {auditResults && (
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">تقرير التدقيق للقيود المعلقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="destructive" className="text-sm">
                  إجمالي مبلغ القيود المعلقة: {auditResults.total_orphaned_amount.toFixed(3)} د.ك
                </Badge>
                <Badge variant="outline" className="text-sm">
                  عدد القيود المعلقة: {auditResults.entries.filter(e => e.status === 'orphaned').length}
                </Badge>
              </div>
              
              {auditResults.entries.filter(e => e.status === 'orphaned').length > 0 && (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {auditResults.entries
                    .filter(e => e.status === 'orphaned')
                    .slice(0, 10)
                    .map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div>
                        <span className="font-medium">{entry.entry_number}</span>
                        <span className="text-muted-foreground mr-2">- {entry.reference_type}</span>
                      </div>
                      <Badge variant="destructive">
                        {entry.amount.toFixed(3)} د.ك
                      </Badge>
                    </div>
                  ))}
                  {auditResults.entries.filter(e => e.status === 'orphaned').length > 10 && (
                    <div className="text-center text-sm text-muted-foreground">
                      ... و {auditResults.entries.filter(e => e.status === 'orphaned').length - 10} قيد آخر
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};