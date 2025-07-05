import React, { useState } from 'react';
import { Play, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AccountingBackfillService } from '@/services/BusinessServices/AccountingBackfillService';
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
  const { toast } = useToast();

  const backfillService = new AccountingBackfillService();

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