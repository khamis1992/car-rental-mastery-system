import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
  Calculator,
  BookOpen
} from 'lucide-react';
import { accountingService } from '@/services/accountingService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DashboardData {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  accountsCount: number;
  activeAccountsCount: number;
  recentTransactions: any[];
  pendingEntries: number;
  monthlyTrends: { month: string; revenue: number; expenses: number }[];
  topAccounts: { account_name: string; account_code: string; balance: number; type: string }[];
}

interface KPI {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
  format: 'currency' | 'number' | 'percentage';
}

export const AccountingDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // جلب البيانات المالية الأساسية
      const [
        assets,
        liabilities,
        equity,
        revenue,
        expenses,
        accounts,
        recentTransactions,
        pendingEntries
      ] = await Promise.all([
        getAccountTypeTotal('asset'),
        getAccountTypeTotal('liability'),
        getAccountTypeTotal('equity'),
        getAccountTypeTotal('revenue'),
        getAccountTypeTotal('expense'),
        accountingService.getChartOfAccounts(),
        getRecentTransactions(),
        getPendingEntries()
      ]);

      const netIncome = revenue - expenses;
      const activeAccounts = accounts.filter(acc => acc.is_active);

      // حساب الاتجاهات الشهرية
      const monthlyTrends = await getMonthlyTrends();
      
      // أهم الحسابات
      const topAccounts = await getTopAccounts();

      const dashboardData: DashboardData = {
        totalAssets: assets,
        totalLiabilities: liabilities,
        totalEquity: equity,
        totalRevenue: revenue,
        totalExpenses: expenses,
        netIncome,
        accountsCount: accounts.length,
        activeAccountsCount: activeAccounts.length,
        recentTransactions,
        pendingEntries,
        monthlyTrends,
        topAccounts
      };

      setData(dashboardData);

      // حساب المؤشرات الرئيسية
      const calculatedKPIs: KPI[] = [
        {
          label: 'هامش الربح',
          value: revenue > 0 ? (netIncome / revenue) * 100 : 0,
          trend: netIncome >= 0 ? 'up' : 'down',
          percentage: 0, // يمكن حسابه مقارنة بالشهر السابق
          format: 'percentage'
        },
        {
          label: 'نسبة السيولة',
          value: liabilities > 0 ? assets / liabilities : 0,
          trend: assets > liabilities ? 'up' : 'down',
          percentage: 0,
          format: 'number'
        },
        {
          label: 'العائد على الأصول',
          value: assets > 0 ? (netIncome / assets) * 100 : 0,
          trend: netIncome >= 0 ? 'up' : 'down',
          percentage: 0,
          format: 'percentage'
        },
        {
          label: 'نسبة المصروفات',
          value: revenue > 0 ? (expenses / revenue) * 100 : 0,
          trend: expenses < revenue * 0.7 ? 'up' : 'down',
          percentage: 0,
          format: 'percentage'
        }
      ];

      setKpis(calculatedKPIs);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات لوحة المعلومات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeTotal = async (accountType: string): Promise<number> => {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('current_balance')
      .eq('account_type', accountType)
      .eq('is_active', true);

    if (error) throw error;
    return data?.reduce((sum, account) => sum + (account.current_balance || 0), 0) || 0;
  };

  const getRecentTransactions = async () => {
    const { data, error } = await supabase
      .from('journal_entry_lines')
      .select(`
        *,
        journal_entries!inner(
          entry_number,
          entry_date,
          description,
          status
        ),
        chart_of_accounts!inner(
          account_name,
          account_code
        )
      `)
      .eq('journal_entries.status', 'posted')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  };

  const getPendingEntries = async (): Promise<number> => {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('status', 'draft');

    if (error) throw error;
    return data?.length || 0;
  };

  const getMonthlyTrends = async () => {
    // إنشاء بيانات وهمية للاتجاهات الشهرية
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
    
    return months.map(month => ({
      month,
      revenue: Math.random() * 10000,
      expenses: Math.random() * 8000
    }));
  };

  const getTopAccounts = async () => {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('account_name, account_code, current_balance, account_type')
      .eq('is_active', true)
      .eq('allow_posting', true)
      .order('current_balance', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data?.map(account => ({
      account_name: account.account_name,
      account_code: account.account_code,
      balance: account.current_balance || 0,
      type: account.account_type
    })) || [];
  };

  const formatCurrency = (amount: number) => {
    return `د.ك ${amount.toLocaleString('ar-KW', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ar-KW');
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      asset: 'text-blue-600',
      liability: 'text-red-600',
      equity: 'text-green-600',
      revenue: 'text-emerald-600',
      expense: 'text-orange-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">جاري تحميل لوحة المعلومات...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">خطأ في تحميل البيانات</h3>
        <p className="text-muted-foreground">لم نتمكن من تحميل بيانات لوحة المعلومات</p>
        <Button onClick={loadDashboardData} className="mt-4">إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* المؤشرات المالية الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأصول</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.totalAssets)}</div>
            <p className="text-xs text-muted-foreground">القيمة الدفترية للأصول</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الخصوم</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(data.totalLiabilities)}</div>
            <p className="text-xs text-muted-foreground">الالتزامات المالية</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حقوق الملكية</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(data.totalEquity)}</div>
            <p className="text-xs text-muted-foreground">رأس المال والاحتياطيات</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(data.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">الإيرادات المحققة</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(data.netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">الربح بعد المصروفات</p>
          </CardContent>
        </Card>
      </div>

      {/* المؤشرات الأداء والتحليلات */}
      <Tabs defaultValue="kpis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kpis">مؤشرات الأداء</TabsTrigger>
          <TabsTrigger value="accounts">الحسابات</TabsTrigger>
          <TabsTrigger value="transactions">المعاملات الأخيرة</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
        </TabsList>

        <TabsContent value="kpis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => (
              <Card key={index} className="card-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : kpi.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {kpi.format === 'currency' && formatCurrency(kpi.value)}
                    {kpi.format === 'number' && formatNumber(kpi.value)}
                    {kpi.format === 'percentage' && formatPercentage(kpi.value)}
                  </div>
                  <Progress 
                    value={Math.min(Math.abs(kpi.value), 100)} 
                    className="mt-2" 
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                  <BookOpen className="w-5 h-5" />
                  إحصائيات الحسابات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>إجمالي الحسابات:</span>
                  <Badge variant="default">{data.accountsCount}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>الحسابات النشطة:</span>
                  <Badge variant="default">{data.activeAccountsCount}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>القيود المعلقة:</span>
                  <Badge variant={data.pendingEntries > 0 ? "destructive" : "default"}>
                    {data.pendingEntries}
                  </Badge>
                </div>
                <Progress 
                  value={(data.activeAccountsCount / data.accountsCount) * 100} 
                  className="mt-2" 
                />
                <p className="text-xs text-muted-foreground">
                  نسبة الحسابات النشطة: {((data.activeAccountsCount / data.accountsCount) * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-right">أهم الحسابات بالرصيد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topAccounts.slice(0, 8).map((account, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {account.account_code} - {account.account_name}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {account.type}
                        </Badge>
                      </div>
                      <div className={`text-sm font-bold ${getAccountTypeColor(account.type)}`}>
                        {formatCurrency(Math.abs(account.balance))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                <FileText className="w-5 h-5" />
                آخر المعاملات المالية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {data.recentTransactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {transaction.chart_of_accounts.account_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.journal_entries.entry_number} - {new Date(transaction.journal_entries.entry_date).toLocaleDateString('ar-KW')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.description || transaction.journal_entries.description}
                        </div>
                      </div>
                      <div className="text-right">
                        {transaction.debit_amount > 0 && (
                          <div className="text-sm font-bold text-green-600">
                            +{formatCurrency(transaction.debit_amount)}
                          </div>
                        )}
                        {transaction.credit_amount > 0 && (
                          <div className="text-sm font-bold text-red-600">
                            -{formatCurrency(transaction.credit_amount)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد معاملات حديثة
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                <BarChart3 className="w-5 h-5" />
                الاتجاهات الشهرية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.monthlyTrends.length > 0 ? (
                <div className="space-y-4">
                  {data.monthlyTrends.map((trend, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 items-center">
                      <div className="text-sm font-medium">{trend.month}</div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">الإيرادات</div>
                        <div className="text-sm font-bold text-emerald-600">
                          {formatCurrency(trend.revenue)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">المصروفات</div>
                        <div className="text-sm font-bold text-red-600">
                          {formatCurrency(trend.expenses)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات كافية لعرض الاتجاهات
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};