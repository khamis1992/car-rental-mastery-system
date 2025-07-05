import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, AlertTriangle, CheckCircle, Play, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrencyKWD } from '@/lib/currency';
import { 
  PaymentReconciliationService, 
  PaymentReconciliationResult,
  AccountingIntegrityCheck 
} from '@/services/BusinessServices/PaymentReconciliationService';

export const PaymentReconciliationTab = () => {
  const [loading, setLoading] = useState(false);
  const [integrityCheck, setIntegrityCheck] = useState<AccountingIntegrityCheck | null>(null);
  const [missingPayments, setMissingPayments] = useState<any[]>([]);
  const [lastResult, setLastResult] = useState<PaymentReconciliationResult | null>(null);
  const [showMissingPayments, setShowMissingPayments] = useState(false);
  const { toast } = useToast();

  const reconciliationService = new PaymentReconciliationService();

  const checkAccountingIntegrity = async () => {
    try {
      setLoading(true);
      const result = await reconciliationService.validateAccountingIntegrity();
      setIntegrityCheck(result);
      
      if (result.overall_status === 'needs_attention') {
        const missing = await reconciliationService.getMissingPaymentEntries();
        setMissingPayments(missing);
      }
      
      toast({
        title: "تم التحقق من سلامة البيانات",
        description: result.overall_status === 'healthy' 
          ? "جميع البيانات المحاسبية سليمة" 
          : "تم العثور على مشاكل تحتاج معالجة"
      });
    } catch (error) {
      console.error('Error checking integrity:', error);
      toast({
        title: "خطأ في التحقق",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const reprocessAllMissingEntries = async () => {
    try {
      setLoading(true);
      const result = await reconciliationService.reprocessMissingPaymentEntries();
      setLastResult(result);
      
      toast({
        title: "تمت إعادة المعالجة",
        description: `تم معالجة ${result.processed_count} دفعة بنجاح، ${result.error_count} دفعة فشلت`
      });
      
      // إعادة فحص السلامة
      await checkAccountingIntegrity();
    } catch (error) {
      console.error('Error reprocessing entries:', error);
      toast({
        title: "خطأ في إعادة المعالجة",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const reprocessSinglePayment = async (paymentId: string) => {
    try {
      setLoading(true);
      await reconciliationService.reprocessSinglePayment(paymentId);
      
      toast({
        title: "تمت المعالجة",
        description: "تم إنشاء القيد المحاسبي للدفعة"
      });
      
      // إعادة فحص السلامة
      await checkAccountingIntegrity();
    } catch (error) {
      console.error('Error reprocessing single payment:', error);
      toast({
        title: "خطأ في المعالجة",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAccountingIntegrity();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">تسوية المدفوعات المحاسبية</h3>
          <p className="text-sm text-muted-foreground">
            فحص ومعالجة المدفوعات التي لم يتم إنشاء قيود محاسبية لها
          </p>
        </div>
        <Button 
          onClick={checkAccountingIntegrity} 
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          فحص السلامة
        </Button>
      </div>

      {/* عرض نتائج فحص السلامة */}
      {integrityCheck && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {integrityCheck.overall_status === 'healthy' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              )}
              حالة النظام المحاسبي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  {integrityCheck.payments_without_entries}
                </div>
                <div className="text-sm text-muted-foreground">
                  مدفوعات بدون قيود
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {integrityCheck.invoices_without_entries}
                </div>
                <div className="text-sm text-muted-foreground">
                  فواتير بدون قيود
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {integrityCheck.unbalanced_entries}
                </div>
                <div className="text-sm text-muted-foreground">
                  قيود غير متوازنة
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {integrityCheck.missing_required_accounts}
                </div>
                <div className="text-sm text-muted-foreground">
                  حسابات مطلوبة مفقودة
                </div>
              </div>
            </div>

            {integrityCheck.overall_status === 'needs_attention' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  تم العثور على مشاكل في النظام المحاسبي تحتاج إلى معالجة فورية
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* أزرار المعالجة */}
      {integrityCheck && integrityCheck.payments_without_entries > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>إجراءات المعالجة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={reprocessAllMissingEntries}
                disabled={loading}
                className="btn-primary"
              >
                <Play className="w-4 h-4 mr-2" />
                معالجة جميع المدفوعات المفقودة
              </Button>
              
              <Button
                onClick={() => setShowMissingPayments(!showMissingPayments)}
                variant="outline"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showMissingPayments ? 'إخفاء' : 'عرض'} التفاصيل
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* عرض المدفوعات المفقودة */}
      {showMissingPayments && missingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>المدفوعات التي تحتاج معالجة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {missingPayments.slice(0, 10).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{payment.payment_number}</div>
                    <div className="text-sm text-muted-foreground">
                      فاتورة: {payment.invoice_number} | عميل: {payment.customer_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {payment.payment_date} | {payment.payment_method}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {formatCurrencyKWD(payment.amount)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reprocessSinglePayment(payment.id)}
                      disabled={loading}
                    >
                      معالجة
                    </Button>
                  </div>
                </div>
              ))}
              {missingPayments.length > 10 && (
                <div className="text-center text-sm text-muted-foreground">
                  وأكثر من {missingPayments.length - 10} مدفوعات أخرى...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* عرض نتائج آخر معالجة */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle>نتائج آخر معالجة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {lastResult.processed_count}
                </div>
                <div className="text-sm text-muted-foreground">تم بنجاح</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {lastResult.error_count}
                </div>
                <div className="text-sm text-muted-foreground">فشل</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {lastResult.total_processed}
                </div>
                <div className="text-sm text-muted-foreground">إجمالي</div>
              </div>
            </div>

            {lastResult.results.length > 0 && (
              <div className="space-y-2">
                <Separator />
                <div className="text-sm font-medium">تفاصيل المعالجة:</div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {lastResult.results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{result.invoice_number}</span>
                      <div className="flex items-center gap-2">
                        <span>{formatCurrencyKWD(result.amount)}</span>
                        <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                          {result.status === 'success' ? 'نجح' : 'فشل'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};