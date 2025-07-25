import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, BarChart3, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrialBalance, IncomeStatement, BalanceSheet } from '@/types/accounting';
import { accountingService } from '@/services/accountingService';
import { useToast } from '@/hooks/use-toast';
import { CostCenterService, CostCenter } from '@/services/BusinessServices/CostCenterService';
import { CostCenterFinancialAnalysis, AllCostCentersOverview } from './CostCenterFinancialAnalysis';
import { TraditionalFinancialReports } from './TraditionalFinancialReports';
import { EnhancedTrialBalance } from './EnhancedTrialBalance';

export const FinancialReportsTab = () => {
  const [trialBalance, setTrialBalance] = useState<TrialBalance[]>([]);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();
  const costCenterService = new CostCenterService();

  useEffect(() => {
    loadReports();
    loadCostCenters();
  }, []);

  const loadCostCenters = async () => {
    try {
      const data = await costCenterService.getAllCostCenters();
      setCostCenters(data);
    } catch (error) {
      console.error('Error loading cost centers:', error);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const [trialBalanceData, incomeStatementData, balanceSheetData] = await Promise.all([
        accountingService.getTrialBalance(),
        accountingService.getIncomeStatement(),
        accountingService.getBalanceSheet()
      ]);
      
      setTrialBalance(trialBalanceData);
      // Transform income statement data to match interface
      const transformedIncomeStatement = {
        revenue: {
          operating_revenue: incomeStatementData.revenue?.[0]?.amount || 0,
          other_revenue: incomeStatementData.revenue?.[1]?.amount || 0,
          total_revenue: incomeStatementData.revenue?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0
        },
        expenses: {
          operating_expense: incomeStatementData.expenses?.[0]?.amount || 0,
          other_expense: incomeStatementData.expenses?.[1]?.amount || 0,
          total_expense: incomeStatementData.expenses?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0
        },
        net_income: incomeStatementData.netIncome || 0
      };
      
      // Transform balance sheet data to match interface
      const transformedBalanceSheet = {
        assets: {
          current_assets: balanceSheetData.assets?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0,
          fixed_assets: 0,
          total_assets: balanceSheetData.assets?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0
        },
        liabilities: {
          current_liabilities: balanceSheetData.liabilities?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0,
          long_term_liabilities: 0,
          total_liabilities: balanceSheetData.liabilities?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0
        },
        equity: {
          capital: balanceSheetData.equity?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0,
          retained_earnings: 0,
          total_equity: balanceSheetData.equity?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0
        }
      };
      
      setIncomeStatement(transformedIncomeStatement);
      setBalanceSheet(transformedBalanceSheet);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل التقارير المالية',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReports = () => {
    loadReports();
  };

  const formatAmount = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  const exportReport = (reportType: string) => {
    toast({
      title: 'قريباً',
      description: `سيتم إضافة تصدير ${reportType} قريباً`,
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري تحميل التقارير...</div>;
  }

  return (
    <div className="space-y-6">
      {/* عناصر التحكم في التقارير */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-end">
            التقارير المالية
            <BarChart3 className="w-5 h-5" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <Label htmlFor="period">الفترة المالية</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفترة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">الفترة الحالية</SelectItem>
                  <SelectItem value="previous">الفترة السابقة</SelectItem>
                  <SelectItem value="custom">فترة مخصصة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="cost_center">مركز التكلفة</Label>
              <Select value={selectedCostCenter} onValueChange={setSelectedCostCenter}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع مراكز التكلفة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع مراكز التكلفة</SelectItem>
                  {costCenters.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.cost_center_name} ({cc.cost_center_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedPeriod === 'custom' && (
              <>
                <div>
                  <Label htmlFor="start_date">من تاريخ</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">إلى تاريخ</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  />
                </div>
              </>
            )}
            
            <div>
              <Button onClick={handleGenerateReports} className="w-full">
                <FileText className="w-4 h-4 ml-2" />
                إنشاء التقارير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التقارير */}
      <Tabs defaultValue="traditional-analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cost-center-analysis">تحليل مراكز التكلفة</TabsTrigger>
          <TabsTrigger value="balance-sheet">الميزانية العمومية</TabsTrigger>
          <TabsTrigger value="income-statement">قائمة الدخل</TabsTrigger>
          <TabsTrigger value="trial-balance">ميزان المراجعة</TabsTrigger>
          <TabsTrigger value="traditional-analysis">التحليل التقليدي</TabsTrigger>
        </TabsList>

        {/* التحليل التقليدي */}
        <TabsContent value="traditional-analysis">
          <TraditionalFinancialReports />
        </TabsContent>

        {/* تحليل مراكز التكلفة */}
        <TabsContent value="cost-center-analysis">
          <Card className="card-elegant">
            <CardHeader>
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => exportReport('تحليل مراكز التكلفة')}>
                  <Download className="w-4 h-4 ml-2" />
                  تصدير
                </Button>
                <CardTitle className="flex items-center gap-2 rtl-flex">
                  <Building2 className="w-5 h-5" />
                  تحليل مراكز التكلفة المالي
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {selectedCostCenter && selectedCostCenter !== 'all' ? (
                <CostCenterFinancialAnalysis costCenterId={selectedCostCenter} />
              ) : (
                <AllCostCentersOverview costCenters={costCenters} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ميزان المراجعة */}
        <TabsContent value="trial-balance">
          <EnhancedTrialBalance />
        </TabsContent>

        {/* قائمة الدخل */}
        <TabsContent value="income-statement">
          <Card className="card-elegant">
            <CardHeader>
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => exportReport('قائمة الدخل')}>
                  <Download className="w-4 h-4 ml-2" />
                  تصدير
                </Button>
                <CardTitle>قائمة الدخل</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {incomeStatement ? (
                <div className="space-y-6">
                  {/* الإيرادات */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-primary">الإيرادات</h3>
                     <div className="space-y-2">
                       <div className="flex justify-between">
                         <span className="font-medium text-green-600">
                           {formatAmount(incomeStatement.revenue.operating_revenue)}
                         </span>
                         <span>إيرادات التشغيل</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="font-medium text-green-600">
                           {formatAmount(incomeStatement.revenue.other_revenue)}
                         </span>
                         <span>إيرادات أخرى</span>
                       </div>
                       <div className="flex justify-between font-semibold border-t pt-2">
                         <span className="text-green-600">
                           {formatAmount(incomeStatement.revenue.total_revenue)}
                         </span>
                         <span>إجمالي الإيرادات</span>
                       </div>
                     </div>
                  </div>

                  {/* المصروفات */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-destructive">المصروفات</h3>
                     <div className="space-y-2">
                       <div className="flex justify-between">
                         <span className="font-medium text-red-600">
                           {formatAmount(incomeStatement.expenses.operating_expense)}
                         </span>
                         <span>مصروفات التشغيل</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="font-medium text-red-600">
                           {formatAmount(incomeStatement.expenses.other_expense)}
                         </span>
                         <span>مصروفات أخرى</span>
                       </div>
                       <div className="flex justify-between font-semibold border-t pt-2">
                         <span className="text-red-600">
                           {formatAmount(incomeStatement.expenses.total_expense)}
                         </span>
                         <span>إجمالي المصروفات</span>
                       </div>
                     </div>
                  </div>

                  {/* صافي الدخل */}
                   <div className="border-t pt-4">
                     <div className="flex justify-between text-xl font-bold">
                       <span className={incomeStatement.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
                         {formatAmount(incomeStatement.net_income)}
                       </span>
                       <span>صافي الدخل</span>
                     </div>
                    <div className="mt-2">
                      <Badge variant={incomeStatement.net_income >= 0 ? 'default' : 'destructive'}>
                        {incomeStatement.net_income >= 0 ? 'ربح' : 'خسارة'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات لعرضها في قائمة الدخل
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* الميزانية العمومية */}
        <TabsContent value="balance-sheet">
          <Card className="card-elegant">
            <CardHeader>
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => exportReport('الميزانية العمومية')}>
                  <Download className="w-4 h-4 ml-2" />
                  تصدير
                </Button>
                <CardTitle>الميزانية العمومية</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {balanceSheet ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* الأصول */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-primary">الأصول</h3>
                     <div className="space-y-2">
                       <div className="flex justify-between">
                         <span className="font-medium">
                           {formatAmount(balanceSheet.assets.current_assets)}
                         </span>
                         <span>الأصول المتداولة</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="font-medium">
                           {formatAmount(balanceSheet.assets.fixed_assets)}
                         </span>
                         <span>الأصول الثابتة</span>
                       </div>
                       <div className="flex justify-between font-semibold border-t pt-2">
                         <span className="text-primary">
                           {formatAmount(balanceSheet.assets.total_assets)}
                         </span>
                         <span>إجمالي الأصول</span>
                       </div>
                     </div>
                  </div>

                  {/* الخصوم وحقوق الملكية */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-destructive">الخصوم وحقوق الملكية</h3>
                    
                    {/* الخصوم */}
                     <div className="space-y-2 mb-4">
                       <h4 className="font-medium text-sm">الخصوم</h4>
                       <div className="flex justify-between text-sm">
                         <span className="font-medium">
                           {formatAmount(balanceSheet.liabilities.current_liabilities)}
                         </span>
                         <span>الخصوم المتداولة</span>
                       </div>
                       <div className="flex justify-between text-sm">
                         <span className="font-medium">
                           {formatAmount(balanceSheet.liabilities.long_term_liabilities)}
                         </span>
                         <span>الخصوم طويلة الأجل</span>
                       </div>
                       <div className="flex justify-between font-medium border-t pt-1">
                         <span>{formatAmount(balanceSheet.liabilities.total_liabilities)}</span>
                         <span>إجمالي الخصوم</span>
                       </div>
                     </div>

                    {/* حقوق الملكية */}
                     <div className="space-y-2">
                       <h4 className="font-medium text-sm">حقوق الملكية</h4>
                       <div className="flex justify-between text-sm">
                         <span className="font-medium">
                           {formatAmount(balanceSheet.equity.capital)}
                         </span>
                         <span>رأس المال</span>
                       </div>
                       <div className="flex justify-between text-sm">
                         <span className="font-medium">
                           {formatAmount(balanceSheet.equity.retained_earnings)}
                         </span>
                         <span>الأرباح المحتجزة</span>
                       </div>
                       <div className="flex justify-between font-medium border-t pt-1">
                         <span>{formatAmount(balanceSheet.equity.total_equity)}</span>
                         <span>إجمالي حقوق الملكية</span>
                       </div>
                     </div>

                     <div className="flex justify-between font-semibold border-t pt-2 mt-4">
                       <span className="text-primary">
                         {formatAmount(balanceSheet.liabilities.total_liabilities + balanceSheet.equity.total_equity)}
                       </span>
                       <span>إجمالي الخصوم وحقوق الملكية</span>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات لعرضها في الميزانية العمومية
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};