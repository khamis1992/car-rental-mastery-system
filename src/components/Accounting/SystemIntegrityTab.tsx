import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Activity,
  Database,
  FileX,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface IntegrityReport {
  payments_without_entries: number;
  invoices_without_entries: number;
  unbalanced_entries: number;
  missing_required_accounts: number;
  overall_status: 'healthy' | 'needs_attention';
  validation_timestamp: string;
}

interface ReprocessResult {
  processed_count: number;
  error_count: number;
  total_processed: number;
  results: Array<{
    payment_id: string;
    invoice_number: string;
    amount: number;
    status: 'success' | 'error';
    error_message?: string;
  }>;
}

export const SystemIntegrityTab = () => {
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [reprocessResult, setReprocessResult] = useState<ReprocessResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);

  const validateIntegrity = async () => {
    setIsValidating(true);
    try {
      const { data, error } = await supabase.rpc('validate_accounting_integrity');
      
      if (error) {
        console.error('Error validating integrity:', error);
        toast.error('فشل في فحص سلامة النظام');
        return;
      }

      setIntegrityReport(data as unknown as IntegrityReport);
      
      if ((data as unknown as IntegrityReport).overall_status === 'healthy') {
        toast.success('النظام المحاسبي سليم ومتوازن');
      } else {
        toast.warning('تم العثور على مشاكل تحتاج إلى معالجة');
      }
    } catch (error) {
      console.error('Error during validation:', error);
      toast.error('خطأ في فحص سلامة النظام');
    } finally {
      setIsValidating(false);
    }
  };

  const reprocessPayments = async () => {
    setIsReprocessing(true);
    try {
      const { data, error } = await supabase.rpc('reprocess_missing_payment_entries');
      
      if (error) {
        console.error('Error reprocessing payments:', error);
        toast.error('فشل في إعادة معالجة المدفوعات');
        return;
      }

      setReprocessResult(data as unknown as ReprocessResult);
      
      if ((data as unknown as ReprocessResult).processed_count > 0) {
        toast.success(`تم معالجة ${(data as unknown as ReprocessResult).processed_count} دفعة بنجاح`);
        // Refresh integrity report
        await validateIntegrity();
      } else {
        toast.info('لا توجد مدفوعات تحتاج إلى معالجة');
      }
    } catch (error) {
      console.error('Error during reprocessing:', error);
      toast.error('خطأ في إعادة معالجة المدفوعات');
    } finally {
      setIsReprocessing(false);
    }
  };

  const reprocessInvoices = async () => {
    setIsReprocessing(true);
    try {
      const { data, error } = await supabase.rpc('reprocess_missing_invoice_entries');
      
      if (error) {
        console.error('Error reprocessing invoices:', error);
        toast.error('فشل في إعادة معالجة الفواتير');
        return;
      }

      toast.success(`تم معالجة ${(data as any).processed_count} فاتورة بنجاح`);
      // Refresh integrity report
      await validateIntegrity();
    } catch (error) {
      console.error('Error during invoice reprocessing:', error);
      toast.error('خطأ في إعادة معالجة الفواتير');
    } finally {
      setIsReprocessing(false);
    }
  };

  return (
    <div className="space-y-6 rtl">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold rtl-title">سلامة النظام المحاسبي</h3>
          <p className="text-sm text-muted-foreground">
            فحص وإصلاح مشاكل التكامل المحاسبي
          </p>
        </div>
        <Button 
          onClick={validateIntegrity}
          disabled={isValidating}
          className="flex items-center gap-2 flex-row-reverse"
        >
          {isValidating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Activity className="h-4 w-4" />
          )}
          فحص سلامة النظام
        </Button>
      </div>

      {integrityReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-row-reverse rtl-title">
              <Database className="h-5 w-5" />
              تقرير سلامة النظام
            </CardTitle>
            <CardDescription>
              آخر فحص: {new Date(integrityReport.validation_timestamp).toLocaleString('ar-SA')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2 flex-row-reverse">
              {integrityReport.overall_status === 'healthy' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Badge variant="default" className="bg-green-500">
                    النظام سليم
                  </Badge>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <Badge variant="destructive">
                    يحتاج إلى اهتمام
                  </Badge>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-destructive">
                  {integrityReport.payments_without_entries}
                </div>
                <div className="text-sm text-muted-foreground">
                  مدفوعات بدون قيود
                </div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-destructive">
                  {integrityReport.invoices_without_entries}
                </div>
                <div className="text-sm text-muted-foreground">
                  فواتير بدون قيود
                </div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-destructive">
                  {integrityReport.unbalanced_entries}
                </div>
                <div className="text-sm text-muted-foreground">
                  قيود غير متوازنة
                </div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-destructive">
                  {integrityReport.missing_required_accounts}
                </div>
                <div className="text-sm text-muted-foreground">
                  حسابات مفقودة
                </div>
              </div>
            </div>

            {(integrityReport.payments_without_entries > 0 || integrityReport.invoices_without_entries > 0) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-semibold rtl-title">إجراءات الإصلاح</h4>
                  
                  <div className="flex gap-2 flex-row-reverse">
                    {integrityReport.payments_without_entries > 0 && (
                      <Button 
                        onClick={reprocessPayments}
                        disabled={isReprocessing}
                        variant="outline"
                        className="flex items-center gap-2 flex-row-reverse"
                      >
                        {isReprocessing ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                        معالجة المدفوعات ({integrityReport.payments_without_entries})
                      </Button>
                    )}
                    
                    {integrityReport.invoices_without_entries > 0 && (
                      <Button 
                        onClick={reprocessInvoices}
                        disabled={isReprocessing}
                        variant="outline"
                        className="flex items-center gap-2 flex-row-reverse"
                      >
                        {isReprocessing ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileX className="h-4 w-4" />
                        )}
                        معالجة الفواتير ({integrityReport.invoices_without_entries})
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {reprocessResult && (
        <Card>
          <CardHeader>
            <CardTitle className="rtl-title">نتائج إعادة المعالجة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 flex-row-reverse">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {reprocessResult.processed_count}
                </div>
                <div className="text-sm text-muted-foreground">نجح</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {reprocessResult.error_count}
                </div>
                <div className="text-sm text-muted-foreground">فشل</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {reprocessResult.total_processed}
                </div>
                <div className="text-sm text-muted-foreground">إجمالي</div>
              </div>
            </div>

            {reprocessResult.processed_count > 0 && (
              <Progress 
                value={(reprocessResult.processed_count / reprocessResult.total_processed) * 100} 
                className="w-full"
              />
            )}

            {reprocessResult.error_count > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  حدثت أخطاء في {reprocessResult.error_count} عملية. يرجى مراجعة السجلات للحصول على التفاصيل.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Alert>
        <Activity className="h-4 w-4" />
        <AlertDescription>
          يُنصح بتشغيل فحص سلامة النظام بانتظام للتأكد من سلامة البيانات المحاسبية.
          في حالة وجود مشاكل، استخدم أدوات إعادة المعالجة لإصلاحها تلقائياً.
        </AlertDescription>
      </Alert>
    </div>
  );
};