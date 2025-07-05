import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
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

export const FinancialReportsTab = () => {
  const [trialBalance, setTrialBalance] = useState<TrialBalance[]>([]);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [trialBalanceData, incomeStatementData, balanceSheetData] = await Promise.all([
        accountingService.getTrialBalance(),
        accountingService.getIncomeStatement(dateRange.startDate, dateRange.endDate),
        accountingService.getBalanceSheet()
      ]);
      
      setTrialBalance(trialBalanceData);
      setIncomeStatement(incomeStatementData);
      setBalanceSheet(balanceSheetData);
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
      <Tabs defaultValue="trial-balance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="balance-sheet">الميزانية العمومية</TabsTrigger>
          <TabsTrigger value="income-statement">قائمة الدخل</TabsTrigger>
          <TabsTrigger value="trial-balance">ميزان المراجعة</TabsTrigger>
        </TabsList>

        {/* ميزان المراجعة */}
        <TabsContent value="trial-balance">
          <Card className="card-elegant">
            <CardHeader>
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => exportReport('ميزان المراجعة')}>
                  <Download className="w-4 h-4 ml-2" />
                  تصدير
                </Button>
                <CardTitle>ميزان المراجعة</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الرصيد الدائن</TableHead>
                    <TableHead className="text-right">الرصيد المدين</TableHead>
                    <TableHead className="text-right">اسم الحساب</TableHead>
                    <TableHead className="text-right">رقم الحساب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trialBalance.map((account, index) => (
                    <TableRow key={index}>
                      <TableCell className={`text-right ${account.credit_balance > 0 ? 'font-medium text-blue-600' : ''}`}>
                        {account.credit_balance > 0 ? formatAmount(account.credit_balance) : '-'}
                      </TableCell>
                      <TableCell className={`text-right ${account.debit_balance > 0 ? 'font-medium text-green-600' : ''}`}>
                        {account.debit_balance > 0 ? formatAmount(account.debit_balance) : '-'}
                      </TableCell>
                      <TableCell>{account.account_name}</TableCell>
                      <TableCell className="font-medium">{account.account_code}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableRow className="bg-muted font-bold">
                  <TableCell className="text-right text-blue-600">
                    {formatAmount(trialBalance.reduce((sum, acc) => sum + acc.credit_balance, 0))}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatAmount(trialBalance.reduce((sum, acc) => sum + acc.debit_balance, 0))}
                  </TableCell>
                  <TableCell colSpan={2} className="text-right">الإجمالي</TableCell>
                </TableRow>
              </Table>
              
              {trialBalance.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات لعرضها في ميزان المراجعة
                </div>
              )}
            </CardContent>
          </Card>
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