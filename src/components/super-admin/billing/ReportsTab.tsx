import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ReportsTab: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const { toast } = useToast();

  // Mock data for demonstration
  const revenueStats = {
    totalRevenue: 125000,
    monthlyGrowth: 12.5,
    activeSubscriptions: 245,
    churnRate: 2.3,
  };

  const monthlyData = [
    { month: 'يناير', revenue: 10500, subscriptions: 220, churn: 2.1 },
    { month: 'فبراير', revenue: 11200, subscriptions: 230, churn: 1.8 },
    { month: 'مارس', revenue: 12100, subscriptions: 245, churn: 2.3 },
    { month: 'أبريل', revenue: 13500, subscriptions: 260, churn: 1.9 },
  ];

  const handleExportReport = () => {
    toast({
      title: 'تصدير التقرير',
      description: 'جاري تحضير التقرير للتصدير...',
    });
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-row-reverse items-center justify-between">
        <div className="flex flex-row-reverse items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="اختر الفترة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">أسبوعي</SelectItem>
              <SelectItem value="monthly">شهري</SelectItem>
              <SelectItem value="quarterly">ربع سنوي</SelectItem>
              <SelectItem value="yearly">سنوي</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="السنة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleExportReport} className="flex items-center gap-2 flex-row-reverse">
          <Download className="h-4 w-4" />
          تصدير التقرير
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">
              {revenueStats.totalRevenue.toLocaleString()} د.ك
            </div>
            <div className="flex items-center justify-end mt-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 ml-1" />
              +{revenueStats.monthlyGrowth}% من الشهر السابق
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الاشتراكات النشطة</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">
              {revenueStats.activeSubscriptions}
            </div>
            <div className="flex items-center justify-end mt-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 ml-1" />
              +15 هذا الشهر
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الإلغاء</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">
              {revenueStats.churnRate}%
            </div>
            <div className="flex items-center justify-end mt-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-red-500 ml-1" />
              +0.2% من الشهر السابق
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط القيمة الشهرية</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">
              {Math.round(revenueStats.totalRevenue / revenueStats.activeSubscriptions).toLocaleString()} د.ك
            </div>
            <div className="flex items-center justify-end mt-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 ml-1" />
              +5.2% من الشهر السابق
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">التفاصيل الشهرية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 font-medium">الشهر</th>
                  <th className="text-right py-3 px-4 font-medium">الإيرادات</th>
                  <th className="text-right py-3 px-4 font-medium">الاشتراكات</th>
                  <th className="text-right py-3 px-4 font-medium">معدل الإلغاء</th>
                  <th className="text-right py-3 px-4 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((month, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{month.month}</td>
                    <td className="py-3 px-4">{month.revenue.toLocaleString()} د.ك</td>
                    <td className="py-3 px-4">{month.subscriptions}</td>
                    <td className="py-3 px-4">{month.churn}%</td>
                    <td className="py-3 px-4">
                      <Badge variant={month.revenue > 12000 ? 'default' : 'secondary'}>
                        {month.revenue > 12000 ? 'ممتاز' : 'جيد'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">اتجاهات الإيرادات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground text-right">نمو الإيرادات الشهرية</div>
                <div className="text-2xl font-bold text-green-600 text-right">+12.5%</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground text-right">متوسط الإيرادات اليومية</div>
                <div className="text-2xl font-bold text-right">4,167 د.ك</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground text-right">التوقعات للشهر القادم</div>
                <div className="text-2xl font-bold text-blue-600 text-right">14,200 د.ك</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};