import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCustomerOperations } from '@/hooks/useCustomerOperations';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export const CustomerTestPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { testCustomerAccess, addCustomer, validateCustomerData, isLoading } = useCustomerOperations();
  const { runDiagnostics, diagnosticResult } = useDiagnostics();

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: TestResult[] = [];

    try {
      // 1. اختبار التشخيص العام
      toast.info('تشغيل التشخيص العام...');
      await runDiagnostics();
      
      if (diagnosticResult) {
        results.push({
          name: 'التشخيص العام',
          status: diagnosticResult.isAuthenticated ? 'success' : 'error',
          message: diagnosticResult.isAuthenticated ? 'تم التحقق من المصادقة بنجاح' : 'خطأ في المصادقة',
          details: diagnosticResult
        });
      }

      // 2. اختبار عمليات العملاء
      toast.info('اختبار صلاحيات العملاء...');
      try {
        const accessTest = await testCustomerAccess();
        results.push({
          name: 'صلاحيات العملاء',
          status: accessTest?.canRead ? 'success' : 'error',
          message: accessTest?.canRead ? 'يمكن قراءة العملاء بنجاح' : 'لا يمكن قراءة العملاء',
          details: accessTest
        });

        results.push({
          name: 'توليد رقم العميل',
          status: accessTest?.canGenerateNumber ? 'success' : 'warning',
          message: accessTest?.canGenerateNumber ? 'تعمل دالة توليد الأرقام بنجاح' : 'مشكلة في دالة توليد الأرقام',
          details: { generatedNumber: accessTest?.generatedNumber }
        });
      } catch (error) {
        results.push({
          name: 'صلاحيات العملاء',
          status: 'error',
          message: `خطأ في اختبار الصلاحيات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
          details: error
        });
      }

      // 3. اختبار التحقق من صحة البيانات
      toast.info('اختبار التحقق من البيانات...');
      const testData = {
        customer_type: 'individual' as const,
        name: 'اختبار العميل',
        phone: '99887766',
        email: 'test@example.com'
      };

      const validationErrors = validateCustomerData(testData);
      results.push({
        name: 'التحقق من صحة البيانات',
        status: validationErrors.length === 0 ? 'success' : 'error',
        message: validationErrors.length === 0 ? 'التحقق من البيانات يعمل بشكل صحيح' : `أخطاء في التحقق: ${validationErrors.length}`,
        details: validationErrors
      });

      // 4. اختبار إضافة عميل (اختياري)
      toast.info('اختبار إضافة عميل تجريبي...');
      try {
        const testCustomer = await addCustomer({
          customer_type: 'individual',
          name: `عميل تجريبي ${Date.now()}`,
          phone: `99${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
          email: `test${Date.now()}@example.com`
        });

        results.push({
          name: 'إضافة عميل تجريبي',
          status: testCustomer ? 'success' : 'error',
          message: testCustomer ? 'تم إنشاء العميل التجريبي بنجاح' : 'فشل في إنشاء العميل التجريبي',
          details: testCustomer
        });
      } catch (error) {
        results.push({
          name: 'إضافة عميل تجريبي',
          status: 'error',
          message: `فشل في إضافة العميل: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
          details: error
        });
      }

      setTestResults(results);
      
      const successCount = results.filter(r => r.status === 'success').length;
      const totalCount = results.length;
      
      if (successCount === totalCount) {
        toast.success(`اكتمل جميع الاختبارات بنجاح (${successCount}/${totalCount})`);
      } else {
        toast.warning(`اكتمل ${successCount} من ${totalCount} اختبارات بنجاح`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف في الاختبار';
      results.push({
        name: 'خطأ عام',
        status: 'error',
        message: errorMessage,
        details: error
      });
      setTestResults(results);
      toast.error(`فشل في تشغيل الاختبارات: ${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">نجح</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">فشل</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">تحذير</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
          <RefreshCw className="w-5 h-5" />
          لوحة اختبار العملاء الشاملة
        </CardTitle>
        <CardDescription className="text-right">
          اختبار شامل لجميع وظائف إدارة العملاء والتحقق من الصلاحيات
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button 
            onClick={runComprehensiveTest}
            disabled={isRunning || isLoading}
            className="flex items-center gap-2 flex-row-reverse"
          >
            {isRunning && <RefreshCw className="w-4 h-4 animate-spin" />}
            {isRunning ? 'جاري التشغيل...' : 'تشغيل الاختبار الشامل'}
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-right">نتائج الاختبار</h3>
            {testResults.map((result, index) => (
              <div 
                key={index}
                className="p-4 border border-border rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    {getStatusBadge(result.status)}
                  </div>
                  <h4 className="font-medium text-right">{result.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground text-right">
                  {result.message}
                </p>
                {result.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-right">تفاصيل إضافية</summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-left overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {testResults.length === 0 && !isRunning && (
          <div className="text-center py-8 text-muted-foreground">
            اضغط على "تشغيل الاختبار الشامل" لبدء الاختبار
          </div>
        )}
      </CardContent>
    </Card>
  );
};