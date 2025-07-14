import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  FileText,
  Calculator,
  Settings
} from 'lucide-react';
import { CustomerTrackingStats } from '@/types/customerTracking';
import { customerTrackingService } from '@/services/customerTrackingService';
import { useToast } from '@/hooks/use-toast';
import { CustomerLedgerTab } from './CustomerLedgerTab';
import { CustomerStatementsTab } from './CustomerStatementsTab';
import { AgingAnalysisTab } from './AgingAnalysisTab';
import { CustomerBalancesTab } from './CustomerBalancesTab';

export const CustomerTrackingDashboard = () => {
  const [stats, setStats] = useState<CustomerTrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const statsData = await customerTrackingService.getCustomerTrackingStats();
      setStats(statsData);
    } catch (error) {
      console.error('خطأ في تحميل إحصائيات تتبع العملاء:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل إحصائيات تتبع العملاء',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>جاري تحميل نظام تتبع العملاء...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* لوحة الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العملاء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_customers_with_balance || 0}</div>
            <p className="text-xs text-muted-foreground">عميل له رصيد مستحق</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستحقات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats?.total_outstanding || 0)}</div>
            <p className="text-xs text-muted-foreground">إجمالي المبالغ المستحقة</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبالغ المتأخرة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatAmount(stats?.overdue_amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">مبالغ متأخرة السداد</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العملاء الحرجون</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.critical_customers || 0}</div>
            <p className="text-xs text-muted-foreground">أكثر من 120 يوم تأخير</p>
          </CardContent>
        </Card>
      </div>

      {/* تنبيه العميل الأكثر تأخيراً */}
      {stats?.most_overdue_customer && (
        <Card className="card-elegant border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive rtl-title">
              <AlertTriangle className="h-5 w-5" />
              تنبيه: عميل متأخر في السداد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{stats.most_overdue_customer.customer_name}</p>
                <p className="text-sm text-muted-foreground">
                  متأخر {stats.most_overdue_customer.days_overdue} يوم
                </p>
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-destructive">
                  {formatAmount(stats.most_overdue_customer.amount)}
                </p>
                <Badge variant="destructive">حرج</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="ledger" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 rtl-tabs">
          <TabsTrigger value="ledger" className="rtl-tab">
            <FileText className="w-4 h-4 ml-2" />
            دفتر الأستاذ المساعد
          </TabsTrigger>
          <TabsTrigger value="statements" className="rtl-tab">
            <Calendar className="w-4 h-4 ml-2" />
            كشوف الحسابات
          </TabsTrigger>
          <TabsTrigger value="aging" className="rtl-tab">
            <Calculator className="w-4 h-4 ml-2" />
            تحليل أعمار الديون
          </TabsTrigger>
          <TabsTrigger value="balances" className="rtl-tab">
            <Users className="w-4 h-4 ml-2" />
            أرصدة العملاء
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ledger">
          <CustomerLedgerTab />
        </TabsContent>

        <TabsContent value="statements">
          <CustomerStatementsTab />
        </TabsContent>

        <TabsContent value="aging">
          <AgingAnalysisTab onRefresh={loadStats} />
        </TabsContent>

        <TabsContent value="balances">
          <CustomerBalancesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};