import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, BarChart3, TrendingUp, TrendingDown, AlertTriangle, Plus, Download, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrencyKWD } from '@/lib/currency';

interface BudgetItem {
  id: string;
  account_id: string;
  account_name: string;
  account_code: string;
  category: string;
  budgeted_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_percentage: number;
  period: string;
}

interface BudgetSummary {
  total_budgeted: number;
  total_actual: number;
  total_variance: number;
  variance_percentage: number;
  categories: Array<{
    name: string;
    budgeted: number;
    actual: number;
    variance: number;
  }>;
}

export const EnhancedBudgetManagement = () => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('2024');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBudgetData();
  }, [selectedPeriod, selectedCategory]);

  const loadBudgetData = async () => {
    try {
      // Mock data for demonstration
      const mockBudgetItems: BudgetItem[] = [
        {
          id: '1',
          account_id: '4110101',
          account_name: 'إيرادات تأجير السيارات - شركات',
          account_code: '4110101',
          category: 'إيرادات',
          budgeted_amount: 50000,
          actual_amount: 45200,
          variance_amount: -4800,
          variance_percentage: -9.6,
          period: '2024-Q1'
        },
        {
          id: '2',
          account_id: '4110301',
          account_name: 'إيرادات تأجير السيارات - أفراد',
          account_code: '4110301',
          category: 'إيرادات',
          budgeted_amount: 30000,
          actual_amount: 32500,
          variance_amount: 2500,
          variance_percentage: 8.3,
          period: '2024-Q1'
        },
        {
          id: '3',
          account_id: '5101',
          account_name: 'الوقود والزيوت',
          account_code: '5101',
          category: 'مصروفات التشغيل',
          budgeted_amount: 8000,
          actual_amount: 8500,
          variance_amount: 500,
          variance_percentage: 6.25,
          period: '2024-Q1'
        },
        {
          id: '4',
          account_id: '5102',
          account_name: 'صيانة المركبات',
          account_code: '5102',
          category: 'مصروفات التشغيل',
          budgeted_amount: 12000,
          actual_amount: 10200,
          variance_amount: -1800,
          variance_percentage: -15,
          period: '2024-Q1'
        },
        {
          id: '5',
          account_id: '5201',
          account_name: 'الرواتب والأجور',
          account_code: '5201',
          category: 'مصروفات إدارية',
          budgeted_amount: 25000,
          actual_amount: 25000,
          variance_amount: 0,
          variance_percentage: 0,
          period: '2024-Q1'
        }
      ];

      setBudgetItems(mockBudgetItems);

      // Calculate summary
      const totalBudgeted = mockBudgetItems.reduce((sum, item) => sum + item.budgeted_amount, 0);
      const totalActual = mockBudgetItems.reduce((sum, item) => sum + item.actual_amount, 0);
      const totalVariance = totalActual - totalBudgeted;
      const variancePercentage = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;

      // Group by category
      const categoryMap = new Map();
      mockBudgetItems.forEach(item => {
        if (!categoryMap.has(item.category)) {
          categoryMap.set(item.category, { budgeted: 0, actual: 0 });
        }
        const cat = categoryMap.get(item.category);
        cat.budgeted += item.budgeted_amount;
        cat.actual += item.actual_amount;
      });

      const categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        budgeted: data.budgeted,
        actual: data.actual,
        variance: data.actual - data.budgeted
      }));

      setBudgetSummary({
        total_budgeted: totalBudgeted,
        total_actual: totalActual,
        total_variance: totalVariance,
        variance_percentage: variancePercentage,
        categories
      });

    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات الميزانية',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getVarianceColor = (percentage: number) => {
    if (Math.abs(percentage) <= 5) return 'text-green-600';
    if (Math.abs(percentage) <= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVarianceIcon = (percentage: number) => {
    if (percentage > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (percentage < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Calculator className="h-4 w-4 text-gray-500" />;
  };

  const getProgressValue = (actual: number, budgeted: number) => {
    if (budgeted === 0) return 0;
    return Math.min((actual / budgeted) * 100, 100);
  };

  const exportBudgetReport = () => {
    toast({
      title: 'قريباً',
      description: 'سيتم إضافة تصدير تقرير الميزانية قريباً',
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* عناصر التحكم */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-end rtl-flex">
            <BarChart3 className="w-5 h-5" />
            إدارة الميزانية المتقدمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="period">الفترة</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفترة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2024-Q1">الربع الأول 2024</SelectItem>
                  <SelectItem value="2024-Q2">الربع الثاني 2024</SelectItem>
                  <SelectItem value="2024-Q3">الربع الثالث 2024</SelectItem>
                  <SelectItem value="2024-Q4">الربع الرابع 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="category">الفئة</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الفئات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  <SelectItem value="إيرادات">الإيرادات</SelectItem>
                  <SelectItem value="مصروفات التشغيل">مصروفات التشغيل</SelectItem>
                  <SelectItem value="مصروفات إدارية">مصروفات إدارية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة بند ميزانية
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة بند ميزانية جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">سيتم إضافة هذه الميزة قريباً</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div>
              <Button variant="outline" onClick={exportBudgetReport} className="w-full">
                <Download className="w-4 h-4 ml-2" />
                تصدير التقرير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملخص الميزانية */}
      {budgetSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الميزانية المخططة</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrencyKWD(budgetSummary.total_budgeted)}
                  </p>
                </div>
                <Calculator className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الفعلي المحقق</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrencyKWD(budgetSummary.total_actual)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الانحراف</p>
                  <p className={`text-2xl font-bold ${getVarianceColor(budgetSummary.variance_percentage)}`}>
                    {formatCurrencyKWD(Math.abs(budgetSummary.total_variance))}
                  </p>
                </div>
                {budgetSummary.total_variance >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-red-500" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-green-500" />
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">نسبة الانحراف</p>
                  <p className={`text-2xl font-bold ${getVarianceColor(budgetSummary.variance_percentage)}`}>
                    {budgetSummary.variance_percentage.toFixed(1)}%
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* التبويبات */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">التحليل التفصيلي</TabsTrigger>
          <TabsTrigger value="categories">التحليل بالفئات</TabsTrigger>
          <TabsTrigger value="items">بنود الميزانية</TabsTrigger>
        </TabsList>

        {/* بنود الميزانية */}
        <TabsContent value="items">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="text-right">تفاصيل بنود الميزانية</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نسبة التنفيذ</TableHead>
                    <TableHead className="text-right">الانحراف</TableHead>
                    <TableHead className="text-right">الفعلي</TableHead>
                    <TableHead className="text-right">المخطط</TableHead>
                    <TableHead className="text-right">الفئة</TableHead>
                    <TableHead className="text-right">اسم الحساب</TableHead>
                    <TableHead className="text-right">رقم الحساب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetItems
                    .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
                    .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-right">
                        <div className="space-y-2">
                          <Progress 
                            value={getProgressValue(item.actual_amount, item.budgeted_amount)} 
                            className="w-20 h-2" 
                          />
                          <span className="text-xs text-muted-foreground">
                            {getProgressValue(item.actual_amount, item.budgeted_amount).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 flex-row-reverse">
                          {getVarianceIcon(item.variance_percentage)}
                          <div>
                            <div className={`font-medium ${getVarianceColor(item.variance_percentage)}`}>
                              {formatCurrencyKWD(Math.abs(item.variance_amount))}
                            </div>
                            <div className={`text-xs ${getVarianceColor(item.variance_percentage)}`}>
                              {item.variance_percentage > 0 ? '+' : ''}{item.variance_percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrencyKWD(item.actual_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrencyKWD(item.budgeted_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.account_name}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {item.account_code}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* التحليل بالفئات */}
        <TabsContent value="categories">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="text-right">التحليل بالفئات</CardTitle>
            </CardHeader>
            <CardContent>
              {budgetSummary && (
                <div className="space-y-4">
                  {budgetSummary.categories.map((category, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={category.variance >= 0 ? 'destructive' : 'default'}>
                            {category.variance >= 0 ? '+' : ''}{((category.variance / category.budgeted) * 100).toFixed(1)}%
                          </Badge>
                          <span className={getVarianceColor((category.variance / category.budgeted) * 100)}>
                            {formatCurrencyKWD(Math.abs(category.variance))}
                          </span>
                        </div>
                        <h3 className="font-medium">{category.name}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">المخطط: </span>
                          <span className="font-medium">{formatCurrencyKWD(category.budgeted)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">الفعلي: </span>
                          <span className="font-medium">{formatCurrencyKWD(category.actual)}</span>
                        </div>
                      </div>
                      <Progress 
                        value={getProgressValue(category.actual, category.budgeted)} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* التحليل التفصيلي */}
        <TabsContent value="analysis">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-right">أكبر الانحرافات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {budgetItems
                    .sort((a, b) => Math.abs(b.variance_percentage) - Math.abs(a.variance_percentage))
                    .slice(0, 5)
                    .map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                      <div className="flex items-center gap-2">
                        {getVarianceIcon(item.variance_percentage)}
                        <span className={`font-medium ${getVarianceColor(item.variance_percentage)}`}>
                          {item.variance_percentage > 0 ? '+' : ''}{item.variance_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.account_name}</div>
                        <div className="text-sm text-muted-foreground">{item.account_code}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-right">الأداء العام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">
                      {budgetSummary ? getProgressValue(budgetSummary.total_actual, budgetSummary.total_budgeted).toFixed(1) : 0}%
                    </div>
                    <div className="text-muted-foreground">نسبة تنفيذ الميزانية</div>
                  </div>
                  
                  {budgetSummary && (
                    <Progress 
                      value={getProgressValue(budgetSummary.total_actual, budgetSummary.total_budgeted)}
                      className="h-4"
                    />
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">بنود في الحدود المقبولة</div>
                      <div className="font-medium text-green-600">
                        {budgetItems.filter(item => Math.abs(item.variance_percentage) <= 5).length}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">بنود تحتاج مراجعة</div>
                      <div className="font-medium text-red-600">
                        {budgetItems.filter(item => Math.abs(item.variance_percentage) > 15).length}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};