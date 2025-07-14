import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { accountingService } from '@/services/accountingService';

interface AccountSummary {
  account_name: string;
  account_code: string;
  account_type: string;
  current_balance: number;
}

interface DashboardSummary {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  netIncome: number;
}

export const SimpleDashboard = () => {
  const [accountSummaries, setAccountSummaries] = useState<AccountSummary[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary>({
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    netIncome: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const accounts = await accountingService.getChartOfAccounts();
      
      // حساب ملخص الحسابات الرئيسية
      const assets = accounts.filter(acc => acc.account_type === 'asset');
      const liabilities = accounts.filter(acc => acc.account_type === 'liability');
      const equity = accounts.filter(acc => acc.account_type === 'equity');
      const revenue = accounts.filter(acc => acc.account_type === 'revenue');
      const expenses = accounts.filter(acc => acc.account_type === 'expense');

      const totalAssets = assets.reduce((sum, acc) => sum + acc.current_balance, 0);
      const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.current_balance, 0);
      const totalEquity = equity.reduce((sum, acc) => sum + acc.current_balance, 0);
      const totalRevenue = revenue.reduce((sum, acc) => sum + acc.current_balance, 0);
      const totalExpenses = expenses.reduce((sum, acc) => sum + acc.current_balance, 0);

      setDashboardSummary({
        totalAssets,
        totalLiabilities,
        totalEquity,
        netIncome: totalRevenue - totalExpenses
      });

      // عرض الحسابات الرئيسية مع الرصيد
      const mainAccounts = accounts.filter(acc => 
        acc.level <= 2 && acc.current_balance !== 0
      ).slice(0, 10);
      
      setAccountSummaries(mainAccounts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(Math.abs(amount));
  };

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      asset: 'أصول',
      liability: 'خصوم',
      equity: 'حقوق ملكية',
      revenue: 'إيرادات',
      expense: 'مصروفات'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-background">
      {/* ملخص سريع */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأصول</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatAmount(dashboardSummary.totalAssets)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الخصوم</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatAmount(dashboardSummary.totalLiabilities)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حقوق الملكية</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(dashboardSummary.totalEquity)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الدخل</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dashboardSummary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatAmount(dashboardSummary.netIncome)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ملخص الحسابات الرئيسية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">ملخص الحسابات الرئيسية</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-semibold">الرصيد</TableHead>
                <TableHead className="text-right font-semibold">النوع</TableHead>
                <TableHead className="text-right font-semibold">اسم الحساب</TableHead>
                <TableHead className="text-right font-semibold">رقم الحساب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountSummaries.map((account, index) => (
                <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-right font-medium">
                    <span className={`${
                      account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatAmount(account.current_balance)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm text-muted-foreground">
                      {getAccountTypeLabel(account.account_type)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {account.account_name}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {account.account_code}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {accountSummaries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد حسابات بأرصدة حالياً
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};