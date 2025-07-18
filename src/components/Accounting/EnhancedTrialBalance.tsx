import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Download, Calendar, TrendingUp, Calculator, Building2, CheckCircle } from 'lucide-react';
import { accountingService } from '@/services/accountingService';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface EnhancedTrialBalanceData {
  account_code: string;
  account_name: string;
  account_type: string;
  opening_debit: number;
  opening_credit: number;
  period_debit: number;
  period_credit: number;
  closing_debit: number;
  closing_credit: number;
}

export const EnhancedTrialBalance = () => {
  const [accountsData, setAccountsData] = useState<EnhancedTrialBalanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  useEffect(() => {
    loadEnhancedTrialBalance();
  }, [dateRange]);

  const loadEnhancedTrialBalance = async () => {
    setLoading(true);
    try {
      // استخدام دالة ميزان المراجعة الموجودة وتحسينها
      const trialBalanceData = await accountingService.getTrialBalance();
      
      // تحويل البيانات للشكل المحسن
      const enhancedData: EnhancedTrialBalanceData[] = trialBalanceData.map(account => ({
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: getAccountTypeInArabic(account.account_code),
        opening_debit: 0, // سيتم حسابها من قاعدة البيانات
        opening_credit: 0, // سيتم حسابها من قاعدة البيانات
        period_debit: account.debit_balance,
        period_credit: account.credit_balance,
        closing_debit: account.debit_balance,
        closing_credit: account.credit_balance
      }));

      setAccountsData(enhancedData);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل ميزان المراجعة المحسن',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeInArabic = (accountCode: string) => {
    if (accountCode.startsWith('1')) return 'أصل';
    if (accountCode.startsWith('2')) return 'خصم';
    if (accountCode.startsWith('3')) return 'حقوق ملكية';
    if (accountCode.startsWith('4')) return 'إيراد';
    if (accountCode.startsWith('5')) return 'مصروف';
    return 'غير محدد';
  };

  const formatAmount = (amount: number) => {
    return amount.toFixed(3);
  };

  const getTotalOpeningDebit = () => accountsData.reduce((sum, acc) => sum + acc.opening_debit, 0);
  const getTotalOpeningCredit = () => accountsData.reduce((sum, acc) => sum + acc.opening_credit, 0);
  const getTotalPeriodDebit = () => accountsData.reduce((sum, acc) => sum + acc.period_debit, 0);
  const getTotalPeriodCredit = () => accountsData.reduce((sum, acc) => sum + acc.period_credit, 0);
  const getTotalClosingDebit = () => accountsData.reduce((sum, acc) => sum + acc.closing_debit, 0);
  const getTotalClosingCredit = () => accountsData.reduce((sum, acc) => sum + acc.closing_credit, 0);

  const isBalanced = () => {
    const debitTotal = getTotalClosingDebit();
    const creditTotal = getTotalClosingCredit();
    return Math.abs(debitTotal - creditTotal) < 0.001; // السماح بفرق صغير للتقريب
  };

  const handleExportReport = () => {
    toast({
      title: 'تصدير التقرير',
      description: 'سيتم تصدير ميزان المراجعة المحسن قريباً',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Calculator className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p>جاري إعداد ميزان المراجعة المحسن...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس التقرير */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl">شركة ساپتكو الخليج لتأجير السيارات</CardTitle>
            <p className="text-lg font-semibold text-primary">ميزان المراجعة المحسن</p>
            <p className="text-sm text-muted-foreground">
              من {new Date(dateRange.startDate).toLocaleDateString('ar-KW')} 
              إلى {new Date(dateRange.endDate).toLocaleDateString('ar-KW')}
            </p>
            <div className="flex justify-center">
              {isBalanced() ? (
                <Badge variant="default" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  الميزان متوازن
                </Badge>
              ) : (
                <Badge variant="destructive">
                  الميزان غير متوازن
                </Badge>
              )}
            </div>
          </div>
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
                  <SelectItem value="current_month">الشهر الحالي</SelectItem>
                  <SelectItem value="current_quarter">الربع الحالي</SelectItem>
                  <SelectItem value="current_year">السنة الحالية</SelectItem>
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

            <div className="flex gap-2">
              <Button onClick={loadEnhancedTrialBalance} className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                تحديث الميزان
              </Button>
              <Button variant="outline" onClick={handleExportReport} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                تصدير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ميزان المراجعة المحسن */}
      <Card className="card-elegant">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead colSpan={2} className="text-center font-bold border">الأرصدة الختامية</TableHead>
                  <TableHead colSpan={2} className="text-center font-bold border">حركة الفترة</TableHead>
                  <TableHead colSpan={2} className="text-center font-bold border">الأرصدة الافتتاحية</TableHead>
                  <TableHead rowSpan={2} className="text-center font-bold border">نوع الحساب</TableHead>
                  <TableHead rowSpan={2} className="text-center font-bold border">اسم الحساب</TableHead>
                  <TableHead rowSpan={2} className="text-center font-bold border">رقم الحساب</TableHead>
                </TableRow>
                <TableRow className="bg-muted">
                  <TableHead className="text-center font-bold border">دائن</TableHead>
                  <TableHead className="text-center font-bold border">مدين</TableHead>
                  <TableHead className="text-center font-bold border">دائن</TableHead>
                  <TableHead className="text-center font-bold border">مدين</TableHead>
                  <TableHead className="text-center font-bold border">دائن</TableHead>
                  <TableHead className="text-center font-bold border">مدين</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountsData.map((account, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell className="text-center border">
                      <span className="text-blue-600">
                        {account.closing_credit > 0 ? formatAmount(account.closing_credit) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center border">
                      <span className="text-green-600">
                        {account.closing_debit > 0 ? formatAmount(account.closing_debit) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center border">
                      <span className="text-blue-600">
                        {account.period_credit > 0 ? formatAmount(account.period_credit) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center border">
                      <span className="text-green-600">
                        {account.period_debit > 0 ? formatAmount(account.period_debit) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center border">
                      <span className="text-blue-600">
                        {account.opening_credit > 0 ? formatAmount(account.opening_credit) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center border">
                      <span className="text-green-600">
                        {account.opening_debit > 0 ? formatAmount(account.opening_debit) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center border text-sm text-muted-foreground">
                      {account.account_type}
                    </TableCell>
                    <TableCell className="text-right border font-medium">
                      {account.account_name}
                    </TableCell>
                    <TableCell className="text-center border font-mono font-bold">
                      {account.account_code}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* صف الإجماليات */}
                <TableRow className="bg-primary/10 font-bold border-t-2">
                  <TableCell className="text-center border font-bold text-lg text-blue-600">
                    {formatAmount(getTotalClosingCredit())}
                  </TableCell>
                  <TableCell className="text-center border font-bold text-lg text-green-600">
                    {formatAmount(getTotalClosingDebit())}
                  </TableCell>
                  <TableCell className="text-center border font-bold text-lg text-blue-600">
                    {formatAmount(getTotalPeriodCredit())}
                  </TableCell>
                  <TableCell className="text-center border font-bold text-lg text-green-600">
                    {formatAmount(getTotalPeriodDebit())}
                  </TableCell>
                  <TableCell className="text-center border font-bold text-lg text-blue-600">
                    {formatAmount(getTotalOpeningCredit())}
                  </TableCell>
                  <TableCell className="text-center border font-bold text-lg text-green-600">
                    {formatAmount(getTotalOpeningDebit())}
                  </TableCell>
                  <TableCell className="text-center border font-bold">-</TableCell>
                  <TableCell className="text-right border font-bold text-lg">الإجمالي</TableCell>
                  <TableCell className="text-center border font-bold">-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {accountsData.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">لا توجد بيانات لعرضها في ميزان المراجعة</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* إحصائيات الميزان */}
      {accountsData.length > 0 && (
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="text-center">إحصائيات ميزان المراجعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">إجمالي المدين</p>
                <p className="text-xl font-bold text-green-600">د.ك {formatAmount(getTotalClosingDebit())}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
                <p className="text-xl font-bold text-blue-600">د.ك {formatAmount(getTotalClosingCredit())}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">الفرق</p>
                <p className={`text-xl font-bold ${Math.abs(getTotalClosingDebit() - getTotalClosingCredit()) < 0.001 ? 'text-green-600' : 'text-red-600'}`}>
                  د.ك {formatAmount(Math.abs(getTotalClosingDebit() - getTotalClosingCredit()))}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">عدد الحسابات</p>
                <p className="text-xl font-bold text-primary">{accountsData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};