
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, FileDown, RefreshCw } from 'lucide-react';
import { BudgetService, BudgetVarianceReport as VarianceReport } from '@/services/BudgetService';
import { formatCurrencyKWD } from '@/lib/currency';
import { toast } from 'sonner';

interface BudgetVarianceReportProps {
  budgetId: string;
  budgetName: string;
}

export const BudgetVarianceReport: React.FC<BudgetVarianceReportProps> = ({
  budgetId,
  budgetName
}) => {
  const [varianceData, setVarianceData] = useState<VarianceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const budgetService = new BudgetService();

  useEffect(() => {
    loadVarianceReport();
  }, [budgetId]);

  const loadVarianceReport = async () => {
    setLoading(true);
    try {
      const data = await budgetService.calculateBudgetVariance(budgetId);
      setVarianceData(data);
    } catch (error) {
      console.error('Error loading variance report:', error);
      toast.error('فشل في تحميل تقرير التباين');
    } finally {
      setLoading(false);
    }
  };

  const getVarianceStatus = (percentage: number) => {
    if (Math.abs(percentage) <= 5) return { label: 'ضمن الهدف', color: 'bg-green-500' };
    if (Math.abs(percentage) <= 15) return { label: 'انحراف متوسط', color: 'bg-yellow-500' };
    return { label: 'انحراف كبير', color: 'bg-red-500' };
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (variance < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  const exportReport = () => {
    if (!varianceData) return;
    
    const csvContent = [
      ['اسم الحساب', 'المبلغ المخطط', 'المبلغ الفعلي', 'التباين', 'نسبة التباين%'],
      ...varianceData.items_with_variance.map(item => [
        item.account_name,
        item.budgeted_amount.toString(),
        item.actual_amount.toString(),
        item.variance_amount.toString(),
        item.variance_percentage.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_التباين_${budgetName}.csv`;
    link.click();
  };

  const chartData = varianceData?.items_with_variance.map(item => ({
    name: item.account_name.substring(0, 20) + '...',
    budgeted: item.budgeted_amount,
    actual: item.actual_amount,
    variance: item.variance_amount
  })) || [];

  const pieData = [
    { name: 'المبلغ المنفق', value: varianceData?.total_actual || 0, color: '#ef4444' },
    { name: 'المبلغ المتبقي', value: Math.max(0, (varianceData?.total_budgeted || 0) - (varianceData?.total_actual || 0)), color: '#22c55e' }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>جاري تحميل تقرير التباين...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!varianceData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            لا توجد بيانات تباين متاحة
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ملخص التباين */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="rtl-flex">
              <TrendingUp className="w-5 h-5" />
              تقرير تباين الميزانية - {budgetName}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadVarianceReport}>
                <RefreshCw className="w-4 h-4" />
                تحديث
              </Button>
              <Button variant="outline" size="sm" onClick={exportReport}>
                <FileDown className="w-4 h-4" />
                تصدير
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrencyKWD(varianceData.total_budgeted)}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي الميزانية</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrencyKWD(varianceData.total_actual)}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي المنفق</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${varianceData.total_variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrencyKWD(Math.abs(varianceData.total_variance))}
              </div>
              <div className="text-sm text-muted-foreground">
                التباين {varianceData.total_variance >= 0 ? '(زيادة)' : '(توفير)'}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${varianceData.variance_percentage >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {Math.abs(varianceData.variance_percentage).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">نسبة التباين</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">نسبة الاستخدام</span>
              <span className="text-sm text-muted-foreground">
                {((varianceData.total_actual / varianceData.total_budgeted) * 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={(varianceData.total_actual / varianceData.total_budgeted) * 100} 
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            {getVarianceIcon(varianceData.total_variance)}
            <Badge 
              variant={varianceData.total_variance <= 0 ? "default" : "destructive"}
              className={getVarianceStatus(varianceData.variance_percentage).color}
            >
              {getVarianceStatus(varianceData.variance_percentage).label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>مقارنة المخطط والفعلي</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrencyKWD(value)} />
                <Bar dataKey="budgeted" fill="#3b82f6" name="المخطط" />
                <Bar dataKey="actual" fill="#ef4444" name="الفعلي" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع الإنفاق</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrencyKWD(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* جدول التفاصيل */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل التباين حسب الحساب</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الحساب</TableHead>
                <TableHead>المبلغ المخطط</TableHead>
                <TableHead>المبلغ الفعلي</TableHead>
                <TableHead>التباين</TableHead>
                <TableHead>نسبة التباين</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {varianceData.items_with_variance.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.account_name}</TableCell>
                  <TableCell>{formatCurrencyKWD(item.budgeted_amount)}</TableCell>
                  <TableCell>{formatCurrencyKWD(item.actual_amount)}</TableCell>
                  <TableCell className={item.variance_amount >= 0 ? 'text-red-600' : 'text-green-600'}>
                    {formatCurrencyKWD(item.variance_amount)}
                  </TableCell>
                  <TableCell className={item.variance_percentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                    {item.variance_percentage.toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={item.variance_amount <= 0 ? "default" : "destructive"}
                      className={getVarianceStatus(item.variance_percentage).color}
                    >
                      {getVarianceStatus(item.variance_percentage).label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
