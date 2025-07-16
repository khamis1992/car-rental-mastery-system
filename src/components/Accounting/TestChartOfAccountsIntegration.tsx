import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';

interface AccountSummary {
  account_type: string;
  count: number;
  total_balance: number;
}

interface TestResult {
  success: boolean;
  accounts_created: number;
  accounts_summary: AccountSummary[];
  error?: string;
}

export const TestChartOfAccountsIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [currentAccounts, setCurrentAccounts] = useState<AccountSummary[]>([]);
  const { toast } = useToast();

  const loadCurrentAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('account_type, current_balance')
        .eq('is_active', true);

      if (error) throw error;

      // تجميع الحسابات حسب النوع
      const summary = data.reduce((acc: Record<string, AccountSummary>, account) => {
        const type = account.account_type;
        if (!acc[type]) {
          acc[type] = {
            account_type: type,
            count: 0,
            total_balance: 0
          };
        }
        acc[type].count += 1;
        acc[type].total_balance += Number(account.current_balance || 0);
        return acc;
      }, {});

      setCurrentAccounts(Object.values(summary));
    } catch (error) {
      console.error('خطأ في تحميل الحسابات الحالية:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الحسابات الحالية',
        variant: 'destructive',
      });
    }
  };

  const testNewChartOfAccounts = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      // استدعاء دالة تطبيق دليل الحسابات الجديد
      const { data, error } = await supabase.rpc('setup_comprehensive_chart_of_accounts_v2', {
        tenant_id_param: await getCurrentTenantId()
      });

      if (error) throw error;

      // تحميل ملخص الحسابات الجديدة
      await loadCurrentAccounts();

      // تكوين نتيجة الاختبار
      const result: TestResult = {
        success: true,
        accounts_created: data || 0,
        accounts_summary: currentAccounts
      };

      setTestResult(result);
      
      toast({
        title: 'نجح الاختبار',
        description: `تم إنشاء ${data} حساب بنجاح`,
      });

    } catch (error: any) {
      console.error('خطأ في اختبار دليل الحسابات:', error);
      
      const result: TestResult = {
        success: false,
        accounts_created: 0,
        accounts_summary: [],
        error: error.message
      };

      setTestResult(result);

      toast({
        title: 'فشل الاختبار',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTenantId = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('المستخدم غير مصادق عليه');

    const { data, error } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      throw new Error('لم يتم العثور على معلومات المؤسسة');
    }

    return data.tenant_id;
  };

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      asset: 'الأصول',
      liability: 'الالتزامات',
      equity: 'حقوق الملكية',
      revenue: 'الإيرادات',
      expense: 'المصروفات'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatBalance = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  React.useEffect(() => {
    loadCurrentAccounts();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            اختبار تكامل دليل الحسابات الشامل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              هذا الاختبار سيطبق دليل الحسابات الشامل الجديد على المؤسسة الحالية. 
              سيتم حذف الحسابات الموجودة وإنشاء الحسابات الجديدة.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button 
              onClick={testNewChartOfAccounts}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'جاري التطبيق...' : 'تطبيق دليل الحسابات الجديد'}
            </Button>

            <Button 
              variant="outline"
              onClick={loadCurrentAccounts}
              disabled={loading}
            >
              تحديث الحسابات الحالية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* عرض الحسابات الحالية */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص الحسابات الحالية</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">نوع الحساب</TableHead>
                <TableHead className="text-right">عدد الحسابات</TableHead>
                <TableHead className="text-right">إجمالي الرصيد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentAccounts.map((summary) => (
                <TableRow key={summary.account_type}>
                  <TableCell className="text-right">
                    <Badge variant="outline">
                      {getAccountTypeLabel(summary.account_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {summary.count}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatBalance(summary.total_balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {currentAccounts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد حسابات محملة
            </div>
          )}
        </CardContent>
      </Card>

      {/* عرض نتائج الاختبار */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              نتائج الاختبار
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">حالة الاختبار</div>
                <Badge variant={testResult.success ? 'default' : 'destructive'}>
                  {testResult.success ? 'نجح' : 'فشل'}
                </Badge>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">الحسابات المنشأة</div>
                <div className="font-medium">{testResult.accounts_created}</div>
              </div>
            </div>

            {testResult.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>خطأ:</strong> {testResult.error}
                </AlertDescription>
              </Alert>
            )}

            {testResult.success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  تم تطبيق دليل الحسابات الشامل بنجاح! يحتوي النظام الآن على هيكل محاسبي متكامل 
                  يشمل جميع الحسابات المطلوبة للعمليات التجارية.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 