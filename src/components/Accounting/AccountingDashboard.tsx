
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Users, 
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { accountingService } from '@/services/accountingService';
import { expenseVoucherService } from '@/services/expenseVoucherService';
import { vehicleSalesService } from '@/services/vehicleSalesService';
import { automatedEntryRulesService } from '@/services/automatedEntryRulesService';
import { ExpenseVouchers } from './ExpenseVouchers';
import { AutomatedJournalEntryService } from './AutomatedJournalEntryService';
import { SmartJournalEntryEditor } from './SmartJournalEntryEditor';
import { toast } from 'sonner';

interface DashboardStats {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  active_contracts: number;
  pending_vouchers: number;
  automated_entries: number;
  balance_sheet_total: number;
  cashflow_status: 'positive' | 'negative' | 'stable';
}

export const AccountingDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    total_revenue: 0,
    total_expenses: 0,
    net_profit: 0,
    active_contracts: 0,
    pending_vouchers: 0,
    automated_entries: 0,
    balance_sheet_total: 0,
    cashflow_status: 'stable'
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [automationRules, setAutomationRules] = useState<any[]>([]);
  const [showJournalEditor, setShowJournalEditor] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // تحميل الإحصائيات الأساسية
      const [
        revenueData,
        expenseData,
        vouchersData,
        automationData,
        activitiesData
      ] = await Promise.all([
        accountingService.getAccountBalancesByType('revenue'),
        accountingService.getAccountBalancesByType('expense'),
        expenseVoucherService.getExpenseVouchers({ status: 'pending_approval' }),
        automatedEntryRulesService.getRules(),
        accountingService.getRecentJournalEntries(10)
      ]);

      const totalRevenue = revenueData.reduce((sum: number, acc: any) => sum + acc.current_balance, 0);
      const totalExpenses = expenseData.reduce((sum: number, acc: any) => sum + acc.current_balance, 0);
      const netProfit = totalRevenue - totalExpenses;

      setStats({
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        active_contracts: 0, // سيتم تحديثه من خدمة العقود
        pending_vouchers: vouchersData.length,
        automated_entries: automationData.filter(rule => rule.is_active).length,
        balance_sheet_total: totalRevenue + totalExpenses,
        cashflow_status: netProfit > 0 ? 'positive' : netProfit < 0 ? 'negative' : 'stable'
      });

      setRecentActivities(activitiesData);
      setAutomationRules(automationData);
    } catch (error) {
      console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
      toast.error('فشل في تحميل بيانات لوحة التحكم');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJournalEntry = async (entryData: any) => {
    try {
      await accountingService.createJournalEntry(entryData);
      toast.success('تم إنشاء القيد بنجاح');
      setShowJournalEditor(false);
      loadDashboardData();
    } catch (error) {
      console.error('خطأ في إنشاء القيد:', error);
      toast.error('فشل في إنشاء القيد');
    }
  };

  const getCashflowIcon = (status: string) => {
    switch (status) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-blue-600" />;
    }
  };

  const getCashflowColor = (status: string) => {
    switch (status) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold rtl-title">لوحة التحكم المحاسبية</h1>
          <p className="text-muted-foreground">نظرة شاملة على الوضع المالي والمحاسبي</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowJournalEditor(true)} className="rtl-flex">
            <FileText className="w-4 h-4" />
            قيد جديد
          </Button>
          <Button variant="outline" onClick={loadDashboardData}>
            <BarChart3 className="w-4 h-4 ml-2" />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-green-600">{stats.total_revenue.toFixed(3)} د.ك</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                <p className="text-2xl font-bold text-red-600">{stats.total_expenses.toFixed(3)} د.ك</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">صافي الربح</p>
                <p className={`text-2xl font-bold ${getCashflowColor(stats.cashflow_status)}`}>
                  {stats.net_profit.toFixed(3)} د.ك
                </p>
              </div>
              {getCashflowIcon(stats.cashflow_status)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">السندات المعلقة</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_vouchers}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="vouchers">سندات الصرف</TabsTrigger>
          <TabsTrigger value="automation">الأتمتة</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* النشاطات الحديثة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  النشاطات الحديثة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">لا توجد نشاطات حديثة</p>
                  ) : (
                    recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <div>
                            <p className="font-medium">{activity.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(activity.created_at).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{activity.entry_type}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* قواعد الأتمتة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  قواعد الأتمتة النشطة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {automationRules.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">لا توجد قواعد أتمتة</p>
                  ) : (
                    automationRules.filter(rule => rule.is_active).slice(0, 5).map((rule, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium">{rule.rule_name}</p>
                            <p className="text-sm text-muted-foreground">{rule.trigger_event}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">نشط</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* مؤشرات الأداء */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                مؤشرات الأداء الرئيسية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {((stats.total_revenue / (stats.total_revenue + stats.total_expenses)) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">نسبة الإيرادات</div>
                  <Progress value={(stats.total_revenue / (stats.total_revenue + stats.total_expenses)) * 100} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {stats.automated_entries}
                  </div>
                  <div className="text-sm text-muted-foreground">قواعد الأتمتة النشطة</div>
                  <Progress value={(stats.automated_entries / 10) * 100} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {stats.pending_vouchers}
                  </div>
                  <div className="text-sm text-muted-foreground">سندات في الانتظار</div>
                  <Progress value={(stats.pending_vouchers / 20) * 100} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vouchers">
          <ExpenseVouchers />
        </TabsContent>

        <TabsContent value="automation">
          <AutomatedJournalEntryService />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>التقارير المالية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <PieChart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">التقارير المالية</p>
                <p className="text-muted-foreground">سيتم إضافة التقارير المالية التفصيلية قريباً</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات النظام المحاسبي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">إعدادات النظام</p>
                <p className="text-muted-foreground">سيتم إضافة إعدادات النظام المحاسبي قريباً</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* محرر القيود الذكي */}
      {showJournalEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <SmartJournalEntryEditor
                onSave={handleCreateJournalEntry}
                onCancel={() => setShowJournalEditor(false)}
                mode="create"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
