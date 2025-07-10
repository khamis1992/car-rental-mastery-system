import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Calendar, 
  FileText, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useSaasInvoices, useSaasSubscriptions, useRunAutomaticBilling } from '@/hooks/useBillingData';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';

export function AutomaticBillingTab() {
  const [billingResults, setBillingResults] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: subscriptions = [], isLoading: subsLoading } = useSaasSubscriptions();
  const { data: invoices = [], isLoading: invoicesLoading } = useSaasInvoices();
  const runBillingMutation = useRunAutomaticBilling();

  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
  const recentInvoices = invoices.slice(0, 5);
  
  // Calculate subscriptions due for billing (next 7 days)
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const subscriptionsDue = subscriptions.filter(sub => {
    if (sub.status !== 'active') return false;
    // Note: We would need next_billing_date field for this calculation
    // For now, we'll use a mock calculation
    return true;
  });

  const handleRunBilling = async () => {
    setIsProcessing(true);
    try {
      const result = await runBillingMutation.mutateAsync();
      setBillingResults(result);
    } catch (error) {
      console.error('Billing process failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (subsLoading || invoicesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">جاري تحميل بيانات الفوترة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">الفوترة التلقائية</h2>
          <p className="text-muted-foreground">إدارة ومراقبة عمليات الفوترة التلقائية</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
          <Button 
            onClick={handleRunBilling}
            disabled={isProcessing || runBillingMutation.isPending}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            تشغيل الفوترة التلقائية
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الاشتراكات النشطة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              من إجمالي {subscriptions.length} اشتراك
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مستحقة الفوترة</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionsDue.length}</div>
            <p className="text-xs text-muted-foreground">
              خلال الأسبوع القادم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير هذا الشهر</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter(inv => {
                const invDate = new Date(inv.created_at);
                const currentMonth = new Date().getMonth();
                return invDate.getMonth() === currentMonth;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              إجمالي {invoices.length} فاتورة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices
                .filter(inv => inv.status === 'paid')
                .reduce((sum, inv) => sum + inv.amount_due, 0)
                .toFixed(3)} د.ك
            </div>
            <p className="text-xs text-muted-foreground">
              من الفواتير المدفوعة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Results */}
      {billingResults && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">نتائج عملية الفوترة التلقائية:</p>
              <div className="text-sm space-y-1">
                <p>• تم معالجة {billingResults.summary?.total || 0} اشتراك</p>
                <p>• نجح {billingResults.summary?.success || 0} اشتراك</p>
                {billingResults.summary?.errors > 0 && (
                  <p className="text-destructive">• فشل {billingResults.summary.errors} اشتراك</p>
                )}
              </div>
              {billingResults.results && billingResults.results.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium mb-2">التفاصيل:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {billingResults.results.map((result: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                        <span>{result.tenant_name}</span>
                        <div className="flex items-center gap-2">
                          {result.status === 'success' ? (
                            <>
                              <Badge variant="default">نجح</Badge>
                              <span>{result.amount?.toFixed(3)} د.ك</span>
                            </>
                          ) : (
                            <>
                              <Badge variant="destructive">فشل</Badge>
                              <span className="text-destructive text-xs">{result.error}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              أحدث الفواتير
            </CardTitle>
            <CardDescription>
              آخر 5 فواتير تم إنشاؤها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInvoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  لا توجد فواتير حتى الآن
                </p>
              ) : (
                recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.tenant?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(invoice.created_at), 'dd/MM/yyyy', { locale: ar })}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{invoice.amount_due.toFixed(3)} د.ك</p>
                      <Badge 
                        variant={
                          invoice.status === 'paid' ? 'default' : 
                          invoice.status === 'sent' ? 'secondary' : 
                          invoice.status === 'overdue' ? 'destructive' : 'outline'
                        }
                      >
                        {invoice.status === 'paid' ? 'مدفوعة' :
                         invoice.status === 'sent' ? 'مرسلة' :
                         invoice.status === 'overdue' ? 'متأخرة' :
                         invoice.status === 'draft' ? 'مسودة' : 'ملغية'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              الاشتراكات القادمة للتجديد
            </CardTitle>
            <CardDescription>
              الاشتراكات التي تحتاج فوترة قريباً
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptionsDue.slice(0, 5).length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  لا توجد اشتراكات مستحقة للفوترة
                </p>
              ) : (
                subscriptionsDue.slice(0, 5).map((subscription) => (
                  <div key={subscription.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{subscription.tenant?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.plan?.plan_name} - {subscription.billing_cycle === 'monthly' ? 'شهري' : 'سنوي'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        آخر تحديث: {formatDistanceToNow(new Date(subscription.updated_at), { addSuffix: true, locale: ar })}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{subscription.amount.toFixed(3)} د.ك</p>
                      <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                        {subscription.status === 'active' ? 'نشط' : 
                         subscription.status === 'paused' ? 'متوقف' :
                         subscription.status === 'cancelled' ? 'ملغي' : 'منتهي'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Settings Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            إعدادات الفوترة التلقائية
          </CardTitle>
          <CardDescription>
            تكوين معايير وجدولة عمليات الفوترة التلقائية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ستتم إضافة إعدادات الفوترة التلقائية قريباً، بما في ذلك:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>جدولة الفوترة التلقائية (يومي، أسبوعي، شهري)</li>
                <li>إعدادات التذكيرات والإشعارات</li>
                <li>تخصيص قوالب الفواتير</li>
                <li>إعدادات الضرائب والخصومات</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}