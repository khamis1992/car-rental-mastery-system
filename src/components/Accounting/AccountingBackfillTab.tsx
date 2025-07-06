import React, { useState } from 'react';
import { Play, AlertCircle, CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AccountingBackfillService } from '@/services/BusinessServices/AccountingBackfillService';
import { AccountingIntegrationService } from '@/services/BusinessServices/AccountingIntegrationService';
import { useToast } from '@/hooks/use-toast';

interface BackfillResult {
  processed: number;
  created: number;
  errors: string[];
}

interface BackfillResults {
  contracts: BackfillResult;
  invoices: BackfillResult;
  payments: BackfillResult;
  missingInvoices: BackfillResult;
}

export const AccountingBackfillTab = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BackfillResults | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [isFixingRevenue, setIsFixingRevenue] = useState(false);
  const [revenueFixResults, setRevenueFixResults] = useState<any>(null);
  const [isFixingContracts, setIsFixingContracts] = useState(false);
  const [contractFixResults, setContractFixResults] = useState<any>(null);
  const { toast } = useToast();

  const backfillService = new AccountingBackfillService();
  const accountingService = new AccountingIntegrationService();

  const fixDoubleRevenueEntries = async () => {
    try {
      setIsFixingRevenue(true);
      setRevenueFixResults(null);

      const results = await accountingService.fixDoubleRevenueEntries();
      setRevenueFixResults(results);

      toast({
        title: 'اكتمل تصحيح الإيرادات المزدوجة',
        description: `تم معالجة ${results.processed_count} عنصر، وتصحيح ${results.fixed_count} قيد${results.error_count > 0 ? ` مع ${results.error_count} خطأ` : ''}`,
        variant: results.error_count > 0 ? 'destructive' : 'default'
      });

    } catch (error) {
      console.error('Double revenue fix error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تصحيح الإيرادات المزدوجة',
        variant: 'destructive'
      });
    } finally {
      setIsFixingRevenue(false);
    }
  };

  const fixExistingContractAccounting = async () => {
    try {
      setIsFixingContracts(true);
      setContractFixResults(null);

      const results = await accountingService.fixExistingContractAccounting();
      setContractFixResults(results);

      toast({
        title: 'اكتمل تصحيح قيود العقود',
        description: `تم معالجة ${results.total_processed} عقد، وتصحيح ${results.fixed_count} قيد${results.error_count > 0 ? ` مع ${results.error_count} خطأ` : ''}`,
        variant: results.error_count > 0 ? 'destructive' : 'default'
      });

    } catch (error) {
      console.error('Contract accounting fix error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تصحيح قيود العقود',
        variant: 'destructive'
      });
    } finally {
      setIsFixingContracts(false);
    }
  };

  const runBackfill = async () => {
    try {
      setIsRunning(true);
      setResults(null);
      setProgress(0);

      setCurrentStep('إنشاء قيود محاسبية للعقود...');
      setProgress(25);
      const contractResults = await backfillService.createContractAccountingEntries();

      setCurrentStep('إنشاء فواتير للعقود المكتملة...');
      setProgress(50);
      const missingInvoicesResults = await backfillService.createMissingInvoices();

      setCurrentStep('إنشاء قيود محاسبية للفواتير...');
      setProgress(75);
      const invoiceResults = await backfillService.createInvoiceAccountingEntries();

      setCurrentStep('إنشاء قيود محاسبية للمدفوعات...');
      setProgress(90);
      const paymentResults = await backfillService.createPaymentAccountingEntries();

      setProgress(100);
      setCurrentStep('اكتملت العملية');

      const finalResults = {
        contracts: contractResults,
        invoices: invoiceResults,
        payments: paymentResults,
        missingInvoices: missingInvoicesResults
      };

      setResults(finalResults);

      const totalCreated = 
        contractResults.created + 
        invoiceResults.created + 
        paymentResults.created + 
        missingInvoicesResults.created;

      const totalErrors = 
        contractResults.errors.length + 
        invoiceResults.errors.length + 
        paymentResults.errors.length + 
        missingInvoicesResults.errors.length;

      toast({
        title: 'اكتملت عملية الاستكمال',
        description: `تم إنشاء ${totalCreated} قيد محاسبي${totalErrors > 0 ? ` مع ${totalErrors} خطأ` : ''}`,
        variant: totalErrors > 0 ? 'destructive' : 'default'
      });

    } catch (error) {
      console.error('Backfill error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تشغيل عملية الاستكمال',
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
      setCurrentStep('');
      setProgress(0);
    }
  };

  const ResultCard = ({ title, result, color }: { title: string; result: BackfillResult; color: string }) => (
    <Card className="card-elegant">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {result.created > 0 ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>تم معالجتها:</span>
          <Badge variant="outline">{result.processed}</Badge>
        </div>
        <div className="flex justify-between text-sm">
          <span>تم إنشاؤها:</span>
          <Badge className={`bg-${color}-100 text-${color}-800`}>{result.created}</Badge>
        </div>
        {result.errors.length > 0 && (
          <div className="flex justify-between text-sm">
            <span>أخطاء:</span>
            <Badge variant="destructive">{result.errors.length}</Badge>
          </div>
        )}
        {result.errors.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-medium text-destructive">الأخطاء:</p>
            {result.errors.slice(0, 3).map((error, index) => (
              <p key={index} className="text-xs text-muted-foreground truncate">
                {error}
              </p>
            ))}
            {result.errors.length > 3 && (
              <p className="text-xs text-muted-foreground">
                و {result.errors.length - 3} أخطاء أخرى...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Double Revenue Fix Section */}
      <Card className="card-elegant border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <AlertTriangle className="w-5 h-5" />
            تصحيح الإيرادات المزدوجة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>مهم:</strong> هذه العملية ستقوم بتحديد وتصحيح القيود المحاسبية التي تحتوي على إيرادات مزدوجة (مسجلة في الفاتورة والدفعة معاً).
              سيتم إلغاء القيود الخاطئة وإعادة إنشائها بالطريقة الصحيحة.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <Button 
              onClick={fixDoubleRevenueEntries} 
              disabled={isFixingRevenue}
              size="lg"
              variant="outline"
              className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              {isFixingRevenue ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {isFixingRevenue ? 'جاري التصحيح...' : 'تصحيح الإيرادات المزدوجة'}
            </Button>
          </div>

          {revenueFixResults && (
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">نتائج التصحيح</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-blue-600">{revenueFixResults.processed_count}</p>
                    <p className="text-xs text-muted-foreground">تم فحصها</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{revenueFixResults.fixed_count}</p>
                    <p className="text-xs text-muted-foreground">تم تصحيحها</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-600">{revenueFixResults.error_count}</p>
                    <p className="text-xs text-muted-foreground">أخطاء</p>
                  </div>
                </div>
                
                {revenueFixResults.results && revenueFixResults.results.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">تفاصيل العمليات:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {revenueFixResults.results.slice(0, 5).map((result: any, index: number) => (
                        <div key={index} className="text-xs p-2 bg-white rounded border">
                          <span className="font-medium">فاتورة {result.invoice_number}:</span>
                          <Badge 
                            variant={result.status === 'fixed' ? 'default' : 'destructive'}
                            className="ml-2 text-xs"
                          >
                            {result.status === 'fixed' ? 'تم التصحيح' : 'خطأ'}
                          </Badge>
                          {result.error_message && (
                            <p className="text-red-600 mt-1">{result.error_message}</p>
                          )}
                        </div>
                      ))}
                      {revenueFixResults.results.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          و {revenueFixResults.results.length - 5} عنصر آخر...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Contract Accounting Fix Section */}
      <Card className="card-elegant border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <RefreshCw className="w-5 h-5" />
            تصحيح قيود العقود للإيرادات المؤجلة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>تحديث نظام المحاسبة:</strong> هذه العملية ستقوم بتحويل قيود العقود الموجودة من نظام الإيراد المباشر
              إلى نظام الإيرادات المؤجلة. سيتم تسجيل الإيراد عند الدفع بدلاً من تسجيله عند إنشاء العقد.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <Button 
              onClick={fixExistingContractAccounting} 
              disabled={isFixingContracts}
              size="lg"
              variant="outline"
              className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              {isFixingContracts ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isFixingContracts ? 'جاري التصحيح...' : 'تحويل إلى الإيرادات المؤجلة'}
            </Button>
          </div>

          {contractFixResults && (
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">نتائج التصحيح</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-blue-600">{contractFixResults.total_processed}</p>
                    <p className="text-xs text-muted-foreground">تم فحصها</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{contractFixResults.fixed_count}</p>
                    <p className="text-xs text-muted-foreground">تم تصحيحها</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-600">{contractFixResults.error_count}</p>
                    <p className="text-xs text-muted-foreground">أخطاء</p>
                  </div>
                </div>
                
                {contractFixResults.results && contractFixResults.results.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">تفاصيل العمليات:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {contractFixResults.results.slice(0, 5).map((result: any, index: number) => (
                        <div key={index} className="text-xs p-2 bg-white rounded border">
                          <span className="font-medium">عقد {result.contract_number}:</span>
                          <Badge 
                            variant={result.status === 'fixed' ? 'default' : 'destructive'}
                            className="ml-2 text-xs"
                          >
                            {result.status === 'fixed' ? 'تم التصحيح' : 'خطأ'}
                          </Badge>
                          {result.error_message && (
                            <p className="text-red-600 mt-1">{result.error_message}</p>
                          )}
                        </div>
                      ))}
                      {contractFixResults.results.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          و {contractFixResults.results.length - 5} عقد آخر...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Existing Backfill Section */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            استكمال القيود المحاسبية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              هذه العملية ستقوم بإنشاء القيود المحاسبية المفقودة للعقود والفواتير والمدفوعات الموجودة في النظام.
              قد تستغرق هذه العملية بعض الوقت حسب كمية البيانات.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <Button 
              onClick={runBackfill} 
              disabled={isRunning}
              size="lg"
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isRunning ? 'جاري التشغيل...' : 'تشغيل عملية الاستكمال'}
            </Button>

            {isRunning && (
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span>{currentStep}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">نتائج العملية</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ResultCard 
              title="قيود العقود"
              result={results.contracts}
              color="blue"
            />
            <ResultCard 
              title="الفواتير المفقودة"
              result={results.missingInvoices}
              color="green"
            />
            <ResultCard 
              title="قيود الفواتير"
              result={results.invoices}
              color="purple"
            />
            <ResultCard 
              title="قيود المدفوعات"
              result={results.payments}
              color="orange"
            />
          </div>

          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>ملخص النتائج</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {results.contracts.created + results.invoices.created + 
                     results.payments.created + results.missingInvoices.created}
                  </p>
                  <p className="text-sm text-muted-foreground">إجمالي المُنشأ</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {results.contracts.processed + results.invoices.processed + 
                     results.payments.processed + results.missingInvoices.processed}
                  </p>
                  <p className="text-sm text-muted-foreground">إجمالي المُعالج</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">
                    {results.contracts.errors.length + results.invoices.errors.length + 
                     results.payments.errors.length + results.missingInvoices.errors.length}
                  </p>
                  <p className="text-sm text-muted-foreground">إجمالي الأخطاء</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {results.contracts.errors.length + results.invoices.errors.length + 
                     results.payments.errors.length + results.missingInvoices.errors.length === 0 ? 
                     '100%' : '---'}
                  </p>
                  <p className="text-sm text-muted-foreground">معدل النجاح</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
